import jwt from "jsonwebtoken";

// Helper to get JWT secret from either environment
const getSecret = () => {
  // In Cloudflare Workers, Wrangler injects env vars globally via "globalThis"
  if (typeof globalThis !== "undefined" && globalThis.JWT_SECRET) {
    return globalThis.JWT_SECRET;
  }

  // In Hono context, env vars may exist on c.env (we’ll handle that later)
  if (typeof process !== "undefined" && process.env?.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  throw new Error("JWT_SECRET not defined in environment variables");
};

/**
 * Generate a JWT token
 */
export const generateToken = (payload, expiresIn = "7d") => {
  const secret = getSecret();
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token) => {
  const secret = getSecret();
  return jwt.verify(token, secret);
};
