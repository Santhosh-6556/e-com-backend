// config/d1.js

// --- 🔒 Universal sanitizer for Cloudflare D1 ---
function sanitizeForD1(value) {
  if (value === undefined) return null;
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return value;
}

// --- 🧱 Initialize the D1 client wrapper ---
export const initD1 = (db) => {
  if (!db) throw new Error("D1 database not provided");

  return {
    findOne: async (table, filter = {}) => {
      const conditions = Object.keys(filter)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const values = Object.values(filter).map(sanitizeForD1);

      const query = conditions
        ? `SELECT * FROM ${table} WHERE ${conditions} LIMIT 1`
        : `SELECT * FROM ${table} LIMIT 1`;

      const result = await db.prepare(query).bind(...values).first();
      return result || null;
    },

    find: async (table, filter = {}, options = {}) => {
      let query = `SELECT * FROM ${table}`;
      const conditions = [];
      const values = [];

      for (const [key, value] of Object.entries(filter)) {
        if (value === null) {
          conditions.push(`${key} IS NULL`);
        } else if (Array.isArray(value)) {
          const placeholders = value.map(() => "?").join(", ");
          values.push(...value.map(sanitizeForD1));
          conditions.push(`${key} IN (${placeholders})`);
        } else if (typeof value === "object" && value !== null) {
          if (value.$in) {
            const placeholders = value.$in.map(() => "?").join(", ");
            values.push(...value.$in.map(sanitizeForD1));
            conditions.push(`${key} IN (${placeholders})`);
          } else if (value.$ne !== undefined) {
            if (value.$ne === null) conditions.push(`${key} IS NOT NULL`);
            else {
              values.push(sanitizeForD1(value.$ne));
              conditions.push(`${key} != ?`);
            }
          } else if (value.$gte !== undefined) {
            values.push(sanitizeForD1(value.$gte));
            conditions.push(`${key} >= ?`);
          } else if (value.$lte !== undefined) {
            values.push(sanitizeForD1(value.$lte));
            conditions.push(`${key} <= ?`);
          } else {
            values.push(sanitizeForD1(value));
            conditions.push(`${key} = ?`);
          }
        } else {
          values.push(sanitizeForD1(value));
          conditions.push(`${key} = ?`);
        }
      }

      if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
      if (options.sort) {
        const sortParts = Object.keys(options.sort).map(
          (key) => `${key} ${options.sort[key] === -1 ? "DESC" : "ASC"}`
        );
        query += ` ORDER BY ${sortParts.join(", ")}`;
      }
      if (options.limit) query += ` LIMIT ${options.limit}`;
      if (options.skip) query += ` OFFSET ${options.skip}`;

      const result = await db.prepare(query).bind(...values).all();
      return result.results || [];
    },

    insertOne: async (table, data) => {
      const keys = Object.keys(data);
      const placeholders = keys.map(() => "?").join(", ");
      const values = keys.map((key) => sanitizeForD1(data[key]));

      const query = `INSERT INTO ${table} (${keys.join(
        ", "
      )}) VALUES (${placeholders})`;
      const result = await db.prepare(query).bind(...values).run();
      return { insertedId: result.meta.last_row_id, ...result };
    },

    insertMany: async (table, documents) => {
      if (documents.length === 0) return { insertedIds: [] };

      const keys = Object.keys(documents[0]);
      const placeholders = keys.map(() => "?").join(", ");
      const results = [];

      for (const doc of documents) {
        const values = keys.map((key) => sanitizeForD1(doc[key]));
        const query = `INSERT INTO ${table} (${keys.join(
          ", "
        )}) VALUES (${placeholders})`;
        const result = await db.prepare(query).bind(...values).run();
        results.push(result.meta.last_row_id);
      }

      return { insertedIds: results };
    },

    updateOne: async (table, filter, update) => {
      const filterConditions = Object.keys(filter)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const filterValues = Object.keys(filter).map((key) =>
        sanitizeForD1(filter[key])
      );

      const updateFields = Object.keys(update)
        .map((key) => `${key} = ?`)
        .join(", ");
      const updateValues = Object.keys(update).map((key) =>
        sanitizeForD1(update[key])
      );

      const query = `UPDATE ${table} SET ${updateFields} WHERE ${filterConditions}`;
      const result = await db
        .prepare(query)
        .bind(...updateValues, ...filterValues)
        .run();
      return { modifiedCount: result.meta.changes };
    },

    updateMany: async (table, filter, update) => {
      const filterConditions = Object.keys(filter)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const filterValues = Object.keys(filter).map((key) =>
        sanitizeForD1(filter[key])
      );

      const updateFields = Object.keys(update)
        .map((key) => `${key} = ?`)
        .join(", ");
      const updateValues = Object.keys(update).map((key) =>
        sanitizeForD1(update[key])
      );

      const query = `UPDATE ${table} SET ${updateFields} WHERE ${filterConditions}`;
      const result = await db
        .prepare(query)
        .bind(...updateValues, ...filterValues)
        .run();
      return { modifiedCount: result.meta.changes };
    },

    deleteOne: async (table, filter) => {
      const conditions = Object.keys(filter)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const values = Object.values(filter).map(sanitizeForD1);

      const query = `DELETE FROM ${table} WHERE ${conditions} LIMIT 1`;
      const result = await db.prepare(query).bind(...values).run();
      return { deletedCount: result.meta.changes };
    },

    deleteMany: async (table, filter) => {
      const conditions = Object.keys(filter)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const values = Object.values(filter).map(sanitizeForD1);

      const query = `DELETE FROM ${table} WHERE ${conditions}`;
      const result = await db.prepare(query).bind(...values).run();
      return { deletedCount: result.meta.changes };
    },

    query: async (sql, params = []) => {
      const safeParams = params.map(sanitizeForD1);
      return await db.prepare(sql).bind(...safeParams).all();
    },

    execute: async (sql, params = []) => {
      const safeParams = params.map(sanitizeForD1);
      return await db.prepare(sql).bind(...safeParams).run();
    },

    getDB: () => db,
  };
};

// --- Singleton management ---
let d1Instance = null;

export const getD1 = () => {
  if (!d1Instance) throw new Error("D1 not initialized. Call setD1 first.");
  return d1Instance;
};

export const setD1 = (db) => {
  d1Instance = initD1(db);
};

export default { initD1, getD1, setD1 };
