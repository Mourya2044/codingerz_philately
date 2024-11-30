const express = require('express');
const path = require('path');
const http = require('http');
const chatController = require("./controllers/chatController")
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');

const app = express();
// Create the HTTP server and integrate Socket.io with it
const server = http.createServer(app);


// Serve static files (CSS, JS, etc.)
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// view engine
app.set('view engine', 'ejs');

// database connection
const dbURI = 'mongodb+srv://mourya:mourya2044@cluster0.8tikn.mongodb.net/node-auth';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

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

app.use(authRoutes);
app.get('*', checkUser);

