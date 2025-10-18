import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("🔗 MONGO_URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed", error);
    process.exit(1);
  }
};
