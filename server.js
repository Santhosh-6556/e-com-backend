// server.js (ESM version)
import dotenv from "dotenv";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io"; // socket.io
import connectDB from "./config/db.js";
import { messages } from "./routes/auth.routes.js";

dotenv.config();

// Connect DB
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for testing
    methods: ["GET", "POST"],
  },
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Send all previous messages to newly connected client
  socket.emit("message-history", messages);

  // Listen for new message
  socket.on("message", (data) => {
    const message = { id: socket.id, text: data, time: new Date() };
    messages.push(message); // store in memory
    // io.emit("message", message);  // broadcast to all clients
    socket.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
