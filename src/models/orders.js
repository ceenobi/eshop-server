import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    merchantCode: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      
    },
    orderItems: [
      {
        name: { type: String, required: true },
        slug: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: [String], required: true },
        price: { type: Number, required: true },
        category: { type: String, required: true },
        brand: { type: String, required: true },
      },
    ],
    shippingDetails: {
      fullname: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: Number, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["Pay on delivery", "Paypal", "Paystack"],
      default: "Pay on delivery",
      required: true,
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0.0,
    },
    quantity: {
      type: Number,
      required: true,
    },
    taxPrice: {
      type: Number,
      default: 0.0,
    },
    discountCode: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0.0,
    },
    subTotal: {
      type: Number,
      required: true,
      default: 0.0,
    },
    total: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    orderStatus: {
      type: String,
      enum: ["open", "processing", "fulfilled"],
      default: "open",
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
const Orders = model("Orders", orderSchema);

export default Orders;
