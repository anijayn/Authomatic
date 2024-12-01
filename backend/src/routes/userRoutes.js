import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
} from "../controllers/auth/UserController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/profile", protect, getUser);

export default router;
