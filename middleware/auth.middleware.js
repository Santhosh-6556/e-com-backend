import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";

export const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = verifyToken(token);
      //   req.user = decoded;

      const userRole = decoded.role || "user";
      req.user = { ...decoded, role: userRole };

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return errorResponse(
          res,
          "Access denied: insufficient permissions",
          403
        );
      }

      next();
    } catch (err) {
      return errorResponse(res, "Invalid or expired token", 403);
    }
  };
};
