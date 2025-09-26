const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("../config/db");
const userRoutes = require("../routes/userRoutes");
const dashboardRoutes = require("../routes/dashboardRoutes");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

module.exports = app;
