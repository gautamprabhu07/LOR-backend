import mongoose from "mongoose";
import { env } from "../config/env.js";

mongoose.set("strictQuery", true);

export const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Index build logging (optional, but useful at scale)
    mongoose.connection.on("index", (model: string) => {
      console.log(`ℹ️ Indexes ensured for model: ${model}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed");
    console.error(err);
    process.exit(1); // fail fast if DB not connected
  }
};
