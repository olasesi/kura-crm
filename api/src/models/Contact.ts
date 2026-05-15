import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { ContactAttributes } from "../types";
import { User } from "./User";

export interface ContactInstance extends Model<ContactAttributes>, ContactAttributes {}

export const Contact = sequelize.define<ContactInstance>(
  "Contact",
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
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    indexes: [
      {
        fields: ["email"],
      },
      {
        fields: ["createdBy"],
      },
    ],
  }
);

Contact.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
User.hasMany(Contact, { foreignKey: "createdBy", as: "contacts" });
