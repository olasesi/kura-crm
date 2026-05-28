import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { verifyRecaptcha } from "../security/recaptcha";
import { sendError } from "../utils/apiResponse";

export const recaptchaMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const recaptchaToken = req.body?.recaptchaToken;

  if (!recaptchaToken && process.env.RECAPTCHA_SECRET_KEY) {
    sendError(res, "reCAPTCHA verification required.", 400);
    return;
  }

  if (!recaptchaToken) {
    next();
    return;
  }

  verifyRecaptcha(recaptchaToken)
    .then(() => next())
    .catch((err) => {
      sendError(res, err.message || "reCAPTCHA verification failed.", 400);
    });
};
