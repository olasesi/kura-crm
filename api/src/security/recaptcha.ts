import { AppError } from "../middleware/errorHandler";
import { env } from "../config/env";
import { logger } from "../config/logger";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export const verifyRecaptcha = async (token: string): Promise<void> => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    logger.warn("RECAPTCHA_SECRET_KEY not configured, skipping reCAPTCHA verification");
    return;
  }

  if (!token) {
    throw new AppError("reCAPTCHA token is required.", 400);
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      body: params,
    });

    const data = await response.json();

    if (!data.success) {
      logger.warn("reCAPTCHA verification failed", { errors: data["error-codes"] });
      throw new AppError("reCAPTCHA verification failed. Please try again.", 400);
    }

    if (data.score !== undefined && data.score < 0.5) {
      throw new AppError("Suspicious activity detected. Please try again later.", 403);
    }

    logger.debug("reCAPTCHA verification passed", { score: data.score });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("reCAPTCHA verification error:", error);
    throw new AppError("reCAPTCHA verification failed.", 500);
  }
};
