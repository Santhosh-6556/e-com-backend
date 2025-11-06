export const initD1 = (db) => {
  if (!db) {
    throw new Error("D1 database not provided");
  }

  return {
    findOne: async (table, filter = {}) => {
      const conditions = Object.keys(filter)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const values = Object.values(filter);

      const query = conditions
        ? `SELECT * FROM ${table} WHERE ${conditions} LIMIT 1`
        : `SELECT * FROM ${table} LIMIT 1`;

      const result = await db
        .prepare(query)
        .bind(...values)
        .first();
      return result || null;
    },

    find: async (table, filter = {}, options = {}) => {
      let query = `SELECT * FROM ${table}`;
      const conditions = [];
      const values = [];

      if (Object.keys(filter).length > 0) {
        const whereConditions = Object.keys(filter)
          .map((key) => {
            if (Array.isArray(filter[key])) {
              const placeholders = filter[key].map(() => "?").join(", ");
              values.push(...filter[key]);
              return `${key} IN (${placeholders})`;
            }
            values.push(filter[key]);
            return `${key} = ?`;
          })
          .join(" AND ");
        query += ` WHERE ${whereConditions}`;
      }

      if (options.sort) {
        const sortKeys = Object.keys(options.sort);
        const sortParts = sortKeys.map((key) => {
          const order = options.sort[key] === -1 ? "DESC" : "ASC";
          return `${key} ${order}`;
        });
        query += ` ORDER BY ${sortParts.join(", ")}`;
      }

      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
      }

      if (options.skip) {
        query += ` OFFSET ${options.skip}`;
      }

      const result = await db
        .prepare(query)
        .bind(...values)
        .all();
      return result.results || [];
    },

    insertOne: async (table, data) => {
      const keys = Object.keys(data);
      const placeholders = keys.map(() => "?").join(", ");
      const values = Object.values(data);

      const query = `INSERT INTO ${table} (${keys.join(
        ", "
      )}) VALUES (${placeholders})`;
      const result = await db
        .prepare(query)
        .bind(...values)
        .run();
      return { insertedId: result.meta.last_row_id, ...result };
    },

    insertMany: async (table, documents) => {
      if (documents.length === 0) return { insertedIds: [] };

      const keys = Object.keys(documents[0]);
      const placeholders = keys.map(() => "?").join(", ");

      const results = [];
      for (const doc of documents) {
        const values = keys.map((key) => doc[key]);
        const query = `INSERT INTO ${table} (${keys.join(
          ", "
        )}) VALUES (${placeholders})`;
        const result = await db
          .prepare(query)
          .bind(...values)
          .run();
        results.push(result.meta.last_row_id);
      }

      return { insertedIds: results };
    },

    updateOne: async (table, filter, update) => {
      const filterConditions = Object.keys(filter)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const filterValues = Object.values(filter);

      const updateFields = Object.keys(update)
        .map((key) => `${key} = ?`)
        .join(", ");
      const updateValues = Object.values(update);

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
      const filterValues = Object.values(filter);

      const updateFields = Object.keys(update)
        .map((key) => `${key} = ?`)
        .join(", ");
      const updateValues = Object.values(update);

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
      const values = Object.values(filter);

      const query = `DELETE FROM ${table} WHERE ${conditions} LIMIT 1`;
      const result = await db
        .prepare(query)
        .bind(...values)
        .run();
      return { deletedCount: result.meta.changes };
    },

    deleteMany: async (table, filter) => {
      const conditions = Object.keys(filter)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      const values = Object.values(filter);

      const query = `DELETE FROM ${table} WHERE ${conditions}`;
      const result = await db
        .prepare(query)
        .bind(...values)
        .run();
      return { deletedCount: result.meta.changes };
    },

    query: async (sql, params = []) => {
      return await db
        .prepare(sql)
        .bind(...params)
        .all();
    },

    execute: async (sql, params = []) => {
      return await db
        .prepare(sql)
        .bind(...params)
        .run();
    },

    getDB: () => db,
  };
};

let d1Instance = null;

export const getD1 = () => {
  if (!d1Instance) {
    throw new Error("D1 not initialized. Call initD1 first.");
  }
  return d1Instance;
};

export const setD1 = (db) => {
  d1Instance = initD1(db);
};

export default { initD1, getD1, setD1 };
