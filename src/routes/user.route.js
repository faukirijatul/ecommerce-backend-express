import express from "express";
import * as userController from "../controllers/user.controller.js";
import { checkAuth } from "../middleware/check-auth.js";

const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", checkAuth, userController.getUserProfile);
router.put("/profile", checkAuth, userController.updateUser);
router.delete("/logout", checkAuth, userController.logout);

export default router;
