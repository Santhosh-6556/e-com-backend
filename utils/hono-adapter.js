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

      // Convert Hono query to object
      // In Hono, c.req.query() returns an object directly, not an iterable
      let query = {};
      try {
        const queryObj = c.req.query();
        if (queryObj && typeof queryObj === 'object') {
          // If it's already an object (not iterable), use it directly
          if (queryObj instanceof Map) {
            query = Object.fromEntries(queryObj);
          } else if (queryObj[Symbol.iterator]) {
            // It's iterable (Array, Set, etc.)
            query = Object.fromEntries(queryObj);
          } else {
            // It's a plain object
            query = queryObj;
          }
        }
      } catch (e) {
        // Fallback to empty object
        query = {};
      }

      // Convert Hono headers to object
      // In Hono, c.req.header(name) returns a string, but c.req.header() without args might not work
      // Get headers from c.req.raw.headers which is the actual Request headers
      let headers = {};
      try {
        if (c.req.raw && c.req.raw.headers) {
          const rawHeaders = c.req.raw.headers;
          if (rawHeaders instanceof Headers) {
            // Convert Headers object to plain object
            headers = Object.fromEntries(rawHeaders);
          } else if (rawHeaders instanceof Map) {
            // Convert Map to plain object
            headers = Object.fromEntries(rawHeaders);
          } else if (typeof rawHeaders === 'object' && rawHeaders !== null) {
            // It's already a plain object (like Node.js IncomingMessage.headers)
            headers = { ...rawHeaders };
          }
        }
      } catch (e) {
        // Fallback: build headers object manually from individual header calls
        try {
          headers = {};
          // Try to get common headers
          const commonHeaders = ['content-type', 'authorization', 'user-agent', 'accept', 'host'];
          commonHeaders.forEach(name => {
            try {
              const value = c.req.header(name);
              if (value) {
                headers[name] = value;
              }
            } catch (e) {
              // Ignore errors for individual headers
            }
          });
        } catch (e2) {
          headers = {};
        }
      }

      const req = {
        body,
        query: query,
        params: c.req.param(),
        headers: headers,
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
