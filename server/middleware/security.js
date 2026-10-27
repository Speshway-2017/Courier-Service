const rateLimit = require('express-rate-limit');

/**
 * Recursive sanitizer to strip MongoDB operator keys ($ and .)
 * from user-supplied request bodies, query params, and route params.
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const clean = {};
  for (const key of Object.keys(obj)) {
    // Drop keys starting with $ or containing a dot
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    clean[key] = sanitizeObject(obj[key]);
  }
  return clean;
};

const mongoSanitizer = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * General API Rate Limiter
 * 300 requests per 15-minute window per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Strict Auth / Login Rate Limiter
 * 15 login attempts per 15-minute window per IP to block brute-force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
});

/**
 * Public Parcel Tracking Rate Limiter
 * 60 queries per 5-minute window per IP
 */
const trackingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Tracking rate limit reached. Please wait a few moments before searching again.',
  },
});

module.exports = {
  mongoSanitizer,
  apiLimiter,
  authLimiter,
  trackingLimiter,
};
