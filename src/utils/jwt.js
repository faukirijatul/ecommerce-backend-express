import jwt from "jsonwebtoken";

export const createToken = (user, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });

  res.cookie("token", token, {
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(Date.now() + 60 * 1000 * 5), // 5 minutes
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    path: "/",
  });
};

export const removeToken = (res) => {
  res.clearCookie("token", {
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};