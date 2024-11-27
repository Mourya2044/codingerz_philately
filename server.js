const express = require('express');
const path = require('path');
const http = require('http');
const chatController = require("./controllers/chatController")

const app = express();
// Create the HTTP server and integrate Socket.io with it
const server = http.createServer(app);


// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to handle client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize chat controller
chatController(server);

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on port 3000');
});

