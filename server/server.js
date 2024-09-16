const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Import routes and socket handlers
const codeBlockRoutes = require("./routes/codeBlockRoutes");
const socketHandler = require("./socket/handlers");

socketHandler(io);

// Middleware setup
app.use(cors());
app.use(express.json()); // Ensure the server can parse JSON requests

// Route handling
app.use("/api", codeBlockRoutes);

// Track the number of students in each room
let rooms = {};

// Socket.IO setup
io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  // Handle joining a room
  socket.on("join", ({ blockId }) => {
    socket.join(blockId);

    if (!rooms[blockId]) {
      rooms[blockId] = 0;
    }

    rooms[blockId] += 1;

    // Emit the updated student count to everyone in the room
    io.to(blockId).emit("studentCount", rooms[blockId]);

    console.log(
      `User joined room: ${blockId}, total students: ${rooms[blockId]}`
    );

    // Handle disconnecting from the room
    socket.on("disconnect", () => {
      if (rooms[blockId]) {
        rooms[blockId] -= 1;
        console.log(
          `User left room: ${blockId}, remaining students: ${rooms[blockId]}`
        );

        if (rooms[blockId] <= 0) {
          delete rooms[blockId];
        } else {
          io.to(blockId).emit("studentCount", rooms[blockId]);
        }
      }

      console.log("User disconnected: ", socket.id);
    });
  });
});

const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/codingApp";
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    console.log("Connection status:", mongoose.connection.readyState);
  })
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Server is up and running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
