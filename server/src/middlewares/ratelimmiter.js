import redis from "../config/redis.js";
const rateLimiter = async (req, res, next) => {
  try {
    const ip = req.ip;
    const key = `ratelimit:${ip}`;

    // Increment request count
    const requests = await redis.incr(key);

    // Set expiration for the first request
    if (requests === 1) {
      await redis.expire(key, 60);
    }

    // Allow maximum 100 requests
    if (requests > 10) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);

    // Decide whether to allow the request if Redis fails
    next();
  }
};

export default rateLimiter;