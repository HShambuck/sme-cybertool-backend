// src/updateVideoUrls.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });
const TrainingModule = require("./models/TrainingModule");
const connectDB = require("./config/db");

connectDB();

const updates = [
  {
    title: "Phishing & Email Security",
    videoUrl: "https://www.youtube.com/embed/dRyWlC88kj4",
    estimatedDuration: 30,
  },
  {
    title: "Access Control & Password Security",
    videoUrl: "https://www.youtube.com/embed/9ANHcZwJfdQ",
    estimatedDuration: 7,
  },
  {
    title: "Data Backup & Recovery",
    videoUrl: "https://www.youtube.com/embed/ji0SQzpOlBw",
    estimatedDuration: 18,
  },
  {
    title: "Network Security Fundamentals",
    videoUrl: "https://www.youtube.com/embed/K4ilFsm2GvA",
    estimatedDuration: 30,
  }, // stripped &t=1283s
  {
    title: "Incident Response Planning",
    videoUrl: "https://www.youtube.com/embed/iBj-rKcfzNE",
    estimatedDuration: 30,
  },
  {
    title: "Physical Security for SMEs",
    videoUrl: "https://www.youtube.com/embed/YtT8q2mUM9c",
    estimatedDuration: 8,
  },
  {
    title: "Device Security & BYOD Policy",
    videoUrl: "https://www.youtube.com/embed/JxaUCC502ts",
    estimatedDuration: 33,
  },
  {
    title: "Data Protection & Privacy Compliance",
    videoUrl: "https://www.youtube.com/embed/NcHSD3fWJiQ",
    estimatedDuration: 9,
  },
  {
    title: "Vendor & Third-Party Risk Management",
    videoUrl: "https://www.youtube.com/embed/13KNjPexnEI",
    estimatedDuration: 11,
  },
  {
    title: "Software Updates & Patch Management",
    videoUrl: "https://www.youtube.com/embed/O5XXlJear0w",
    estimatedDuration: 10,
  },
];

const updateVideos = async () => {
  try {
    for (const { title, videoUrl, estimatedDuration } of updates) {
      const result = await TrainingModule.updateOne(
        { title },
        { $set: { videoUrl, estimatedDuration } },
      );
      console.log(`${result.modifiedCount ? "✅" : "⚠️ "} ${title}`);
    }
    console.log("\n✅ Video URLs and durations updated.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
};

updateVideos();
