import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";
import NodeCache from "node-cache";
import tryCatch from "../config/tryCatchFn.js";
import Discount from "../models/discounts.js";
import Merchant from "../models/merchant.js";

const cache = new NodeCache({ stdTTL: 600 });

export const createDiscount = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const {
    discountCode,
    discountValue,
    quantity,
    startDate,
    endDate,
    products,
    enabled,
  } = req.body;
  if (!merchantCode) {
    return next(createHttpError(400, "Your Merchant code is missing"));
  }
  if (!discountCode || !discountValue) {
    return next(createHttpError(400, "Required parameters are missing!"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant code not found!"));
  }
  const discount = await Discount.create({
    merchantId: merchant._id,
    merchantCode: merchant.merchantCode,
    discountCode,
    discountValue,
    quantity,
    startDate,
    endDate,
    products,
    enabled,
  });
  await discount.save();
  res.status(201).json({ discount, msg: "Discount created" });
});

export const getADiscount = tryCatch(async (req, res, next) => {
  const { discountId } = req.params;
  const { merchantCode } = req.params;
  if (!isValidObjectId(discountId)) {
    return next(createHttpError(400, "Invalid discountId "));
  }
  if (!merchantCode || !discountId) {
    return next(createHttpError(400, "Merchant code or discountId is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const cacheDiscount = cache.get("discount");
  if (cacheDiscount) {
    return res.status(200).json(cacheDiscount);
  }
  const discount = await Discount.findById(discountId);
  if (!discount) {
    return next(createHttpError(404, "Discount not found"));
  }
  cache.set("discount", discount);
  res.status(200).json(discount);
});

export const getAllDiscounts = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  if (!merchantCode) {
    return next(createHttpError(400, "merchantCode is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const discounts = await Discount.find({ merchantCode: merchantCode }).sort({
    _id: -1,
  });
  res.status(200).json(discounts);
});

export const updateDiscount = tryCatch(async (req, res, next) => {
  const { discountId } = req.params;
  const { merchantCode } = req.params;
  const {
    discountCode,
    discountValue,
    quantity,
    startDate,
    endDate,
    products,
    enabled,
  } = req.body;
  if (!isValidObjectId(discountId)) {
    return next(createHttpError(400, "Invalid discountId"));
  }
  if (!discountId || !merchantCode) {
    return next(createHttpError(400, "DiscountId or merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  if (merchant.merchantCode !== merchantCode) {
    return next(
      createHttpError(403, "You cannot access this merchant discount")
    );
  }
  const updatedFields = {
    discountCode,
    discountValue,
    quantity,
    startDate,
    endDate,
    products,
    enabled,
  };

  Object.keys(updatedFields).forEach(
    (key) =>
      (updatedFields[key] === "" || undefined) && delete updatedFields[key]
  );
  const updatedDiscount = await Discount.findByIdAndUpdate(
    discountId,
    updatedFields,
    {
      new: true,
    }
  );
  res.status(200).json({
    updatedDiscount,
    msg: "Merchant discount updated successfully",
  });
});

export const deleteDiscount = tryCatch(async (req, res, next) => {
  const { discountId, merchantCode } = req.params;
  if (!isValidObjectId(discountId)) {
    return next(createHttpError(400, "Invalid discountId "));
  }
  if (!discountId || !merchantCode) {
    return next(createHttpError(400, "Params is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const discount = await Discount.findById(discountId);
  if (!discount) {
    return next(createHttpError(404, "discount not found"));
  }
  if (!discount.merchantCode !== merchantCode) {
    return next(createHttpError(401, "You can only delete your discounts"));
  }
  await discount.deleteOne();
  res.status(200).json({ msg: "Discount deleted!" });
});

//client
export const validateDiscountCode = tryCatch(async (req, res, next) => {
  const { discountCode } = req.body;
  const { quantity, subTotal } = req.params;
  const findDiscount = await Discount.findOne({
    discountCode: discountCode,
    enabled: true,
  });
  if (!findDiscount) {
    return next(createHttpError(400, "discount code not valid!"));
  }
  const checkValidity = findDiscount.endDate;
  if (checkValidity !== null) {
    const currentDate = Date.now();
    if (currentDate > checkValidity) {
      return next(createHttpError(400, "Discount code expired!"));
    }
  }
  if (
    quantity &&
    findDiscount.quantity !== 0 &&
    quantity < findDiscount.quantity
  ) {
    return next(
      createHttpError(
        400,
        `Discount code valid for ${findDiscount.quantity} items! Buy more.`
      )
    );
  }
  if (quantity >= findDiscount.quantity) {
    const getDiscount = findDiscount.discountValue / 100;
    const discountValue = getDiscount ? (getDiscount * subTotal).toFixed(2) : 0;
    res.status(200).json({ discountCode, discountValue, msg: "Discount added" });
  }
});
