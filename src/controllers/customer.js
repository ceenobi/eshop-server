import createHttpError from "http-errors";
import tryCatch from "../config/tryCatchFn.js";
import Merchant from "../models/merchant.js";
import Customer from "../models/customer.js";
import Orders from "../models/orders.js";

export const getAllCustomers = tryCatch(async (req, res, next) => {
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
  const count = await Customer.countDocuments();
  const totalPages = Math.ceil(count / limit);
  const customers = await Customer.find({
    merchantCode: merchantCode,
  })
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);
  const customer = {
    currentPage: page,
    totalPages,
    count,
    customers,
  };
  if (!customer) {
    return next(createHttpError(404, "Customers not found"));
  }
  res.status(200).json(customer);
});

export const getACustomer = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const { username } = req.params;
  if (!merchantCode || !username) {
    return next(createHttpError(400, "Merchant code or username is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const customer = await Customer.findOne({ username: username });
  if (!customer) {
    return next(createHttpError(404, "Customer not found"));
  }
  const customerOrders = await Orders.find({
    userId: customer.userId,
    merchantCode: merchantCode,
  }).sort({ _id: -1 });
  res.status(200).json({ customer, customerOrders });
});

export const deleteACustomer = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  const { username } = req.params;
  if (!merchantCode || !username) {
    return next(createHttpError(400, "Merchant code or username is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const customer = await Customer.findOne({ username: username });
  if (!customer) {
    return next(createHttpError(404, "Customer not found"));
  }
  await Orders.deleteOne({ userId: customer.userId });
  await customer.deleteOne();
  res.status(200).json({ msg: "Customer deleted!" });
});
