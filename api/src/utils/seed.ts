import { User } from "../models/User";
import { Contact } from "../models/Contact";
import { connectDatabase } from "../config/database";
import { UserRole } from "../types";
import { logger } from "../config/logger";

const seed = async (): Promise<void> => {
  try {
    await connectDatabase();

    const adminExists = await User.findOne({ where: { email: "admin@kura-crm.com" } });
    if (adminExists) {
      logger.info("Seed data already exists, skipping.");
      process.exit(0);
    }

    const admin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: "admin@kura-crm.com",
      password: "Admin123!",
      role: UserRole.ADMIN,
    } as any);

    const manager = await User.create({
      firstName: "Manager",
      lastName: "User",
      email: "manager@kura-crm.com",
      password: "Manager123!",
      role: UserRole.MANAGER,
    } as any);

    const regularUser = await User.create({
      firstName: "Regular",
      lastName: "User",
      email: "user@kura-crm.com",
      password: "User123!",
      role: UserRole.USER,
    } as any);

    await Contact.bulkCreate([
      { firstName: "Alice", lastName: "Johnson", email: "alice@example.com", phone: "+1111111111", company: "Acme Inc", createdBy: admin.id },
      { firstName: "Bob", lastName: "Smith", email: "bob@example.com", phone: "+1222222222", company: "Globex Corp", createdBy: manager.id },
      { firstName: "Carol", lastName: "Williams", email: "carol@example.com", phone: "+1333333333", company: "Initech", createdBy: regularUser.id },
    ] as any);

    logger.info("Seed data created successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("Seed failed:", error);
    process.exit(1);
  }
};

seed();
