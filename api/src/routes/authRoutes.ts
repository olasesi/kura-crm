import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", authenticate, AuthController.logout);
router.get("/profile", authenticate, AuthController.profile);

export default router;
