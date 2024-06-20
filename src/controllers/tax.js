import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";
import tryCatch from "../config/tryCatchFn.js";
import Tax from "../models/tax.js";
import Merchant from "../models/merchant.js";

export const createTax = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const { street, city, zip, state, country, standardRate, enabled } = req.body;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant Code is missing"));
  }
  if (!country || !standardRate) {
    return next(createHttpError(400, "Country and Standard rate missing!"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const tax = await Tax.create({
    merchantId: merchant._id,
    merchantCode: merchant.merchantCode,
    address: {
      street,
      city,
      zip,
      state,
      country,
    },
    rate: {
      standardRate,
    },
    enabled,
  });
  await tax.save();
  res.status(201).json({ tax, msg: "Tax rate set success" });
});

export const getAllTax = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const tax = await Tax.find({ merchantCode: merchantCode });
  res.status(200).json(tax);
});

export const getTax = tryCatch(async (req, res, next) => {
  const { taxId } = req.params;
  const { merchantCode } = req.params;
  if (!isValidObjectId(taxId)) {
    return next(createHttpError(400, "Invalid taxId"));
  }
  if (!taxId) {
    return next(createHttpError(400, "TaxId is missing"));
  }
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const tax = await Tax.findById(taxId);
  res.status(200).json(tax);
});

export const updateTax = tryCatch(async (req, res, next) => {
  const { taxId } = req.params;
  const { merchantCode } = req.params;
  const { street, city, zip, state, country, standardRate, enabled } = req.body;
  if (!isValidObjectId(taxId)) {
    return next(createHttpError(400, "Invalid merchantId"));
  }
  if (!taxId) {
    return next(createHttpError(400, "TaxId is missing"));
  }
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const updatedFields = {
    address: {
      street,
      city,
      zip,
      state,
      country,
    },
    rate: {
      standardRate,
    },
    enabled,
  };

  Object.keys(updatedFields).forEach(
    (key) =>
      (updatedFields[key] === "" || undefined) && delete updatedFields[key]
  );
  const updatedTax = await Tax.findByIdAndUpdate(taxId, updatedFields, {
    new: true,
  });
  res.status(200).json({
    updatedTax,
    msg: "Merchant info updated successfully",
  });
});

export const deleteTax = tryCatch(async (req, res, next) => {
  const { taxId } = req.params;
  const { merchantCode } = req.params;
  if (!isValidObjectId(taxId)) {
    return next(createHttpError(400, "Invalid tax Id "));
  }
  if (!taxId) {
    return next(createHttpError(400, "TaxId is missing"));
  }
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const tax = await Tax.findById(taxId);
  if (!tax) {
    return next(createHttpError(404, "tax not found"));
  }
  if (tax.merchantCode !== merchantCode) {
    return next(createHttpError(401, "You can only delete your own tax"));
  }
  await tax.deleteOne();
  res.status(200).json({ msg: "Tax deleted!" });
});

//client
export const getTaxRate = tryCatch(async (req, res, next) => {
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
  const findTaxRate = await Tax.findOne({
    "address.state": state,
    enabled: true,
  });
  const taxRate = findTaxRate ? findTaxRate.rate.standardRate : 0;
  res.status(200).json(taxRate);
});
