import asyncHandler from "express-async-handler";
import UserModel from "../../models/auth/userModel.js";
import generateToken from "../../helpers/generateToken.js";
import bcrypt from "bcrypt";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  //Setting constraints
  if (!name || !email || !password) {
    res.status(400).json({
      message: "All fields are mandatory!",
    });
  }
  if (password.length < 6) {
    res.status(400).json({
      message: "Password length should be greater than 6 characters",
    });
  }

  const userExists = await UserModel.findOne({ email });
  if (userExists) {
    res.status(400).json({
      message: "User already exits. Please try logging in!",
    });
  }

  const user = await UserModel.create({
    name,
    email,
    password,
  });

  // Creating JWT and storing it as a cookie
  const token = generateToken(user._id);
  res.cookie("token", token, {
    path: "/", // Cookie valid for entire domain
    httpOnly: true, // works only through HTTP(S) and not via client side JS
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: true, // Avoid CSRF
    secure: true, // Only works over HTTPS
  });

  // Sending back registered user information in response
  if (user) {
    const { _id, name, email, role, photo, bio, isVerified } = user;
    res.status(201).json({
      _id,
      name,
      email,
      role,
      photo,
      bio,
      isVerified,
      token,
    });
  } else {
    res.status(400).json({
      message: "User creation failed. Invalid user data",
    });
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are mandatory" });
  }

  // Check if user exists
  const userExists = await UserModel.findOne({ email });
  if (!userExists) {
    return res.status(400).json({
      message: "User does not exist. Please register before logging in",
    });
  }

  // Check if password is correct
  const isMatching = await bcrypt.compare(password, userExists.password);
  if (!isMatching) {
    return res.status(400).json({
      message: "Invalid user credentials",
    });
  }

  // Generate token, store it in cookie and return user information
  const token = generateToken(userExists._id);
  if (userExists && isMatching) {
    const { _id, name, email, role, photo, bio, isVerified } = userExists;
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: true,
      secure: true,
    });
    res.status(200).json({
      _id,
      name,
      email,
      role,
      photo,
      bio,
      isVerified,
      token,
    });
  } else {
    res.status(400).json({
      message: "Login failed. Invalid credentials",
    });
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "User has been logged out successfully!" });
});

export const getUser = asyncHandler(async (req, res) => {
  // Protect middleware extracts user information from token
  const user = await UserModel.findById(req.user._id).select("-password");
  if (user) {
    return res.status(200).json(user);
  } else {
    return res.status(404).json({ message: "User not found!" });
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  // Protect middleware extracts user information from token
  const user = await UserModel.findById(req.user._id);
  // If user exists, proceeding with the update
  if (user) {
    // Extract update details from request and update if they exist
    const { name, bio, photo } = req.body;
    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.photo = photo || user.photo;

    // Save the updated info to db and return the updated info in response
    const updated = await user.save();
    res.status(200).json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      photo: updated.photo,
      bio: updated.bio,
      isVerified: updated.isVerified,
    });
  } else {
    res.status(404).json({ message: "User updation failed. User not found" });
  }
});
