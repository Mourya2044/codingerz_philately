const { Server } = require("socket.io");

// Create a function to handle Socket.io setup and events
const chatController = (server) => {
    const io = new Server(server);

    // Keep track of users in each room
    const rooms = {
        global: new Set(),
        state: new Set(),
    };

    io.on("connection", (socket) => {
        let currentRoom = null;
        let username = null;

        socket.on("join room", ({ room, user }) => {
            // Leave current room if any
            if (currentRoom) {
                socket.leave(currentRoom);
                rooms[currentRoom]?.delete(username);
                io.to(currentRoom).emit("user left", {
                    user: username,
                    room: currentRoom,
                    count: {
                        global: rooms["global"].size,
                        state: rooms["state"].size,
                    },
                });
            }

            // Join new room
            currentRoom = room;
            username = user;
            socket.join(room);

            // Ensure room exists in the `rooms` object
            if (!rooms[room]) {
                rooms[room] = new Set();
            }

            rooms[room].add(username);

            // Broadcast to room that user has joined
            io.to(room).emit("user joined", {
                user: username,
                room,
                count: {
                    global: rooms["global"].size,
                    state: rooms["state"].size,
                },
            });
        });

        socket.on("chat message", ({ msg, room }) => {
            io.to(room).emit("chat message", {
                text: msg,
                user: username,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                room,
            });
        });

        socket.on("disconnect", () => {
            if (currentRoom && username) {
                rooms[currentRoom]?.delete(username);
                io.to(currentRoom).emit("user left", {
                    user: username,
                    room: currentRoom,
                });
            }
        });
    });
};

module.exports = chatController;
