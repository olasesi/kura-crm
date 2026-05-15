import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { sendError } from "../utils/apiResponse";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      if (error instanceof Error && "issues" in error) {
        const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> };
        const messages = zodError.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
        sendError(res, `Validation failed: ${messages.join("; ")}`, 400);
        return;
      }
      sendError(res, "Invalid request data.", 400);
    }
  };
};
