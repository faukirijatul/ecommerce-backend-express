import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { createToken, removeToken } from "../utils/jwt.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email address" });
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    newUser.password = undefined;

    res.status(201).json({
      success: true,
      user: newUser,
      message: "Register successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Register Failed",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email address" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    await createToken(user, res);

    user.password = undefined;

    res.status(200).json({
      success: true,
      user,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Login Failed",
      error: error.message,
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user,
      message: "Get user profile successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Get user profile Failed",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData = {};

    if (name) {
      if (!validator.isLength(name, { min: 1 })) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      updateData.name = name;
    }

    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address",
        });
      }

      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      updateData.email = email;
    }

    if (password) {
      if (!validator.isLength(password, { min: 8 })) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      user: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Update user failed",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    await removeToken(res);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Logout Failed",
      error: error.message,
    });
  }
};
