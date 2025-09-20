import multer from "multer";

const storage = multer.memoryStorage(); // keep in memory, upload to cloud
const upload = multer({ storage });

export default upload;
