import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { RoleAttributes } from "../types";

export interface RoleInstance extends Model<RoleAttributes>, RoleAttributes {}

export const Role = sequelize.define<RoleInstance>(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    permissions: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      comment: "JSON array of permission keys",
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: "roles",
  }
);