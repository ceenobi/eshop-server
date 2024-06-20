import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";
import tryCatch from "../config/tryCatchFn.js";
import Category from "../models/category.js";
import Merchant from "../models/merchant.js";
import { uploadSingleImage } from "../config/uploadImages.js";

export const createCategory = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const { name, description, image } = req.body;
  if (!merchantCode) {
    return next(createHttpError(400, "MerchantId is missing"));
  }
  if (!name || !description) {
    return next(createHttpError(400, "Name and Description is required!"));
  }

  let catImage = "";

  if (image) {
    try {
      const photoUploaded = await uploadSingleImage(image);
      catImage = photoUploaded;
    } catch (error) {
      console.log(error);
      return next(createHttpError(500, "Failed to upload category image"));
    }
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const category = await Category.create({
    merchantId: merchant._id,
    merchantCode: merchant.merchantCode,
    name,
    description,
    image: catImage,
  });
  await category.save();
  res.status(201).json({ category, msg: "Category added." });
});

export const getAllCategories = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const categories = await Category.find({ merchantCode: merchantCode });
  if (!categories) {
    return next(createHttpError(400, "No categories to display"));
  }
  res.status(200).json(categories);
});

export const getACategory = tryCatch(async (req, res, next) => {
  const { categoryId } = req.params;
  const { merchantCode } = req.params;
  if (!isValidObjectId(categoryId)) {
    return next(createHttpError(400, "Invalid categoryId "));
  }
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  if (!categoryId) {
    return next(createHttpError(400, "CategoryId is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const category = await Category.findById(categoryId);
  res.status(200).json(category);
});

export const updateCategory = tryCatch(async (req, res, next) => {
  const { categoryId } = req.params;
  const { merchantCode } = req.params;
  const { name, description, image } = req.body;

  if (!isValidObjectId(categoryId)) {
    return next(createHttpError(400, "Invalid  categoryId"));
  }
  if (!categoryId || !merchantCode) {
    return next(createHttpError(400, "categoryId or merchantCode is missing"));
  }

  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }

  let catImage = "";
  if (image) {
    try {
      const photoUploaded = await uploadSingleImage(image);
      catImage = photoUploaded;
    } catch (error) {
      console.log(error);
      return next(createHttpError(500, "Failed to upload category image"));
    }
  }

  const updatedFields = {
    name,
    description,
    image: catImage,
  };

  Object.keys(updatedFields).forEach(
    (key) =>
      (updatedFields[key] === "" || undefined) && delete updatedFields[key]
  );
  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    updatedFields,
    {
      new: true,
    }
  );

  if (merchant.merchantCode !== merchantCode) {
    return next(createHttpError(403, "You cannot access this merchant"));
  }
  res.status(200).json({
    updatedCategory,
    msg: "Category updated successfully",
  });
});

export const deleteCategory = tryCatch(async (req, res, next) => {
  const { categoryId } = req.params;
  const { merchantCode } = req.params;
  if (!isValidObjectId(categoryId)) {
    return next(createHttpError(400, "Invalid categoryId "));
  }
  if (!categoryId || !merchantCode) {
    return next(createHttpError(400, "Params is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    return next(createHttpError(404, "category not found"));
  }
  if (!category.merchantCode !== (merchantCode)) {
    return next(createHttpError(401, "You can only delete your category "));
  }
  await category.deleteOne();
  res.status(200).json({ msg: "Category deleted!" });
});
