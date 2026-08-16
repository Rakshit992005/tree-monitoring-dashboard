require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const treeRoutes = require('./routes/tree');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from the frontend (configured via FRONTEND_URL in .env)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  })
);

// Parse incoming JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files
// e.g. GET http://localhost:3001/uploads/tree-12345.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check — useful for verifying the server is running
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Tree Monitor API is running 🌳' });
});

// All tree data routes live under /api/tree
app.use('/api/tree', treeRoutes);

// 404 handler — catch any unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploaded images served at http://localhost:${PORT}/uploads`);
});
