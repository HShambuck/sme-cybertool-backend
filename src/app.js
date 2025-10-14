const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("../config/db");
const userRoutes = require("../routes/userRoutes");
const dashboardRoutes = require("../routes/dashboardRoutes");
const assessmentRoutes = require("../routes/assessmentRoutes");
const trainingRoutes = require("../routes/trainingRoutes");
const threatRoutes = require("../routes/threatRoutes");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" })); // Increase payload limit
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/threats", threatRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'SME Security API is running!',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// 404 handler (BEFORE error handler)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware (MUST BE LAST)
app.use((err, req, res, next) => {
  // Check if headers already sent
  if (res.headersSent) {
    console.error('⚠️ Error after response sent:', err.message);
    return next(err); // Delegate to default Express error handler
  }

  console.error('❌ Error Handler:', err.stack);
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;