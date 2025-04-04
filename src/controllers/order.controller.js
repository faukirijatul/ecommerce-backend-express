import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import "dotenv/config";

import Stripe from "stripe";

// Gateway Init
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// COD oder
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.body.paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message:
          "This endpoint is only for COD orders. Please use the appropriate endpoint for other payment methods.",
      });
    }

    if (!req.body.products || req.body.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products found",
      });
    }

    // Check product availability
    const isProductAvailable = await Promise.all(
      req.body.products.map(async (item) => {
        const product = await Product.findById(item.product);

        if (!product) {
          return {
            available: false,
            productId: item.product,
            message: "Product not found",
          };
        }

        const sizeInventory = product.sizes.find((s) => s.size === item.size);
        if (!sizeInventory) {
          return {
            available: false,
            productId: item.product,
            name: product.name,
            message: `Size ${item.size} not available for ${product.name}`,
          };
        }

        if (sizeInventory.quantity < item.quantity) {
          return {
            available: false,
            productId: item.product,
            name: product.name,
            message: `Only ${sizeInventory.quantity} items available for ${product.name} in size ${item.size}, requested ${item.quantity}`,
          };
        }

        return {
          available: true,
          productId: item.product,
          size: item.size,
          quantity: item.quantity,
        };
      })
    );

    const unavailableProducts = isProductAvailable.filter((p) => !p.available);
    if (unavailableProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some products are not available",
        unavailableProducts,
      });
    }

    // Update product quantities and sold count
    await Promise.all(
      isProductAvailable.map(async (item) => {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              "sizes.$[size].quantity": -item.quantity,
              sold: item.quantity,
            },
          },
          {
            arrayFilters: [{ "size.size": item.size }],
            new: true,
          }
        );
      })
    );

    const products = req.body.products.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      size: item.size,
    }));

    // Create a new order
    const order = new Order({
      user: userId,
      products,
      amount: req.body.amount,
      deliveryFee: req.body.deliveryFee,
      totalAmount: req.body.totalAmount,
      deliveryData: req.body.deliveryData,
      paymentMethod: req.body.paymentMethod,
      payment: false,
      status: "Placed",
    });

    const savedOrder = await order.save();

    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Create Order Failed",
      error: error.message,
    });
  }
};

// Stripe
export const createStripeOrder = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.body.paymentMethod !== "online") {
      return res.status(400).json({
        success: false,
        message:
          "This endpoint is only for Online payments. Please use the appropriate endpoint for other payment methods.",
      });
    }

    if (!req.body.products || req.body.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products found",
      });
    }

    // Check product availability
    const isProductAvailable = await Promise.all(
      req.body.products.map(async (item) => {
        const product = await Product.findById(item.product);

        if (!product) {
          return {
            available: false,
            productId: item.product,
            message: "Product not found",
          };
        }

        const sizeInventory = product.sizes.find((s) => s.size === item.size);
        if (!sizeInventory) {
          return {
            available: false,
            productId: item.product,
            name: product.name,
            message: `Size ${item.size} not available for ${product.name}`,
          };
        }

        if (sizeInventory.quantity < item.quantity) {
          return {
            available: false,

            productId: item.product,
            name: product.name,
            message: `Only ${sizeInventory.quantity} items available for ${product.name} in size ${item.size}, requested ${item.quantity}`,
          };
        }

        return {
          available: true,
          name: product.name,
          productId: item.product,
          size: item.size,
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    const unavailableProducts = isProductAvailable.filter((p) => !p.available);
    if (unavailableProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some products are not available",
        unavailableProducts,
      });
    }

    const products = req.body.products.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      size: item.size,
    }));

    // Create a new order
    const order = new Order({
      user: userId,
      products,
      amount: req.body.amount,
      deliveryFee: req.body.deliveryFee,
      totalAmount: req.body.totalAmount,
      deliveryData: req.body.deliveryData,
      paymentMethod: req.body.paymentMethod,
      payment: false,
      status: "Unpaid",
    });

    const savedOrder = await order.save();

    // Calculate total amount for Stripe
    const lineItems = isProductAvailable.map((item) => ({
      price_data: {
        currency: "idr",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    if (req.body.deliveryFee && req.body.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: "idr",
          product_data: {
            name: "Delivery Fee",
          },
          unit_amount: req.body.deliveryFee * 100,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.ORIGIN}/success?orderId=${savedOrder._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.ORIGIN}/cart`,
      metadata: {
        userId: userId.toString(),
        totalAmount: req.body.totalAmount,
      },
    });

    res.status(200).json({
      success: true,
      message: "Stripe checkout session created",
      url: session.url,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Create Stripe Order Failed",
      error: error.message,
    });
  }
};

export const stripeVerify = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId, session_id } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed or failed",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "Placed", payment: true },
      { new: true }
    );

    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment Verified",
      order: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Strype Verify Failed",
      error: error.message,
    });
  }
};

// Get all orders for the logged-in user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .populate({
        path: "products.product",
        select: {
          name: 1,
          price: 1,
          image: { $slice: 1 },
        },
      })
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found for this user",
        orders: [],
      });
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
      error: error.message,
    });
  }
};
