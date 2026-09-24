import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import contactRoutes from "./contactRoutes";
import mfaRoutes from "./mfaRoutes";
import webhookRoutes from "./webhookRoutes";
import settingRoutes from "./settingRoutes";
import roleRoutes from "./roleRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/contacts", contactRoutes);
router.use("/auth/mfa", mfaRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/settings", settingRoutes);
router.use("/roles", roleRoutes);

export default router;
