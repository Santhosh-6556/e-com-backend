import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadImage = async (base64) => {
  if (!base64) return null;

  const buffer = Buffer.from(base64.split(",")[1], "base64");

  const fileName = `img_${Date.now()}.png`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, buffer);

  // ✅ return full URL
  return `${process.env.BASE_URL}/uploads/${fileName}`;
};



@@ -75,44 +75,44 @@ export const uploadImage = async (base64) => {
// };


// import multer from "multer";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { successResponse } from "./response.js";

// const upload = multer();

// // ⚠️ Never hardcode secrets — move these to .env!
// const bucket = "e-comerce";
// const accountId = "1b2eef7a4f54a62b5315720ac41c5857";
// const publicId = "24b0ef26a7c548cd9d5acf28fe538193";
// const accessKey = "028fdb19a340f69a2e88e03c5814a68d";
// const secretKey = "2738efcb1913d220a284d8635dade4f6a4f2d1ea6624de8df616b541dc04394b";

// const s3 = new S3Client({
//   region: "auto",
//   endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
//   credentials: {
//     accessKeyId: accessKey,
//     secretAccessKey: secretKey,
//   },
// });

// export const uploadImage = async (base64) => {
//   if (!base64) return null;

//   const buffer = Buffer.from(base64.split(",")[1], "base64");
//   const filename = `img_${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

//   const putCommand = new PutObjectCommand({
//     Bucket: bucket,
//     Key: filename,
//     Body: buffer,
//     ContentType: "image/png",
//     CacheControl: "max-age=31536000",
//     ContentDisposition: "inline",
//   });

//   await s3.send(putCommand);

//   return `https://pub-${publicId}.r2.dev/${filename}`;
// };
