import createHttpError from "http-errors";
import { isValidObjectId } from "mongoose";
import tryCatch from "../config/tryCatchFn.js";
import Merchant from "../models/merchant.js";
import Product from "../models/product.js";
import { uploadImages } from "../config/uploadImages.js";
import formatText from "../utils/formatText.js";

export const addProduct = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const {
    name,
    description,
    category,
    price,
    slug,
    image,
    brand,
    isActive,
    inStock,
  } = req.body;

  if (!merchantCode) {
    return next(createHttpError(400, "MerchantId is missing"));
  }
  if (!name || !description || !category || !price || !slug || !image) {
    return next(createHttpError(400, "Field params is required!"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  let productImage = [];
  if (image) {
    try {
      const photoUploaded = await uploadImages(image);
      productImage.push(...photoUploaded);
    } catch (error) {
      console.log(error);
      return next(createHttpError(500, "Failed to upload product images"));
    }
  }

  const product = await Product.create({
    merchantId: merchant._id,
    merchantCode: merchant.merchantCode,
    name,
    description,
    category,
    slug,
    price,
    brand,
    image: productImage,
    isActive,
    inStock,
  });
  await product.save();
  res.status(201).json({ product, msg: "Product added." });
});

export const getAllProducts = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skipCount = (page - 1) * limit;
  const count = await Product.countDocuments();
  const totalPages = Math.ceil(count / limit);
  const products = await Product.find({
    merchantCode: merchantCode,
  })
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);
  if (!products) {
    return next(createHttpError(400, "No products to display"));
  }
  const product = {
    currentPage: page,
    totalPages,
    count,
    products,
  };
  res.status(200).json(product);
});

export const getAProduct = tryCatch(async (req, res, next) => {
  const { slug, merchantCode } = req.params;
  if (!merchantCode || !slug) {
    return next(
      createHttpError(400, "Merchant code or Product slug is missing")
    );
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const product = await Product.findOne({ slug: slug });
  if (!product) {
    return next(createHttpError(404, "Product not found"));
  }
  res.status(200).json(product);
});

export const updateProduct = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const { productId } = req.params;
  const {
    name,
    description,
    category,
    price,
    slug,
    image,
    brand,
    isActive,
    inStock,
    condition,
  } = req.body;

  if (!isValidObjectId(productId)) {
    return next(createHttpError(400, "Invalid product id"));
  }
  if (!merchantCode || !productId) {
    return next(createHttpError(400, "Product or Merchant Id is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  let productImage = [];
  if (image) {
    try {
      const photoUploaded = await uploadImages(image);
      productImage.push(...photoUploaded);
    } catch (error) {
      console.log(error);
      return next(createHttpError(500, "Failed to upload product images"));
    }
  }
  const updatedFields = {
    name,
    description,
    category,
    slug,
    price,
    brand,
    image: productImage,
    isActive,
    inStock,
    condition,
  };
  // Remove empty fields
  Object.keys(updatedFields).forEach((key) => {
    if (
      updatedFields[key] === "" ||
      updatedFields[key] === undefined ||
      (Array.isArray(updatedFields[key]) && updatedFields[key].length === 0)
    ) {
      delete updatedFields[key];
    }
  });
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    updatedFields,
    {
      new: true,
    }
  );
  if (merchant.merchantCode !== updatedProduct.merchantCode) {
    return next(
      createHttpError(403, "You cannot access this merchant product")
    );
  }
  res.status(200).json({
    updatedProduct,
    msg: "Product updated successfully",
  });
});

export const deleteProduct = tryCatch(async (req, res, next) => {
  const { productId } = req.params;
  const { merchantCode } = req.params;
  if (!isValidObjectId(productId)) {
    return next(createHttpError(400, "Invalid productId "));
  }
  if (!productId || !merchantCode) {
    return next(createHttpError(400, "Product or Merchant id is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const product = await Product.findById(productId);
  if (!product) {
    return next(createHttpError(404, "discount not found"));
  }
  if (!product.merchantCode !== merchantCode) {
    return next(
      createHttpError(401, "No id match, You can only delete your product")
    );
  }
  await product.deleteOne();
  res.status(200).json({ msg: "Product deleted!" });
});

//client
export const getNewProducts = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skipCount = (page - 1) * limit;
  const count = await Product.countDocuments();
  const totalPages = Math.ceil(count / limit);
  const products = await Product.find({
    merchantCode: merchantCode,
    condition: "new",
    isActive: true,
  })
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);
  if (!products) {
    return next(createHttpError(400, "No products to display"));
  }
  const product = {
    currentPage: page,
    totalPages,
    count,
    products,
  };
  res.status(200).json(product);
});

export const getBestSellerProducts = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skipCount = (page - 1) * limit;
  const count = await Product.countDocuments();
  const totalPages = Math.ceil(count / limit);
  const products = await Product.find({
    merchantCode: merchantCode,
    condition: "best seller",
    isActive: true,
  })
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);
  if (!products) {
    return next(createHttpError(400, "No products to display"));
  }
  const product = {
    currentPage: page,
    totalPages,
    count,
    products,
  };
  res.status(200).json(product);
});

export const getProductsByCategory = tryCatch(async (req, res, next) => {
  const { merchantCode, category } = req.params;
  if (!merchantCode || !category) {
    return next(createHttpError(400, "Merchant code or category is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skipCount = (page - 1) * limit;
  let categoryName = formatText(
    category.charAt(0).toUpperCase() + category.slice(1)
  );
  const count = await Product.countDocuments();
  const totalPages = Math.ceil(count / limit);
  const products = await Product.find({
    merchantCode: merchantCode,
    category: { $regex: categoryName, $options: "i" },
    isActive: true,
  })
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);
  if (!products) {
    return next(createHttpError(400, "No products to display"));
  }
  const product = {
    currentPage: page,
    totalPages,
    count,
    products,
  };
  res.status(200).json(product);
});

export const getRecommendedProducts = tryCatch(async (req, res, next) => {
  const { slug, merchantCode } = req.params;
  if (!merchantCode || !slug) {
    return next(
      createHttpError(400, "Merchant code or Product slug is missing")
    );
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const product = await Product.findOne({ slug: slug });
  if (!product) {
    return next(createHttpError(404, "Product not found"));
  }
  const populateProducts = await Product.aggregate([{ $sample: { size: 7 } }]);
  const filterCurrentProduct = populateProducts.filter(
    (item) => item.slug !== product.slug
  );
  res.status(200).json(filterCurrentProduct);
});

export const searchProducts = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const query = req.query.q || "undefined";
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const searchQuery = query.trim() || query.split(",").map((tag) => tag.trim());
  const searchResult = await Product.find({
    $or: [
      { name: { $regex: searchQuery, $options: "i" } },
      { description: { $regex: searchQuery, $options: "i" } },
      { brand: { $regex: searchQuery, $options: "i" } },
    ],
  });
  if (!searchResult) {
    return next(createHttpError(400, "Search did not return a match"));
  }
  res.status(200).json(searchResult);
});
