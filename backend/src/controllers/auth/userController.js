import asyncHandler from "express-async-handler";
import UserModel from "../../models/auth/userModel.js";
import generateToken from "../../helpers/generateToken.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import TokenModel from "../../models/auth/tokenModel.js";
import crypto, { hash } from "node:crypto";
import { hashToken } from "../../middleware/hashToken.js";
import sendEmail from "../../helpers/sendEmail.js";

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

export const getLoginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized. Please log in first!" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded) {
    res.status(200).json(true);
  } else {
    res.status(401).json(false);
  }
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user._id);
  if (!user) {
    res.status(404).json({ message: "User not found!" });
  }
  if (user.isVerified) {
    res.status(400).json({ message: "User already verified!" });
  }
  let token = await TokenModel.findOne({
    userId: user._id,
  });
  if (token) {
    await token.deleteOne();
  }
  // Generate a random token and append the user id to it making it unique
  const verificationToken = crypto.randomBytes(64).toString("hex") + user._id;
  // Hashes the above token and saves it in the db
  const hashedToken = hashToken(verificationToken);
  await new TokenModel({
    userId: user._id,
    verificationToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, //24 hours
  }).save();

  // Sending verification email
  const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  const subject = "Email Verification - Authomatic";
  const send_to = user.email;
  const reply_to = "noreply@gmail.com";
  const template = "emailVerification";
  const send_from = process.env.USER_EMAIL;
  const name = user.name;
  const url = verificationLink;
  try {
    await sendEmail(subject, send_to, send_from, reply_to, template, name, url);
    return res.json({ message: "Email sent" });
  } catch (error) {
    console.log("Error sending email: ", error);
    return res.status(500).json({ message: "Email could not be sent" });
  }
});

export const verifyUser = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;
  if (!verificationToken) {
    res.status(400).json({ message: "Invalid verification token" });
  }

  // Hashing the token so it can be retrieved from db and also check if the token has expired
  const hashedToken = hashToken(verificationToken);
  const userToken = await TokenModel.findOne({
    verificationToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });
  if (!userToken) {
    res.status(401).json({ message: "Invalid or expired verification token" });
  }

  // Retrieving user info from the user token + verification
  const user = await UserModel.findById(userToken.userId);
  if (user.isVerified) {
    res.status(400).json({ message: "User is already verified!" });
  }
  user.isVerified = true;
  await user.save();
  res.status(200).json({ message: "User has been successfully verified!" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Please provide an email" });
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the password reset token exist and if yes, remove it
  let token = await TokenModel.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Generate a random token and append the user id to it making it unique
  const resetPasswordToken = crypto.randomBytes(64).toString("hex") + user._id;
  const hashedToken = hashToken(resetPasswordToken);
  await new TokenModel({
    userId: user._id,
    resetPasswordToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  }).save();

  // Sending reset password email
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`;
  const subject = "Password Reset - Authomatic";
  const send_to = user.email;
  const send_from = process.env.USER_EMAIL;
  const reply_to = "noreply@noreply.com";
  const template = "forgotPassword";
  const name = user.name;
  const url = resetLink;
  try {
    await sendEmail(subject, send_to, send_from, reply_to, template, name, url);
    res.json({ message: "Email sent" });
  } catch (error) {
    console.log("Error sending email: ", error);
    return res.status(500).json({ message: "Email could not be sent" });
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetPasswordToken } = req.params;
  const { password } = req.body;
  if (!resetPasswordToken) {
    res.status(400).json({ message: "Invalid reset password token" });
  }

  // Hashing the token so it can be retrieved from db and also check if the token has expired
  const hashedToken = hashToken(resetPasswordToken);
  const userToken = await TokenModel.findOne({
    resetPasswordToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });
  if (!userToken) {
    res.status(400).json({ message: "Invalid or expired password token" });
  }

  // Retrieving user info from the user token + verification
  const user = await UserModel.findById(userToken.userId);
  user.password = password;
  await user.save();
  res.status(200).json({ message: "Password has been successfully reset!" });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400).json({ message: "All fields are mandatory!" });
  }
  const user = await UserModel.findById(req.user._id);
  const isMatching = await bcrypt.compare(oldPassword, user.password);
  if (!isMatching) {
    res.status(400).json({ message: "Current password is invalid!" });
  }
  if (isMatching) {
    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "New password and old password cannot be the same!" });
    }
    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json({ message: "Password has been successfully updated!" });
  } else {
    res.status(500).json({ message: "Password update failed!" });
  }
});
