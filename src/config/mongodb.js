import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Database connected");
  } catch (error) {
    console.log(error);
  }
};

export default connectDb;
