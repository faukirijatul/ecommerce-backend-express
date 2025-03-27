import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    sizes: [
      {
        size: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
