import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { createToken } from "../utils/jwt.js";

export const checkAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        const refreshToken = req.cookies.refreshToken;

        if (!token && !refreshToken) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (token) {
            try {
                const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decodedToken.id);
                next();
                return;
            } catch (error) {
                return res.status(403).json({ success: false, message: "Invalid token", error: error.message });
            }
        }

        if (refreshToken) {
            try {
                const decodedToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
                req.user = await User.findById(decodedToken.id);

                await createToken(req.user, res);
                next()
                return;
            } catch (error) {
                return res.status(403).json({ success: false, message: "Invalid token", error: error.message });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
}