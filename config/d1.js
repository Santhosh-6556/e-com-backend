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
        const conditions = [];

        for (const [key, value] of Object.entries(filter)) {
          // Skip $or - it's handled separately
          if (key === "$or") continue;

          // Handle MongoDB operators
          if (value && typeof value === "object" && !Array.isArray(value)) {
            // Handle operators like { $ne: null }, { $gte: 100 }, etc.
            if (value.$ne !== undefined) {
              if (value.$ne === null) {
                conditions.push(`${key} IS NOT NULL`);
              } else {
                values.push(value.$ne);
                conditions.push(`${key} != ?`);
              }
            } else if (value.$gte !== undefined) {
              // Convert Date to timestamp if needed
              const val =
                value.$gte instanceof Date
                  ? Math.floor(value.$gte.getTime() / 1000)
                  : value.$gte;
              values.push(val);
              conditions.push(`${key} >= ?`);
            } else if (value.$lte !== undefined) {
              // Convert Date to timestamp if needed
              const val =
                value.$lte instanceof Date
                  ? Math.floor(value.$lte.getTime() / 1000)
                  : value.$lte;
              values.push(val);
              conditions.push(`${key} <= ?`);
            } else if (value.$gt !== undefined) {
              values.push(value.$gt);
              conditions.push(`${key} > ?`);
            } else if (value.$lt !== undefined) {
              values.push(value.$lt);
              conditions.push(`${key} < ?`);
            } else if (value.$exists !== undefined) {
              if (value.$exists) {
                conditions.push(`${key} IS NOT NULL`);
              } else {
                conditions.push(`${key} IS NULL`);
              }
            } else if (value.$in !== undefined) {
              const placeholders = value.$in.map(() => "?").join(", ");
              values.push(...value.$in);
              conditions.push(`${key} IN (${placeholders})`);
            } else {
              // Regular object (nested), convert to JSON comparison
              values.push(JSON.stringify(value));
              conditions.push(`${key} = ?`);
            }
          } else if (Array.isArray(value)) {
            // Handle $in operator (array)
            const placeholders = value.map(() => "?").join(", ");
            // Ensure all array values are primitives
            const primitiveValues = value.map((v) => {
              if (v instanceof Date) return Math.floor(v.getTime() / 1000);
              if (typeof v === "object" && v !== null) return JSON.stringify(v);
              return v;
            });
            values.push(...primitiveValues);
            conditions.push(`${key} IN (${placeholders})`);
          } else if (value === null) {
            conditions.push(`${key} IS NULL`);
          } else {
            // Convert Date to timestamp if needed, ensure primitive types
            let val = value;
            if (value instanceof Date) {
              val = Math.floor(value.getTime() / 1000);
            } else if (typeof value === "object" && value !== null) {
              // Skip objects that aren't handled above - they shouldn't be here
              console.warn(`Skipping object value for key ${key}:`, value);
              continue;
            }
            values.push(val);
            conditions.push(`${key} = ?`);
          }
        }

        // Handle $or operator
        if (filter.$or) {
          const orConditions = filter.$or.map((orGroup) => {
            const orParts = [];
            const orValues = [];

            for (const [key, value] of Object.entries(orGroup)) {
              if (value && typeof value === "object" && !Array.isArray(value)) {
                if (value.$exists !== undefined) {
                  if (value.$exists) {
                    orParts.push(`${key} IS NOT NULL`);
                  } else {
                    orParts.push(`${key} IS NULL`);
                  }
                } else if (value.$gte !== undefined) {
                  // Convert Date to timestamp if needed
                  const val =
                    value.$gte instanceof Date
                      ? Math.floor(value.$gte.getTime() / 1000)
                      : value.$gte;
                  orValues.push(val);
                  orParts.push(`${key} >= ?`);
                } else if (value === null) {
                  orParts.push(`${key} IS NULL`);
                } else {
                  orValues.push(JSON.stringify(value));
                  orParts.push(`${key} = ?`);
                }
              } else if (value === null) {
                orParts.push(`${key} IS NULL`);
              } else {
                orValues.push(value);
                orParts.push(`${key} = ?`);
              }
            }

            values.push(...orValues);
            return `(${orParts.join(" AND ")})`;
          });

          conditions.push(`(${orConditions.join(" OR ")})`);
        }

        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(" AND ")}`;
        }
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
      // Convert Date objects to timestamps and handle other complex types
      const values = keys.map((key) => {
        const val = data[key];
        if (val instanceof Date) {
          return Math.floor(val.getTime() / 1000);
        } else if (
          val !== null &&
          typeof val === "object" &&
          !Array.isArray(val)
        ) {
          return JSON.stringify(val);
        }
        return val;
      });

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
        // Convert Date objects to timestamps and handle other complex types
        const values = keys.map((key) => {
          const val = doc[key];
          if (val instanceof Date) {
            return Math.floor(val.getTime() / 1000);
          } else if (
            val !== null &&
            typeof val === "object" &&
            !Array.isArray(val)
          ) {
            return JSON.stringify(val);
          }
          return val;
        });
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
      // Convert Date objects to timestamps and handle other complex types
      const filterValues = Object.keys(filter).map((key) => {
        const val = filter[key];
        if (val instanceof Date) {
          return Math.floor(val.getTime() / 1000);
        } else if (
          val !== null &&
          typeof val === "object" &&
          !Array.isArray(val)
        ) {
          return JSON.stringify(val);
        }
        return val;
      });

      const updateFields = Object.keys(update)
        .map((key) => `${key} = ?`)
        .join(", ");
      // Convert Date objects to timestamps and handle other complex types
      const updateValues = Object.keys(update).map((key) => {
        const val = update[key];
        if (val instanceof Date) {
          return Math.floor(val.getTime() / 1000);
        } else if (
          val !== null &&
          typeof val === "object" &&
          !Array.isArray(val)
        ) {
          return JSON.stringify(val);
        }
        return val;
      });

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
      // Convert Date objects to timestamps and handle other complex types
      const filterValues = Object.keys(filter).map((key) => {
        const val = filter[key];
        if (val instanceof Date) {
          return Math.floor(val.getTime() / 1000);
        } else if (
          val !== null &&
          typeof val === "object" &&
          !Array.isArray(val)
        ) {
          return JSON.stringify(val);
        }
        return val;
      });

      const updateFields = Object.keys(update)
        .map((key) => `${key} = ?`)
        .join(", ");
      // Convert Date objects to timestamps and handle other complex types
      const updateValues = Object.keys(update).map((key) => {
        const val = update[key];
        if (val instanceof Date) {
          return Math.floor(val.getTime() / 1000);
        } else if (
          val !== null &&
          typeof val === "object" &&
          !Array.isArray(val)
        ) {
          return JSON.stringify(val);
        }
        return val;
      });

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
