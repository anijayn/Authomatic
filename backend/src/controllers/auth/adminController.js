import asyncHandler from "express-async-handler";
import UserModel from "../../models/auth/userModel.js";

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Deleting user failed" });
  }
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserModel.find({});
  if (!users) {
    res.status(404).json({ message: "No users found!" });
  }
  res.status(200).json(users);
});
