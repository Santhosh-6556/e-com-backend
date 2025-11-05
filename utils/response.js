export const successResponse = (c, message, data = {}) => {
  return c.json(
    {
      success: true,
      message,
      data,
    },
    200
  );
};

export const errorResponse = (c, message, statusCode = 400) => {
  return c.json(
    {
      success: false,
      message,
    },
    statusCode
  );
};
