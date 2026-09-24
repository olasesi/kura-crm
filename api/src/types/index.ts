import { Request } from "express";

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  refreshToken?: string;
  failedLoginAttempts: number;
  lockoutUntil?: Date | null;
  totpSecret?: string;
  totpEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginResult {
  user?: Record<string, unknown>;
  tokens?: { accessToken: string; refreshToken: string };
  mfaRequired?: boolean;
  mfaToken?: string;
}

export interface MfaPayload {
  userId: number;
  type: "mfa";
}

export interface ContactAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WebhookAttributes {
  id: number;
  userId: number;
  url: string;
  events: string;
  secret?: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SettingAttributes {
  id: number;
  group: string;
  key: string;
  value: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SettingEntry {
  key: string;
  value: unknown;
}

export const WEBHOOK_EVENTS = [
  "contact.created",
  "contact.updated",
  "contact.deleted",
  "user.registered",
  "user.updated",
  "login.success",
  "login.failed",
  "account.locked",
  "setting.updated",
  "setting.deleted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
