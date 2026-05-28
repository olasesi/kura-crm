import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { WebhookAttributes } from "../types";
import { User } from "./User";

export interface WebhookInstance extends Model<WebhookAttributes>, WebhookAttributes {}

export const Webhook = sequelize.define<WebhookInstance>(
  "Webhook",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    events: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue("events");
        return raw ? JSON.parse(raw) : [];
      },
      set(value: string[]) {
        this.setDataValue("events", JSON.stringify(value));
      },
    },
    secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    defaultScope: {
      attributes: { exclude: ["secret"] },
    },
    scopes: {
      withSecret: {
        attributes: { include: ["secret"] },
      },
    },
  }
);

Webhook.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Webhook, { foreignKey: "userId", as: "webhooks" });
