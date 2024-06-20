import { Schema, model } from "mongoose";

const productSchema = new Schema(
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
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: String,
    },
    brand: {
      type: String,
    },
    discountCode: {
      type: String,
    },
    image: {
      type: [String],
      required: true,
    },
    condition: {
      type: String,
      enum: ["new", "featured", "best seller", "normal"],
      default: "normal",
    },
    inStock: { type: Boolean, default: true, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Product = model("Product", productSchema);

export default Product;
