import mongoose from "mongoose";
import { info, error } from "../utils/logger.js";

const connectToDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);
    info("Connected to MongoDB");
  } catch (err) {
    error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};
export default connectToDatabase;
