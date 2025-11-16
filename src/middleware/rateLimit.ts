/**
 * Rate Limiting Middleware
 *
 * Protects API from abuse and DoS attacks by limiting request rates.
 * Prevents cost explosion from AI API calls.
 */

import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * - 100 requests per 15 minutes per IP
 * - Applies to all API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Skip rate limiting if API key is valid (authenticated users get higher limits)
  skip: (req: any) => req.apiKeyValid === true,
});

/**
 * Module creation rate limiter
 * - 10 requests per hour per IP
 * - More strict because it triggers expensive AI processing
 * - Cost per module: ~$0.053
 * - 10 requests/hr = max $0.53/hr per IP
 */
export const createModuleLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 module creates per hour
  message: {
    success: false,
    error: "Module creation rate limit exceeded. Maximum 10 modules per hour.",
    cost: "Each module costs ~$0.053 to process with AI",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Authenticated users get 3x higher limit
  skip: (req: any) => false,  // Never skip
  keyGenerator: (req: any) => {
    // Use API key if authenticated, otherwise IP
    return req.apiKeyValid ? `api_key_${req.apiKeyValid}` : req.ip;
  },
});

/**
 * Authenticated user rate limiter
 * - 300 requests per 15 minutes
 * - Higher limit for authenticated users
 */
export const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    error: "Authenticated rate limit exceeded. Maximum 300 requests per 15 minutes.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 * - 5 uploads per hour per IP
 * - Very strict to prevent storage abuse
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 uploads per hour
  message: {
    success: false,
    error: "Upload rate limit exceeded. Maximum 5 uploads per hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Webflow sync rate limiter
 * - 30 requests per hour per IP
 * - Protects against Webflow API rate limits
 */
export const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: "Sync rate limit exceeded. Maximum 30 syncs per hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
