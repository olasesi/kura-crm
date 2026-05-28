import crypto from "crypto";
import https from "https";
import http from "http";
import { URL } from "url";
import { Webhook, WebhookInstance } from "../models/Webhook";
import { WebhookEvent, WebhookAttributes } from "../types";
import { webhookQueue } from "../config/queue";
import { logger } from "../config/logger";
import { AppError } from "../middleware/errorHandler";

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export class WebhookService {
  static async subscribe(
    userId: number,
    url: string,
    events: WebhookEvent[],
    secret?: string
  ): Promise<WebhookInstance> {
    return Webhook.create({ userId, url, events, secret, enabled: true } as any);
  }

  static async unsubscribe(userId: number, webhookId: number): Promise<void> {
    const webhook = await Webhook.findOne({ where: { id: webhookId, userId } });
    if (!webhook) {
      throw new AppError("Webhook not found.", 404);
    }
    await webhook.destroy();
  }

  static async update(
    userId: number,
    webhookId: number,
    data: Partial<Pick<WebhookAttributes, "url" | "events" | "secret" | "enabled">>
  ): Promise<WebhookInstance> {
    const webhook = await Webhook.findOne({ where: { id: webhookId, userId } });
    if (!webhook) {
      throw new AppError("Webhook not found.", 404);
    }
    await webhook.update(data as any);
    return webhook;
  }

  static async list(userId: number): Promise<WebhookInstance[]> {
    return Webhook.findAll({ where: { userId }, order: [["createdAt", "DESC"]] });
  }

  static async dispatch(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    try {
      const webhooks = await Webhook.scope("withSecret").findAll({
        where: { enabled: true },
      });

      const matching = webhooks.filter((w) => {
        const events = w.getDataValue("events");
        const parsed = typeof events === "string" ? JSON.parse(events) : events;
        return Array.isArray(parsed) && parsed.includes(event);
      });

      if (matching.length === 0) return;

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      for (const webhook of matching) {
        await webhookQueue.add(
          { webhookId: webhook.id, payload },
          { attempts: 5, backoff: { type: "exponential", delay: 2000 } }
        );
      }
    } catch (error) {
      logger.warn(`Failed to dispatch event ${event}:`, error);
    }
  }

  static async deliver(webhookId: number, payload: WebhookPayload): Promise<void> {
    const webhook = await Webhook.scope("withSecret").findByPk(webhookId);
    if (!webhook || !webhook.enabled) return;

    const body = JSON.stringify(payload);
    const secret = webhook.getDataValue("secret") || "";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    try {
      await httpRequest(webhook.url, body, signature);
      logger.debug(`Webhook delivered: ${webhook.url} (event: ${payload.event})`);
    } catch (error) {
      logger.warn(`Webhook delivery failed: ${webhook.url}`, error);
      throw error;
    }
  }
}

function httpRequest(url: string, body: string, signature: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "X-Webhook-Signature": signature,
        "User-Agent": "Kura-CRM-Webhook/1.0",
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk: string) => {
        responseBody += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Webhook returned status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Webhook request timed out"));
    });

    req.write(body);
    req.end();
  });
}
