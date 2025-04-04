import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        size: { type: String, required: true },
      },
    ],
    amount: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, required: true, default: "Placed" },
    deliveryData: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      street: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String },
      country: { type: String },
    },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
