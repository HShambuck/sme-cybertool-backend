// utils/seedTrainingModules.js
const mongoose = require("mongoose");
const TrainingModule = require("../models/TrainingModule");
require("dotenv").config();

const trainingModules = [
  {
    title: "Multi-Factor Authentication (MFA) Implementation Guide",
    description:
      "Learn how to implement multi-factor authentication across your organization to significantly improve account security and prevent unauthorized access.",
    category: "security_measure",
    difficulty: "beginner",
    estimatedDuration: 30,
    content: {
      overview:
        "Multi-factor authentication adds an extra layer of security beyond just passwords. This module will guide you through implementing MFA for your business accounts step by step.",
      learningObjectives: [
        "Understand what MFA is and why it's critical",
        "Learn different types of MFA methods",
        "Implement MFA on email and cloud services",
        "Train employees on using MFA tools",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Understand MFA Basics",
          description:
            "Multi-factor authentication requires two or more verification methods: something you know (password), something you have (phone/token), or something you are (biometric).",
          resources: [
            {
              type: "video",
              url: "https://www.youtube.com/watch?v=m3x8ZUiaa-U",
            },
          ],
        },
        {
          stepNumber: 2,
          title: "Choose an MFA Method",
          description:
            "Select authenticator apps (Google Authenticator, Microsoft Authenticator, Authy) over SMS-based MFA for better security.",
          resources: [
            {
              type: "article",
              url: "https://www.cisa.gov/mfa",
            },
          ],
        },
        {
          stepNumber: 3,
          title: "Enable MFA on Email Accounts",
          description:
            "Start with email accounts as they're often the gateway to other services. Enable MFA on Gmail, Outlook, or your email provider.",
          resources: [
            {
              type: "guide",
              url: "https://support.google.com/accounts/answer/185839",
            },
          ],
        },
        {
          stepNumber: 4,
          title: "Implement MFA on Cloud Services",
          description:
            "Enable MFA on all cloud services: Microsoft 365, Google Workspace, Dropbox, AWS, etc.",
          resources: [],
        },
        {
          stepNumber: 5,
          title: "Train Your Team",
          description:
            "Conduct training sessions showing employees how to set up and use MFA. Provide written guides and support.",
          resources: [],
        },
      ],
      checklistItems: [
        { item: "Choose MFA method for organization", completed: false },
        { item: "Enable MFA on email accounts", completed: false },
        { item: "Enable MFA on cloud services", completed: false },
        { item: "Enable MFA on financial/banking accounts", completed: false },
        { item: "Train all employees", completed: false },
        { item: "Document MFA procedures", completed: false },
      ],
    },
    videoUrl: "https://www.youtube.com/watch?v=m3x8ZUiaa-U",
    resources: [
      {
        title: "CISA MFA Guide",
        type: "article",
        url: "https://www.cisa.gov/mfa",
        description: "Official government guide on implementing MFA",
      },
      {
        title: "Google Authenticator Setup",
        type: "tool",
        url: "https://support.google.com/accounts/answer/1066447",
        description: "How to set up Google Authenticator",
      },
    ],
    quiz: {
      questions: [
        {
          question:
            "What are the three factors in multi-factor authentication?",
          options: [
            "Email, phone, and password",
            "Something you know, something you have, something you are",
            "Username, password, and security question",
            "Fingerprint, face scan, and voice recognition",
          ],
          correctAnswer: 1,
          explanation:
            "The three factors are: something you know (password), something you have (phone/token), and something you are (biometric).",
        },
        {
          question: "Which MFA method is most secure?",
          options: [
            "SMS text messages",
            "Email codes",
            "Authenticator app",
            "Security questions",
          ],
          correctAnswer: 2,
          explanation:
            "Authenticator apps are more secure than SMS because they can't be intercepted as easily.",
        },
      ],
      passingScore: 70,
    },
    tags: ["authentication", "mfa", "security", "access control"],
  },

  {
    title: "Strong Password Policy Implementation",
    description:
      "Create and enforce a comprehensive password policy to protect your business from password-based attacks.",
    category: "security_measure",
    difficulty: "beginner",
    estimatedDuration: 25,
    content: {
      overview:
        "Weak passwords are one of the leading causes of security breaches. This module teaches you how to create and enforce strong password policies across your organization.",
      learningObjectives: [
        "Understand password security best practices",
        "Create a written password policy",
        "Deploy a password manager",
        "Enforce password requirements technically",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Create Password Policy Document",
          description:
            "Write a clear policy requiring minimum 12 characters, mix of uppercase, lowercase, numbers, and symbols. Ban common passwords.",
          resources: [],
        },
        {
          stepNumber: 2,
          title: "Choose a Password Manager",
          description:
            "Select and deploy a business password manager like 1Password, LastPass, or Bitwarden for the entire organization.",
          resources: [
            {
              type: "tool",
              url: "https://1password.com/business",
            },
          ],
        },
        {
          stepNumber: 3,
          title: "Configure Technical Enforcement",
          description:
            "Use Active Directory, Google Workspace, or Microsoft 365 settings to enforce password complexity requirements.",
          resources: [],
        },
        {
          stepNumber: 4,
          title: "Implement Password Expiry Policy",
          description:
            "Require password changes every 90 days and prevent password reuse for last 5 passwords.",
          resources: [],
        },
      ],
      checklistItems: [
        { item: "Draft password policy document", completed: false },
        { item: "Select password manager", completed: false },
        { item: "Purchase licenses for all employees", completed: false },
        { item: "Configure technical password requirements", completed: false },
        { item: "Train employees on password manager", completed: false },
        { item: "Communicate policy to all staff", completed: false },
      ],
    },
    videoUrl: "https://www.youtube.com/watch?v=3NjQ9b3pgIg",
    resources: [
      {
        title: "NIST Password Guidelines",
        type: "pdf",
        url: "https://pages.nist.gov/800-63-3/sp800-63b.html",
        description: "Official NIST password security standards",
      },
    ],
    tags: ["passwords", "security", "authentication", "policy"],
  },

  {
    title: "Data Backup Strategy & Implementation",
    description:
      "Implement the 3-2-1 backup rule and ensure business continuity through proper data backup procedures.",
    category: "data_protection",
    difficulty: "intermediate",
    estimatedDuration: 45,
    content: {
      overview:
        "Data loss can devastate a business. Learn how to implement automated backups following the 3-2-1 rule: 3 copies, 2 different media types, 1 offsite.",
      learningObjectives: [
        "Understand the 3-2-1 backup rule",
        "Set up automated daily backups",
        "Test backup restoration procedures",
        "Implement offsite/cloud backup storage",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Identify Critical Data",
          description:
            "List all critical business data: customer databases, financial records, documents, configurations, etc.",
          resources: [],
        },
        {
          stepNumber: 2,
          title: "Choose Backup Solution",
          description:
            "Select backup software (Veeam, Acronis, cloud-native tools) that supports automated scheduling and versioning.",
          resources: [
            {
              type: "tool",
              url: "https://www.backblaze.com/business-backup.html",
            },
          ],
        },
        {
          stepNumber: 3,
          title: "Implement Local Backups",
          description:
            "Set up automated daily backups to a local NAS or external hard drive. Keep multiple versions (30 days recommended).",
          resources: [],
        },
        {
          stepNumber: 4,
          title: "Set Up Cloud/Offsite Backup",
          description:
            "Configure cloud backup to AWS S3, Azure, or dedicated backup service for offsite copy.",
          resources: [],
        },
        {
          stepNumber: 5,
          title: "Test Restoration",
          description:
            "Perform quarterly restoration tests to ensure backups work. Document recovery time objectives (RTO).",
          resources: [],
        },
      ],
      checklistItems: [
        { item: "Inventory all critical data", completed: false },
        { item: "Purchase backup software/service", completed: false },
        { item: "Configure automated daily backups", completed: false },
        { item: "Set up offsite/cloud backup", completed: false },
        { item: "Enable backup encryption", completed: false },
        { item: "Test restoration procedure", completed: false },
        { item: "Document backup procedures", completed: false },
        { item: "Schedule quarterly backup tests", completed: false },
      ],
    },
    videoUrl: "https://www.youtube.com/watch?v=S0KZ5iXTkzg",
    resources: [
      {
        title: "3-2-1 Backup Strategy Guide",
        type: "article",
        url: "https://www.backblaze.com/blog/the-3-2-1-backup-strategy/",
        description: "Comprehensive guide to implementing 3-2-1 backups",
      },
    ],
    tags: [
      "backup",
      "data protection",
      "disaster recovery",
      "business continuity",
    ],
  },

  {
    title: "Phishing Awareness Training",
    description:
      "Train your team to recognize and report phishing attempts, the #1 attack vector targeting small businesses.",
    category: "training",
    difficulty: "beginner",
    estimatedDuration: 35,
    content: {
      overview:
        "Phishing attacks trick employees into revealing credentials or clicking malicious links. This training helps your team become your first line of defense.",
      learningObjectives: [
        "Recognize common phishing indicators",
        "Identify spear phishing and CEO fraud",
        "Report suspicious emails properly",
        "Verify requests through secondary channels",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Understand Phishing Types",
          description:
            "Learn about email phishing, spear phishing (targeted), whaling (executives), smishing (SMS), and vishing (voice).",
          resources: [
            {
              type: "video",
              url: "https://www.youtube.com/watch?v=Y4pvgrJPCKw",
            },
          ],
        },
        {
          stepNumber: 2,
          title: "Spot Red Flags",
          description:
            "Look for urgency, unexpected requests, misspellings, suspicious sender addresses, and unfamiliar links.",
          resources: [],
        },
        {
          stepNumber: 3,
          title: "Verify Before Acting",
          description:
            "Always verify requests for sensitive info or wire transfers through a known phone number (not from the email).",
          resources: [],
        },
        {
          stepNumber: 4,
          title: "Set Up Reporting System",
          description:
            "Create a simple way for employees to report suspicious emails (dedicated email address or button in email client).",
          resources: [],
        },
      ],
      checklistItems: [
        {
          item: "Conduct initial phishing awareness training",
          completed: false,
        },
        { item: "Create phishing reporting email/system", completed: false },
        { item: "Send simulated phishing tests quarterly", completed: false },
        {
          item: "Document wire transfer verification process",
          completed: false,
        },
        { item: "Post phishing awareness reminders", completed: false },
      ],
    },
    videoUrl: "https://www.youtube.com/watch?v=Y4pvgrJPCKw",
    resources: [
      {
        title: "CISA Phishing Guidance",
        type: "article",
        url: "https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks",
        description: "Government guidance on avoiding phishing",
      },
    ],
    tags: ["phishing", "email security", "awareness", "social engineering"],
  },

  {
    title: "Network Security Fundamentals",
    description:
      "Secure your business network with firewalls, VPNs, and proper Wi-Fi configuration.",
    category: "technical",
    difficulty: "intermediate",
    estimatedDuration: 50,
    content: {
      overview:
        "Your network is the foundation of your digital infrastructure. Learn how to implement layered network security to protect against external threats.",
      learningObjectives: [
        "Configure firewall rules properly",
        "Set up VPN for remote access",
        "Secure Wi-Fi with WPA3",
        "Segment networks for security",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Install Hardware Firewall",
          description:
            "Deploy a business-grade firewall (Fortinet, SonicWall, pfSense) at your network perimeter.",
          resources: [],
        },
        {
          stepNumber: 2,
          title: "Configure Firewall Rules",
          description:
            "Block all inbound traffic by default, allow only necessary services, enable logging.",
          resources: [],
        },
        {
          stepNumber: 3,
          title: "Upgrade Wi-Fi Security",
          description:
            "Use WPA3 or WPA2-Enterprise encryption. Change default admin passwords. Disable WPS.",
          resources: [],
        },
        {
          stepNumber: 4,
          title: "Create Guest Network",
          description:
            "Set up isolated guest Wi-Fi network separate from business network.",
          resources: [],
        },
        {
          stepNumber: 5,
          title: "Deploy VPN",
          description:
            "Implement VPN for remote access (OpenVPN, WireGuard, or commercial VPN solution).",
          resources: [],
        },
      ],
      checklistItems: [
        { item: "Purchase and install firewall", completed: false },
        { item: "Configure firewall rules", completed: false },
        { item: "Upgrade Wi-Fi to WPA3/WPA2-Enterprise", completed: false },
        { item: "Create separate guest network", completed: false },
        { item: "Deploy VPN for remote workers", completed: false },
        { item: "Enable firewall logging", completed: false },
        { item: "Document network architecture", completed: false },
      ],
    },
    videoUrl: "https://www.youtube.com/watch?v=SDUB0V9TJmg",
    resources: [
      {
        title: "Small Business Network Security",
        type: "article",
        url: "https://www.cisco.com/c/en/us/products/security/small-business.html",
        description: "Cisco's guide to small business network security",
      },
    ],
    tags: ["network security", "firewall", "vpn", "wi-fi"],
  },

  {
    title: "Incident Response Plan Development",
    description:
      "Create a documented incident response plan to minimize damage and recovery time during a cyberattack.",
    category: "policy",
    difficulty: "advanced",
    estimatedDuration: 60,
    content: {
      overview:
        "When a security incident occurs, having a documented response plan can save your business. Learn how to create and test your incident response procedures.",
      learningObjectives: [
        "Define incident response roles and responsibilities",
        "Create step-by-step response procedures",
        "Establish communication protocols",
        "Test and update the plan regularly",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Form Incident Response Team",
          description:
            "Assign roles: Incident Manager, IT Lead, Communications Lead, Legal/Compliance contact.",
          resources: [],
        },
        {
          stepNumber: 2,
          title: "Define Incident Categories",
          description:
            "Classify incidents by severity: Critical (ransomware), High (data breach), Medium (malware), Low (spam).",
          resources: [],
        },
        {
          stepNumber: 3,
          title: "Document Response Steps",
          description:
            "Create playbooks for each incident type: detection, containment, eradication, recovery, lessons learned.",
          resources: [],
        },
        {
          stepNumber: 4,
          title: "Establish Communication Plan",
          description:
            "Define who to notify (management, customers, authorities), when, and how.",
          resources: [],
        },
        {
          stepNumber: 5,
          title: "Test the Plan",
          description:
            "Conduct tabletop exercises annually to practice response procedures.",
          resources: [],
        },
      ],
      checklistItems: [
        { item: "Identify incident response team members", completed: false },
        { item: "Document incident classification system", completed: false },
        { item: "Create response playbooks", completed: false },
        { item: "List emergency contacts", completed: false },
        { item: "Document evidence collection procedures", completed: false },
        { item: "Conduct first tabletop exercise", completed: false },
        { item: "Store plan in accessible location", completed: false },
      ],
    },
    videoUrl: "https://www.youtube.com/watch?v=6ETfI7RQlNo",
    resources: [
      {
        title: "NIST Incident Response Guide",
        type: "pdf",
        url: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf",
        description: "Comprehensive incident response framework",
      },
    ],
    tags: [
      "incident response",
      "disaster recovery",
      "policy",
      "security planning",
    ],
  },
];

// Connection and seeding function
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Clear existing modules (optional - comment out if you want to keep existing)
    await TrainingModule.deleteMany({});
    console.log("🗑️  Cleared existing training modules");

    // Insert new modules
    const created = await TrainingModule.insertMany(trainingModules);
    console.log(`✅ Successfully seeded ${created.length} training modules`);

    mongoose.connection.close();
    console.log("🔒 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { trainingModules, seedDatabase };
