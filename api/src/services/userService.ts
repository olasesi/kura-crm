import { User, UserInstance } from "../models/User";
import { UserRole } from "../types";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../config/logger";

export class UserService {
  static async findAll(
    page: number,
    limit: number
  ): Promise<{ rows: UserInstance[]; count: number }> {
    const offset = (page - 1) * limit;
    const result = await User.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    return result;
  }

  static async findById(id: number): Promise<UserInstance> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return user;
  }

  static async update(
    id: number,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      role: UserRole;
      isActive: boolean;
    }>
  ): Promise<UserInstance> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) {
        throw new AppError("Email already in use.", 409);
      }
    }

    await user.update(data);
    logger.info(`User updated: ${id}`);
    return user;
  }

  static async delete(id: number): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    await user.destroy();
    logger.info(`User deleted: ${id}`);
  }

  static async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.scope("withCredentials").findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      throw new AppError("Current password is incorrect.", 401);
    }

    user.password = newPassword;
    await user.save();
    logger.info(`Password changed for user: ${id}`);
  }
}
