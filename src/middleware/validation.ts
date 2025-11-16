/**
 * Input Validation Middleware
 *
 * Uses Zod for runtime type validation and sanitization.
 * Prevents invalid data from reaching business logic.
 */

import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

/**
 * Module creation schema
 */
export const createModuleSchema = z.object({
  title: z
    .string()
    .max(200, "Title must be 200 characters or less")
    .optional()
    .transform((val) => val?.trim()),

  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(1024 * 1024, "Content must be less than 1MB") // 1MB limit
    .transform((val) => val.trim()),

  autoSync: z
    .boolean()
    .optional()
    .default(true),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;

/**
 * Validation middleware factory
 *
 * Creates Express middleware that validates request body against a Zod schema.
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and transform the request body
      const validated = schema.parse(req.body);

      // Replace request body with validated/transformed data
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors nicely
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors,
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
        });
      }
    }
  };
}

/**
 * Sanitize string input
 *
 * Removes potentially dangerous characters and patterns.
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Remove control characters
}

/**
 * Validate slug format
 */
export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens"
  );

/**
 * Validate UUID format
 */
export const uuidSchema = z
  .string()
  .uuid("Invalid UUID format");
