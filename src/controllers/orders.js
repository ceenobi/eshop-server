import createHttpError from "http-errors";
import tryCatch from "../config/tryCatchFn.js";
import Merchant from "../models/merchant.js";
import Orders from "../models/orders.js";
import Tax from "../models/tax.js";
import Discount from "../models/discounts.js";
import Shipping from "../models/shipping.js";
import User from "../models/user.js";
import Customer from "../models/customer.js";
import env from "../utils/validateEnv.js";
import sendEmail from "../config/sendMail.js";

//check discount
const validateDiscountCode = async (discountCode, quantity, subTotal, next) => {
  try {
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
      // const getDiscount = findDiscount.discountValue / 100;
      // discountValue = (getDiscount * subTotal).toFixed(2);
      const getDiscount = findDiscount.discountValue / 100;
      const discountValue = getDiscount
        ? (getDiscount * subTotal).toFixed(2)
        : 0;
      return discountValue;
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};
//calc tax fee
const calculateTax = async (shippingDetails, subTotal, next) => {
  try {
    const getState = shippingDetails.state;
    const findTaxRate = await Tax.findOne({
      "address.state": getState,
      enabled: true,
    });
    const taxRate = findTaxRate ? findTaxRate.rate.standardRate : 2;
    const tax = taxRate / 100;
    const actual = (tax * subTotal).toFixed(2);
    return actual;
  } catch (error) {
    console.error(error);
    next(error);
  }
};

//calc shipping fee
const calcShippingFee = async (shippingDetails, next) => {
  const getState = shippingDetails.state;
  try {
    const findShipping = await Shipping.findOne({ state: getState });
    const shippingFee = findShipping ? findShipping.amount : 4000;
    return shippingFee.toFixed(2);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

//grab and save customer detail at point of order
const addCustomer = async (user, merchant, next) => {
  try {
    const getOrderCount = await Orders.find({ userId: user._id });
    const getOrderLength = getOrderCount.length;
    const findUser = await Orders.find({ userId: user._id });
    const totalSum = findUser.reduce((acc, curr) => acc + curr.total, 0);
    const findCustomer = await Customer.findOne({ email: user.email });
    if (!findCustomer) {
      const customer = await Customer.create({
        userId: user._id,
        merchantId: merchant._id,
        merchantCode: merchant.merchantCode,
        username: user.username,
        email: user.email,
        photo: user.photo,
        totalOrders: getOrderLength,
        totalSpent: totalSum,
      });
      await customer.save();
    }
    if (findCustomer) {
      const updatedFields = {
        totalOrders: getOrderLength,
        totalSpent: totalSum,
      };
      const updateCustomer = await Customer.findOneAndUpdate(
        { email: user.email },
        updatedFields,
        {
          new: true,
        }
      );
      await updateCustomer.save();
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const sendOrderMail = async (user, order) => {
  const emailStatus = await sendEmail({
    username: user.username,
    from: env.USER_MAIL_LOGIN,
    to: user.email,
    subject: "You created an order",
    text: `Your order ${order._id} was successfully
        created. You are to pay #${order.total}`,
  });
  if (!emailStatus.success) {
    return next(createHttpError(500, "Order message not sent"));
  }
};

//create order
export const createOrder = tryCatch(async (req, res, next) => {
  const { id: userId } = req.user;
  const { merchantCode } = req.params;
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
  const {
    orderItems,
    quantity,
    shippingDetails,
    paymentMethod,
    discountCode,
    subTotal,
  } = req.body;
  if (orderItems && orderItems.length === 0) {
    return next(createHttpError(400, "No order items to process!"));
  }
  //get discount
  let discountValue = 0;
  if (discountCode) {
    discountValue = await validateDiscountCode(
      discountCode,
      quantity,
      subTotal,
      next
    );
  }

  //gettax
  const calcTax = await calculateTax(shippingDetails, subTotal, next);

  //get shippingFee
  const getShippingFee = await calcShippingFee(shippingDetails, subTotal, next);
  const fullTotal = Number(
    (
      Number(subTotal) +
      Number(calcTax) +
      Number(getShippingFee) -
      Number(discountValue)
    ).toFixed(2)
  );

  const order = await Orders.create({
    userId: userId,
    merchantId: merchant._id,
    merchantCode: merchant.merchantCode,
    orderItems,
    quantity,
    shippingDetails,
    paymentMethod,
    discount: discountValue,
    taxPrice: calcTax,
    shippingFee: getShippingFee,
    subTotal,
    total: fullTotal,
  });
  await order.save();
  await addCustomer(user, merchant, next);
  await sendOrderMail(user, order);
  res.status(201).json({ order, msg: "Order created success." });
});

export const getAllOrders = tryCatch(async (req, res, next) => {
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
  const count = await Orders.countDocuments();
  const totalPages = Math.ceil(count / limit);
  const orders = await Orders.find({
    merchantCode: merchantCode,
  })
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);
  const order = {
    currentPage: page,
    totalPages,
    count,
    orders,
  };
  if (!order) {
    return next(createHttpError(404, "Orders not found"));
  }
  res.status(200).json(order);
});

export const getAllOrdersClient = tryCatch(async (req, res, next) => {
  const { merchantCode, userId } = req.params;
  if (!merchantCode || !userId) {
    return next(createHttpError(400, "Merchant code or userId is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skipCount = (page - 1) * limit;
  const count = await Orders.countDocuments();
  const totalPages = Math.ceil(count / limit);
  const orders = await Orders.find({
    merchantCode: merchantCode,
    userId: userId,
  })
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);
  const order = {
    currentPage: page,
    totalPages,
    count,
    orders,
  };
  if (!order) {
    return next(createHttpError(404, "Orders not found"));
  }
  res.status(200).json(order);
});

export const getAnOrder = tryCatch(async (req, res, next) => {
  const { orderId } = req.params;
  const { merchantCode } = req.params;
  if (!merchantCode || !orderId) {
    return next(createHttpError(400, "Merchant code or OrderId is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const order = await Orders.findById(orderId);
  if (!order) {
    return next(createHttpError(404, "Order not found"));
  }
  res.status(200).json(order);
});

export const updateAnOrderStatus = tryCatch(async (req, res, next) => {
  const { id: userId } = req.user;
  const { orderId, merchantCode } = req.params;
  const { orderStatus, isPaid, isDelivered, reference } = req.body;
  if (!merchantCode || !orderId) {
    return next(createHttpError(400, "Merchant code or OrderId is missing"));
  }
  const user = await User.findById(userId);
  if (!user) {
    return next(createHttpError(401, "User not found"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const order = await Orders.findById(orderId);
  if (!order) {
    return next(createHttpError(404, "Order not found"));
  }
  if (merchant.merchantCode !== merchantCode) {
    return next(createHttpError(403, "You cannot access this merchant order"));
  }
  const updatedFields = {
    orderStatus,
    isPaid,
    paidAt: isPaid ? Date.now() : undefined,
    isDelivered,
    deliveredAt: isDelivered ? Date.now() : undefined,
    reference,
  };
  Object.keys(updatedFields).forEach(
    (key) =>
      (updatedFields[key] === "" || undefined || null) &&
      delete updatedFields[key]
  );
  if (isPaid) {
    await sendEmail({
      username: user.username,
      from: env.USER_MAIL_LOGIN,
      to: user.email,
      subject: "Payment received",
      text: `We received your payment with reference id: ${
        reference ? reference : orderId
      }.`,
    });
  }
  if (isDelivered) {
    await sendEmail({
      username: user.username,
      from: env.USER_MAIL_LOGIN,
      to: user.email,
      subject: "Order fufillment",
      text: `We have successfully delivered your order with reference id: ${
        reference ? reference : orderId
      }.`,
    });
  }
  const updatedOrder = await Orders.findByIdAndUpdate(orderId, updatedFields, {
    new: true,
  });
  res
    .status(200)
    .json({ updatedOrder, msg: "Order info updated successfully" });
});

export const createCheckout = tryCatch(async (req, res, next) => {
  const { merchantCode } = req.params;
  if (!merchantCode) {
    return next(createHttpError(400, "Merchant code is missing"));
  }
  const merchant = await Merchant.findOne({ merchantCode: merchantCode });
  if (!merchant) {
    return next(createHttpError(404, "Merchant not found"));
  }
  const { quantity, shippingDetails, discountCode, subTotal } = req.body;
  let discountValue = 0;
  if (discountCode) {
    discountValue = await validateDiscountCode(
      discountCode,
      quantity,
      subTotal,
      next
    );
  }
  const calcTax = await calculateTax(shippingDetails, subTotal, next);
  const getShippingFee = await calcShippingFee(shippingDetails, subTotal, next);
  const total = Number(
    (
      Number(subTotal) +
      Number(calcTax) +
      Number(getShippingFee) -
      Number(discountValue)
    ).toFixed(2)
  );
  res.status(200).json({
    discountValue,
    discountCode,
    subTotal,
    calcTax,
    getShippingFee,
    total,
  });
});
