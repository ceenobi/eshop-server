import { Schema, model } from "mongoose";

const clientSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      lowercase: true,
    },
    photo: {
      type: String,
      default:
        "https://res.cloudinary.com/ceenobi/image/upload/v1698666381/icons/user-avatar-profile-icon-black-vector-illustration_mpn3ef.jpg",
    },
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },
    email: {
      type: String,
      unique: [true, "Email already exists!"],
      required: [true, "Email is required!"],
      match: [
        /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const Client = model("Client", clientSchema);

export default Client;
