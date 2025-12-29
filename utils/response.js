export const successResponse = (cOrRes, message, data = {}) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (typeof cOrRes.json === "function" && typeof cOrRes.req !== "undefined") {
    return cOrRes.json(response, 200);
  }

  return cOrRes.status(200).json(response);
};

export const errorResponse = (cOrRes, message, statusCode = 400) => {
  const response = {
    success: false,
    message,
  };

  if (typeof cOrRes.json === "function" && typeof cOrRes.req !== "undefined") {
    return cOrRes.json(response, statusCode);
  }

  return cOrRes.status(statusCode).json(response);
};
