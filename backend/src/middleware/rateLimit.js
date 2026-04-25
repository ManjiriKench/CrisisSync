// Rate limiting middleware
// SOS endpoint: max 3 requests per device fingerprint per hour
// General API: 100 requests per IP per 15 minutes

import { rateLimit } from 'express-rate-limit';

// SOS rate limiter — 3 per hour per device
// Device fingerprint = IP + User-Agent hash
export const sosRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => {
    const ip = req.ip;
    const ua = req.headers['user-agent'] || 'unknown';
    return `${ip}:${ua.slice(0, 32)}`;
  },
  message: {
    error: 'Too many SOS requests. Maximum 3 per hour per device.',
    retryAfter: 'Check Retry-After header',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
