import express from "express";
import * as productController from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";
import { checkRole } from "../middleware/check-role.js";
import { checkAuth } from "../middleware/check-auth.js";

const router = express.Router();

router.post(
  "/",
  checkAuth,
  checkRole("admin"),
  upload.array("images", 5),
  productController.addProduct
);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.put(
  "/:id",
  checkAuth,
  checkRole("admin"),
  upload.array("images", 5),
  productController.updateProduct
);
router.delete(
  "/:id",
  checkAuth,
  checkRole("admin"),
  productController.deleteProduct
);

export default router;
