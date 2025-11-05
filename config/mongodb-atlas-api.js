// MongoDB Atlas Data API client for Cloudflare Workers
// This uses HTTP requests instead of TCP connections

class MongoDBAtlasAPI {
  constructor(apiKey, apiUrl, dataSource, database) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl; // e.g., "https://data.mongodb-api.com/app/xxx/endpoint/data/v1"
    this.dataSource = dataSource;
    this.database = database;
  }

  async request(action, collection, filter = {}, options = {}) {
    const url = `${this.apiUrl}/action/${action}`;
    
    const body = {
      dataSource: this.dataSource,
      database: this.database,
      collection: collection,
      ...options,
    };

    // Add filter if provided
    if (Object.keys(filter).length > 0) {
      body.filter = filter;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`MongoDB Atlas API error: ${error}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("MongoDB Atlas API request failed:", error);
      throw error;
    }
  }

  // CRUD operations
  async findOne(collection, filter) {
    const result = await this.request("findOne", collection, filter, { limit: 1 });
    return result.document || null;
  }

  async find(collection, filter = {}, options = {}) {
    const result = await this.request("find", collection, filter, options);
    return result.documents || [];
  }

  async insertOne(collection, document) {
    const result = await this.request("insertOne", collection, {}, { document });
    return result;
  }

  async insertMany(collection, documents) {
    const result = await this.request("insertMany", collection, {}, { documents });
    return result;
  }

  async updateOne(collection, filter, update) {
    const result = await this.request("updateOne", collection, filter, { update });
    return result;
  }

  async updateMany(collection, filter, update) {
    const result = await this.request("updateMany", collection, filter, { update });
    return result;
  }

  async deleteOne(collection, filter) {
    const result = await this.request("deleteOne", collection, filter);
    return result;
  }

  async deleteMany(collection, filter) {
    const result = await this.request("deleteMany", collection, filter);
    return result;
  }

  async replaceOne(collection, filter, replacement) {
    const result = await this.request("replaceOne", collection, filter, { replacement });
    return result;
  }
}

// Singleton instance
let atlasClient = null;

export const initMongoDBAtlasAPI = (apiKey, apiUrl, dataSource, database) => {
  atlasClient = new MongoDBAtlasAPI(apiKey, apiUrl, dataSource, database);
  return atlasClient;
};

export const getMongoDBAtlasAPI = () => {
  if (!atlasClient) {
    throw new Error("MongoDB Atlas API not initialized. Call initMongoDBAtlasAPI first.");
  }
  return atlasClient;
};

export default MongoDBAtlasAPI;

