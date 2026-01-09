// Workers-compatible R2 upload using native bindings
// For Node.js, fallback to AWS SDK
export const uploadImage = async (base64, env = null) => {
  if (!base64) return null;

  const filename = `img_${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  
  // Extract base64 data
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  
  // Convert base64 to ArrayBuffer (Works with both Workers and Node.js)
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Use Cloudflare R2 bindings if available (Workers environment)
  if (env && env.R2_BUCKET) {
    await env.R2_BUCKET.put(filename, bytes, {
      httpMetadata: {
        contentType: "image/png",
        cacheControl: "max-age=31536000",
      },
    });
    // Return public URL - adjust based on your R2 public domain
    return `https://pub-24b0ef26a7c548cd9d5acf28fe538193.r2.dev/${filename}`;
  }

  // Fallback for Node.js - use AWS SDK (only runs in Node.js, not Workers)
  // We use string-based dynamic import to prevent Wrangler from bundling AWS SDK
  if (typeof process !== "undefined" && process.env) {
    try {
      // Use string variable to make import truly dynamic
      const awsSdkPath = "@aws-sdk/client-s3";
      const awsSdk = await import(awsSdkPath);
      const { S3Client, PutObjectCommand } = awsSdk;
      
      const bucket = "e-comerce";
      const accountId = "1b2eef7a4f54a62b5315720ac41c5857";
      const publicId = "24b0ef26a7c548cd9d5acf28fe538193";
      const accessKey = "028fdb19a340f69a2e88e03c5814a68d";
      const secretKey = "2738efcb1913d220a284d8635dade4f6a4f2d1ea6624de8df616b541dc04394b";

      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      });

      const buffer = Buffer.from(bytes);
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: "image/png",
        CacheControl: "max-age=31536000",
        ContentDisposition: "inline",
      });

      await s3.send(putCommand);
      return `https://pub-${publicId}.r2.dev/${filename}`;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Image upload failed");
    }
  }
  
  // If we reach here in Workers without R2_BUCKET, throw error
  throw new Error("R2_BUCKET not available. Ensure R2 bucket is configured in wrangler.toml");
};
