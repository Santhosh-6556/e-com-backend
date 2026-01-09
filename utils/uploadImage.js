export const uploadImage = async (base64, env) => {
  if (!base64) return null;

  // Decode base64 → ArrayBuffer (Workers-safe)
  const binary = Uint8Array.from(
    atob(base64.split(",")[1]),
    (c) => c.charCodeAt(0)
  );

  const fileName = `img_${Date.now()}_${crypto.randomUUID()}.png`;

  await env.R2_BUCKET.put(fileName, binary, {
    httpMetadata: {
      contentType: "image/png",
    },
  });

  // Public R2 URL
  return `https://pub-${env.R2_PUBLIC_ID}.r2.dev/${fileName}`;
};
