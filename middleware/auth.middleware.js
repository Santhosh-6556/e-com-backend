import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";

export const authMiddleware = (allowedRoles = []) => {
  return async (c, next) => {
    const authHeader = c.req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(c, "No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = verifyToken(token);

      const userRole = decoded.role || "user";
      c.set("user", { ...decoded, role: userRole });

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return errorResponse(c, "Access denied: insufficient permissions", 403);
      }

      await next();
    } catch (err) {
      return errorResponse(c, "Invalid or expired token", 403);
    }
  };
};
