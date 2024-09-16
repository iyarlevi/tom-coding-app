let codeBlockUsers = {};
let studentCounts = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join", ({ blockId }) => {
      socket.join(blockId);

      if (!codeBlockUsers[blockId]) {
        codeBlockUsers[blockId] = [];
        studentCounts[blockId] = 0;
      }

      // Assign role to the user
      const usersInBlock = codeBlockUsers[blockId].length;
      const role = usersInBlock === 0 ? "mentor" : "student";
      codeBlockUsers[blockId].push(socket.id);

      socket.emit("role", role);

      // Increment student count only if the user is a "student"
      if (role === "student") {
        studentCounts[blockId] += 1;
      }

      // Emit the current student count to all users in the room
      io.to(blockId).emit("studentCount", studentCounts[blockId]);

      // Notify all users in the room when a code change happens
      socket.on("codeChange", ({ blockId, code }) => {
        socket.to(blockId).emit("codeUpdate", code);
      });

      // Handle user disconnect
      socket.on("disconnect", () => {
        codeBlockUsers[blockId] = codeBlockUsers[blockId].filter(
          (id) => id !== socket.id
        );

        // Decrement student count if the disconnected user was a "student"
        if (role === "student") {
          studentCounts[blockId] -= 1;
        }

        // Emit the updated student count to all users in the room
        io.to(blockId).emit("studentCount", studentCounts[blockId]);

        // If the mentor leaves, notify all students
        if (role === "mentor") {
          io.to(blockId).emit("mentorLeft");
        }

        socket.leave(blockId);
      });
    });
  });
};
