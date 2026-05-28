import { Router } from "express";
import { WebhookController } from "../controllers/webhookController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", WebhookController.subscribe);
router.get("/", WebhookController.list);
router.put("/:id", WebhookController.update);
router.delete("/:id", WebhookController.unsubscribe);

export default router;
