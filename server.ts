import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { 
  UserRole, 
  DeveloperProfile, 
  RecruiterProfile, 
  Project, 
  ProjectStatus, 
  HiringType, 
  WorkMode, 
  Application, 
  ApplicationStatus, 
  Invite, 
  InviteStatus, 
  ContactAccessRequest, 
  Message, 
  Chat, 
  Notification, 
  Dispute, 
  DisputeStatus,
  ProjectStage,
  NDA,
  Review
} from "./src/types.js";
import {
  isSupabaseConfigured,
  SUPABASE_SETUP_SQL,
  dbGetUsers,
  dbSaveUser,
  dbGetDeveloperProfiles,
  dbSaveDeveloperProfile,
  dbGetRecruiterProfiles,
  dbSaveRecruiterProfile,
  dbGetProjects,
  dbSaveProject,
  dbGetApplications,
  dbSaveApplication,
  dbGetInvites,
  dbSaveInvite,
  dbGetContactRequests,
  dbSaveContactRequest,
  dbGetChats,
  dbSaveChat,
  dbGetMessages,
  dbSaveMessage,
  dbGetProjectStages,
  dbSaveProjectStage,
  dbGetNDAs,
  dbSaveNDA,
  dbGetNotifications,
  dbSaveNotification,
  dbGetDisputes,
  dbSaveDispute
} from "./server/supabaseService.js";

dotenv.config();

const __filename = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "";
const __dirname = __filename ? path.dirname(__filename) : process.cwd();

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ----------------------------------------------------
// Mock Databases
// ----------------------------------------------------
let currentUserId = "admin"; // Default session user (admin = administrator)

let users = [
  { id: "dev-aryan", email: "aryan.sharma@gmail.com", role: UserRole.DEVELOPER, isVerified: true, isSuspended: false, createdAt: "2026-01-15T10:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true } },
  { id: "dev-priya", email: "priya.iyer@gmail.com", role: UserRole.DEVELOPER, isVerified: true, isSuspended: false, createdAt: "2026-02-10T11:30:00Z", notificationPreferences: { emailNewInvites: false, emailApplicationUpdates: true, emailChatMessages: true } },
  { id: "dev-vikram", email: "vikram.singh@gmail.com", role: UserRole.DEVELOPER, isVerified: false, isSuspended: false, createdAt: "2026-05-20T08:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: false, emailChatMessages: true } },
  { id: "rec-nexa", email: "hiring@nexasystems.com", role: UserRole.RECRUITER, isVerified: true, isSuspended: false, createdAt: "2026-03-01T09:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true } },
  { id: "rec-aura", email: "talent@aurafinance.io", role: UserRole.RECRUITER, isVerified: true, isSuspended: false, createdAt: "2026-04-12T15:20:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true } },
  { id: "admin", email: "info.bouuz@gmail.com", role: UserRole.ADMIN, isVerified: true, isSuspended: false, createdAt: "2025-01-01T00:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true, emailGlobalAlerts: true } }
];

let developerProfiles: Record<string, DeveloperProfile> = {
  "dev-aryan": {
    userId: "dev-aryan",
    fullName: "Aryan Sharma",
    headline: "Senior Full-Stack & DevOps Engineer",
    bio: "Pragmatic developer with 8+ years of engineering experience scaled backend microservices to 10M+ DAU. Expert in React/Next.js and Go microservices orchestrations.",
    skills: ["React", "TypeScript", "Node.js", "Go", "Kubernetes", "AWS", "PostgreSQL"],
    techStack: ["Next.js", "Go", "Docker", "AWS", "GraphQL"],
    experienceYears: 8,
    availability: "Both",
    rates: { hourly: 1200, weekly: 45000, monthly: 160000, projectMin: 25000 },
    location: "Bengaluru, Karnataka",
    socials: { github: "github.com/aryansharma", linkedin: "linkedin.com/in/aryansharma" },
    isContactVisible: false,
    phoneNumber: "+91 98765 43210",
    email: "aryan.sharma@gmail.com",
    status: "Available for contract",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAi4ngWd5CrR6vUA6u0s6nBgVorL1fJyiQeZGeTeldbqhrqo9SS08yPNdg1B_Bk5lK1nvZh3BQ20nxw-_y916Lyejy2LxBzH4dAd1fP20hkhXE2kyKcTIYgAXXEptu9T0DclDgPvOBdEXrLbGGVOs3uDJ-nbVrYWF8IeLnci5zg4yRQEInVehN5YYGJ8wLmMXcepUuqt73ZyhELf0LAB24-WUMsuFgxiRcVu33uwaHQP7VUW7dHQMA8sZitTh2A3D-tr5lV2LwAdRg",
    analytics: { profileViews: 1420, invitesCount: 15, applicationsSent: 24, acceptedProjects: 6 }
  },
  "dev-priya": {
    userId: "dev-priya",
    fullName: "Priya Iyer",
    headline: "Mobile Solutions Architect",
    bio: "Focused on high-performance cross-platform applications and beautiful pixel-perfect Flutter workflows.",
    skills: ["Flutter", "Dart", "Swift", "Kotlin", "Firebase", "TypeScript"],
    techStack: ["React Native", "Android SDK", "iOS", "FastAPI"],
    experienceYears: 6,
    availability: "Full-time",
    rates: { hourly: 1000, weekly: 38000, monthly: 140000, projectMin: 20000 },
    location: "Pune, Maharashtra",
    socials: { github: "github.com/priyaiyer", linkedin: "linkedin.com/in/priyaiyer" },
    isContactVisible: true,
    phoneNumber: "+91 91234 56789",
    email: "priya.iyer@gmail.com",
    status: "Open to offers",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB1I5USH65OsJUR2pS5Kf_2YeKJP6eu-nelkx3GzTZCt3_hr8eAr7ae8tH2uPOgQyOjmXAon3loz00VEC7-eZQEJx4IVNzicoTZUGAHT8m65PnLMwEkXOHZ0fPQCUweKrA-BCGKCp7NZD0i3iQX42swV4pVmqzcaEXbPwfahUZISzCkRdMLWUoYgp9SDikX4VUBq0aYGLEJsiuLdMs4zI1j9LdIczPaub-gucmFs3iBlKIERIKj9bq4DKRbupWpZqoZK1Hz7POBfaQ",
    analytics: { profileViews: 980, invitesCount: 9, applicationsSent: 12, acceptedProjects: 3 }
  },
  "dev-vikram": {
    userId: "dev-vikram",
    fullName: "Vikram Singh",
    headline: "ML Engineer & Data Pytonian",
    bio: "Developing deep learning modules and high throughput data pipeline integrations.",
    skills: ["Python", "PyTorch", "TensorFlow", "scikit-learn", "Kafka", "PostgreSQL"],
    techStack: ["Kubernetes", "Docker", "Spark"],
    experienceYears: 4,
    availability: "Part-time",
    rates: { hourly: 1500, weekly: 55000, monthly: 210000, projectMin: 35000 },
    location: "Hyderabad, Telangana",
    socials: { github: "github.com/vikramsingh" },
    isContactVisible: false,
    phoneNumber: "+91 99911 88822",
    email: "vikram.singh@gmail.com",
    status: "Busy",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWAHhBMvzbuR1SjuYs2Xlch2nkthYZraqu9ez7OafKCpsEd-PUjyJBiuxVSiXlgEsVNpbOEdwg5RssS29DhJjAnRzOG1Du-eD6ZUMRpmE06xPXvWSTGbLWBv1PbPCm1NvGl-PvAQf57ma6AuwnnXbaiA_QSjqa0ajuqtf5BWMMbu8vzz3nk1pltNC4vn1nGfZMDPeCbbdR9gixSW2aC1SxAvZ163wdTyJgKLIOwLcV0Z_WgMaoNP8xJ4mQurnRLB8CsXWyXAXcfLo",
    analytics: { profileViews: 410, invitesCount: 4, applicationsSent: 9, acceptedProjects: 1 }
  }
};

let recruiterProfiles: Record<string, RecruiterProfile> = {
  "rec-nexa": {
    userId: "rec-nexa",
    companyName: "Nexa Systems",
    companyLogoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPftZ36iKw3nObHvgba9nea_Zyj0Nd2M3c8O7F7xvt5Iu4MxzIXQnstWlp0RK8oQQ_FwArn7mL_sYT_iASEO041jfnEH_3PP2sa42YqQL55QIB686NISb31ZNTc_2uA1eh-o5IfIVOmi8OdS6Tem9sBVUN6TY5M_xDRK40PsR16g65-9Kf6eTta14_n6FgTjMlVUum_aH42kRZ-WsWd10bDpnSrUJJR847sHAZl0ZiXHyomzsOHFevVbSAMA1YbvN7jbzfwvlEShI",
    website: "https://nexasystems.com",
    industry: "Fintech Solutions",
    companySize: "100-500",
    aboutCompany: "Leading decentralized transaction routing architectures for high scale retail clients.",
    fullName: "Sarah J. Lans",
    phone: "+91 98888 77777",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHrtVwh41RJX2Lpko9KyyxeN_5FjD7e8wL9O30OGNUlCSrUA8hZw4oTWT2TMM8w1luD7JPSM1h6tzjgVKt558q3ANC4hxM0L3z2M1cpU-QNe4IGDxMM66k-rvsA8Z1opa8mzfvhjxZyWMZ_fv55MMonleD0t9G14KbZUZtmX7aJGrLJco7tFdkcFS4W8Hh4g1HxeAmC6P6AGoE28f0XOQwkPSu8DU7xXD13FgPwnfSEq6zavtcKHaRtNB3fFP9hSuMI_JqnvMkr7k"
  },
  "rec-aura": {
    userId: "rec-aura",
    companyName: "Aura Finance",
    website: "https://aurafinance.io",
    industry: "SaaS & Investment",
    companySize: "10-50",
    aboutCompany: "Pioneering real-time global portfolio metrics & predictive asset optimization.",
    fullName: "Rohan Kumar",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyPjw7LxfSUTvN9rzWWB4RD5TqgZiorg5rquwu-VQN2lWxOlAc4WwGaBZS48YEe9dxzr0oxKJjVLfMl9oUhKPo07w1dgULolyOHOBKo9tWEK5_L6kFLmvQd2Mtj3CWDloreSZU62NJlW3Vmo6hsyzU5qxGVzLVdatE-jT5bi5fGgQ6p2PN44ZP4pHnX_cBqJRdr9Bqr5_e2JQRm6UbCzmRTlNfW16EFXW43G3qyO77kNFkRc1-p8EMjWOAP_juvHhCrFUoCaa8vFQ"
  }
};

let projects: Project[] = [
  {
    id: "proj-ecommerce",
    recruiterId: "rec-nexa",
    title: "Next-Gen E-commerce Backend Architecture",
    description: "Seeking a senior backend architect to design and implement a next-generation e-commerce backbone capable of handling high-concurrency peak events (10k+ orders/min). The system must be event-driven using Redis, PostgreSQL and deploy to Kubernetes.",
    techStack: ["Node.js", "TypeScript", "Redis", "Docker", "AWS", "PostgreSQL"],
    budget: 1200000,
    hiringType: HiringType.FIXED_PRICE,
    workMode: WorkMode.REMOTE,
    duration: "3 months",
    status: ProjectStatus.OPEN,
    createdAt: "2026-05-26T18:00:00Z"
  },
  {
    id: "proj-llm",
    recruiterId: "rec-aura",
    title: "LLM Integration for Real-time Financial Analysis",
    description: "Build an optimized data ingestion pipeline parsing market sentiment trends via Llama-3 or Gemini. Integrate results cleanly into an existing React dashboard. Priority to local developers in Mumbai/Bengaluru.",
    techStack: ["React", "Python", "LangChain", "FastAPI"],
    budget: 85000,
    hiringType: HiringType.HOURLY,
    workMode: WorkMode.REMOTE,
    duration: "1 month",
    status: ProjectStatus.OPEN,
    createdAt: "2026-05-27T12:00:00Z"
  },
  {
    id: "proj-bento",
    recruiterId: "rec-aura",
    title: "Bento-Style Dashboard Design & Frontend",
    description: "Create a modern, high-density bento grid portfolio dashboard with framer-motion kinetics using React and Tailwind CSS v4. Must have strict visual hierarchy and beautiful spacing.",
    techStack: ["React", "Tailwind CSS", "Framer Motion"],
    budget: 45000,
    hiringType: HiringType.FIXED_PRICE,
    workMode: WorkMode.ONSITE,
    duration: "2 weeks",
    status: ProjectStatus.OPEN,
    createdAt: "2026-05-28T09:00:00Z"
  }
];

let applications: Application[] = [
  {
    id: "app-1",
    projectId: "proj-ecommerce",
    developerId: "dev-aryan",
    coverLetter: "I have extensive experience refactoring high-throughput Node.js microservices and building Redis locks for checkout consistency.",
    proposedRate: 65000,
    availability: "Full-time",
    timelineEstimate: "3 months",
    status: ApplicationStatus.SHORTLISTED,
    createdAt: "2026-05-27T10:00:00Z"
  }
];

let invites: Invite[] = [
  {
    id: "inv-1",
    projectId: "proj-bento",
    recruiterId: "rec-aura",
    developerId: "dev-aryan",
    message: "We loved your profile's focus on elegant design pairings and typography! Let's build our dashboard together.",
    status: InviteStatus.PENDING,
    createdAt: "2026-05-28T10:00:00Z"
  }
];

let contactAccessRequests: ContactAccessRequest[] = [
  {
    id: "con-1",
    recruiterId: "rec-nexa",
    developerId: "dev-aryan",
    status: "APPROVED",
    createdAt: "2026-05-26T14:00:00Z"
  }
];

let chats: Chat[] = [
  { id: "chat-1", developerId: "dev-aryan", recruiterId: "rec-nexa", lastMessageText: "Our team will love your proposed milestone structure.", updatedAt: "2026-05-28T14:32:00Z" }
];

let messages: Message[] = [
  { id: "msg-1", chatId: "chat-1", senderId: "rec-nexa", receiverId: "dev-aryan", text: "Hi Aryan, we are absolutely thrilled with your project proposal. Can we initiate the contract?", seen: true, createdAt: "2026-05-28T14:30:00Z" },
  { id: "msg-2", chatId: "chat-1", senderId: "dev-aryan", receiverId: "rec-nexa", text: "Yes Sarah, I just completed configuring the milestones. Our team can start immediately after Escrow setup.", seen: false, createdAt: "2026-05-28T14:32:00Z" }
];

let disputes: Dispute[] = [
  {
    id: "disp-1",
    projectId: "proj-ecommerce",
    milestoneTitle: "Sprint 4: API Integration & Validation",
    claimantId: "rec-nexa",
    opponentId: "dev-aryan",
    reason: "Quality Issues",
    details: "The script returns invalid schema exceptions for the payment webhook handler, which took 3 days of down-time during integration tests.",
    escrowAmount: 210000,
    proposedResolution: "Extend scope of work or partial refund of 50%",
    status: DisputeStatus.UNDER_REVIEW,
    mediatorId: "Elena Vance",
    createdAt: "2026-05-28T08:00:00Z",
    updatedAt: "2026-05-28T08:00:00Z"
  }
];

let projectStages: ProjectStage[] = [
  { id: "stage-1", projectId: "proj-ecommerce", title: "Milestone 1: Database Setup & Infrastructure", description: "Spin up postgres schemas and complete local container configurations.", cost: 300000, dueDate: "2026-06-15", createdBy: "RECRUITER", status: "APPROVED" },
  { id: "stage-2", projectId: "proj-ecommerce", title: "Milestone 2: Multi-tenant Auth Gateway", description: "Design JWT-based secure session boundaries and role middlewares.", cost: 400000, dueDate: "2026-07-05", createdBy: "DEVELOPER", status: "PROPOSED" }
];

let ndas: NDA[] = [
  { id: "nda-1", projectId: "proj-ecommerce", developerId: "dev-aryan", recruiterId: "rec-nexa", terms: "This Mutual Non-Disclosure Agreement protects Nexa Systems proprietary trade secrets, transactional ledger formulas, and client lists from unauthorised dissemination. The developer Aryan Sharma agrees to zero public repository disclosures without written authorization.", status: "SIGNED", recruiterSignature: "Sarah J. Lans", developerSignature: "Aryan Sharma", recruiterSignedAt: "2026-05-26T15:00:00Z", developerSignedAt: "2026-05-27T09:00:00Z", createdAt: "2026-05-26T14:30:00Z" }
];

let notifications: Notification[] = [
  { id: "not-1", userId: "dev-aryan", title: "New Interview Request", description: "TechCorp invited you to chat about 'Bento-Style Dashboard'.", type: "invite", isRead: false, createdAt: "2026-05-28T18:00:00Z" },
  { id: "not-2", userId: "rec-nexa", title: "New Application Received", description: "Aryan Sharma applied to your project.", type: "application", isRead: false, createdAt: "2026-05-28T18:10:00Z" }
];

let reviews: Review[] = [
  {
    id: "rev-1",
    projectId: "proj-ecommerce",
    reviewerId: "rec-nexa",
    reviewerName: "Nexa Systems (Sarah J. Lans)",
    revieweeId: "dev-aryan",
    rating: 5,
    comment: "Aryan Sharma is a remarkable engineer! Migrated our high-capacity microservices API seamlessly. Our page response times decreased by 40% with absolute database consistency! Outstanding.",
    createdAt: "2026-05-28T12:00:00Z"
  },
  {
    id: "rev-2",
    projectId: "proj-ecommerce",
    reviewerId: "dev-aryan",
    reviewerName: "Aryan Sharma",
    revieweeId: "rec-nexa",
    rating: 5,
    comment: "Working with Nexa Systems was fantastic. Clear sprint parameters, instant escrow pre-funding, and highly responsive feedback loop throughout the development architecture.",
    createdAt: "2026-05-29T10:00:00Z"
  }
];

// Helper to push admin notifications
function addAdminNotification(title: string, desc: string) {
  notifications.push({
    id: "not-" + Math.random().toString(36).substring(2, 9),
    userId: "admin",
    title,
    description: desc,
    type: "verification",
    isRead: false,
    createdAt: new Date().toISOString()
  });
  // Auto sync if configured
  if (isSupabaseConfigured()) {
    const lastNotif = notifications[notifications.length - 1];
    dbSaveNotification(lastNotif).catch(e => console.warn("Background notification save failed", e));
  }
}

// ----------------------------------------------------
// Supabase Replication and Synchronization Logic
// ----------------------------------------------------
async function initializeSupabaseSync() {
  if (isSupabaseConfigured()) {
    console.log("🔄 Hydrating local in-memory DB tables with Supabase database content...");
    try {
      // 1. Users
      const dbUsers = await dbGetUsers(users);
      if (dbUsers && dbUsers.length > 0) {
        dbUsers.forEach(dbU => {
          const idx = users.findIndex(u => u.id === dbU.id);
          if (idx !== -1) users[idx] = dbU;
          else users.push(dbU);
        });
      }

      // 2. Developer Profiles
      const dbDevProfs = await dbGetDeveloperProfiles(developerProfiles);
      if (dbDevProfs) {
        Object.assign(developerProfiles, dbDevProfs);
      }

      // 3. Recruiter Profiles
      const dbRecProfs = await dbGetRecruiterProfiles(recruiterProfiles);
      if (dbRecProfs) {
        Object.assign(recruiterProfiles, dbRecProfs);
      }

      // 4. Projects
      const dbProjs = await dbGetProjects(projects);
      if (dbProjs && dbProjs.length > 0) {
        dbProjs.forEach(dbP => {
          const idx = projects.findIndex(p => p.id === dbP.id);
          if (idx !== -1) projects[idx] = dbP;
          else projects.push(dbP);
        });
      }

      // 5. Applications
      const dbApps = await dbGetApplications(applications);
      if (dbApps && dbApps.length > 0) {
        dbApps.forEach(dbA => {
          const idx = applications.findIndex(a => a.id === dbA.id);
          if (idx !== -1) applications[idx] = dbA;
          else applications.push(dbA);
        });
      }

      // 6. Project Stages
      const dbStages = await dbGetProjectStages(projectStages);
      if (dbStages && dbStages.length > 0) {
        dbStages.forEach(dbS => {
          const idx = projectStages.findIndex(s => s.id === dbS.id);
          if (idx !== -1) projectStages[idx] = dbS;
          else projectStages.push(dbS);
        });
      }

      // 7. NDAs
      const dbNdas = await dbGetNDAs(ndas);
      if (dbNdas && dbNdas.length > 0) {
        dbNdas.forEach(dbN => {
          const idx = ndas.findIndex(n => n.id === dbN.id);
          if (idx !== -1) ndas[idx] = dbN;
          else ndas.push(dbN);
        });
      }

      // 8. Chats
      const dbChatsList = await dbGetChats(chats);
      if (dbChatsList && dbChatsList.length > 0) {
        dbChatsList.forEach(dbC => {
          const idx = chats.findIndex(c => c.id === dbC.id);
          if (idx !== -1) chats[idx] = dbC;
          else chats.push(dbC);
        });
      }

      // Messages (individual chat fetching)
      for (const chat of chats) {
        const dbMsgs = await dbGetMessages(chat.id, []);
        if (dbMsgs && dbMsgs.length > 0) {
          dbMsgs.forEach(dbM => {
            const idx = messages.findIndex(m => m.id === dbM.id);
            if (idx !== -1) messages[idx] = dbM;
            else messages.push(dbM);
          });
        }
      }

      // 9. Notifications
      const dbNotifs = await dbGetNotifications(notifications);
      if (dbNotifs && dbNotifs.length > 0) {
        dbNotifs.forEach(dbN => {
          const idx = notifications.findIndex(n => n.id === dbN.id);
          if (idx !== -1) notifications[idx] = dbN;
          else notifications.push(dbN);
        });
      }

      // 10. Disputes
      const dbDisps = await dbGetDisputes(disputes);
      if (dbDisps && dbDisps.length > 0) {
        dbDisps.forEach(dbD => {
          const idx = disputes.findIndex(d => d.id === dbD.id);
          if (idx !== -1) disputes[idx] = dbD;
          else disputes.push(dbD);
        });
      }

      // 11. Invites
      const dbInvs = await dbGetInvites(invites);
      if (dbInvs && dbInvs.length > 0) {
        dbInvs.forEach(dbI => {
          const idx = invites.findIndex(i => i.id === dbI.id);
          if (idx !== -1) invites[idx] = dbI;
          else invites.push(dbI);
        });
      }

      // 12. Contact requests
      const dbCons = await dbGetContactRequests(contactAccessRequests);
      if (dbCons && dbCons.length > 0) {
        dbCons.forEach(dbC => {
          const idx = contactAccessRequests.findIndex(c => c.id === dbC.id);
          if (idx !== -1) contactAccessRequests[idx] = dbC;
          else contactAccessRequests.push(dbC);
        });
      }

      console.log("✨ Supabase in-memory sync hydration completed successfully.");
    } catch (err) {
      console.error("🔴 Supabase in-memory sync hydration failed partially (usually due to unseeded schema tables):", err);
    }
  }
}

// Background Replication Triggers
async function syncUser(user: any) {
  if (isSupabaseConfigured()) dbSaveUser(user).catch(e => console.error("Sync user fail", e));
}
async function syncDevProfile(userId: string, profile: any) {
  if (isSupabaseConfigured()) dbSaveDeveloperProfile(userId, profile).catch(e => console.error("Sync dev profile fail", e));
}
async function syncRecProfile(userId: string, profile: any) {
  if (isSupabaseConfigured()) dbSaveRecruiterProfile(userId, profile).catch(e => console.error("Sync recruiter profile fail", e));
}
async function syncProject(proj: any) {
  if (isSupabaseConfigured()) dbSaveProject(proj).catch(e => console.error("Sync project fail", e));
}
async function syncApplication(app: any) {
  if (isSupabaseConfigured()) dbSaveApplication(app).catch(e => console.error("Sync application fail", e));
}
async function syncInvite(inv: any) {
  if (isSupabaseConfigured()) dbSaveInvite(inv).catch(e => console.error("Sync invite fail", e));
}
async function syncContactRequest(req: any) {
  if (isSupabaseConfigured()) dbSaveContactRequest(req).catch(e => console.error("Sync contact req fail", e));
}
async function syncChat(chat: any) {
  if (isSupabaseConfigured()) dbSaveChat(chat).catch(e => console.error("Sync chat fail", e));
}
async function syncMessage(msg: any) {
  if (isSupabaseConfigured()) dbSaveMessage(msg).catch(e => console.error("Sync message fail", e));
}
async function syncProjectStage(stage: any) {
  if (isSupabaseConfigured()) dbSaveProjectStage(stage).catch(e => console.error("Sync project stage fail", e));
}
async function syncNDA(nda: any) {
  if (isSupabaseConfigured()) dbSaveNDA(nda).catch(e => console.error("Sync NDA fail", e));
}
async function syncNotification(notif: any) {
  if (isSupabaseConfigured()) dbSaveNotification(notif).catch(e => console.error("Sync notification fail", e));
}
async function syncDispute(disp: any) {
  if (isSupabaseConfigured()) dbSaveDispute(disp).catch(e => console.error("Sync dispute fail", e));
}

// ----------------------------------------------------
// Express Setup
// ----------------------------------------------------
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Hydrate Supabase on Server Startup (non-blocking for container health compliance)
  initializeSupabaseSync().catch(err => {
    console.error("🔴 Failed to perform initial Supabase hydration checks:", err);
  });

  app.use(express.json());

  // ----------------------------------------------------
  // API Endpoints
  // ----------------------------------------------------

  // Current session routing (Simulated auth switcher)
  app.get("/api/session", (req, res) => {
    if (currentUserId === "guest") {
      return res.json({ user: null, devProfile: null, recProfile: null });
    }
    const user = users.find(u => u.id === currentUserId);
    if (!user) {
      return res.json({ user: null, devProfile: null, recProfile: null });
    }
    const devProfile = developerProfiles[user.id] || null;
    const recProfile = recruiterProfiles[user.id] || null;
    res.json({ user, devProfile, recProfile });
  });

  app.post("/api/session/login", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const targetEmail = email.toLowerCase().trim();
    
    // Find matching user by email
    const user = users.find(u => u.email.toLowerCase().trim() === targetEmail);
    if (user) {
      if (user.role === UserRole.ADMIN && targetEmail !== "info.bouuz@gmail.com") {
        return res.status(403).json({ error: "Access Denied. Only info.bouuz@gmail.com can log in with administrator privileges." });
      }
      if (user.isSuspended) {
        return res.status(403).json({ error: "This account has been suspended by administration." });
      }
      currentUserId = user.id;
      const devProfile = developerProfiles[user.id] || null;
      const recProfile = recruiterProfiles[user.id] || null;
      res.json({ success: true, user, devProfile, recProfile });
    } else {
      res.status(401).json({ error: "Invalid credentials. If you are registering a new user, please use the Signup tab." });
    }
  });

  app.post("/api/session/logout", (req, res) => {
    currentUserId = "guest";
    res.json({ success: true });
  });

  app.post("/api/session/signup", (req, res) => {
    const { email, role, fullName, headline, companyName, industry, bio, aboutCompany } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const targetEmail = email.toLowerCase().trim();

    // Check if they tried to register as ADMIN but are not info.bouuz@gmail.com
    if (role === UserRole.ADMIN && targetEmail !== "info.bouuz@gmail.com") {
      return res.status(403).json({ error: "Unauthorized role assignment. Only info.bouuz@gmail.com can be registered as an Administrator." });
    }

    // Check if email already exists
    const existing = users.find(u => u.email.toLowerCase().trim() === targetEmail);
    if (existing) {
      return res.status(400).json({ error: "Email already registered. Please login instead." });
    }

    const id = "user-" + Math.random().toString(36).substring(2, 9);
    const newUser = { 
      id, 
      email: email.trim(), 
      role, 
      isVerified: role === UserRole.ADMIN ? true : false, 
      isSuspended: false, 
      createdAt: new Date().toISOString(),
      notificationPreferences: {
        emailNewInvites: true,
        emailApplicationUpdates: true,
        emailChatMessages: true,
        emailGlobalAlerts: role === UserRole.ADMIN ? true : false
      }
    };
    users.push(newUser);

    if (role === UserRole.DEVELOPER) {
      developerProfiles[id] = {
        userId: id,
        fullName: fullName || "New Developer Candidate",
        headline: headline || "Full-Stack Engineer",
        bio: bio || "Passionate React & TypeScript systems engineer.",
        skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
        techStack: ["React", "Tailwind CSS"],
        experienceYears: 3,
        availability: "Both",
        rates: { hourly: 600, weekly: 22000, monthly: 85000, projectMin: 10000 },
        location: "Bengaluru, India",
        socials: {},
        isContactVisible: false,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName || "Dev")}`,
        analytics: { profileViews: 0, invitesCount: 0, applicationsSent: 0, acceptedProjects: 0 }
      };
      syncDevProfile(id, developerProfiles[id]);
    } else if (role === UserRole.RECRUITER) {
      recruiterProfiles[id] = {
        userId: id,
        companyName: companyName || "Startup Solutions Ltd",
        industry: industry || "Information Technology",
        companySize: "11-50",
        aboutCompany: aboutCompany || "Next-generation high performance product incubator.",
        fullName: fullName || "Talent Lead",
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(companyName || "Rec")}`
      };
      syncRecProfile(id, recruiterProfiles[id]);
    }

    currentUserId = id;
    syncUser(newUser);
    addAdminNotification("New User Registered", `${fullName || companyName || "New user"} signed up as a new ${role}.`);
    res.json({ 
      success: true, 
      user: newUser, 
      devProfile: developerProfiles[id] || null, 
      recProfile: recruiterProfiles[id] || null 
    });
  });

  app.post("/api/session/switch", (req, res) => {
    const { userId } = req.body;
    const user = users.find(u => u.id === userId);
    if (user) {
      currentUserId = userId;
      res.json({ success: true, user });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // Users endpoint (useful for Admin list)
  app.get("/api/users", (req, res) => {
    const combined = users.map(user => {
      return {
        ...user,
        devProfile: developerProfiles[user.id] || null,
        recProfile: recruiterProfiles[user.id] || null
      };
    });
    res.json(combined);
  });

  app.post("/api/users/update", (req, res) => {
    const { userId, isVerified, isSuspended, role, notificationPreferences } = req.body;
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      if (typeof isVerified === "boolean") users[userIndex].isVerified = isVerified;
      if (typeof isSuspended === "boolean") users[userIndex].isSuspended = isSuspended;
      if (role) {
        if (role === UserRole.ADMIN && users[userIndex].email.toLowerCase().trim() !== "info.bouuz@gmail.com") {
          return res.status(403).json({ error: "Only info.bouuz@gmail.com is authorized to hold the Administrator role." });
        }
        users[userIndex].role = role;
        
        // Populate profile if role was switched and the target profile does not exist yet
        const id = userId;
        if (role === UserRole.DEVELOPER && !developerProfiles[id]) {
          developerProfiles[id] = {
            userId: id,
            fullName: "Developer Candidate",
            headline: "Full-Stack Engineer",
            bio: "Passionate React & TypeScript systems engineer.",
            skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
            techStack: ["React", "Tailwind CSS"],
            experienceYears: 3,
            availability: "Both",
            rates: { hourly: 600, weekly: 22000, monthly: 85000, projectMin: 10000 },
            location: "Bengaluru, India",
            socials: {},
            isContactVisible: false,
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(users[userIndex].email || "Dev")}`,
            analytics: { profileViews: 0, invitesCount: 0, applicationsSent: 0, acceptedProjects: 0 }
          };
          syncDevProfile(id, developerProfiles[id]);
        } else if (role === UserRole.RECRUITER && !recruiterProfiles[id]) {
          recruiterProfiles[id] = {
            userId: id,
            companyName: "Startup Solutions Ltd",
            industry: "Information Technology",
            companySize: "11-50",
            aboutCompany: "Next-generation high performance product incubator.",
            fullName: "Talent Lead",
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(users[userIndex].email || "Rec")}`
          };
          syncRecProfile(id, recruiterProfiles[id]);
        }
      }
      if (notificationPreferences) {
        users[userIndex].notificationPreferences = {
          ...users[userIndex].notificationPreferences,
          ...notificationPreferences
        };
      }
      syncUser(users[userIndex]);
      res.json({ success: true, user: users[userIndex] });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/users/preferences", (req, res) => {
    if (currentUserId === "guest") {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    const userIndex = users.findIndex(u => u.id === currentUserId);
    if (userIndex !== -1) {
      users[userIndex].notificationPreferences = {
        emailNewInvites: true,
        emailApplicationUpdates: true,
        emailChatMessages: true,
        ...users[userIndex].notificationPreferences,
        ...req.body
      };
      syncUser(users[userIndex]);
      res.json({ success: true, user: users[userIndex] });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/users/add", (req, res) => {
    const { email, role, fullName } = req.body;
    const id = "user-" + Math.random().toString(36).substring(2, 9);
    const newUser = { 
      id, 
      email, 
      role, 
      isVerified: true, 
      isSuspended: false, 
      createdAt: new Date().toISOString(),
      notificationPreferences: {
        emailNewInvites: true,
        emailApplicationUpdates: true,
        emailChatMessages: true,
        emailGlobalAlerts: false
      }
    };
    users.push(newUser);

    if (role === UserRole.DEVELOPER) {
      developerProfiles[id] = {
        userId: id,
        fullName: fullName || "New Developer",
        headline: "Software Engineer",
        bio: "Bio description",
        skills: ["React", "TypeScript", "Node.js"],
        techStack: [],
        experienceYears: 2,
        availability: "Both",
        rates: { hourly: 500, weekly: 15000, monthly: 50000, projectMin: 5000 },
        location: "Bengaluru, India",
        socials: {},
        isContactVisible: false,
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU",
        analytics: { profileViews: 0, invitesCount: 0, applicationsSent: 0, acceptedProjects: 0 }
      };
    } else if (role === UserRole.RECRUITER) {
      recruiterProfiles[id] = {
        userId: id,
        companyName: fullName || "New Startup",
        industry: "IT & Services",
        companySize: "1-10",
        aboutCompany: "About section",
        fullName: "Contact Person"
      };
    }
    
    res.json({ success: true, user: newUser });
  });

  // Projects endpoint
  app.get("/api/projects", (req, res) => {
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const { title, description, techStack, budget, hiringType, workMode, duration, aiMetrics } = req.body;
    const id = "proj-" + Math.random().toString(36).substring(2, 9);
    const newProject: Project = {
      id,
      recruiterId: currentUserId,
      title,
      description,
      techStack: techStack || ["React", "Node.js"],
      budget: Number(budget) || 15000,
      hiringType: hiringType || HiringType.FIXED_PRICE,
      workMode: workMode || WorkMode.REMOTE,
      duration: duration || "1 month",
      status: ProjectStatus.OPEN,
      createdAt: new Date().toISOString(),
      aiSuggestedMetrics: aiMetrics || null
    };

    projects.push(newProject);
    syncProject(newProject);
    addAdminNotification("New Project Posted", `A project titled "${title}" has been launched.`);
    res.json({ success: true, project: newProject });
  });

  app.post("/api/projects/status", (req, res) => {
    const { projectId, status } = req.body;
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      proj.status = status;
      syncProject(proj);
      res.json({ success: true, project: proj });
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  });

  // ----------------------------------------------------
  // PROJECT STAGES & MILESTONES API
  // ----------------------------------------------------
  app.get("/api/project-stages", (req, res) => {
    res.json(projectStages);
  });

  app.post("/api/project-stages", (req, res) => {
    const { projectId, title, description, cost, dueDate, createdBy } = req.body;
    const id = "stage-" + Math.random().toString(36).substring(2, 9);
    const newStage: ProjectStage = {
      id,
      projectId,
      title,
      description,
      cost: Number(cost) || 0,
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      createdBy: createdBy || "RECRUITER",
      status: "PROPOSED"
    };
    projectStages.push(newStage);
    syncProjectStage(newStage);

    // Notify other party
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      const acceptedApp = applications.find(a => a.projectId === projectId && a.status === ApplicationStatus.ACCEPTED);
      const targetUserId = createdBy === "RECRUITER" ? (acceptedApp ? acceptedApp.developerId : "guest") : proj.recruiterId;
      notifications.push({
        id: "not-" + Math.random().toString(36).substring(2, 9),
        userId: targetUserId,
        title: "New Stage Proposed",
        description: `A new project milestone plan stage "${title}" has been created.`,
        type: "project_update",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, stage: newStage });
  });

  app.post("/api/project-stages/approve", (req, res) => {
    const { stageId } = req.body;
    const stage = projectStages.find(s => s.id === stageId);
    if (stage) {
      stage.status = "APPROVED";
      syncProjectStage(stage);
      res.json({ success: true, stage });
    } else {
      res.status(404).json({ error: "Stage not found" });
    }
  });

  app.post("/api/project-stages/complete", (req, res) => {
    const { stageId } = req.body;
    const stage = projectStages.find(s => s.id === stageId);
    if (stage) {
      stage.status = "COMPLETED";
      syncProjectStage(stage);
      res.json({ success: true, stage });
    } else {
      res.status(404).json({ error: "Stage not found" });
    }
  });

  // ----------------------------------------------------
  // SECURE DIGITAL NDA CONTRACTS API
  // ----------------------------------------------------
  app.get("/api/ndas", (req, res) => {
    res.json(ndas);
  });

  app.post("/api/ndas", (req, res) => {
    const { projectId, developerId, terms } = req.body;
    const id = "nda-" + Math.random().toString(36).substring(2, 9);
    
    const existingNda = ndas.find(n => n.projectId === projectId && n.developerId === developerId);
    if (existingNda) {
      existingNda.terms = terms;
      existingNda.status = "SENT";
      existingNda.recruiterSignature = undefined;
      existingNda.developerSignature = undefined;
      existingNda.recruiterSignedAt = undefined;
      existingNda.developerSignedAt = undefined;
      syncNDA(existingNda);
      return res.json({ success: true, nda: existingNda });
    }

    const proj = projects.find(p => p.id === projectId);
    const recruiterId = proj ? proj.recruiterId : currentUserId;

    const newNda: NDA = {
      id,
      projectId,
      developerId,
      recruiterId,
      terms,
      status: "SENT",
      createdAt: new Date().toISOString()
    };
    ndas.push(newNda);
    syncNDA(newNda);

    // Notify developer
    notifications.push({
      id: "not-" + Math.random().toString(36).substring(2, 9),
      userId: developerId,
      title: "NDA Sent for Signing",
      description: `Please review, understand and digitally sign the NDA for ${proj ? proj.title : "your software deliverables"}.`,
      type: "project_update",
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, nda: newNda });
  });

  app.post("/api/ndas/generate", async (req, res) => {
    const { projectName, companyName, developerName, additionalConditions } = req.body;

    const fallbackTerms = `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement (the "Agreement") is entered into by and between ${companyName} ("Disclosing Party") and ${developerName} ("Receiving Party") regarding the development of the project: "${projectName}".

1. Confidential Information: All proprietary codebases, platform mechanisms, database schemes, credentials, and business specifications shared are confidential.
2. Direct Conditions: ${additionalConditions || "The developer agrees to build compliant milestones and refrain from disclosing any proprietary algorithms or third party keys."}
3. Term and Termination: Obligations of confidentiality shall terminate 3 years from the date of sign-off.
4. Compliance: Both parties confirm binding adherence, conforming with standard Indian IT Act procedures.`;

    if (!ai) {
      console.warn("Gemini is unconfigured. Returning premium fallback NDA draft.");
      return res.json({ terms: fallbackTerms });
    }

    try {
      const prompt = `Write a professional, comprehensive, and legally binding Non-Disclosure Agreement (NDA) in plain text for a software outsourcing contract.
Disclosing Party (Company): ${companyName}
Receiving Party (Developer): ${developerName}
Project: ${projectName}
Additional Specific Conditions provided by the Recruiter: ${additionalConditions || "None"}

The NDA must be detailed, including Clauses for Confidential Information classification, Obligations of Non-Disclosure, Standard Exclusions, Return of Materials, Equitable Remedies, and Governed Law (complying with standard Indian IT Act). Ensure it is highly professional and structured as a direct plain text legal contract.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      const extractedText = response.text || fallbackTerms;
      res.json({ terms: extractedText });
    } catch (err: any) {
      console.error("Gemini NDA generation failed. Falling back to structured schema.", err);
      res.json({ terms: fallbackTerms });
    }
  });

  app.post("/api/ndas/sign", (req, res) => {
    const { ndaId, role, signature } = req.body;
    const nda = ndas.find(n => n.id === ndaId);
    if (!nda) {
      return res.status(404).json({ error: "NDA not found" });
    }

    if (role === "RECRUITER") {
      nda.recruiterSignature = signature || "Digital Signature";
      nda.recruiterSignedAt = new Date().toISOString();
    } else if (role === "DEVELOPER") {
      nda.developerSignature = signature || "Digital Signature";
      nda.developerSignedAt = new Date().toISOString();
    }

    if (nda.recruiterSignature && nda.developerSignature) {
      nda.status = "SIGNED";
    } else {
      nda.status = "SENT";
    }

    syncNDA(nda);
    res.json({ success: true, nda });
  });

  // ----------------------------------------------------
  // RECRUITER QUICK-HIRE DIRECT ENGAGEMENT API
  // ----------------------------------------------------
  app.post("/api/projects/quick-hire", (req, res) => {
    const { projectId, developerId, proposedRate, timelineEstimate, coverLetter } = req.body;
    
    const proj = projects.find(p => p.id === projectId);
    if (!proj) {
      return res.status(404).json({ error: "Project not found" });
    }

    proj.status = ProjectStatus.IN_REVIEW;

    const id = "app-" + Math.random().toString(36).substring(2, 9);
    const newApp: Application = {
      id,
      projectId,
      developerId,
      coverLetter: coverLetter || "Quick Hire direct contract engagement.",
      proposedRate: Number(proposedRate) || proj.budget,
      availability: "Both",
      timelineEstimate: timelineEstimate || "3 months",
      status: ApplicationStatus.ACCEPTED,
      createdAt: new Date().toISOString()
    };
    applications.push(newApp);
    syncApplication(newApp);
    syncProject(proj);

    // Update developer acceptances count
    const devProfile = developerProfiles[developerId];
    if (devProfile) {
      devProfile.analytics.acceptedProjects += 1;
      syncDevProfile(developerId, devProfile);
    }

    // Establish dynamic chats immediately
    let existingChat = chats.find(c => c.developerId === developerId && c.recruiterId === currentUserId);
    if (!existingChat) {
      existingChat = {
        id: "chat-" + Math.random().toString(36).substring(2, 9),
        developerId,
        recruiterId: currentUserId,
        lastMessageText: "Quick Hire order established. Welcome to the workspace!",
        updatedAt: new Date().toISOString()
      };
      chats.push(existingChat);
      syncChat(existingChat);
    } else {
      existingChat.lastMessageText = "Quick Hire order established. Welcome to the workspace!";
      existingChat.updatedAt = new Date().toISOString();
      syncChat(existingChat);
    }

    // Notify developer
    notifications.push({
      id: "not-" + Math.random().toString(36).substring(2, 9),
      userId: developerId,
      title: "Direct Quick Hire Contract!",
      description: `You have been directly hired for "${proj.title}" with bypassed apply flows! Validate your milestones & digital NDA now.`,
      type: "application",
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, application: newApp, chat: existingChat });
  });

  // Applications endpoint
  app.get("/api/applications", (req, res) => {
    res.json(applications);
  });

  app.post("/api/applications", (req, res) => {
    const { projectId, coverLetter, proposedRate, availability, timelineEstimate } = req.body;
    const id = "app-" + Math.random().toString(36).substring(2, 9);
    const newApp: Application = {
      id,
      projectId,
      developerId: currentUserId,
      coverLetter,
      proposedRate: Number(proposedRate) || 500,
      availability: availability || "Both",
      timelineEstimate: timelineEstimate || "2 weeks",
      status: ApplicationStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    applications.push(newApp);
    syncApplication(newApp);

    // Notify Project owner
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      notifications.push({
        id: "not-" + Math.random().toString(36).substring(2, 9),
        userId: proj.recruiterId,
        title: "New Application",
        description: `A developer applied to your project "${proj.title}"`,
        type: "application",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, application: newApp });
  });

  app.post("/api/applications/status", (req, res) => {
    const { applicationId, status } = req.body;
    const appRecord = applications.find(a => a.id === applicationId);
    if (appRecord) {
      appRecord.status = status;

      // Update developer stats on accept
      if (status === ApplicationStatus.ACCEPTED) {
        const devProfile = developerProfiles[appRecord.developerId];
        if (devProfile) {
          devProfile.analytics.acceptedProjects += 1;
          syncDevProfile(appRecord.developerId, devProfile);
        }
      }

      syncApplication(appRecord);

      // Notify developer
      notifications.push({
        id: "not-" + Math.random().toString(36).substring(2, 9),
        userId: appRecord.developerId,
        title: `Application ${status}`,
        description: `Your application to the project has been flag status: ${status}`,
        type: "application",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, application: appRecord });
    } else {
      res.status(404).json({ error: "Application not found" });
    }
  });

  // Profile management endpoint
  app.post("/api/profile/developer", (req, res) => {
    const profile = req.body;
    developerProfiles[currentUserId] = {
      ...developerProfiles[currentUserId],
      ...profile,
      userId: currentUserId
    };
    syncDevProfile(currentUserId, developerProfiles[currentUserId]);
    res.json({ success: true, profile: developerProfiles[currentUserId] });
  });

  app.post("/api/profile/recruiter", (req, res) => {
    const profile = req.body;
    recruiterProfiles[currentUserId] = {
      ...recruiterProfiles[currentUserId],
      ...profile,
      userId: currentUserId
    };
    syncRecProfile(currentUserId, recruiterProfiles[currentUserId]);
    res.json({ success: true, profile: recruiterProfiles[currentUserId] });
  });

  // Invites endpoint
  app.get("/api/invites", (req, res) => {
    res.json(invites);
  });

  app.post("/api/invites", (req, res) => {
    const { projectId, developerId, message } = req.body;
    const id = "inv-" + Math.random().toString(36).substring(2, 9);
    const newInvite: Invite = {
      id,
      projectId,
      recruiterId: currentUserId,
      developerId,
      message: message || "We would love for you to checkout our project!",
      status: InviteStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    invites.push(newInvite);
    syncInvite(newInvite);

    // Notify developer
    notifications.push({
      id: "not-" + Math.random().toString(36).substring(2, 9),
      userId: developerId,
      title: "New Invitation Received",
      description: `A recruiter has invited you to apply.`,
      type: "invite",
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, invite: newInvite });
  });

  app.post("/api/invites/respond", (req, res) => {
    const { inviteId, status } = req.body;
    const inv = invites.find(i => i.id === inviteId);
    if (inv) {
      inv.status = status;
      syncInvite(inv);
      res.json({ success: true, invite: inv });
    } else {
      res.status(404).json({ error: "Invite not found" });
    }
  });

  // Contact requests endpoint
  app.get("/api/contacts", (req, res) => {
    res.json(contactAccessRequests);
  });

  app.post("/api/contacts/request", (req, res) => {
    const { developerId } = req.body;
    const id = "con-" + Math.random().toString(36).substring(2, 9);
    const newRequest: ContactAccessRequest = {
      id,
      recruiterId: currentUserId,
      developerId,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    contactAccessRequests.push(newRequest);
    syncContactRequest(newRequest);

    // Notify dev
    notifications.push({
      id: "not-" + Math.random().toString(36).substring(2, 9),
      userId: developerId,
      title: "Contact Details Request",
      description: `A recruiter requested access to view your contact information.`,
      type: "contact_request",
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, request: newRequest });
  });

  app.post("/api/contacts/respond", (req, res) => {
    const { requestId, status } = req.body;
    const reqRecord = contactAccessRequests.find(c => c.id === requestId);
    if (reqRecord) {
      reqRecord.status = status;

      // Update developer profile visibility on accept
      if (status === "APPROVED") {
        const devProf = developerProfiles[reqRecord.developerId];
        if (devProf) {
          devProf.isContactVisible = true;
          syncDevProfile(reqRecord.developerId, devProf);
        }
      }

      syncContactRequest(reqRecord);
      res.json({ success: true, request: reqRecord });
    } else {
      res.status(404).json({ error: "Request not found" });
    }
  });

  // Chats & messaging
  app.get("/api/chats", (req, res) => {
    // Return chats involving current user
    const userChats = chats.filter(c => c.developerId === currentUserId || c.recruiterId === currentUserId);
    res.json(userChats);
  });

  app.get("/api/messages/:chatId", (req, res) => {
    const chatMessages = messages.filter(m => m.chatId === req.params.chatId);
    res.json(chatMessages);
  });

  app.post("/api/messages", (req, res) => {
    const { chatId, receiverId, text, fileUrl, fileType } = req.body;
    const id = "msg-" + Math.random().toString(36).substring(2, 9);
    const newMsg: Message = {
      id,
      chatId,
      senderId: currentUserId,
      receiverId,
      text,
      fileUrl,
      fileType,
      seen: false,
      createdAt: new Date().toISOString()
    };
    messages.push(newMsg);
    syncMessage(newMsg);

    // Update Chat timestamp
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      chat.lastMessageText = text || (fileType === "image" ? "Sent an image" : "Sent a file");
      chat.updatedAt = newMsg.createdAt;
      syncChat(chat);
    }

    res.json({ success: true, message: newMsg });
  });

  app.post("/api/chats/create", (req, res) => {
    const { recruiterId, developerId } = req.body;
    // Check if chat already exists
    let existing = chats.find(c => c.developerId === developerId && c.recruiterId === recruiterId);
    if (!existing) {
      existing = {
        id: "chat-" + Math.random().toString(36).substring(2, 9),
        developerId,
        recruiterId,
        lastMessageText: "Chat initiated",
        updatedAt: new Date().toISOString()
      };
      chats.push(existing);
      syncChat(existing);
    }
    res.json({ success: true, chat: existing });
  });

  // Toggle chat keep-open state
  app.post("/api/chats/:chatId/keep-open", (req, res) => {
    const { chatId } = req.params;
    const { keepOpen } = req.body;
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      chat.keepOpen = !!keepOpen;
      syncChat(chat);
      res.json({ success: true, chat });
    } else {
      res.status(404).json({ error: "Chat thread not found" });
    }
  });

  // Gemini suggested actions generator
  app.get("/api/chats/:chatId/suggested-actions", async (req, res) => {
    const { chatId } = req.params;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Determine current user context
    const isDeveloper = (currentUserId === chat.developerId);
    const roleLabel = isDeveloper ? "Developer" : "Recruiter";

    // Gather past messages
    const chatMessages = messages.filter(m => m.chatId === chatId).slice(-10); // last 10 messages
    const messageHistoryText = chatMessages.map(m => {
      const senderLabel = m.senderId === chat.developerId ? "Developer" : "Recruiter";
      return `[${senderLabel}]: ${m.text}`;
    }).join("\n");

    // Static fallback rules in case Gemini is not active or fails
    const getFallbackSuggestions = () => {
      let suggestionsList = [];
      const chatLower = messageHistoryText.toLowerCase();

      if (isDeveloper) {
        if (chatLower.includes("done") || chatLower.includes("deliver") || chatLower.includes("milestone") || chatLower.includes("complete")) {
          suggestionsList = [
            {
              title: "Request Escrow Release",
              description: "Ask the recruiter to release the current milestone payment if files match criteria.",
              textToFill: "I have uploaded and deployed the milestone files. Can you please review the delivery and unlock the escrow payout?",
              color: "green"
            },
            {
              title: "Deliver Working Draft",
              description: "Share the updated working link and files for visual audit.",
              textToFill: "Here is the active preview deployment URL for your review. Let me know if you would like me to adjust any components.",
              color: "blue"
            },
            {
              title: "Request Code Review",
              description: "Request technical code review and feedback on integration scripts.",
              textToFill: "I have committed the clean database router middleware to our repo. Feel free to check the API integrations of this sprint.",
              color: "indigo"
            }
          ];
        } else if (chatLower.includes("delay") || chatLower.includes("bug") || chatLower.includes("time") || chatLower.includes("extend")) {
          suggestionsList = [
            {
              title: "Propose Milestone Extension",
              description: "Kindly request more time to double-check Edge cases or security protocols.",
              textToFill: "Hi, while polishing the gateway callbacks, we spotted a minor validation latency. To prevent any live issues, can we please extend this milestone timeline by 3 days?",
              color: "yellow"
            },
            {
              title: "Propose Scope Sync Call",
              description: "Schedule a technical alignment sync to clear up ambiguous requirements.",
              textToFill: "Let's align over a quick audio sync to map out the payment callback flow and make sure it has exact matching params.",
              color: "blue"
            }
          ];
        } else {
          suggestionsList = [
            {
              title: "Share Status Update",
              description: "Give a quick overview of currently compiled tasks.",
              textToFill: "Everything is proceeding smoothly! The routing tables and schemas are fully written. Next up is wiring the webhook handlers.",
              color: "blue"
            },
            {
              title: "Request Clarification",
              description: "Ask for direct constraints on upcoming project delivery details.",
              textToFill: "Could you clarify the precise schema parameters expected by your analytical reporting engine for this next step?",
              color: "indigo"
            },
            {
              title: "Propose Walkthrough",
              description: "Invite the client to look at the functional user flow together.",
              textToFill: "The primary design is fully interactive now! Would you be available for a short demo session sometime tomorrow?",
              color: "green"
            }
          ];
        }
      } else {
        // Recruiter Actions
        if (chatLower.includes("done") || chatLower.includes("deliver") || chatLower.includes("complete") || chatLower.includes("escrow")) {
          suggestionsList = [
            {
              title: "Release Milestone Payout",
              description: "Approve the milestone contribution and release the safe escrow capital.",
              textToFill: "I have audited the functional staging dashboard and things look incredible. I have triggered the Escrow milestone payout button!",
              color: "green"
            },
            {
              title: "Request Revision Fixes",
              description: "Report missing specifications or visual errors and ask for a quick round of updates.",
              textToFill: "Thank you for the update. Could you please double-check the border styling of the bento grid cards? Let's make sure it matches our theme guidelines perfectly.",
              color: "yellow"
            },
            {
              title: "Propose Next Milestone Escrow",
              description: "Fund the next scheduled milestone in our pipeline.",
              textToFill: "Since Sprint 1 was a major success, I am about to pre-fund the Escrow escrow wallet for Sprint 2 immediately to keep up the momentum!",
              color: "blue"
            }
          ];
        } else if (chatLower.includes("delay") || chatLower.includes("bug") || chatLower.includes("time") || chatLower.includes("extend")) {
          suggestionsList = [
            {
              title: "Extend Project Deadline",
              description: "Grant additional days in the official workspace schedule to preserve product density.",
              textToFill: "No worries at all! We strictly value quality. I am extending the milestone deadline in the workspace by 3 more days to allow proper validation.",
              color: "green"
            },
            {
              title: "Suggest Technical Sync",
              description: "Organize a visual sync or chat session to help resolve blocking challenges together.",
              textToFill: "Let's schedule a 15-minute screen walk-through to look at the database router exceptions together and get it unblocked.",
              color: "blue"
            }
          ];
        } else {
          suggestionsList = [
            {
              title: "Request Progress Status",
              description: "Politely check if there are any updates or active blockages.",
              textToFill: "Hi! Just wanted to check in on how our milestone is shaping up. Do you have any fresh preview links I can present to our management team?",
              color: "blue"
            },
            {
              title: "Clarify Milestone Details",
              description: "Send formal mockups and design assets to assist the builder.",
              textToFill: "To help streamline development, let me send over our strict visual asset specifications with exact typography alignments.",
              color: "indigo"
            },
            {
              title: "Propose Code Walkthrough",
              description: "Request a quick live feedback session.",
              textToFill: "Would you like to hop on a short sync tomorrow afternoon to review the current milestone build progress together?",
              color: "green"
            }
          ];
        }
      }
      return suggestionsList;
    };

    if (!ai) {
      return res.json({ source: "fallback", suggestions: getFallbackSuggestions() });
    }

    try {
      const promptText = `
You are a smart project coordinator assistant in an elite freelance developer platform.
Your task is to analyze the conversation history between a Developer and Recruiter and suggest 2-3 custom, contextual "Suggested Action" buttons that the logged-in user (${roleLabel}) can click to send as a chat message.

Logged-In User Role: ${roleLabel}
Opposite User: ${isDeveloper ? "Recruiter" : "Developer"}

Conversation History (Last 10 messages):
${messageHistoryText || "(No messages yet in this discussion thread)"}

Instructions:
- Tailor the suggestions specifically to what they discussed.
- Every suggestion has a "title" (the button text, e.g. "Release Escrow Payout", max 3-4 words), a "description" (a one-sentence explanation of why it is suggested), and "textToFill" (the actual message template text that will pre-fill the chat box when they click it).
- Keep descriptions concise and supportive.
- Choose a visual color indicator: 'green', 'blue', 'indigo', or 'yellow' (no other strings).
`;

      const callParams = {
        contents: promptText,
        config: {
          systemInstruction: "You are an elite, helpful sandbox assistant that coordinates smart freelance developer contract workflows.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    textToFill: { type: Type.STRING },
                    color: { type: Type.STRING }
                  },
                  required: ["title", "description", "textToFill", "color"]
                }
              }
            },
            required: ["suggestions"]
          },
        },
      };

      let response;
      let usedModel = "gemini-3.5-flash";

       try {
        console.log("Fetching contract suggestions with primary engine model...");
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          ...callParams
        });
        usedModel = "gemini-3.5-flash";
      } catch (firstErr: any) {
        console.log("[Prompt Engine] Routing request to alternate model due to high demand configuration.");
        // Wait 300ms
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            ...callParams
          });
          usedModel = "gemini-3.1-flash-lite";
        } catch (secondErr: any) {
          console.log("[Prompt Engine] Fine-tuning secondary routing...");
          await new Promise(resolve => setTimeout(resolve, 150));
          response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            ...callParams
          });
          usedModel = "gemini-flash-latest";
        }
      }

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return res.json({ source: "gemini", model: usedModel, suggestions: parsed.suggestions });
      } else {
        throw new Error("Invalid suggestions structure");
      }
    } catch (err: any) {
      console.log("[Prompt Engine] Activating secure local fallback suggestions engine.");
      return res.json({ source: "fallback_on_error", suggestions: getFallbackSuggestions() });
    }
  });

  // Disputes & escrow
  app.get("/api/disputes", (req, res) => {
    res.json(disputes);
  });

  app.post("/api/disputes", (req, res) => {
    const { projectId, milestoneTitle, opponentId, reason, details, escrowAmount, proposedResolution } = req.body;
    const id = "disp-" + Math.random().toString(36).substring(2, 9);
    const newDispute: Dispute = {
      id,
      projectId,
      milestoneTitle,
      claimantId: currentUserId,
      opponentId,
      reason,
      details,
      escrowAmount: Number(escrowAmount) || 5000,
      proposedResolution,
      status: DisputeStatus.UNDER_REVIEW,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    disputes.push(newDispute);
    syncDispute(newDispute);
    addAdminNotification("New Dispute Opened", `A dispute has been opened for "${milestoneTitle}".`);
    res.json({ success: true, dispute: newDispute });
  });

  app.post("/api/disputes/verdict", (req, res) => {
    const { disputeId, verdictRationale, splitRatio, status } = req.body;
    const disp = disputes.find(d => d.id === disputeId);
    if (disp) {
      disp.status = status || DisputeStatus.RESOLVED;
      disp.verdictRationale = verdictRationale;
      if (splitRatio) disp.splitRatio = splitRatio;
      disp.updatedAt = new Date().toISOString();
      syncDispute(disp);
      res.json({ success: true, dispute: disp });
    } else {
      res.status(404).json({ error: "Dispute not found" });
    }
  });

  // Notifications
  app.get("/api/notifications", (req, res) => {
    const userNotifications = notifications.filter(n => n.userId === currentUserId || (currentUserId === "admin" && n.userId === "admin"));
    res.json(userNotifications);
  });

  app.post("/api/notifications/read", (req, res) => {
    const { notificationId } = req.body;
    if (notificationId === "all") {
      notifications.forEach(n => {
        if (n.userId === currentUserId || (currentUserId === "admin" && n.userId === "admin")) {
          n.isRead = true;
          syncNotification(n);
        }
      });
      return res.json({ success: true });
    }
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      syncNotification(notif);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  });

  // Reviews APIs
  app.get("/api/reviews", (req, res) => {
    res.json(reviews);
  });

  app.post("/api/reviews", (req, res) => {
    const { projectId, reviewerId, reviewerName, revieweeId, rating, comment } = req.body;
    if (!reviewerId || !revieweeId || !rating || !comment) {
      return res.status(400).json({ error: "Missing required review parameters." });
    }
    const newReview: Review = {
      id: "rev-" + Math.random().toString(36).substring(2, 9),
      projectId: projectId || "",
      reviewerId,
      reviewerName,
      revieweeId,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };
    reviews.push(newReview);
    res.json(newReview);
  });

  // Supabase connection and status query endpoint (for administrative views or diagnostics panel)
  app.get("/api/supabase/status", (req, res) => {
    res.json({
      configured: isSupabaseConfigured(),
      endpoint: process.env.SUPABASE_URL || "NOT SET",
      setupSql: SUPABASE_SETUP_SQL,
      tablesHydrated: {
        users: users.length,
        projects: projects.length,
        applications: applications.length,
        stages: projectStages.length,
        developerProfiles: Object.keys(developerProfiles).length,
        recruiterProfiles: Object.keys(recruiterProfiles).length,
        chats: chats.length,
        messages: messages.length,
        disputes: disputes.length,
        invites: invites.length,
        contactAccessRequests: contactAccessRequests.length,
        ndas: ndas.length,
        notifications: notifications.length
      }
    });
  });

  // ----------------------------------------------------
  // GEMINI AI ENDPOINT
  // ----------------------------------------------------
  app.post("/api/ai-analysis", async (req, res) => {
    const { type, payload } = req.body;

    if (!ai) {
      // Fallback response structures in case API key is missing or unconfigured
      console.warn("Gemini API key is unconfigured. Returning premium fallback mock analytics.");
      
      if (type === "project-analysis") {
        return res.json({
          suggestedTech: ["React", "Node.js", "Docker", "AWS", "PostgreSQL", "Redis"],
          recommendedRoles: ["Senior Backend Engineer", "DevOps Specialist"],
          confidence: 94,
          estimatedDays: 45
        });
      } else if (type === "profile-optimization") {
        return res.json({
          optimizedHeadline: "Principal Backend Architect | High-Scale Go & Next.js Microservices",
          optimizedBio: "Elite Full-Stack System Architect with over 8 years experience building highly concurrent transactional infrastructures. Specializes in building sub-100ms AWS microservices with rigorous test compliance, handling peak loads of up to 12,000 requests/minute.",
          suggestedSkillsToLearn: ["Go (Golang)", "Kubernetes (K8s)", "gRPC / Protobuf"]
        });
      } else if (type === "proposal-generation") {
        return res.json({
          title: "Proposal for Next-Gen E-commerce Backend Architecture",
          pitch: `Hi, I saw your post for the Next-Gen E-commerce Backend Architecture. 

With over 8 years of specialized software construction experience, I have successfully refactored 4 legacy monoliths into highly reliable, fault-tolerant microservices. I am extremely familiar with your requested stack, specifically configuring Redis pub/sub channels for sub-millisecond stock synchronization and designing isolated Docker networks on AWS. 

I proposed a structured, milestone-oriented execution approach. Let me know if you would like to hop on a quick video session to align the initial API blueprint specifications.`
        });
      }
      return res.status(400).json({ error: "Unsupported analysis type" });
    }

    try {
      if (type === "project-analysis") {
        const prompt = `Analyze the following project posting in the context of the technical marketplace "DeveloperConnect".
Title: ${payload.title}
Description: ${payload.description}

Provide a JSON object containing:
1. suggestedTech: An array of strings representing the suggested technology stack.
2. recommendedRoles: An array of strings of recommended developer roles.
3. confidence: A confidence percentage score (integer between 1 and 100) of matching standard profiles.
4. estimatedDays: Estimated project duration/timeline in integer days.

Strictly return the JSON matching this exact structure without any formatting wrapping or markdown blocks.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggestedTech: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendedRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
                confidence: { type: Type.INTEGER },
                estimatedDays: { type: Type.INTEGER }
              },
              required: ["suggestedTech", "recommendedRoles", "confidence", "estimatedDays"]
            }
          }
        });

        const dataStr = response.text || "{}";
        return res.json(JSON.parse(dataStr));

      } else if (type === "profile-optimization") {
        const prompt = `Optimize the following developer profile to match premium recruiters on "DeveloperConnect":
Headline: ${payload.headline}
Bio: ${payload.bio}
Skills: ${(payload.skills || []).join(", ")}
Experience: ${payload.experienceYears} years

Provide a JSON object with:
1. optimizedHeadline: A highly polished and punchy title.
2. optimizedBio: An advanced, professional technical summary.
3. suggestedSkillsToLearn: An array of 3 trending skills to learn or add.

Strictly return the JSON matching this exact structure without any formatting wrapping or markdown blocks.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                optimizedHeadline: { type: Type.STRING },
                optimizedBio: { type: Type.STRING },
                suggestedSkillsToLearn: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["optimizedHeadline", "optimizedBio", "suggestedSkillsToLearn"]
            }
          }
        });

        const dataStr = response.text || "{}";
        return res.json(JSON.parse(dataStr));

      } else if (type === "proposal-generation") {
        const prompt = `Generate a compelling, personalized cover letter / proposal brief:
Project: ${payload.projectTitle} - ${payload.projectDescription}
Developer Skills: ${(payload.devSkills || []).join(", ")}

Provide a JSON object with:
1. title: A catchy subject.
2. pitch: A professional proposal letter written by the developer, matching their expertise to the project's exact needs.

Strictly return the JSON matching this exact structure without any formatting wrapping or markdown blocks.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                pitch: { type: Type.STRING }
              },
              required: ["title", "pitch"]
            }
          }
        });

        const dataStr = response.text || "{}";
        return res.json(JSON.parse(dataStr));
      }

      res.status(400).json({ error: "Unsupported analysis type" });
    } catch (e: any) {
      console.error("Gemini API call failed, using high-fidelity fallback.", e);
      // Failover fallback in case of rate limits or service constraints
      if (type === "project-analysis") {
        return res.json({
          suggestedTech: ["React", "Node.js", "Jest", "Microservices"],
          recommendedRoles: ["Backend Engineer"],
          confidence: 88,
          estimatedDays: 30
        });
      }
      res.status(500).json({ error: e.message || "Failed AI response" });
    }
  });

  // ----------------------------------------------------
  // Vite Middleware & Static Serves
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
