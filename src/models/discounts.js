import { Schema, model } from "mongoose";

const discountSchema = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    merchantCode: {
      type: String,
      required: true,
    },
    discountCode: {
      type: String,
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    products: {
      type: [String],
    },
    enabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Discount = model("Discount", discountSchema);

export default Discount;
