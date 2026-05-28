import { Router } from "express";
import { MfaController } from "../controllers/mfaController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/setup", authenticate, MfaController.setup);
router.post("/verify", authenticate, MfaController.verify);
router.post("/disable", authenticate, MfaController.disable);
router.post("/challenge", MfaController.challenge);

export default router;
