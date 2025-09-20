import fs from "fs";
import path from "path";

// Dummy function to simulate upload (replace with S3, Cloudinary, etc.)
export const uploadImage = async (base64) => {
  if (!base64) return null;

  // Convert base64 to buffer
  const buffer = Buffer.from(base64.split(",")[1], "base64");

  // Save temporary file
  const fileName = `img_${Date.now()}.png`;
  const filePath = path.join("/tmp", fileName);
  fs.writeFileSync(filePath, buffer);

  // Here, you should upload to your storage (S3 / Cloudinary / Firebase)
  // For now, we simulate returning a URL
  return `https://cdn.example.com/${fileName}`;
};
