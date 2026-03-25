// src/updateVideoUrls.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });
const TrainingModule = require("./models/TrainingModule");
const connectDB = require("./config/db");

connectDB();

// These are verified working YouTube embeds mapped to module titles
const videoMap = {
  "Phishing & Email Security":
    "https://www.youtube.com/embed/XBkzBrXlle0",
  "Access Control & Password Security":
    "https://www.youtube.com/embed/aEmXedVFg-Y",
  "Data Backup & Recovery":
    "https://www.youtube.com/embed/E9iWuGJbbeA",
  "Network Security Fundamentals":
    "https://www.youtube.com/embed/qiQR5rTSshw",
  "Incident Response Planning":
    "https://www.youtube.com/embed/2J6hCDxVVpk",
  "Physical Security for SMEs":
    "https://www.youtube.com/embed/zCKWczQPKCE",
  "Device Security & BYOD Policy":
    "https://www.youtube.com/embed/YB-d1EpWjvo",
  "Data Protection & Privacy Compliance":
    "https://www.youtube.com/embed/GIHKq9PQTBY",
  "Vendor & Third-Party Risk Management":
    "https://www.youtube.com/embed/HBpLBMbVKMg",
  "Software Updates & Patch Management":
    "https://www.youtube.com/embed/4ZpSEK1Edlc",
};

const updateVideos = async () => {
  try {
    for (const [title, url] of Object.entries(videoMap)) {
      const result = await TrainingModule.updateOne(
        { title },
        { $set: { videoUrl: url } }
      );
      console.log(`${result.modifiedCount ? "✅" : "⚠️ "} ${title}`);
    }
    console.log("\n✅ Video URLs updated.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
};

updateVideos();
