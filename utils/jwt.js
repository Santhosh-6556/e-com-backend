import jwt from "jsonwebtoken";

/**
 * Generate a JWT token
 * @param {Object} payload - Data to include in token (e.g., { id, email, role })
 * @param {String} expiresIn - Token expiry (default "7d")
 * @returns {String} Signed JWT token
 */
export const generateToken = (payload, expiresIn = "7d") => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined in environment variables");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token from request header
 * @returns {Object} Decoded token payload
 * @throws Error if token invalid or expired
 */
export const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined in environment variables");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};
