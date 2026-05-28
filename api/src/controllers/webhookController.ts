import { Response, NextFunction } from "express";
import { WebhookService } from "../services/webhookService";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/apiResponse";

export class WebhookController {
  static async subscribe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const { url, events, secret } = req.body;
      if (!url || !events || !Array.isArray(events) || events.length === 0) {
        sendError(res, "URL and events array are required.", 400);
        return;
      }
      const webhook = await WebhookService.subscribe(req.user.userId, url, events, secret);
      sendSuccess(res, webhook, "Webhook subscribed successfully.", undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async unsubscribe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const webhookId = parseInt(req.params.id as string);
      await WebhookService.unsubscribe(req.user.userId, webhookId);
      sendSuccess(res, null, "Webhook unsubscribed.");
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const webhookId = parseInt(req.params.id as string);
      const webhook = await WebhookService.update(req.user.userId, webhookId, req.body);
      sendSuccess(res, webhook, "Webhook updated.");
    } catch (err) {
      next(err);
    }
  }

  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const webhooks = await WebhookService.list(req.user.userId);
      sendSuccess(res, webhooks);
    } catch (err) {
      next(err);
    }
  }
}
