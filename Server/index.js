// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const route = require('./src/routes');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
    },
});

const PORT = process.env.PORT || 5000;

const initAdmin = require('./src/utils/initAdmin');

// Store connected sellers (sellerId -> socket.id)
const connectedSellers = new Map();

// Socket.IO Connection Handling
io.on('connection', (socket) => {
    console.log(`📡 New connection: ${socket.id}`);

    // Seller joins their notification room
    socket.on('seller:join', (sellerId) => {
        socket.join(`seller:${sellerId}`);
        connectedSellers.set(sellerId, socket.id);
        console.log(`✅ Seller ${sellerId} joined (socket: ${socket.id})`);
    });

    // Seller leaves
    socket.on('disconnect', () => {
        // Remove seller from connected list
        for (const [sellerId, socketId] of connectedSellers.entries()) {
            if (socketId === socket.id) {
                connectedSellers.delete(sellerId);
                console.log(`❌ Seller ${sellerId} disconnected`);
                break;
            }
        }
    });
});

// Make io accessible to routes
app.locals.io = io;
app.locals.connectedSellers = connectedSellers;

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());

app.use(cookieParser());
// Routes
route(app);
// Connect DB
mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        await initAdmin();
        server.listen(PORT, () =>
            console.log(`🚀 Server running on port ${PORT}`)
        );
    })
    .catch((err) => console.error('❌ MongoDB connection error:', err));
