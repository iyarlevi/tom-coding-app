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
    origin: "http://localhost:3000",
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
      rooms[blockId] = 0; // Initialize room if it doesn't exist
    }

    rooms[blockId] += 1; // Increment student count in the room

    // Emit the updated student count to everyone in the room
    io.to(blockId).emit("studentCount", rooms[blockId]);

    console.log(
      `User joined room: ${blockId}, total students: ${rooms[blockId]}`
    );

    // Handle disconnecting from the room
    socket.on("disconnect", () => {
      if (rooms[blockId]) {
        rooms[blockId] -= 1; // Decrement student count on disconnect
        console.log(
          `User left room: ${blockId}, remaining students: ${rooms[blockId]}`
        );

        if (rooms[blockId] <= 0) {
          delete rooms[blockId]; // Delete the room if no students are left
        } else {
          io.to(blockId).emit("studentCount", rooms[blockId]); // Update count for remaining students
        }
      }

      console.log("User disconnected: ", socket.id);
    });
  });
});

// MongoDB connection setup
const dbURI = "mongodb://localhost:27017/codingApp";
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    console.log("Connection status:", mongoose.connection.readyState);
  })
  .catch((err) => console.log(err));

// Default route
app.get("/", (req, res) => {
  res.send("Server is up and running");
});

// Start server
server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
