import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      min: 3,
      max: 50,
    },
    image: {
      type: String,
    },
    merchantCode: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = model("Category", categorySchema);

export default Category;
