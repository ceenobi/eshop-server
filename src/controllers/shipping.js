import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";
import tryCatch from "../config/tryCatchFn.js";
import Merchant from "../models/merchant.js";
import Shipping from "../models/shipping.js";

export const createShippingFee = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const { state, country, amount } = req.body;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  if (!state || !country || !amount) {
    return next(createHttpError(400, "Field params is required!"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const shippingFee = await Shipping.create({
    merchantId: merchant._id,
    merchantCode: merchant.merchantCode,
    state,
    country,
    amount,
  });
  await shippingFee.save();
  res.status(201).json({ shippingFee, msg: "Shipping Fee added." });
});

export const getAllShippingFee = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const shipping = await Shipping.find({ merchantCode: merchantCode }).sort({
    _id: -1,
  });
  res.status(200).json(shipping);
});

export const getShipping = tryCatch(async (req, res, next) => {
  const { shippingId } = req.params;
  const { merchantCode } = req.params;
  if (!isValidObjectId(shippingId)) {
    return next(createHttpError(400, "Invalid shippingId"));
  }
  if (!shippingId) {
    return next(createHttpError(400, "ShippingId is missing"));
  }
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const shipping = await Shipping.findById(shippingId);
  res.status(200).json(shipping);
});

export const updateShipping = tryCatch(async (req, res, next) => {
  const { shippingId } = req.params;
  const { merchantCode } = req.params;
  const { state, country, amount } = req.body;
  if (!isValidObjectId(shippingId)) {
    return next(createHttpError(400, "Invalid shippingId"));
  }
  if (!shippingId) {
    return next(createHttpError(400, "shippingId is missing"));
  }
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const updatedFields = {
    state,
    country,
    amount,
  };
  Object.keys(updatedFields).forEach(
    (key) =>
      (updatedFields[key] === "" || undefined) && delete updatedFields[key]
  );
  const updatedShipping = await Shipping.findByIdAndUpdate(
    shippingId,
    updatedFields,
    {
      new: true,
    }
  );
  res.status(200).json({
    updatedShipping,
    msg: "Shipping fee updated successfully",
  });
});

export const deleteShipping = tryCatch(async (req, res, next) => {
  const { shippingId } = req.params;
  const { merchantCode } = req.params;
  if (!isValidObjectId(shippingId)) {
    return next(createHttpError(400, "Invalid shippingId or merchant Id"));
  }
  if (!shippingId) {
    return next(createHttpError(400, " ShippingId is missing"));
  }
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const shipping = await Shipping.findById(shippingId);
  if (!shipping) {
    return next(createHttpError(404, "shipping not found"));
  }
  if (shipping.merchantCode !== merchantCode) {
    return next(
      createHttpError(401, "You can only delete your own shipping fee")
    );
  }
  await shipping.deleteOne();
  res.status(200).json({ msg: "shipping fee deleted!" });
});

//client
export const getShippingAmount = tryCatch(async (req, res, next) => {
  const { merchantCode, state } = req.params;
  if (!state || !merchantCode) {
    return next(
      createHttpError(400, "Shipping state or merchant code is missing")
    );
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const shippingState = await Shipping.findOne({ state: state });
  const shippingFee = shippingState ? shippingState.amount : 4000;
  res.status(200).json(shippingFee);
});
