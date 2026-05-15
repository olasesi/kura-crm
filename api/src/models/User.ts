import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { UserAttributes, UserRole } from "../types";
import bcrypt from "bcryptjs";

export interface UserInstance extends Model<UserAttributes>, UserAttributes {
  validatePassword(password: string): Promise<boolean>;
}

export const User = sequelize.define<UserInstance>(
  "User",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.USER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    refreshToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    hooks: {
      beforeCreate: async (user: UserInstance) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
      beforeUpdate: async (user: UserInstance) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ["password", "refreshToken"] },
    },
    scopes: {
      withCredentials: {
        attributes: { include: ["password", "refreshToken"] },
      },
    },
  }
);

(User.prototype as UserInstance).validatePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};
