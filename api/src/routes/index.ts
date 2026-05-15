import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import contactRoutes from "./contactRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/contacts", contactRoutes);

export default router;
