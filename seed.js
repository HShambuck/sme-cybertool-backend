// seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Assessment = require("./models/Assessment");
const Recommendation = require("./models/Recommendation");
const TrainingModule = require("./models/TrainingModule");
const TrainingProgress = require("./models/TrainingProgress");
const ThreatUpdate = require("./models/ThreatUpdate");
const Alert = require("./models/Alert");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data (optional, for fresh starts)
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany();
    await Assessment.deleteMany();
    await Recommendation.deleteMany();
    await TrainingModule.deleteMany();
    await TrainingProgress.deleteMany();
    await ThreatUpdate.deleteMany();
    await Alert.deleteMany();

    // Create a user
    console.log("👤 Creating user...");
    const user = await User.create({
      email: "test@sme.com",
      password: "password123", // Will be hashed by pre-save hook
      companyName: "Acme Corp",
      contactPerson: "John Doe",
    });

    // Create training modules
    console.log("📚 Creating training modules...");
    const module1 = await TrainingModule.create({
      title: "Phishing Awareness",
      description:
        "Learn to identify and avoid phishing attempts through email, social media, and websites. Understand common tactics used by cybercriminals.",
      durationMinutes: 15,
      difficulty: "beginner",
      content:
        "This module covers email phishing, spear phishing, and social engineering tactics...",
      quiz: [
        {
          question: "What is a common sign of a phishing email?",
          options: [
            "Perfect grammar",
            "Urgent action required",
            "Company logo",
            "Short message",
          ],
          correctAnswer: 1,
        },
      ],
    });

    const module2 = await TrainingModule.create({
      title: "Password Hygiene",
      description:
        "Best practices for creating, managing, and securing passwords across all your business accounts.",
      durationMinutes: 10,
      difficulty: "beginner",
      content:
        "Strong passwords are your first line of defense. Learn about password complexity, managers, and 2FA...",
      quiz: [
        {
          question: "What makes a password strong?",
          options: [
            "Length only",
            "Complexity only",
            "Length and complexity",
            "Common words",
          ],
          correctAnswer: 2,
        },
      ],
    });

    const module3 = await TrainingModule.create({
      title: "Data Backup Strategies",
      description:
        "Implement reliable backup solutions to protect your business data from ransomware and hardware failures.",
      durationMinutes: 20,
      difficulty: "intermediate",
      content:
        "Learn the 3-2-1 backup rule and various backup solutions suitable for SMEs...",
      quiz: [
        {
          question: "What is the 3-2-1 backup rule?",
          options: [
            "3 copies, 2 locations, 1 offline",
            "3 drives, 2 backups, 1 cloud",
            "3 days, 2 weeks, 1 month",
            "3 people, 2 systems, 1 backup",
          ],
          correctAnswer: 0,
        },
      ],
    });

    const module4 = await TrainingModule.create({
      title: "Ransomware Prevention",
      description:
        "Understand how ransomware works and implement preventive measures to protect your business.",
      durationMinutes: 25,
      difficulty: "intermediate",
      content:
        "Ransomware is one of the biggest threats to SMEs. Learn prevention, detection, and response strategies...",
      quiz: [
        {
          question: "What should you do if you suspect ransomware?",
          options: [
            "Pay immediately",
            "Disconnect from network",
            "Restart computer",
            "Delete files",
          ],
          correctAnswer: 1,
        },
      ],
    });

    const module5 = await TrainingModule.create({
      title: "MFA Implementation",
      description:
        "Set up multi-factor authentication to add an extra layer of security to your accounts.",
      durationMinutes: 10,
      difficulty: "beginner",
      content:
        "Multi-factor authentication significantly improves security. Learn how to implement it across your business tools...",
      quiz: [
        {
          question: "What is multi-factor authentication?",
          options: [
            "Multiple passwords",
            "Two or more verification methods",
            "Different usernames",
            "Complex passwords",
          ],
          correctAnswer: 1,
        },
      ],
    });

    // Create an assessment
    console.log("📊 Creating assessment...");
    const assessment = await Assessment.create({
      userId: user._id,
      score: 78,
      level: "MEDIUM RISK",
      assessmentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
      questionsAnswered: [
        {
          questionId: "q1",
          question: "Do you use antivirus software?",
          answer: "yes",
          score: 10,
        },
        {
          questionId: "q2",
          question: "Do you regularly update software?",
          answer: "sometimes",
          score: 5,
        },
        {
          questionId: "q3",
          question: "Do you have a data backup plan?",
          answer: "yes",
          score: 10,
        },
        {
          questionId: "q4",
          question: "Do employees use strong passwords?",
          answer: "no",
          score: 0,
        },
        {
          questionId: "q5",
          question: "Is multi-factor authentication enabled?",
          answer: "no",
          score: 0,
        },
        {
          questionId: "q6",
          question: "Do you provide cybersecurity training?",
          answer: "no",
          score: 0,
        },
        {
          questionId: "q7",
          question: "Do you have a incident response plan?",
          answer: "somewhat",
          score: 5,
        },
        {
          questionId: "q8",
          question: "Are your networks secured?",
          answer: "yes",
          score: 8,
        },
        {
          questionId: "q9",
          question: "Do you monitor for suspicious activity?",
          answer: "sometimes",
          score: 4,
        },
        {
          questionId: "q10",
          question: "Are software licenses up to date?",
          answer: "yes",
          score: 6,
        },
      ],
      totalQuestions: 10,
      maxPossibleScore: 100,
    });

    // Create recommendations linked to the assessment
    console.log("💡 Creating recommendations...");
    const rec1 = await Recommendation.create({
      assessmentId: assessment._id,
      text: 'Complete the "Phishing Awareness" training module.',
      priority: "high",
      relatedTrainingModuleId: module1._id,
      status: "pending",
      category: "training",
    });

    const rec2 = await Recommendation.create({
      assessmentId: assessment._id,
      text: "Implement multi-factor authentication on all business accounts.",
      priority: "high",
      status: "pending",
      category: "security_measure",
    });

    const rec3 = await Recommendation.create({
      assessmentId: assessment._id,
      text: "Regularly backup critical data offline",
      priority: "medium",
      relatedTrainingModuleId: module3._id,
      status: "pending",
      category: "data_protection",
    });

    // Update assessment with recommendation IDs
    assessment.recommendationIds.push(rec1._id, rec2._id, rec3._id);
    await assessment.save();

    // Create training progress
    console.log("📈 Creating training progress...");
    await TrainingProgress.create({
      userId: user._id,
      moduleId: module1._id,
      status: "completed",
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      score: 85,
    });

    await TrainingProgress.create({
      userId: user._id,
      moduleId: module2._id,
      status: "completed",
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      score: 92,
    });

    await TrainingProgress.create({
      userId: user._id,
      moduleId: module3._id,
      status: "completed",
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
      score: 78,
    });

    await TrainingProgress.create({
      userId: user._id,
      moduleId: module4._id,
      status: "in_progress",
      startedAt: new Date(),
      progress: 60,
    });

    await TrainingProgress.create({
      userId: user._id,
      moduleId: module5._id,
      status: "not_started",
    });

    // Create threat updates
    console.log("⚠️  Creating threat updates...");
    await ThreatUpdate.create({
      title: "New Ransomware targets local businesses",
      description:
        'A new strain of ransomware called "LocalCrypt" has been targeting small and medium enterprises in the region. It spreads through malicious email attachments and can encrypt entire network drives within minutes.',
      severity: "critical",
      category: "ransomware",
      source: "Regional Cybersecurity Alliance",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      affectedRegions: ["Local Area"],
      recommendations: [
        "Update all antivirus software immediately",
        "Train employees on email security",
        "Ensure offline backups are current",
      ],
    });

    await ThreatUpdate.create({
      title: "Beware of fake invoices via email",
      description:
        "Cybercriminals are sending fake invoices via email claiming to be from popular business services. These emails contain malicious links that steal credentials when clicked.",
      severity: "warning",
      category: "phishing",
      source: "National Cyber Alert System",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      affectedRegions: ["Nationwide"],
      recommendations: [
        "Verify all invoices through official channels",
        "Hover over links to check destinations",
        "Report suspicious emails to IT support",
      ],
    });

    await ThreatUpdate.create({
      title: "Critical Windows Security Update Available",
      description:
        "Microsoft has released a critical security update addressing vulnerabilities that could allow remote code execution. All Windows systems should be updated immediately.",
      severity: "high",
      category: "vulnerability",
      source: "Microsoft Security Response Center",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      affectedRegions: ["Global"],
      recommendations: [
        "Install Windows updates immediately",
        "Enable automatic updates",
        "Restart systems after updating",
      ],
    });

    // Create alerts
    console.log("🚨 Creating alerts...");
    await Alert.create({
      userId: user._id,
      title: "Phishing attempt blocked",
      description:
        "An email trying to trick users into revealing credentials was detected and quarantined. The email claimed to be from your bank requesting immediate account verification.",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
      severity: "medium",
      status: "resolved",
    });

    await Alert.create({
      userId: user._id,
      title: "Suspicious login attempt",
      description:
        "An unusual login attempt from an unrecognized location (IP: 192.168.1.100, Location: Unknown) was detected and blocked for security purposes. If this was you, please verify your location settings.",
      type: "warning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      severity: "high",
      status: "investigating",
    });

    await Alert.create({
      userId: user._id,
      title: "Software update required",
      description:
        "Critical security updates are available for your antivirus software. Please update to maintain optimal protection against the latest threats.",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      severity: "low",
      status: "pending",
    });

    await Alert.create({
      userId: user._id,
      title: "Malware scan completed",
      description:
        "Weekly malware scan completed successfully. No threats detected. Your system is clean and secure.",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      severity: "low",
      status: "resolved",
    });

    console.log("✅ Database seeding completed successfully!");
    console.log("📊 Created:");
    console.log(`   - 1 User: ${user.email}`);
    console.log(`   - 5 Training Modules`);
    console.log(`   - 1 Assessment (Score: ${assessment.score})`);
    console.log(`   - 3 Recommendations`);
    console.log(`   - 5 Training Progress Records`);
    console.log(`   - 3 Threat Updates`);
    console.log(`   - 4 Alerts`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedData();
