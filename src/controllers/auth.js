import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import { validationResult } from "express-validator";
import NodeCache from "node-cache";
import User from "../models/user.js";
import Merchant from "../models/merchant.js";
import Token from "../models/token.js";
import sendEmail from "../config/sendMail.js";
import {
  generateToken,
  generateRefreshToken,
} from "../config/generateToken.js";
import env from "../utils/validateEnv.js";
import tryCatch from "../config/tryCatchFn.js";
import { uploadSingleImage } from "../config/uploadImages.js";

const cache = new NodeCache({ stdTTL: 300 });

const createToken = async (userId, token) => {
  const createToken = new Token(userId, token);
  return createToken.save();
};

const verifyToken = async (userId, token) => {
  return await Token.findOne(userId, token);
};

export const signUp = tryCatch(async (req, res, next) => {
  const errors = validationResult(req);
  const serverUrl = req.protocol + "://" + req.get("host");
  const { email, password, username } = req.body;
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  if (!email || !password || !username) {
    return next(createHttpError(400, "Field params missing!"));
  }
  const currentUsername = await User.findOne({ username });
  if (currentUsername) {
    return next(
      createHttpError(409, "Username already exists!, choose another")
    );
  }
  const currentEmail = await User.findOne({ email });
  if (currentEmail) {
    return next(createHttpError(409, "Email already exists!, choose another"));
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    email,
    password: hashedPassword,
    username,
  });
  const accessToken = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);
  user.refreshToken = refreshToken;
  user.role = serverUrl === env.BASE_SELLER_URL ? "seller" : user.role;
  await user.save();
  return res.status(201).json({
    accessToken,
    refreshToken,
    msg: "Registration successfull",
  });
});

export const signIn = tryCatch(async (req, res, next) => {
  const errors = validationResult(req);
  const { email, password } = req.body;
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  if (!email || !password) {
    return next(createHttpError(400, "Field params missing!"));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(createHttpError(401, "User with Email not found!"));
  }
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return next(createHttpError(401, "Password is incorrect!"));
  }
  const accessToken = generateToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);
  user.refreshToken = refreshToken;
  await user.save();
  res.status(200).json({
    accessToken,
    refreshToken,
    msg: "Login successfull",
  });
});

export const refreshAccessToken = tryCatch(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(createHttpError(401, "You are unauthenticated!"));
  }
  jwt.verify(refreshToken, env.JWT_REFRESH_TOKEN, (err, user) => {
    if (err) {
      console.log(err);
      return next(createHttpError(401, "Invalid refresh token"));
    }
    const newAccessToken = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.role);
    res
      .status(200)
      .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  });
});

export const authenticateUser = async (req, res, next) => {
  const { id: userId } = req.user;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserAccount = tryCatch(async (req, res, next) => {
  const { id: userId } = req.user;
  const { username, email, currentPassword, password, photo } = req.body;
  if (!isValidObjectId(userId)) {
    return next(createHttpError(400, "Invalid userId"));
  }
  let profilePhoto = "";
  let updatedPassword = "";
  if (photo) {
    try {
      const photoUploaded = await uploadSingleImage(photo);
      profilePhoto = photoUploaded;
    } catch (error) {
      console.log(error);
      return next(createHttpError(500, "Failed to upload image"));
    }
  }
  if (password && !currentPassword) {
    return next(createHttpError(401, "Pls provide your current password"));
  }
  if (currentPassword) {
    const validatePassword = await User.findById(userId).select("+password");
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      validatePassword.password
    );
    if (!passwordMatch) {
      return next(createHttpError(401, "Current password is incorrect!"));
    }
    if (passwordMatch) {
      updatedPassword = await bcrypt.hash(password, 10);
    }
  }

  const updatedFields = {
    username,
    email,
    password: updatedPassword,
    photo: profilePhoto,
  };
  // Remove empty fields
  Object.keys(updatedFields).forEach(
    (key) =>
      (updatedFields[key] === "" || undefined) && delete updatedFields[key]
  );
  const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
    new: true,
  });
  if (!updatedUser._id.equals(userId)) {
    return next(createHttpError(401, "You cannot access this user"));
  }
  res.status(200).json({
    updatedUser,
    msg: "User info updated successfully",
  });
});

export const deleteUserAccount = tryCatch(async (req, res, next) => {
  const { id: userId } = req.user;
  const user = await User.findById(userId);
  if (!user) {
    return next(createHttpError(401, "User not found"));
  }
  await Merchant.deleteMany({ userId: userId });
  await user.deleteOne();
  res.status(200).send({ msg: "User account deleted" });
});

export const forgotPassword = tryCatch(async (req, res, next) => {
  const { email } = req.body;
  const serverUrl = req.protocol + "://" + req.get("host");
  if (!email) {
    return next(createHttpError(400, `Email field is missing`));
  }
  const user = await User.findOne({ email: email });
  if (!user) {
    return next(createHttpError(404, "Email not found"));
  }
  let setToken = await createToken({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex"),
  });
  if (!setToken) {
    return next(createHttpError(500, "Error creating token"));
  }
  const messageLink = `${
    serverUrl === env.BASE_SELLER_URL
      ? env.BASE_SELLER_URL
      : env.BASE_CLIENT_URL
  }/authorize/reset-password/${user._id}/${setToken.token}`;
  if (!messageLink) {
    return next(createHttpError(400, "Verification message not sent"));
  }
  const emailStatus = await sendEmail({
    username: user.username,
    from: env.USER_MAIL_LOGIN,
    to: user.email,
    subject: "Password recovery link",
    text: `You requested to reset your password. Click the link to reset your pasword ${messageLink}. Link expires in 15 minutes. If this was not from you, kindly ignore.`,
  });
  if (!emailStatus.success) {
    return next(createHttpError(500, "Verification message not sent"));
  } else {
    res.status(200).json({ msg: "Recovery password link sent to your email" });
  }
});

export const resetUserPassword = tryCatch(async (req, res, next) => {
  const { userId, token } = req.params;
  const { password } = req.body;
  if (!isValidObjectId(userId)) {
    return next(createHttpError(400, "Invalid userId"));
  }
  if (!password || !token || !userId) {
    return next(createHttpError(401, "Invalid params, token may be broken"));
  }
  const user = await User.findById(userId);
  if (!user) {
    return next(createHttpError(404, "User not found"));
  }
  const getToken = await verifyToken({ userId, token });
  if (!getToken) {
    return next(createHttpError(401, "Invalid or expired token"));
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  await User.updateOne({ _id: user._id }, { password: hashedPassword });
  await sendEmail({
    username: user.username,
    from: env.USER_MAIL_LOGIN,
    to: user.email,
    subject: "Password update",
    text: `You have successfully changed your password.`,
  });
  res.status(200).json({ msg: "Password updated!, redirecting to login" });
});
