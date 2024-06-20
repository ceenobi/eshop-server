import { Schema, model } from "mongoose";

// Define a sub-schema for the address
const addressSchema = new Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  country: { type: String, required: true },
});

// Main Tax schema
const taxSchema = new Schema(
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
    address: addressSchema,
    rate: {
      standardRate: { type: Number, required: true },
    },
    enabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Tax = model("Tax", taxSchema);

export default Tax;
