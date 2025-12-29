# MongoDB Atlas Setup for Cloudflare Workers

## Problem
Cloudflare Workers don't support TCP connections, so Mongoose/MongoDB won't work directly. We need to use MongoDB Atlas Data API (HTTP-based).

## Solution Options

### Option 1: MongoDB Atlas Data API (Recommended for Workers)

MongoDB Atlas Data API allows you to access MongoDB via HTTP requests, which works perfectly with Cloudflare Workers.

#### Setup Steps:

1. **Enable MongoDB Atlas Data API:**
   - Go to MongoDB Atlas Dashboard
   - Navigate to your cluster → **Data API** tab
   - Click **"Enable Data API"**
   - Note your **API URL** (e.g., `https://data.mongodb-api.com/app/xxx/endpoint/data/v1`)
   - Create an **API Key** and save it securely

2. **Configure Wrangler Secrets:**
   ```bash
   wrangler secret put MONGODB_ATLAS_API_KEY
   # Enter your API key when prompted

   wrangler secret put MONGODB_ATLAS_API_URL
   # Enter your Data API URL when prompted

   wrangler secret put MONGODB_ATLAS_DATA_SOURCE
   # Enter your data source name (usually "Cluster0")

   wrangler secret put MONGODB_ATLAS_DATABASE
   # Enter your database name (e.g., "ecommerce")
   ```

3. **Update wrangler.toml:**
   ```toml
   [vars]
   MONGODB_ATLAS_DATA_SOURCE = "Cluster0"
   MONGODB_ATLAS_DATABASE = "ecommerce"
   ```

4. **Use the MongoDB Atlas API Client:**
   The `config/mongodb-atlas-api.js` file provides a client that works like Mongoose:
   ```javascript
   import { getMongoDBAtlasAPI } from "./config/mongodb-atlas-api.js";
   
   const db = getMongoDBAtlasAPI();
   const user = await db.findOne("users", { email: "user@example.com" });
   ```

#### Pros:
- ✅ Works with Cloudflare Workers (HTTP-based)
- ✅ No TCP connections needed
- ✅ Secure (uses API keys)
- ✅ Scales automatically

#### Cons:
- ⚠️ Requires refactoring controllers to use the API client instead of Mongoose
- ⚠️ Limited features compared to Mongoose (no middleware, validation, etc.)
- ⚠️ Requires MongoDB Atlas (paid service)

---

### Option 2: Separate Node.js Backend (Recommended for Production)

Keep your current Mongoose setup on a separate Node.js server (Railway, Render, Fly.io, etc.) and call it from your Cloudflare Workers.

#### Setup:
1. Deploy your current backend to a Node.js platform (Railway, Render, etc.)
2. Use Workers as an edge layer/API gateway
3. Workers make HTTP requests to your Node.js backend

#### Pros:
- ✅ No code changes needed (keep Mongoose)
- ✅ Full Mongoose features available
- ✅ Better for complex applications
- ✅ Can use Socket.IO, file system, etc.

#### Cons:
- ⚠️ Requires two deployments (Workers + Node.js backend)
- ⚠️ Additional latency (Workers → Node.js backend → MongoDB)

---

### Option 3: Use Workers-Compatible Database

Switch to a database that works natively with Workers:
- **D1** (Cloudflare's SQLite database) - Built for Workers
- **PlanetScale** (MySQL) - HTTP-based
- **Supabase** (PostgreSQL) - HTTP-based
- **Turso** (SQLite) - HTTP-based

#### Pros:
- ✅ Native Workers support
- ✅ Fast and optimized
- ✅ Some have free tiers

#### Cons:
- ⚠️ Requires migrating from MongoDB
- ⚠️ Different query language (SQL vs NoSQL)

---

## Recommendation

For your current setup, I recommend **Option 2** (Separate Node.js Backend):

1. **Deploy your current backend** (with Mongoose) to Railway/Render/Fly.io
2. **Use Cloudflare Workers** as an edge proxy/cache layer
3. **Keep your existing code** - no refactoring needed

If you want to use Workers directly, use **Option 1** (MongoDB Atlas Data API) but be prepared to refactor your controllers to use the HTTP-based API client instead of Mongoose.

---

## Quick Start with MongoDB Atlas Data API

If you choose Option 1, here's how to use it:

```javascript
// In your controller
import { getMongoDBAtlasAPI } from "../config/mongodb-atlas-api.js";

export const getUser = async (req, res) => {
  try {
    const db = getMongoDBAtlasAPI();
    const user = await db.findOne("users", { email: req.body.email });
    
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    
    return successResponse(res, "User found", user);
  } catch (error) {
    return errorResponse(res, "Database error", 500);
  }
};
```

Note: You'll need to refactor all your controllers to use the Data API client instead of Mongoose models.

