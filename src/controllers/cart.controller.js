import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

// add signle product to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, size, quantity } = req.body;

    if (!productId || !size || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID, size and quantity are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Check if size is available
    const sizeObj = product.sizes.find((s) => s.size === size);
    if (!sizeObj) {
      return res.status(400).json({
        success: false,
        message: "Size not available for this product",
      });
    }

    // Check if quantity is available
    if (sizeObj.quantity < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough quantity available" });
    }

    // Find user's cart or create a new one
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [{ product: productId, size, quantity }],
      });
    } else {
      // Check if product with same size already exists in cart
      const existingProductIndex = cart.products.findIndex(
        (p) => p.product.toString() === productId && p.size === size
      );

      if (existingProductIndex !== -1) {
        // Update quantity of existing product
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        // Add new product to cart
        cart.products.push({ product: productId, size, quantity });
      }
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ user: userId }).populate({
      path: "products.product",
      select: "name price image category subCategory",
    });

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed add to cart",
      error: error.message,
    });
  }
};

// Bulk add products to cart (for handling array of products)
export const bulkAddToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { products } = req.body;

    console.log(products);

    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Products array is required" });
    }

    // Find user's cart or create a new one
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [],
      });
    }

    // Validate and add each product
    for (const item of products) {
      const { name, size, quantity, productId } = item;

      // Find product by name (assuming unique names, otherwise use ID)
      const product = await Product.findById(productId);

      if (!product) {
        continue; // Skip invalid products
      }

      // Check if size is available
      const sizeObj = product.sizes.find((s) => s.size === size);
      if (!sizeObj || sizeObj.quantity < quantity) {
        continue; // Skip if size not available or not enough quantity
      }

      // Check if product with same size already exists in cart
      const existingProductIndex = cart.products.findIndex(
        (p) =>
          p.product.toString() === product._id.toString() && p.size === size
      );

      if (existingProductIndex !== -1) {
        // Update quantity of existing product
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        // Add new product to cart
        cart.products.push({ product: product._id, size, quantity });
      }
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ user: userId }).populate({
      path: "products.product",
      select: "name price image category subCategory",
    });

    return res.status(200).json({
      success: true,
      message: "Products added to cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error adding products to cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add products to cart",
      error: error.message,
    });
  }
};

// get cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "products.product",
      select: "name price image category subCategory",
    });

    if (!cart) {
      return res.status(200).json({ success: true, cart: { products: [] } });
    }

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Get Cart Failed",
      error: error.message,
    });
  }
};

// Update product quantity in cart
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, size, quantity } = req.body;

    console.log(req.body);

    if (!productId || !size || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID, size and quantity are required",
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Find product in cart
    const productIndex = cart.products.findIndex(
      (p) => p.product.toString() === productId && p.size === size
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });
    }

    // Check if quantity is valid
    if (quantity <= 0) {
      // Remove product from cart
      cart.products.splice(productIndex, 1);
    } else {
      // Update product quantity
      const product = await Product.findById(productId);
      const sizeObj = product.sizes.find((s) => s.size === size);

      if (!sizeObj || sizeObj.quantity < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Not enough quantity available" });
      }

      cart.products[productIndex].quantity = quantity;
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ user: userId }).populate({
      path: "products.product",
      select: "name price image category subCategory",
    });

    return res
      .status(200)
      .json({ success: true, message: "Cart updated", cart: updatedCart });
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
};

// Remove product from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, size } = req.params;

    if (!productId || !size) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID and size are required" });
    }

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Find product in cart
    const productIndex = cart.products.findIndex(
      (p) => p.product.toString() === productId && p.size === size
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });
    }

    // Remove product from cart
    cart.products.splice(productIndex, 1);

    await cart.save();

    const updatedCart = await Cart.findOne({ user: userId }).populate({
      path: "products.product",
      select: "name price image category subCategory",
    });

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove from cart",
      error: error.message,
    });
  }
};
