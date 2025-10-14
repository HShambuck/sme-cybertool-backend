// scripts/seedThreats.js
const mongoose = require("mongoose");
const ThreatUpdate = require("../models/ThreatUpdate");
require("dotenv").config();

const sampleThreats = [
  {
    title: "Critical Ransomware Campaign Targeting SMEs",
    description:
      "A new ransomware variant named 'BlackCat 2.0' has been actively targeting small and medium enterprises across West Africa. The malware encrypts critical business files and demands payment in cryptocurrency.",
    severity: "critical",
    category: "ransomware",
    source: "CERT-GH",
    publishedAt: new Date(),
    affectedRegions: ["Ghana", "Nigeria", "Ivory Coast"],
    recommendations: [
      "Implement regular automated backups with offline storage",
      "Update all Windows systems to the latest security patches",
      "Enable multi-factor authentication on all critical systems",
      "Conduct employee training on identifying suspicious emails",
    ],
    isActive: true,
  },
  {
    title: "Phishing Campaign Impersonating Ghana Revenue Authority",
    description:
      "Cybercriminals are sending fraudulent emails claiming to be from GRA, requesting taxpayers to 'verify' their information by clicking malicious links. Several businesses have reported credential theft.",
    severity: "high",
    category: "phishing",
    source: "GRA Cybersecurity Unit",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    affectedRegions: ["Ghana"],
    recommendations: [
      "Never click links in unexpected tax-related emails",
      "Always verify sender email addresses carefully",
      "Access GRA services only through official website",
      "Report suspicious emails to security@gra.gov.gh",
    ],
    isActive: true,
  },
  {
    title: "Critical Vulnerability in Microsoft Exchange Server",
    description:
      "Microsoft has disclosed a zero-day vulnerability (CVE-2025-12345) in Exchange Server that allows remote code execution. Organizations using on-premises Exchange are at immediate risk.",
    severity: "critical",
    category: "vulnerability",
    source: "Microsoft Security Response Center",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    affectedRegions: ["Global"],
    recommendations: [
      "Apply Microsoft security patch immediately",
      "Monitor Exchange logs for suspicious activity",
      "Consider migrating to cloud-based email solutions",
      "Implement network segmentation to limit exposure",
    ],
    isActive: true,
  },
  {
    title: "Mobile Banking Trojan Targeting African Markets",
    description:
      "A sophisticated mobile malware named 'MoMo-Stealer' has been detected in third-party app stores, specifically targeting mobile money and banking applications popular in Ghana and neighboring countries.",
    severity: "high",
    category: "malware",
    source: "Mobile Security Alliance",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    affectedRegions: ["Ghana", "Kenya", "Uganda", "Tanzania"],
    recommendations: [
      "Only download banking apps from official app stores",
      "Enable Google Play Protect or equivalent security features",
      "Regularly review app permissions and revoke unnecessary access",
      "Use strong, unique passwords for banking applications",
    ],
    isActive: true,
  },
  {
    title: "Supply Chain Attack Compromises Popular Accounting Software",
    description:
      "A supply chain compromise has been discovered in QuickAccounts Pro, affecting version 8.2. Attackers inserted backdoor code that could allow unauthorized access to financial records.",
    severity: "high",
    category: "data_breach",
    source: "CISA",
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    affectedRegions: ["Global"],
    recommendations: [
      "Immediately update to version 8.3 or higher",
      "Review user access logs for suspicious activity",
      "Change all credentials associated with the software",
      "Conduct a security audit of financial systems",
    ],
    isActive: true,
  },
  {
    title: "New GDPR Compliance Requirements for Data Processing",
    description:
      "The Ghana Data Protection Commission has issued updated guidelines for businesses processing personal data, aligning with international standards. Non-compliance may result in significant fines.",
    severity: "warning",
    category: "policy",
    source: "Ghana Data Protection Commission",
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    affectedRegions: ["Ghana"],
    recommendations: [
      "Review and update privacy policies by March 2025",
      "Conduct data mapping to identify all personal data processing",
      "Appoint a Data Protection Officer if required",
      "Implement technical measures to ensure data security",
    ],
    isActive: true,
  },
  {
    title: "WiFi Vulnerability Allows Unauthorized Network Access",
    description:
      "Security researchers have discovered a vulnerability in WPA2 encryption that could allow attackers to decrypt WiFi traffic and gain unauthorized access to business networks.",
    severity: "warning",
    category: "vulnerability",
    source: "WiFi Alliance",
    publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    affectedRegions: ["Global"],
    recommendations: [
      "Upgrade to WPA3 security protocol where possible",
      "Update all WiFi routers and access points to latest firmware",
      "Use VPN for sensitive communications over WiFi",
      "Implement network segmentation to isolate critical systems",
    ],
    isActive: true,
  },
  {
    title: "AI-Powered Deepfake Scams Increasing in Business Settings",
    description:
      "Fraudsters are using AI-generated voice and video to impersonate executives and request fraudulent wire transfers. Several West African businesses have lost significant funds to these sophisticated scams.",
    severity: "warning",
    category: "phishing",
    source: "Interpol Cybercrime Unit",
    publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    affectedRegions: ["Global", "West Africa"],
    recommendations: [
      "Establish verification procedures for all financial requests",
      "Train staff to recognize social engineering tactics",
      "Implement dual authorization for large transactions",
      "Use code words or security questions for verbal confirmations",
    ],
    isActive: true,
  },
];

const seedThreats = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Clear existing threats
    await ThreatUpdate.deleteMany({});
    console.log("🗑️ Cleared existing threats");

    // Insert sample threats
    await ThreatUpdate.insertMany(sampleThreats);
    console.log(
      `✅ Successfully seeded ${sampleThreats.length} threat updates`
    );

    mongoose.connection.close();
    console.log("👋 Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding threats:", error);
    process.exit(1);
  }
};

seedThreats();
