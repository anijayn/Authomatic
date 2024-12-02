import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUser,
  getLoginStatus,
  verifyEmail,
  verifyUser,
} from "../controllers/auth/UserController.js";
import {
  adminProtect,
  creatorProtect,
  protect,
} from "../middleware/authMiddleware.js";
import {
  deleteUser,
  getAllUsers,
} from "../controllers/auth/adminController.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/profile", protect, getUser);
router.patch("/profile", protect, updateUser);
router.get("/login-status", getLoginStatus);
router.post("/verify-email", protect, verifyEmail);
router.post("/verify-user/:verificationToken", protect, verifyUser);

//Admin routes
router.delete("/admin/users/:id", protect, adminProtect, deleteUser);

//Creator routes
router.get("/admin/users", protect, creatorProtect, getAllUsers);

export default router;
