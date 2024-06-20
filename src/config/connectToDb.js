import mongoose from "mongoose";
import env from "../utils/validateEnv.js";

const connection = {};

export const connectDB = async () => {
  if (connection.isConnected) {
    console.log("MongoDB is already connected");
    return;
  }
  let db;
  try {
    connection.isConnected = true; // Update status before connection
    db = await mongoose.connect(env.MONGO_URI, {
      dbName: "DB-MERCH2",
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.log(error);
    throw new Error(error);
  } finally {
    connection.isConnected = db.connections[0].readyState; // Update status in finally block
  }
};
