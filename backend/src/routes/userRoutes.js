import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUser,
} from "../controllers/auth/UserController.js";
import { adminProtect, protect } from "../middleware/authMiddleware.js";
import { deleteUser } from "../controllers/auth/adminController.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/profile", protect, getUser);
router.patch("/profile", protect, updateUser);

//Admin routes
router.delete("/admin/users/:id", adminProtect, deleteUser);

export default router;
