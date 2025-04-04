import Product from "../models/product.model.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";

export const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, sizes } = req.body;

    if (req.files.length === 0) {
      res.status(500).json({
        success: false,
        message: "Image is required",
      });
    }

    const imageUploads = await Promise.all(
      req.files.map(
        async (file) => await uploadImage(file, "tokobaju/products")
      )
    );

    const images = imageUploads.map((upload) => ({
      public_id: upload.public_id,
      url: upload.secure_url,
    }));

    const product = new Product({
      name,
      description,
      price,
      image: images,
      category,
      subCategory,
      sizes: JSON.parse(sizes),
    });
    
    await product.save();

    res.status(201).json({ success: true, message: "Product added", product });
  } catch (error) {
    console.error(error);

    // Rollback Cloudinary uploads if product creation fails
    if (req.files) {
      await Promise.all(req.files.map((file) => deleteImage(file.public_id)));
    }

    res.status(500).json({
      success: false,
      message: "Add Product Failed",
      error: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      search = "",
      category,
      subCategory,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 40,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = Array.isArray(category) 
        ? { $in: category } 
        : category;
    }

    if (subCategory) {
      query.subCategory = Array.isArray(subCategory) 
        ? { $in: subCategory } 
        : subCategory;
    }


    const validSortFields = ["price", "sold", "createdAt"];
    const sanitizedSortBy = validSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sort = {
      [sanitizedSortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .select({
        name: 1,
        description: 1,
        price: 1,
        image: { $slice: 1 },
        sold: 1,
        category: 1,
        subCategory: 1,
      });

    const totalProducts = await Product.countDocuments(query);

    const totalPages = Math.ceil(totalProducts / limitNumber);

    res.json({
      success: true,
      message: "Get all products successful",
      products,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalProducts,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get all products",
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const transformedProduct = {
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image.map((img) => ({ url: img.url })),
      category: product.category,
      subCategory: product.subCategory,
      sizes: product.sizes.map((size) => ({
        size: size.size,
        quantity: size.quantity,
      })),
      sold: product.sold,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    res.json({
      success: true,
      message: "Product found",
      product: transformedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      existingImages = [],
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Upload new images
    const newImageUploads = req.files
      ? await Promise.all(
          req.files.map((file) => uploadImage(file, "products"))
        )
      : [];

    const newImages = newImageUploads.map((upload) => ({
      public_id: upload.public_id,
      url: upload.secure_url,
    }));

    // Remove old images not in existing images
    const imagesToDelete = product.image.filter(
      (img) => !existingImages.includes(img.public_id)
    );

    // Delete old images from Cloudinary
    await Promise.all(imagesToDelete.map((img) => deleteImage(img.public_id)));

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ? price : product.price;
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.sizes = sizes ? JSON.parse(sizes) : product.sizes;
    product.image = [
      ...existingImages.map((id) =>
        product.image.find((img) => img.public_id === id)
      ),
      ...newImages,
    ];

    await product.save();

    const transformedProduct = {
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image.map((img) => ({ url: img.url })),
      category: product.category,
      subCategory: product.subCategory,
      sizes: product.sizes.map((size) => ({
        size: size.size,
        quantity: size.quantity,
      })),
      sold: product.sold,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    res.status(200).json({
      message: "Product updated",
      product: transformedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Update Product Failed",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    await Promise.all(
      product.image.map((image) => deleteImage(image.public_id))
    );

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Product deleted", product });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Delete Product Failed",
      error: error.message,
    });
  }
};
