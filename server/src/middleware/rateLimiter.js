/**
 * Lightweight in-memory rate limiter for sensitive endpoints.
 */

const requestCounts = new Map();

function rateLimiter({ windowMs = 60000, max = 30 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }

    requestCounts.set(ip, record);

    if (record.count > max) {
      return res.status(429).json({
        error: 'Too many requests. Please wait before repeating this action.'
      });
    }

    next();
  };
}

module.exports = rateLimiter;

