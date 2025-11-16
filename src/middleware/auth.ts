/**
 * Authentication Middleware
 *
 * Provides API key-based authentication for endpoints.
 * Supports both header-based and query parameter authentication.
 *
 * Usage:
 * - Add to routes that need protection
 * - Set API_KEY environment variable
 * - Clients send: Authorization: Bearer {API_KEY} or ?api_key={API_KEY}
 */

import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  apiKeyValid?: boolean;
}

/**
 * Check if authentication is enabled
 */
export function isAuthEnabled(): boolean {
  return !!process.env.API_KEY && process.env.API_KEY.length > 0;
}

/**
 * Authentication middleware
 *
 * If API_KEY is not set, authentication is disabled (open access).
 * If API_KEY is set, requests must provide valid key.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // If no API key configured, allow all requests (backwards compatible)
  if (!isAuthEnabled()) {
    console.warn(
      "⚠️  API authentication disabled - set API_KEY environment variable to enable"
    );
    next();
    return;
  }

  const apiKey = process.env.API_KEY!;

  // Check Authorization header (preferred)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const providedKey = authHeader.substring(7);

    if (providedKey === apiKey) {
      req.apiKeyValid = true;
      next();
      return;
    }
  }

  // Fallback: Check query parameter (less secure, but convenient)
  const queryKey = req.query.api_key;
  if (queryKey && queryKey === apiKey) {
    req.apiKeyValid = true;
    next();
    return;
  }

  // Authentication failed
  res.status(401).json({
    success: false,
    error: "Unauthorized - valid API key required",
    message: "Provide API key via Authorization header (Bearer token) or api_key query parameter",
  });
}

/**
 * Optional authentication
 *
 * Validates API key if provided, but doesn't require it.
 * Useful for endpoints that have both public and authenticated behavior.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!isAuthEnabled()) {
    next();
    return;
  }

  const apiKey = process.env.API_KEY!;

  // Check header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const providedKey = authHeader.substring(7);
    req.apiKeyValid = providedKey === apiKey;
  }

  // Check query
  const queryKey = req.query.api_key;
  if (queryKey && queryKey === apiKey) {
    req.apiKeyValid = true;
  }

  // Continue regardless of validation result
  next();
}
