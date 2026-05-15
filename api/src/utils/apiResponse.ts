import { Response } from "express";
import { ApiResponse, PaginationMeta } from "../types";

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  meta?: PaginationMeta,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = { success: true, data, message, meta };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
  details?: unknown
): void => {
  const response: ApiResponse = { success: false, error };
  if (details && process.env.NODE_ENV === "development") {
    (response as unknown as Record<string, unknown>).details = details;
  }
  res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): void => {
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
  sendSuccess(res, data, message, meta);
};
