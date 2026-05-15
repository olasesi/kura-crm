import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

router.get("/", authorize(UserRole.ADMIN, UserRole.MANAGER), UserController.getAll);
router.get("/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), UserController.getById);
router.put("/:id", authorize(UserRole.ADMIN), UserController.update);
router.delete("/:id", authorize(UserRole.ADMIN), UserController.delete);
router.put("/password/change", UserController.changePassword);

export default router;
