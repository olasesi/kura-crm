import Bull from "bull";
import { env } from "./env";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const createQueue = (name: string): Bull.Queue => {
  if (env.NODE_ENV === "test") {
    return { name, on: () => {}, isReady: () => Promise.resolve(), add: () => Promise.resolve() } as unknown as Bull.Queue;
  }
  return new Bull(name, REDIS_URL);
};

export const emailQueue = createQueue("email");
export const auditQueue = createQueue("audit");
export const reportQueue = createQueue("report");
export const notificationQueue = createQueue("notification");
export const webhookQueue = createQueue("webhook");

emailQueue.on("completed", (job) => {
  logger.debug(`Email job ${job.id} completed`);
});

emailQueue.on("failed", (job, err) => {
  logger.error(`Email job ${job.id} failed:`, err);
});

auditQueue.on("completed", (job) => {
  logger.debug(`Audit job ${job.id} completed`);
});

reportQueue.on("completed", (job) => {
  logger.debug(`Report job ${job.id} completed`);
});

notificationQueue.on("completed", (job) => {
  logger.debug(`Notification job ${job.id} completed`);
});

export const initializeQueues = async (): Promise<void> => {
  try {
    await emailQueue.isReady();
    await auditQueue.isReady();
    await reportQueue.isReady();
    await notificationQueue.isReady();
    await webhookQueue.isReady();
    logger.info("Bull queues initialized successfully");
  } catch (error) {
    logger.warn("Bull queues not available (Redis may be down):", error);
  }
};

webhookQueue.on("completed", (job) => {
  logger.debug(`Webhook job ${job.id} completed`);
});

webhookQueue.on("failed", (job, err) => {
  logger.error(`Webhook job ${job.id} failed:`, err);
});

if (env.NODE_ENV !== "test") {
  webhookQueue.process(async (job) => {
    const { WebhookService } = await import("../services/webhookService");
    await WebhookService.deliver(job.data.webhookId, job.data.payload);
  });
}

export const addAuditLog = async (data: {
  userId: number;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}): Promise<void> => {
  try {
    await auditQueue.add(data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  } catch {
    logger.warn("Failed to enqueue audit log");
  }
};
