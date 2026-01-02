import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Global rate limiter - applies to all routes
 * 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later.",
    retryAfter: 15,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later.",
      retryAfter: 900, // 15 minutes in seconds
    });
  },
});

/**
 * Strict limiter for authentication-related endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment limiter - stricter for financial operations
 * 10 requests per 15 minutes per IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many payment requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Order creation limiter
 * 20 orders per hour per IP
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: "Order creation limit reached, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API limiter for general API calls
 * 200 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "API rate limit exceeded, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
