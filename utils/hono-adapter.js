export const expressToHono = (handler) => {
  return async (c) => {
    try {
      let body = {};
      try {
        const contentType = c.req.header("content-type") || "";
        if (contentType.includes("application/json")) {
          body = await c.req.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          body = await c.req.parseBody();
        }
      } catch (e) {}

      const req = {
        body,
        query: Object.fromEntries(c.req.query()),
        params: c.req.param(),
        headers: Object.fromEntries(c.req.header()),
        header: (name) => c.req.header(name),
        user: c.get("user"),
        env: c.get("env") || c.env,
      };

      const res = {
        status: (code) => {
          res._statusCode = code;
          return res;
        },
        json: (data) => {
          return c.json(data, res._statusCode || 200);
        },
        send: (data) => {
          if (typeof data === "string") {
            return c.text(data, res._statusCode || 200);
          }
          return c.json(data, res._statusCode || 200);
        },
        _statusCode: 200,
      };

      return await handler(req, res);
    } catch (error) {
      console.error("Adapter error:", error);
      return c.json({ success: false, message: "Internal server error" }, 500);
    }
  };
};
