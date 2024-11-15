const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const { Server } = require("socket.io");

// Create the HTTP server and integrate Socket.io with it
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to handle client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on port 3000');
});

// Keep track of users in each room
const rooms = {
  global: new Set(),
  state: new Set()
};

io.on('connection', (socket) => {
  let currentRoom = null;
  let username = null;

  socket.on('join room', ({ room, user }) => {
    // Leave current room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms[currentRoom].delete(username);
      io.to(currentRoom).emit('user left', { user: username, room: currentRoom, count: {global: rooms['global'].size, state: rooms['state'].size} });
    }

    // Join new room
    currentRoom = room;
    username = user;
    socket.join(room);
    rooms[room].add(username);

    // Broadcast to room that user has joined
    io.to(room).emit('user joined', { user: username, room, count: {global: rooms['global'].size, state: rooms['state'].size} });
    // io.to(room).emit('user list', Array.from(rooms[room]));
  });

  socket.on('chat message', ({ msg, room }) => {
    io.to(room).emit('chat message', {
      text: msg,
      user: username,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      room
    });
  });

  socket.on('disconnect', () => {
    if (currentRoom && username) {
      rooms[currentRoom].delete(username);
      io.to(currentRoom).emit('user left', { user: username, room: currentRoom });
      // io.to(currentRoom).emit('user list', Array.from(rooms[currentRoom]));
    }
  });
});
