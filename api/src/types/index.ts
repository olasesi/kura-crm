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
  createdAt?: Date;
  updatedAt?: Date;
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
