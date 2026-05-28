import { Response, NextFunction } from "express";
import { Contact } from "../models/Contact";
import { AuthRequest } from "../types";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse";
import { WebhookService } from "../services/webhookService";

export class ContactController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contactData = {
        ...req.body,
        createdBy: req.user?.userId,
      };
      const contact = await Contact.create(contactData);
      WebhookService.dispatch("contact.created", { contactId: contact.id, email: contact.email, createdBy: req.user?.userId });
      sendSuccess(res, contact, "Contact created successfully.", undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { rows, count } = await Contact.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [{ association: "creator", attributes: ["id", "firstName", "lastName", "email"] }],
      });

      sendPaginated(res, rows, count, page, limit);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const contact = await Contact.findByPk(id, {
        include: [{ association: "creator", attributes: ["id", "firstName", "lastName", "email"] }],
      });
      if (!contact) {
        sendError(res, "Contact not found.", 404);
        return;
      }
      sendSuccess(res, contact);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const [updated] = await Contact.update(req.body, {
        where: { id },
      });
      if (!updated) {
        sendError(res, "Contact not found.", 404);
        return;
      }
      const contact = await Contact.findByPk(id);
      WebhookService.dispatch("contact.updated", { contactId: id, email: contact?.email });
      sendSuccess(res, contact, "Contact updated successfully.");
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const contact = await Contact.findByPk(id);
      if (!contact) {
        sendError(res, "Contact not found.", 404);
        return;
      }
      await contact.destroy();
      WebhookService.dispatch("contact.deleted", { contactId: id, email: contact.email });
      sendSuccess(res, null, "Contact deleted successfully.");
    } catch (err) {
      next(err);
    }
  }
}
