// src/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const TrainingModule = require("./models/TrainingModule");
const Recommendation = require("./models/Recommendations");
const connectDB = require("./config/db");

connectDB();

const modules = [
  {
    title: "Phishing & Email Security",
    description:
      "Learn to identify phishing emails, social engineering attacks, and how to build a reporting culture in your organisation.",
    category: "training",
    difficulty: "beginner",
    estimatedDuration: 15,
    videoUrl: "https://www.youtube.com/embed/XBkzBrXlle0",
    tags: ["phishing", "email", "social engineering", "awareness"],
    isPublished: true,
    content: {
      overview:
        "Phishing is the number one cause of data breaches for SMEs. This module teaches your team to spot and report suspicious emails before they cause damage.",
      learningObjectives: [
        "Identify common signs of phishing emails",
        "Understand spear phishing and CEO fraud tactics",
        "Know how to report suspicious emails",
        "Verify requests for sensitive information or payments",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Understand what phishing is",
          description:
            "Phishing is a cyberattack where criminals impersonate trusted organisations via email to steal credentials or money. Watch the video above for a full overview.",
        },
        {
          stepNumber: 2,
          title: "Spot the red flags",
          description:
            "Check for: urgent language, mismatched sender domains, unexpected attachments, requests for passwords or wire transfers, and poor grammar.",
        },
        {
          stepNumber: 3,
          title: "Verify before you click",
          description:
            "If an email requests sensitive action, verify it through a separate channel — call the sender directly using a number you already have, not one in the email.",
        },
        {
          stepNumber: 4,
          title: "Set up a reporting process",
          description:
            "Create a simple way for employees to report suspicious emails — a dedicated email address or IT helpdesk ticket. Reward reporting culture.",
        },
      ],
      checklistItems: [
        { item: "Shared phishing examples with all staff", completed: false },
        {
          item: "Created a suspicious email reporting process",
          completed: false,
        },
        {
          item: "Tested staff with a simulated phishing email",
          completed: false,
        },
        {
          item: "Enabled email filtering on your mail provider",
          completed: false,
        },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question: "Which of these is the strongest sign of a phishing email?",
          options: [
            "It has a company logo",
            "It asks for urgent action and your password",
            "It was sent on a weekday",
            "It contains a long message",
          ],
          correctAnswer: 1,
          explanation:
            "Urgency combined with a request for credentials or payment is the most common phishing tactic.",
        },
        {
          question:
            "What should you do if you receive a suspicious invoice by email?",
          options: [
            "Pay it immediately to avoid late fees",
            "Forward it to colleagues",
            "Verify it by calling the supplier on a known number",
            "Reply to the email asking if it is real",
          ],
          correctAnswer: 2,
          explanation:
            "Always verify payment requests through a separate, trusted channel — never reply to the suspicious email itself.",
        },
        {
          question: "What is spear phishing?",
          options: [
            "Mass phishing sent to millions of people",
            "A targeted phishing attack aimed at a specific person or company",
            "Phishing conducted over the phone",
            "Phishing using fake websites",
          ],
          correctAnswer: 1,
          explanation:
            "Spear phishing is highly targeted — attackers research their victim to make the email seem legitimate.",
        },
      ],
    },
  },
  {
    title: "Access Control & Password Security",
    description:
      "Implement strong password policies, password managers, and access control principles to protect business accounts.",
    category: "security_measure",
    difficulty: "beginner",
    estimatedDuration: 20,
    videoUrl: "https://www.youtube.com/embed/aEmXedVFg-Y",
    tags: ["passwords", "access control", "MFA", "credentials"],
    isPublished: true,
    content: {
      overview:
        "Weak or shared passwords are one of the easiest ways attackers gain access to SME systems. This module covers password hygiene, access control, and multi-factor authentication.",
      learningObjectives: [
        "Create and enforce a strong password policy",
        "Deploy a company-wide password manager",
        "Enable MFA on all critical business systems",
        "Manage access rights for employees and departing staff",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Audit your current passwords",
          description:
            "Check if any shared accounts exist. List all business systems and who has access to each. Remove access for anyone who no longer needs it.",
        },
        {
          stepNumber: 2,
          title: "Deploy a password manager",
          description:
            "Choose a business password manager such as Bitwarden (free), 1Password, or Dashlane. Set it up for your team so each person has unique strong passwords.",
        },
        {
          stepNumber: 3,
          title: "Enable MFA everywhere",
          description:
            "Turn on multi-factor authentication on email, banking, cloud storage, and any system that holds sensitive data. Use an authenticator app rather than SMS where possible.",
        },
        {
          stepNumber: 4,
          title: "Set an offboarding process",
          description:
            "When an employee leaves, immediately revoke their access to all systems. Document this as a checklist your HR or manager follows on their last day.",
        },
      ],
      checklistItems: [
        { item: "Removed all shared passwords", completed: false },
        { item: "Password manager deployed for all staff", completed: false },
        { item: "MFA enabled on email accounts", completed: false },
        {
          item: "MFA enabled on banking and financial systems",
          completed: false,
        },
        { item: "Employee offboarding checklist created", completed: false },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question:
            "What is the minimum recommended password length for business accounts?",
          options: [
            "6 characters",
            "8 characters",
            "12 characters",
            "Any length with symbols",
          ],
          correctAnswer: 2,
          explanation:
            "12 characters is the widely accepted minimum for business accounts. Longer is always better.",
        },
        {
          question: "Which MFA method is most secure?",
          options: [
            "SMS text message code",
            "Email verification link",
            "Authenticator app (TOTP)",
            "Security question",
          ],
          correctAnswer: 2,
          explanation:
            "Authenticator apps generate time-based codes locally and are not vulnerable to SIM swapping like SMS.",
        },
        {
          question:
            "When should you revoke a departing employee's system access?",
          options: [
            "Within a month of them leaving",
            "When you remember to do it",
            "On or before their last day",
            "Only if they were in IT",
          ],
          correctAnswer: 2,
          explanation:
            "Access should be revoked on or before the employee's last day to prevent unauthorised access.",
        },
      ],
    },
  },
  {
    title: "Data Backup & Recovery",
    description:
      "Build a reliable backup strategy using the 3-2-1 rule to protect your business from ransomware and data loss.",
    category: "data_protection",
    difficulty: "intermediate",
    estimatedDuration: 20,
    videoUrl: "https://www.youtube.com/embed/E9iWuGJbbeA",
    tags: ["backup", "recovery", "ransomware", "3-2-1", "disaster recovery"],
    isPublished: true,
    content: {
      overview:
        "Data loss from ransomware, hardware failure, or accidental deletion can destroy a small business. A proper backup strategy means you can recover quickly and avoid paying ransoms.",
      learningObjectives: [
        "Understand the 3-2-1 backup rule",
        "Set up automated backups for critical data",
        "Test that backups can actually be restored",
        "Isolate backups from ransomware reach",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Identify what needs backing up",
          description:
            "List your critical data: customer records, financial files, emails, project files. Everything that would hurt the business if it disappeared tomorrow.",
        },
        {
          stepNumber: 2,
          title: "Apply the 3-2-1 rule",
          description:
            "Keep 3 copies of data, on 2 different media types (e.g. cloud + external drive), with 1 copy stored offsite or offline. This protects against any single point of failure.",
        },
        {
          stepNumber: 3,
          title: "Automate your backups",
          description:
            "Manual backups get forgotten. Use automated tools — Windows Backup, Time Machine (Mac), or a cloud service like Backblaze or Google Workspace Backup.",
        },
        {
          stepNumber: 4,
          title: "Test your restoration",
          description:
            "A backup you have never tested is not a backup. Schedule a quarterly test where you restore a file or folder from your backup to confirm it works.",
        },
      ],
      checklistItems: [
        { item: "Identified all critical business data", completed: false },
        { item: "Set up automated daily backups", completed: false },
        {
          item: "Confirmed at least one offline or offsite copy",
          completed: false,
        },
        { item: "Successfully tested a backup restoration", completed: false },
        { item: "Backup encryption enabled", completed: false },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question: "What does the 3-2-1 backup rule mean?",
          options: [
            "3 daily backups, 2 weekly, 1 monthly",
            "3 copies of data, on 2 different media, with 1 offsite",
            "3 cloud services, 2 hard drives, 1 USB",
            "3 people responsible, 2 schedules, 1 tool",
          ],
          correctAnswer: 1,
          explanation:
            "3-2-1 means three copies, two different storage types, one stored offsite or offline away from your main systems.",
        },
        {
          question:
            "Why should at least one backup copy be offline or isolated?",
          options: [
            "To save on cloud storage costs",
            "Because offline backups are faster to restore",
            "To protect against ransomware which can encrypt connected backups",
            "There is no specific reason",
          ],
          correctAnswer: 2,
          explanation:
            "Ransomware can spread to any connected drive or cloud folder. An isolated offline copy cannot be encrypted by ransomware.",
        },
        {
          question: "How often should you test your backup restoration?",
          options: [
            "Never — if the backup ran it works",
            "Once a year",
            "At least quarterly",
            "Every day",
          ],
          correctAnswer: 2,
          explanation:
            "Quarterly testing ensures your backups are valid and your team knows the recovery process before a crisis hits.",
        },
      ],
    },
  },
  {
    title: "Network Security Fundamentals",
    description:
      "Secure your business Wi-Fi, firewall, and remote access to prevent unauthorised network intrusions.",
    category: "technical",
    difficulty: "intermediate",
    estimatedDuration: 25,
    videoUrl: "https://www.youtube.com/embed/qiQR5rTSshw",
    tags: ["network", "firewall", "VPN", "wifi", "remote access"],
    isPublished: true,
    content: {
      overview:
        "Your network is the gateway to all your business systems. Poorly secured Wi-Fi, no firewall, and uncontrolled remote access are common SME vulnerabilities attackers exploit.",
      learningObjectives: [
        "Secure business Wi-Fi with proper encryption",
        "Set up a guest network separate from business systems",
        "Configure a firewall for your network perimeter",
        "Implement VPN for secure remote access",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Audit your Wi-Fi security",
          description:
            "Log into your router admin panel. Change the default admin password. Set encryption to WPA3 or WPA2-Enterprise. Change the default network name (SSID) to something that does not identify your business.",
        },
        {
          stepNumber: 2,
          title: "Create a guest network",
          description:
            "Set up a separate guest Wi-Fi for visitors and personal devices. This keeps your business network isolated. Most modern routers support this in their admin panel.",
        },
        {
          stepNumber: 3,
          title: "Enable and configure your firewall",
          description:
            "Ensure your router's built-in firewall is active. For businesses with servers, consider a dedicated hardware firewall. Block all inbound traffic that is not explicitly needed.",
        },
        {
          stepNumber: 4,
          title: "Set up VPN for remote workers",
          description:
            "Require staff to use a VPN when accessing company resources remotely. Options for SMEs include NordLayer, Cloudflare Zero Trust (free tier), or a self-hosted WireGuard setup.",
        },
      ],
      checklistItems: [
        { item: "Router default admin password changed", completed: false },
        { item: "Wi-Fi encryption set to WPA2 or WPA3", completed: false },
        { item: "Guest network created and isolated", completed: false },
        { item: "Firewall enabled on router", completed: false },
        { item: "VPN required for remote access", completed: false },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question:
            "Which Wi-Fi encryption standard is most secure for business use?",
          options: ["WEP", "WPA", "WPA2-Personal", "WPA3 or WPA2-Enterprise"],
          correctAnswer: 3,
          explanation:
            "WPA3 and WPA2-Enterprise provide the strongest protection. WEP and WPA are outdated and easily broken.",
        },
        {
          question: "Why should guest Wi-Fi be on a separate network?",
          options: [
            "To give guests faster internet",
            "To stop guests accessing your business systems and data",
            "Because guest networks use less bandwidth",
            "It is a legal requirement",
          ],
          correctAnswer: 1,
          explanation:
            "Isolating guest Wi-Fi means a compromised guest device cannot reach your business files, printers, or servers.",
        },
        {
          question: "What does a VPN do for remote workers?",
          options: [
            "Makes their internet faster",
            "Encrypts their connection and routes it securely to company systems",
            "Blocks all websites",
            "Replaces the need for passwords",
          ],
          correctAnswer: 1,
          explanation:
            "A VPN encrypts traffic between the remote worker and company systems, preventing interception on public or home networks.",
        },
      ],
    },
  },
  {
    title: "Incident Response Planning",
    description:
      "Build a simple but effective incident response plan so your business can react quickly when a cyberattack occurs.",
    category: "policy",
    difficulty: "intermediate",
    estimatedDuration: 30,
    videoUrl: "https://www.youtube.com/embed/2J6hCDxVVpk",
    tags: ["incident response", "policy", "breach", "recovery", "planning"],
    isPublished: true,
    content: {
      overview:
        "Most SMEs have no plan for what to do during a cyberattack. This module walks you through creating a simple incident response plan that your whole team can follow.",
      learningObjectives: [
        "Understand the phases of incident response",
        "Create a contact list for cyber emergencies",
        "Define roles and responsibilities during an incident",
        "Know when and how to notify customers or regulators",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Define what counts as an incident",
          description:
            "Write down the types of events that trigger your plan: ransomware, data breach, phishing success, account compromise, system outage caused by attack.",
        },
        {
          stepNumber: 2,
          title: "Create an emergency contact list",
          description:
            "List who to call: internal IT contact, external IT support, your internet provider, your bank (for financial fraud), your cyber insurance provider, and if needed, local law enforcement or your country's cyber authority.",
        },
        {
          stepNumber: 3,
          title: "Define containment steps",
          description:
            "For each incident type, define the first actions: disconnect affected devices from the network, change compromised passwords, preserve logs, stop the spread before trying to fix.",
        },
        {
          stepNumber: 4,
          title: "Plan your communication",
          description:
            "Decide in advance: who tells customers if data is breached, what the message says, and whether you are legally required to notify a regulator (GDPR requires notification within 72 hours in many cases).",
        },
      ],
      checklistItems: [
        { item: "Incident types defined and documented", completed: false },
        { item: "Emergency contact list created and shared", completed: false },
        {
          item: "Containment steps documented for each incident type",
          completed: false,
        },
        { item: "Communication plan written and approved", completed: false },
        { item: "Plan tested with a tabletop exercise", completed: false },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question:
            "What is the first thing you should do if ransomware is detected?",
          options: [
            "Pay the ransom to recover files quickly",
            "Restart all computers",
            "Disconnect affected devices from the network immediately",
            "Email all staff to warn them",
          ],
          correctAnswer: 2,
          explanation:
            "Disconnecting stops the ransomware from spreading to other devices and shared drives. Never pay the ransom as it does not guarantee recovery.",
        },
        {
          question:
            "Under GDPR, how quickly must a personal data breach be reported to the regulator?",
          options: ["7 days", "30 days", "72 hours", "Immediately"],
          correctAnswer: 2,
          explanation:
            "GDPR requires organisations to notify the relevant supervisory authority within 72 hours of becoming aware of a breach.",
        },
        {
          question: "What is a tabletop exercise?",
          options: [
            "A physical security drill",
            "A simulated walkthrough of your incident response plan with your team",
            "A software testing method",
            "A backup testing procedure",
          ],
          correctAnswer: 1,
          explanation:
            "A tabletop exercise is a discussion-based simulation where your team talks through how they would respond to a specific incident scenario.",
        },
      ],
    },
  },
  {
    title: "Physical Security for SMEs",
    description:
      "Protect your office, devices, and sensitive areas from physical threats including theft, tailgating, and unauthorised access.",
    category: "physical_security",
    difficulty: "beginner",
    estimatedDuration: 15,
    videoUrl: "https://www.youtube.com/embed/zCKWczQPKCE",
    tags: [
      "physical security",
      "office",
      "tailgating",
      "access control",
      "CCTV",
    ],
    isPublished: true,
    content: {
      overview:
        "Cybersecurity is not only digital. Physical access to your office, servers, and devices is just as important. This module covers practical physical security measures any SME can implement.",
      learningObjectives: [
        "Control who can physically access sensitive areas",
        "Protect devices from theft and unauthorised access",
        "Implement a clean desk and screen lock policy",
        "Understand tailgating and how to prevent it",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Secure your server and network equipment",
          description:
            "Routers, switches, and servers should be in a locked room or cabinet. Anyone with physical access to networking equipment can intercept traffic or install rogue devices.",
        },
        {
          stepNumber: 2,
          title: "Implement a clean desk policy",
          description:
            "Require staff to lock their screens when leaving their desk and to not leave sensitive documents visible. A post-it note with a password on a monitor is a real risk.",
        },
        {
          stepNumber: 3,
          title: "Control building access",
          description:
            "Use keycards, coded entry, or at minimum a sign-in register for visitors. Train staff not to hold doors open for strangers — this is called tailgating and is a common physical intrusion method.",
        },
        {
          stepNumber: 4,
          title: "Install and review CCTV",
          description:
            "CCTV at entry points and server rooms deters physical intrusion and provides evidence if an incident occurs. Ensure recordings are stored securely and reviewed periodically.",
        },
      ],
      checklistItems: [
        {
          item: "Server and network equipment in locked room or cabinet",
          completed: false,
        },
        {
          item: "Screen lock policy enforced (auto-lock after 5 minutes)",
          completed: false,
        },
        {
          item: "Clean desk policy communicated to all staff",
          completed: false,
        },
        { item: "Visitor sign-in process in place", completed: false },
        { item: "CCTV installed at entry points", completed: false },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question: "What is tailgating in the context of physical security?",
          options: [
            "Following someone too closely while driving",
            "An attacker following an authorised person through a secure door",
            "Leaving a computer logged in when you walk away",
            "Copying data onto a USB drive",
          ],
          correctAnswer: 1,
          explanation:
            "Tailgating is when an unauthorised person follows an authorised employee through a secured entry point without using their own credentials.",
        },
        {
          question: "Why should server equipment be in a locked room?",
          options: [
            "To keep it cool",
            "To reduce noise in the office",
            "Because physical access to servers can allow data theft or network interception",
            "It is only necessary for large companies",
          ],
          correctAnswer: 2,
          explanation:
            "Physical access to servers and networking equipment gives an attacker the ability to copy data, install malware, or intercept network traffic.",
        },
      ],
    },
  },
  {
    title: "Device Security & BYOD Policy",
    description:
      "Secure company laptops, mobile devices, and personal devices used for work through encryption, MDM, and clear policies.",
    category: "device_security",
    difficulty: "intermediate",
    estimatedDuration: 20,
    videoUrl: "https://www.youtube.com/embed/YB-d1EpWjvo",
    tags: ["device security", "BYOD", "encryption", "MDM", "endpoint"],
    isPublished: true,
    content: {
      overview:
        "Laptops and phones are stolen, lost, and compromised every day. Without encryption and device policies, a single lost laptop can expose your entire business.",
      learningObjectives: [
        "Enable full disk encryption on all company devices",
        "Enforce screen lock and PIN policies",
        "Create a BYOD policy for personal devices",
        "Understand Mobile Device Management (MDM)",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Enable encryption on all devices",
          description:
            "Windows: enable BitLocker. Mac: enable FileVault. Both are built-in and free. For mobile devices, ensure device encryption is on in settings. An encrypted lost laptop cannot be read without the password.",
        },
        {
          stepNumber: 2,
          title: "Enforce screen lock",
          description:
            "Set all devices to automatically lock after 5 minutes of inactivity. Require a PIN, password, or biometric to unlock. This prevents unauthorised access if a device is left unattended.",
        },
        {
          stepNumber: 3,
          title: "Create a BYOD policy",
          description:
            "If staff use personal phones or laptops for work, define: what data they can access, whether the device must have encryption, and whether you can remotely wipe business data if the device is lost.",
        },
        {
          stepNumber: 4,
          title: "Consider Mobile Device Management",
          description:
            "MDM tools like Microsoft Intune, Jamf, or the free tier of Scalefusion let you enforce policies, remotely wipe devices, and ensure compliance across all endpoints centrally.",
        },
      ],
      checklistItems: [
        {
          item: "BitLocker or FileVault enabled on all laptops",
          completed: false,
        },
        { item: "Screen auto-lock set to 5 minutes or less", completed: false },
        {
          item: "BYOD policy documented and signed by staff",
          completed: false,
        },
        {
          item: "Remote wipe capability set up for lost devices",
          completed: false,
        },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question: "What does full disk encryption protect against?",
          options: [
            "Viruses and malware",
            "Phishing attacks",
            "Data being read from a stolen or lost device",
            "Network intrusions",
          ],
          correctAnswer: 2,
          explanation:
            "Full disk encryption makes the data on a device unreadable without the correct password, so a stolen device cannot be accessed.",
        },
        {
          question: "What is the purpose of a BYOD policy?",
          options: [
            "To ban personal devices in the office",
            "To define rules for how personal devices can be used to access company data",
            "To provide company phones to all staff",
            "To track employee locations",
          ],
          correctAnswer: 1,
          explanation:
            "A BYOD policy sets clear rules so personal devices can be used for work safely, with defined security requirements and data boundaries.",
        },
      ],
    },
  },
  {
    title: "Data Protection & Privacy Compliance",
    description:
      "Understand GDPR, data classification, and privacy obligations for SMEs handling customer and employee data.",
    category: "data_protection",
    difficulty: "intermediate",
    estimatedDuration: 25,
    videoUrl: "https://www.youtube.com/embed/GIHKq9PQTBY",
    tags: [
      "GDPR",
      "privacy",
      "data classification",
      "compliance",
      "data protection",
    ],
    isPublished: true,
    content: {
      overview:
        "If your business handles customer or employee data, you have legal obligations. GDPR and similar laws require you to protect data, be transparent about its use, and report breaches.",
      learningObjectives: [
        "Understand what personal data you hold and why",
        "Classify data by sensitivity level",
        "Know your obligations under GDPR or local privacy law",
        "Handle a data breach notification correctly",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Map your data",
          description:
            "Create a simple data inventory: what personal data do you collect, where is it stored, who has access, and how long you keep it. This is called a data map or Record of Processing Activities (ROPA).",
        },
        {
          stepNumber: 2,
          title: "Classify your data",
          description:
            "Label data by sensitivity: Public (anyone can see it), Internal (staff only), Confidential (limited access), Restricted (highest protection — financial, medical, legal). Apply access controls accordingly.",
        },
        {
          stepNumber: 3,
          title: "Understand your legal basis for processing",
          description:
            "Under GDPR you must have a lawful basis for processing personal data: consent, contract, legal obligation, vital interests, public task, or legitimate interests. Document which applies to each data type.",
        },
        {
          stepNumber: 4,
          title: "Prepare for breach notification",
          description:
            "Know who your data protection authority is. Under GDPR you must notify them within 72 hours of discovering a breach affecting personal data. Have a template notification ready.",
        },
      ],
      checklistItems: [
        { item: "Data inventory / ROPA created", completed: false },
        { item: "Data classification labels applied", completed: false },
        {
          item: "Privacy policy updated and visible on website",
          completed: false,
        },
        { item: "Staff trained on data handling rules", completed: false },
        { item: "Breach notification process documented", completed: false },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question: "What is personal data under GDPR?",
          options: [
            "Only passport numbers and bank details",
            "Any information that can identify a living individual",
            "Only data stored digitally",
            "Only data shared with third parties",
          ],
          correctAnswer: 1,
          explanation:
            "Personal data is any information that can identify a living person — this includes names, email addresses, IP addresses, and more.",
        },
        {
          question:
            "How quickly must a GDPR breach be reported to the regulator?",
          options: ["24 hours", "72 hours", "7 days", "30 days"],
          correctAnswer: 1,
          explanation:
            "GDPR requires notification to the supervisory authority within 72 hours of becoming aware of a personal data breach.",
        },
      ],
    },
  },
  {
    title: "Vendor & Third-Party Risk Management",
    description:
      "Assess and manage cybersecurity risks introduced by vendors, suppliers, and third-party software your business depends on.",
    category: "vendor",
    difficulty: "advanced",
    estimatedDuration: 25,
    videoUrl: "https://www.youtube.com/embed/HBpLBMbVKMg",
    tags: [
      "vendor risk",
      "third-party",
      "supply chain",
      "contracts",
      "due diligence",
    ],
    isPublished: true,
    content: {
      overview:
        "Many SME breaches happen through trusted vendors. If a supplier has access to your systems or data and they are compromised, your business is too. This module covers third-party risk management.",
      learningObjectives: [
        "Identify which vendors have access to your systems or data",
        "Assess vendor security posture before engagement",
        "Include security clauses in vendor contracts",
        "Monitor ongoing vendor risk",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Map your vendor ecosystem",
          description:
            "List every supplier, software provider, and contractor who has access to your systems, data, or office. Include cloud services, cleaning companies with building access, and IT support providers.",
        },
        {
          stepNumber: 2,
          title: "Assess vendor security",
          description:
            "Before onboarding a new vendor, ask: Do they have a security policy? Have they had a breach? Are they certified (ISO 27001, SOC 2)? For high-risk vendors, request a completed security questionnaire.",
        },
        {
          stepNumber: 3,
          title: "Include security clauses in contracts",
          description:
            "Contracts with vendors who handle your data should include: data protection obligations, breach notification requirements, the right to audit, and what happens to your data when the contract ends.",
        },
        {
          stepNumber: 4,
          title: "Apply least privilege to vendor access",
          description:
            "Give vendors only the access they need to do their job — nothing more. Use separate credentials for each vendor. Revoke access immediately when the relationship ends.",
        },
      ],
      checklistItems: [
        {
          item: "Vendor inventory created with access levels documented",
          completed: false,
        },
        {
          item: "Security questionnaire sent to high-risk vendors",
          completed: false,
        },
        {
          item: "Data protection clauses added to vendor contracts",
          completed: false,
        },
        {
          item: "Vendor access reviewed and limited to minimum required",
          completed: false,
        },
        {
          item: "Process to revoke vendor access on contract end documented",
          completed: false,
        },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question: "Why is vendor risk management important for SMEs?",
          options: [
            "It is only relevant for large enterprises",
            "A compromised vendor with access to your systems can lead to your business being breached",
            "Vendors are always more secure than the businesses they serve",
            "It is only about software vendors",
          ],
          correctAnswer: 1,
          explanation:
            "Supply chain attacks are increasingly common. A vendor with access to your systems is a potential attack vector into your business.",
        },
        {
          question:
            "What is the principle of least privilege in vendor access?",
          options: [
            "Give vendors admin access so they can do their job efficiently",
            "Give vendors only the access they need for their specific role and nothing more",
            "Share one login across all vendors for simplicity",
            "Allow vendors to set their own access permissions",
          ],
          correctAnswer: 1,
          explanation:
            "Least privilege limits the damage a compromised vendor account can do by ensuring they can only access what is strictly necessary.",
        },
      ],
    },
  },
  {
    title: "Software Updates & Patch Management",
    description:
      "Build a systematic approach to keeping all business software updated and patched against known vulnerabilities.",
    category: "technical",
    difficulty: "beginner",
    estimatedDuration: 15,
    videoUrl: "https://www.youtube.com/embed/4ZpSEK1Edlc",
    tags: [
      "patch management",
      "updates",
      "vulnerabilities",
      "antivirus",
      "software",
    ],
    isPublished: true,
    content: {
      overview:
        "Unpatched software is one of the most common ways attackers gain access to SME systems. Most cyberattacks exploit known vulnerabilities that already have patches available.",
      learningObjectives: [
        "Understand why software updates are critical to security",
        "Set up automatic updates across all business devices",
        "Maintain a software and device inventory",
        "Choose and deploy appropriate antivirus protection",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Enable automatic updates",
          description:
            "Turn on automatic updates for Windows or macOS, all browsers, and any business-critical software. Schedule updates to run outside business hours to minimise disruption.",
        },
        {
          stepNumber: 2,
          title: "Audit all installed software",
          description:
            "Create an inventory of all software on company devices. Remove anything unlicensed, unsupported, or no longer needed. Unused software is often unpatched software.",
        },
        {
          stepNumber: 3,
          title: "Deploy business-grade antivirus",
          description:
            "Free antivirus is insufficient for business use. Deploy a managed endpoint security solution such as Microsoft Defender for Business, Malwarebytes for Teams, or similar. Ensure it updates automatically.",
        },
        {
          stepNumber: 4,
          title: "Check for end-of-life software",
          description:
            "Software that is no longer supported by the vendor receives no security patches. Identify and replace any end-of-life operating systems or applications (e.g. Windows 10 reaches end of life in October 2025).",
        },
      ],
      checklistItems: [
        {
          item: "Automatic updates enabled on all Windows and Mac devices",
          completed: false,
        },
        {
          item: "Browser updates set to automatic on all devices",
          completed: false,
        },
        { item: "Software inventory created and reviewed", completed: false },
        {
          item: "Business-grade antivirus deployed on all endpoints",
          completed: false,
        },
        {
          item: "End-of-life software identified and removal scheduled",
          completed: false,
        },
      ],
    },
    quiz: {
      passingScore: 70,
      questions: [
        {
          question: "Why are software updates important for security?",
          options: [
            "They add new features",
            "They fix known vulnerabilities that attackers actively exploit",
            "They make the software run faster",
            "They are required by law",
          ],
          correctAnswer: 1,
          explanation:
            "Most cyberattacks exploit known vulnerabilities that have already been patched. Keeping software updated closes these doors.",
        },
        {
          question: "What does end-of-life software mean?",
          options: [
            "Software that is very old but still supported",
            "Software the vendor no longer supports or patches",
            "Software that is about to be updated",
            "Software used only for testing",
          ],
          correctAnswer: 1,
          explanation:
            "End-of-life software no longer receives security patches, meaning known vulnerabilities in it will never be fixed by the vendor.",
        },
        {
          question: "What is the risk of using unlicensed software?",
          options: [
            "It may run slower",
            "It often contains hidden malware and receives no updates",
            "It uses more storage",
            "There is no real security risk",
          ],
          correctAnswer: 1,
          explanation:
            "Pirated software frequently contains malware pre-installed by the distributor and never receives official security patches.",
        },
      ],
    },
  },
];

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting training module seed...");

    await TrainingModule.deleteMany({});
    console.log("🗑️  Cleared existing training modules");

    const created = await TrainingModule.insertMany(modules);
    console.log(`✅ Inserted ${created.length} training modules`);

    // Print IDs so you can reference them
    created.forEach((m) => {
      console.log(`   [${m.category}] ${m.title} → ${m._id}`);
    });

    console.log(
      "\n🎉 Seed complete. Run your app and visit /training to see the modules.",
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seedDatabase();
