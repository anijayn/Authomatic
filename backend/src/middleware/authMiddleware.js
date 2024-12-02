import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import UserModel from "../models/auth/userModel.js";

export const protect = asyncHandler(async (req, res, next) => {
  try {
    // Check if token is present in cookies
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "User not authorized. Please log in first!" });
    }

    // Verify if the token is associated to a user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id).select("-password"); // Fetches user information excluding the password
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Send the extracted user data from token back to the request
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Not authorized. Token failed to work" });
  }
});

export const adminProtect = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      message: "Admins are only allowed to do this!",
    });
  }
});

export const creatorProtect = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === "creator" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({
      message: "Creators/admins are only allowed to do this!",
    });
  }
});
