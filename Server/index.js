// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const route = require('./src/routes');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

const initAdmin = require('./src/utils/initAdmin');

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
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => console.error('❌ MongoDB connection error:', err));
