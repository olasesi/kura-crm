import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { sendError } from "../utils/apiResponse";
import { env } from "../config/env";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      statusCode: err.statusCode,
    });
    sendError(res, err.message, err.statusCode);
    return;
  }

  logger.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
  });

  const statusCode = 500;
  const message = env.NODE_ENV === "production" ? "Internal server error" : err.message;
  sendError(res, message, statusCode);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, "Resource not found", 404);
};
