import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { SettingAttributes } from "../types";

export interface SettingInstance extends Model<SettingAttributes>, SettingAttributes {}

export const Setting = sequelize.define<SettingInstance>(
  "Setting",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    group: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["group", "key", "userId"],
        name: "settings_group_key_user_unique",
      },
      { fields: ["group"] },
      { fields: ["userId"] },
    ],
  }
);