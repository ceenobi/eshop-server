import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";
import { validationResult } from "express-validator";
import tryCatch from "../config/tryCatchFn.js";
import Merchant from "../models/merchant.js";
import generateRandomNumberString from "../utils/generateMerchantId.js";
import User from "../models/user.js";
import { uploadSingleImage } from "../config/uploadImages.js";
import Orders from "../models/orders.js";
import Customer from "../models/customer.js";

export const createMerchant = tryCatch(async (req, res, next) => {
  const errors = validationResult(req);
  const { merchantName, merchantEmail, currency } = req.body;
  const { id: userId } = req.user;
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  if (!merchantName || !merchantEmail || !currency) {
    return next(createHttpError(400, "Field params missing!"));
  }
  if (!userId) {
    return next(createHttpError(400, "UserId is missing"));
  }
  const user = await User.findById(userId);
  if (!user) {
    return next(createHttpError(400, "User not found"));
  }
  const currentName = await Merchant.findOne({ merchantName });
  if (currentName) {
    return next(
      createHttpError(409, "Merchant Name already exists!, choose another")
    );
  }
  const currentEmail = await Merchant.findOne({ merchantEmail });
  if (currentEmail) {
    return next(
      createHttpError(409, "Merchant Email already exists!, choose another")
    );
  }
  const newMerchant = await Merchant.create({
    merchantName,
    merchantEmail,
    merchantCode: generateRandomNumberString(),
    userId: user._id,
    currency,
  });
  await newMerchant.save();
  user.merchantId = newMerchant._id;
  await user.save();
  return res.status(201).json({
    merchant: newMerchant,
    msg: "Merchant store created successfully",
  });
});

export const getMerchant = async (req, res, next) => {
  const { id: userId } = req.user;
  if (!isValidObjectId(userId)) {
    return next(createHttpError(400, "Invalid merchantId"));
  }
  try {
    const merchant = await Merchant.findOne({ userId: userId.toString() });
    if (!merchant) {
      return next(createHttpError(404, "Merchant not found"));
    }
    res.status(200).json(merchant);
  } catch (error) {
    next(error);
  }
};

export const updateMerchantAccount = tryCatch(async (req, res, next) => {
  const { id: merchantId } = req.params;
  const {
    merchantName,
    merchantEmail,
    currency,
    description,
    street,
    city,
    zip,
    state,
    country,
    logo,
    coverImage,
  } = req.body;

  if (!isValidObjectId(merchantId)) {
    return next(createHttpError(400, "Invalid userId"));
  }
  const findMerchant = await Merchant.findById(merchantId);
  if (!findMerchant) {
    return next(createHttpError(400, "Merchant not found"));
  }
  if (!findMerchant._id.equals(merchantId)) {
    return next(createHttpError(401, "You cannot access this merchant"));
  }
  let logoPhoto = "";
  let coverPhoto = "";

  if (logo) {
    try {
      const photoUploaded = await uploadSingleImage(logo);
      logoPhoto = photoUploaded;
    } catch (error) {
      console.log(error);
      return next(createHttpError(500, "Failed to upload logo image"));
    }
  }
  if (coverImage) {
    try {
      const photoUploaded = await uploadSingleImage(coverImage);
      coverPhoto = photoUploaded;
    } catch (error) {
      console.log(error);
      return next(createHttpError(500, "Failed to upload coverimage"));
    }
  }
  const updatedFields = {
    merchantName,
    merchantEmail,
    currency,
    description,
    address: {
      street,
      city,
      zip,
      state,
      country,
    },
    logo: logoPhoto,
    coverImage: coverPhoto,
  };
  // Remove empty fields
  Object.keys(updatedFields).forEach(
    (key) =>
      (updatedFields[key] === "" || undefined) && delete updatedFields[key]
  );
  const updatedMerchant = await Merchant.findByIdAndUpdate(
    merchantId,
    updatedFields,
    {
      new: true,
    }
  );
  res.status(200).json({
    updatedMerchant,
    msg: "Merchant info updated successfully",
  });
});

export const deleteMerchantAccount = tryCatch(async (req, res, next) => {
  const { id: userId } = req.user;
  const merchant = await Merchant.findOne({ userId: userId.toString() });
  if (!merchant) {
    return next(createHttpError(401, "User merchant not found"));
  }
  const user = await User.findById(userId);
  await Merchant.deleteOne({ userId: userId });
  user.merchantId = undefined;
  await user.save();
  res.status(200).send({ msg: "Merchant account deleted" });
});

export const seeOrderRecords = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const { id: userId } = req.user;
  const user = await User.findById(userId);
  if (!user) {
    return next(createHttpError(404, "User not found"));
  }
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const orderCount = await Orders.countDocuments({
    merchantCode: merchantCode,
  });
  const customerCount = await Customer.countDocuments({
    merchantCode: merchantCode,
  });
  const trackOrderSales = await Orders.find({ merchantCode: merchantCode });
  const findIsPaid = await Orders.find({
    merchantCode: merchantCode,
    isPaid: true,
  });
  const findNotIsPaid = await Orders.find({
    merchantCode: merchantCode,
    isPaid: false,
  });
  const totalSales = trackOrderSales.reduce((acc, curr) => acc + curr.total, 0);
  const findTotalPaid = findIsPaid.reduce((acc, curr) => acc + curr.total, 0);
  const findTotalNotPaid = findNotIsPaid.reduce((acc, curr) => acc + curr.total, 0);
  res
    .status(200)
    .json({
      orderCount,
      customerCount,
      totalSales,
      findTotalPaid,
      findTotalNotPaid,
    });
});
