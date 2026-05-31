import { UserRole } from "./types.js";

// Helper function to safely read from local storage with fallback
const getStorageItem = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper function to write to local storage
const setStorageItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Local storage error", e);
  }
};

// ----------------------------------------------------
// DEFAULT MONGO-ESQUE IN-MEMORY COLLECTIONS
// ----------------------------------------------------
const defaultUsers = [
  { id: "dev-aryan", email: "aryan.sharma@gmail.com", role: UserRole.DEVELOPER, isVerified: true, isSuspended: false, createdAt: "2026-01-15T10:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true } },
  { id: "dev-priya", email: "priya.iyer@gmail.com", role: UserRole.DEVELOPER, isVerified: true, isSuspended: false, createdAt: "2026-02-10T11:30:00Z", notificationPreferences: { emailNewInvites: false, emailApplicationUpdates: true, emailChatMessages: true } },
  { id: "dev-vikram", email: "vikram.singh@gmail.com", role: UserRole.DEVELOPER, isVerified: false, isSuspended: false, createdAt: "2026-05-20T08:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: false, emailChatMessages: true } },
  { id: "rec-nexa", email: "hiring@nexasystems.com", role: UserRole.RECRUITER, isVerified: true, isSuspended: false, createdAt: "2026-03-01T09:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true } },
  { id: "rec-aura", email: "talent@aurafinance.io", role: UserRole.RECRUITER, isVerified: true, isSuspended: false, createdAt: "2026-04-12T15:20:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true } },
  { id: "admin", email: "info.bouuz@gmail.com", role: UserRole.ADMIN, isVerified: true, isSuspended: false, createdAt: "2025-01-01T00:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true, emailGlobalAlerts: true } }
];

const defaultDeveloperProfiles = {
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

const defaultRecruiterProfiles = {
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

const defaultProjects = [
  {
    id: "proj-ecommerce",
    recruiterId: "rec-nexa",
    title: "Next-Gen E-commerce Backend Architecture",
    description: "Seeking a senior backend architect to design and implement a next-generation e-commerce backbone capable of handling high-concurrency peak events (10k+ orders/min). The system must be event-driven using Redis, PostgreSQL and deploy to Kubernetes.",
    techStack: ["Node.js", "TypeScript", "Redis", "Docker", "AWS", "PostgreSQL"],
    budget: 1200000,
    hiringType: "Fixed Price",
    workMode: "Remote",
    duration: "3 months",
    status: "OPEN",
    createdAt: "2026-05-26T18:00:00Z"
  },
  {
    id: "proj-llm",
    recruiterId: "rec-aura",
    title: "LLM Integration for Real-time Financial Analysis",
    description: "Build an optimized data ingestion pipeline parsing market sentiment trends via Llama-3 or Gemini. Integrate results cleanly into an existing React dashboard. Priority to local developers in Mumbai/Bengaluru.",
    techStack: ["React", "Python", "LangChain", "FastAPI"],
    budget: 85000,
    hiringType: "Hourly Rate",
    workMode: "Remote",
    duration: "1 month",
    status: "OPEN",
    createdAt: "2026-05-27T12:00:00Z"
  },
  {
    id: "proj-bento",
    recruiterId: "rec-aura",
    title: "Bento-Style Dashboard Design & Frontend",
    description: "Create a modern, high-density bento grid portfolio dashboard with framer-motion kinetics using React and Tailwind CSS v4. Must have strict visual hierarchy and beautiful spacing.",
    techStack: ["React", "Tailwind CSS", "Framer Motion"],
    budget: 45000,
    hiringType: "Fixed Price",
    workMode: "On-site",
    duration: "2 weeks",
    status: "OPEN",
    createdAt: "2026-05-28T09:00:00Z"
  }
];

const defaultApplications = [
  {
    id: "app-1",
    projectId: "proj-ecommerce",
    developerId: "dev-aryan",
    coverLetter: "I have extensive experience refactoring high-throughput Node.js microservices and building Redis locks for checkout consistency.",
    proposedRate: 65000,
    availability: "Full-time",
    timelineEstimate: "3 months",
    status: "SHORTLISTED",
    createdAt: "2026-05-27T10:00:00Z"
  }
];

const defaultInvites = [
  {
    id: "inv-1",
    projectId: "proj-bento",
    recruiterId: "rec-aura",
    developerId: "dev-aryan",
    message: "We loved your profile's focus on elegant design pairings and typography! Let's build our dashboard together.",
    status: "PENDING",
    createdAt: "2026-05-28T10:00:00Z"
  }
];

const defaultContactRequests = [
  {
    id: "con-1",
    recruiterId: "rec-nexa",
    developerId: "dev-aryan",
    status: "APPROVED",
    createdAt: "2026-05-28T11:00:00Z"
  }
];

const defaultChats = [
  {
    id: "chat-aryan-nexa",
    projectId: "proj-ecommerce",
    developerId: "dev-aryan",
    recruiterId: "rec-nexa",
    lastMessageText: "Looking forward to starting our secure contract session Aryan!",
    lastMessageAt: "2026-05-29T14:30:00Z",
    isClosed: false,
    closedReason: null
  }
];

const defaultMessages = [
  {
    id: "msg-1",
    chatId: "chat-aryan-nexa",
    senderId: "rec-nexa",
    receiverId: "dev-aryan",
    text: "Hello Aryan! I saw your stunning performance metrics on DeveloperConnect and wanted to kickstart our backend refactor milestone discussion.",
    createdAt: "2026-05-29T14:15:00Z"
  },
  {
    id: "msg-2",
    chatId: "chat-aryan-nexa",
    senderId: "dev-aryan",
    receiverId: "rec-nexa",
    text: "Thank you Sarah! I've already drafted the technical design spec for the transactional redis locking system. I can start deployment next Monday.",
    createdAt: "2026-05-29T14:20:00Z"
  },
  {
    id: "msg-3",
    chatId: "chat-aryan-nexa",
    senderId: "rec-nexa",
    receiverId: "dev-aryan",
    text: "Looking forward to starting our secure contract session Aryan!",
    createdAt: "2026-05-29T14:30:00Z"
  }
];

const defaultDisputes = [
  {
    id: "disp-1",
    projectId: "proj-ecommerce",
    milestoneTitle: "Milestone 1: Redis Integration",
    raisedBy: "rec-nexa",
    opponentId: "dev-aryan",
    reason: "Delayed Milestone",
    details: "The locking framework requires multi-region coverage which wasn't fully checked, resulting in a single point of failure in APAC deployments. Seeking resolution.",
    escrowAmount: 45000,
    proposedResolution: "Split escrow 70/30 or extend delivery timeline by 4 business days.",
    status: "PENDING",
    mediatorDecision: null,
    createdAt: "2026-05-30T10:00:00Z"
  }
];

const defaultProjectStages = [
  {
    id: "stage-1",
    projectId: "proj-ecommerce",
    title: "Milestone 1: In-memory Caching Setup",
    description: "Design and implement full high throughput caching mechanisms.",
    cost: 45000,
    dueDate: "2026-06-15",
    createdBy: "RECRUITER",
    isApproved: true,
    isCompleted: false,
    createdAt: "2026-05-29T11:00:00Z"
  }
];

const defaultNdas = [
  {
    id: "nda-1",
    projectId: "proj-ecommerce",
    developerId: "dev-aryan",
    terms: "All e-commerce scaling formulas, cluster configs, and transaction locking design strategies are strictly trade secret covenants of Nexa Systems.",
    developerSignature: "Aryan Sharma",
    developerSignedAt: "2026-05-28T09:30:00Z",
    recruiterSignature: "Sarah Lans",
    recruiterSignedAt: "2026-05-28T10:00:00Z",
    createdAt: "2026-05-28T09:00:00Z"
  }
];

const defaultReviews = [
  {
    id: "rev-1",
    projectId: "proj-ecommerce",
    reviewerId: "rec-nexa",
    revieweeId: "dev-aryan",
    rating: 5,
    comment: "Excellent technical design and swift Redis logic. Outstaffing under BANTConfirm guidelines of absolute legal compliance is pristine.",
    createdAt: "2026-05-30T18:00:00Z"
  }
];

const defaultNotifications = [
  {
    id: "not-1",
    userId: "dev-aryan",
    title: "New Recruiter Lead",
    message: "Sarah Lans from Nexa Systems has accessed your profile analytics and generated an NDA blueprint.",
    isRead: false,
    createdAt: "2026-05-30T09:00:00Z"
  }
];

// Setup local schema
export const initializeStorageDatabase = () => {
  if (!localStorage.getItem("dc_initialized")) {
    setStorageItem("dc_users", defaultUsers);
    setStorageItem("dc_developerProfiles", defaultDeveloperProfiles);
    setStorageItem("dc_recruiterProfiles", defaultRecruiterProfiles);
    setStorageItem("dc_projects", defaultProjects);
    setStorageItem("dc_applications", defaultApplications);
    setStorageItem("dc_invites", defaultInvites);
    setStorageItem("dc_contacts", defaultContactRequests);
    setStorageItem("dc_chats", defaultChats);
    setStorageItem("dc_messages", defaultMessages);
    setStorageItem("dc_disputes", defaultDisputes);
    setStorageItem("dc_projectStages", defaultProjectStages);
    setStorageItem("dc_ndas", defaultNdas);
    setStorageItem("dc_reviews", defaultReviews);
    setStorageItem("dc_notifications", defaultNotifications);
    setStorageItem("dc_currentUserId", "admin");
    localStorage.setItem("dc_initialized", "true");
  }
};

// ----------------------------------------------------
// UNIVERSAL API INTERCEPT ROUTER
// ----------------------------------------------------
const handleMockRequest = async (url: string, init?: RequestInit): Promise<Response> => {
  initializeStorageDatabase();

  const method = (init?.method || "GET").toUpperCase();
  const parsedBody = init?.body && typeof init.body === "string" ? JSON.parse(init.body) : {};

  let users = getStorageItem("dc_users", defaultUsers);
  let devProfiles: Record<string, any> = getStorageItem("dc_developerProfiles", defaultDeveloperProfiles);
  let recProfiles: Record<string, any> = getStorageItem("dc_recruiterProfiles", defaultRecruiterProfiles);
  let projects = getStorageItem("dc_projects", defaultProjects);
  let applications = getStorageItem("dc_applications", defaultApplications);
  let invites = getStorageItem("dc_invites", defaultInvites);
  let contacts = getStorageItem("dc_contacts", defaultContactRequests);
  let chats = getStorageItem("dc_chats", defaultChats);
  let messages = getStorageItem("dc_messages", defaultMessages);
  let disputes = getStorageItem("dc_disputes", defaultDisputes);
  let projectStages = getStorageItem("dc_projectStages", defaultProjectStages);
  let ndas = getStorageItem("dc_ndas", defaultNdas);
  let reviews = getStorageItem("dc_reviews", defaultReviews);
  let notifications = getStorageItem("dc_notifications", defaultNotifications);
  let currentUserId = getStorageItem("dc_currentUserId", "admin");

  const buildJSONResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  };

  const getSessionData = () => {
    const user = users.find((u: any) => u.id === currentUserId) || null;
    const devProfile = user && user.role === UserRole.DEVELOPER ? (devProfiles[user.id] || null) : null;
    const recProfile = user && user.role === UserRole.RECRUITER ? (recProfiles[user.id] || null) : null;
    return { user, devProfile, recProfile };
  };

  // Switch Route Selectors
  if (url === "/api/session" && method === "GET") {
    return buildJSONResponse(getSessionData());
  }

  if (url === "/api/session/login" && method === "POST") {
    const { email } = parsedBody;
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setStorageItem("dc_currentUserId", user.id);
      return buildJSONResponse({ success: true, user });
    }
    return buildJSONResponse({ error: "User not registered." }, 404);
  }

  if (url === "/api/session/logout" && method === "POST") {
    setStorageItem("dc_currentUserId", "");
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/session/signup" && method === "POST") {
    const { email, role, fullName, companyName, headline, industry, bio, aboutCompany } = parsedBody;
    const existing = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return buildJSONResponse({ error: "Email already registered." }, 400);
    }

    const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
      id: newId,
      email: email.toLowerCase(),
      role,
      isVerified: true,
      isSuspended: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    setStorageItem("dc_users", users);

    if (role === UserRole.DEVELOPER) {
      devProfiles[newId] = {
        userId: newId,
        fullName: fullName || "Senior Engineer",
        headline: headline || "Full-Stack Engineer",
        bio: bio || "Experienced developer.",
        skills: ["React", "TypeScript", "Node.js"],
        techStack: ["React", "TypeScript", "Node.js"],
        experienceYears: 5,
        availability: "Both",
        rates: { hourly: 800, weekly: 30000, monthly: 120000, projectMin: 15000 },
        location: "Bengaluru, India",
        socials: {},
        isContactVisible: true,
        phoneNumber: "+91 99999 88888",
        email: email.toLowerCase(),
        analytics: { profileViews: 1, invitesCount: 0, applicationsSent: 0, acceptedProjects: 0 }
      };
      setStorageItem("dc_developerProfiles", devProfiles);
    } else if (role === UserRole.RECRUITER) {
      recProfiles[newId] = {
        userId: newId,
        companyName: companyName || "New Enterprise",
        website: "",
        industry: industry || "Technology",
        companySize: "10-50",
        aboutCompany: aboutCompany || "Next gen systems.",
        fullName: fullName || "Hiring Lead",
        avatarUrl: ""
      };
      setStorageItem("dc_recruiterProfiles", recProfiles);
    }

    setStorageItem("dc_currentUserId", newId);
    return buildJSONResponse({ success: true, user: newUser });
  }

  if (url === "/api/session/switch" && method === "POST") {
    const { userId } = parsedBody;
    if (users.find((u: any) => u.id === userId)) {
      setStorageItem("dc_currentUserId", userId);
      return buildJSONResponse({ success: true });
    }
    return buildJSONResponse({ error: "User not found." }, 404);
  }

  if (url === "/api/users" && method === "GET") {
    // Return all users populated with profile details
    const populated = users.map((u: any) => ({
      ...u,
      devProfile: devProfiles[u.id] || null,
      recProfile: recProfiles[u.id] || null
    }));
    return buildJSONResponse(populated);
  }

  if (url === "/api/users/preferences" && method === "POST") {
    const userIndex = users.findIndex((u: any) => u.id === currentUserId);
    if (userIndex !== -1) {
      users[userIndex].notificationPreferences = {
        ...users[userIndex].notificationPreferences,
        ...parsedBody
      };
      setStorageItem("dc_users", users);
    }
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/projects" && method === "GET") {
    return buildJSONResponse(projects);
  }

  if (url === "/api/projects" && method === "POST") {
    const newProj = {
      ...parsedBody,
      id: `proj-${Math.random().toString(36).substr(2, 9)}`,
      recruiterId: currentUserId,
      status: "OPEN",
      createdAt: new Date().toISOString()
    };
    projects.push(newProj);
    setStorageItem("dc_projects", projects);
    return buildJSONResponse(newProj);
  }

  if (url === "/api/projects/status" && method === "POST") {
    const { projectId, status } = parsedBody;
    const projIndex = projects.findIndex((p: any) => p.id === projectId);
    if (projIndex !== -1) {
      projects[projIndex].status = status;
      setStorageItem("dc_projects", projects);
    }
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/project-stages" && method === "GET") {
    return buildJSONResponse(projectStages);
  }

  if (url === "/api/project-stages" && method === "POST") {
    const newStage = {
      ...parsedBody,
      id: `stage-${Math.random().toString(36).substr(2, 9)}`,
      isApproved: parsedBody.createdBy === "RECRUITER",
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    projectStages.push(newStage);
    setStorageItem("dc_projectStages", projectStages);
    return buildJSONResponse(newStage);
  }

  if (url === "/api/project-stages/approve" && method === "POST") {
    const { stageId } = parsedBody;
    const index = projectStages.findIndex((s: any) => s.id === stageId);
    if (index !== -1) {
      projectStages[index].isApproved = true;
      setStorageItem("dc_projectStages", projectStages);
    }
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/project-stages/complete" && method === "POST") {
    const { stageId } = parsedBody;
    const index = projectStages.findIndex((s: any) => s.id === stageId);
    if (index !== -1) {
      projectStages[index].isCompleted = true;
      setStorageItem("dc_projectStages", projectStages);
    }
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/applications" && method === "GET") {
    return buildJSONResponse(applications);
  }

  if (url === "/api/applications" && method === "POST") {
    const newApp = {
      ...parsedBody,
      id: `app-${Math.random().toString(36).substr(2, 9)}`,
      developerId: currentUserId,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    applications.push(newApp);
    setStorageItem("dc_applications", applications);
    return buildJSONResponse(newApp);
  }

  if (url === "/api/applications/status" && method === "POST") {
    const { applicationId, status } = parsedBody;
    const index = applications.findIndex((a: any) => a.id === applicationId);
    if (index !== -1) {
      applications[index].status = status;
      setStorageItem("dc_applications", applications);
    }
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/profile/developer" && method === "POST") {
    devProfiles[currentUserId] = {
      ...devProfiles[currentUserId],
      ...parsedBody,
      userId: currentUserId
    };
    setStorageItem("dc_developerProfiles", devProfiles);
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/profile/recruiter" && method === "POST") {
    recProfiles[currentUserId] = {
      ...recProfiles[currentUserId],
      ...parsedBody,
      userId: currentUserId
    };
    setStorageItem("dc_recruiterProfiles", recProfiles);
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/invites" && method === "GET") {
    return buildJSONResponse(invites);
  }

  if (url === "/api/invites" && method === "POST") {
    const newInv = {
      ...parsedBody,
      id: `inv-${Math.random().toString(36).substr(2, 9)}`,
      recruiterId: currentUserId,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    invites.push(newInv);
    setStorageItem("dc_invites", invites);
    return buildJSONResponse(newInv);
  }

  if (url === "/api/invites/respond" && method === "POST") {
    const { inviteId, status } = parsedBody;
    const index = invites.findIndex((i: any) => i.id === inviteId);
    if (index !== -1) {
      invites[index].status = status;
      setStorageItem("dc_invites", invites);

      // Create a chat if accepted!
      if (status === "ACCEPTED") {
        const inv = invites[index];
        const existingChat = chats.find(
          (c: any) => c.developerId === inv.developerId && c.recruiterId === inv.recruiterId
        );
        if (!existingChat) {
          chats.push({
            id: `chat-${inv.developerId}-${inv.recruiterId}`,
            projectId: inv.projectId,
            developerId: inv.developerId,
            recruiterId: inv.recruiterId,
            lastMessageText: "Invite Accepted - Chat Started",
            lastMessageAt: new Date().toISOString(),
            isClosed: false,
            closedReason: null
          });
          setStorageItem("dc_chats", chats);
        }
      }
    }
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/contacts" && method === "GET") {
    return buildJSONResponse(contacts);
  }

  if (url === "/api/contacts/request" && method === "POST") {
    const newRequest = {
      ...parsedBody,
      id: `con-${Math.random().toString(36).substr(2, 9)}`,
      recruiterId: currentUserId,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    contacts.push(newRequest);
    setStorageItem("dc_contacts", contacts);
    return buildJSONResponse(newRequest);
  }

  if (url === "/api/contacts/respond" && method === "POST") {
    const { requestId, status } = parsedBody;
    const index = contacts.findIndex((c: any) => c.id === requestId);
    if (index !== -1) {
      contacts[index].status = status;
      setStorageItem("dc_contacts", contacts);
    }
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/chats" && method === "GET") {
    return buildJSONResponse(chats);
  }

  if (url.startsWith("/api/messages/")) {
    const chatId = url.split("/").pop();
    const chatMsgs = messages.filter((m: any) => m.chatId === chatId);
    return buildJSONResponse(chatMsgs);
  }

  if (url === "/api/messages" && method === "POST") {
    const newMsg = {
      ...parsedBody,
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUserId,
      createdAt: new Date().toISOString()
    };
    messages.push(newMsg);
    setStorageItem("dc_messages", messages);

    // Update last message in chat
    const chatIndex = chats.findIndex((c: any) => c.id === parsedBody.chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].lastMessageText = parsedBody.text || "File attachment";
      chats[chatIndex].lastMessageAt = new Date().toISOString();
      setStorageItem("dc_chats", chats);
    }
    return buildJSONResponse(newMsg);
  }

  if (url === "/api/chats/create" && method === "POST") {
    const { projectId, developerId, recruiterId } = parsedBody;
    const existing = chats.find(
      (c: any) => c.developerId === developerId && c.recruiterId === recruiterId
    );
    if (existing) {
      return buildJSONResponse({ chat: existing });
    }

    const newChat = {
      id: `chat-${developerId}-${recruiterId}`,
      projectId,
      developerId,
      recruiterId,
      lastMessageText: "Conversation started securely.",
      lastMessageAt: new Date().toISOString(),
      isClosed: false,
      closedReason: null
    };
    chats.push(newChat);
    setStorageItem("dc_chats", chats);
    return buildJSONResponse({ chat: newChat });
  }

  if (url === "/api/projects/quick-hire" && method === "POST") {
    const { projectId, developerId, proposedRate, timelineEstimate } = parsedBody;
    
    // Create direct application accepted
    const newApp = {
      id: `app-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      developerId,
      coverLetter: "Direct quick hire invitation.",
      proposedRate,
      availability: "Full-time",
      timelineEstimate,
      status: "ACCEPTED",
      createdAt: new Date().toISOString()
    };
    applications.push(newApp);
    setStorageItem("dc_applications", applications);

    // Lock project status
    const projIndex = projects.findIndex((p: any) => p.id === projectId);
    if (projIndex !== -1) {
      projects[projIndex].status = "CLOSED";
      setStorageItem("dc_projects", projects);
    }

    // Create chat
    const existingChat = chats.find(
      (c: any) => c.developerId === developerId && c.recruiterId === currentUserId
    );
    let targetChat = existingChat;
    if (!existingChat) {
      targetChat = {
        id: `chat-${developerId}-${currentUserId}`,
        projectId,
        developerId,
        recruiterId: currentUserId,
        lastMessageText: "Direct quick hire escrow session initiated.",
        lastMessageAt: new Date().toISOString(),
        isClosed: false,
        closedReason: null
      };
      chats.push(targetChat);
      setStorageItem("dc_chats", chats);
    }

    return buildJSONResponse({ success: true, chat: targetChat });
  }

  if (url === "/api/ndas" && method === "GET") {
    return buildJSONResponse(ndas);
  }

  if (url === "/api/ndas" && method === "POST") {
    const newNda = {
      ...parsedBody,
      id: `nda-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    ndas.push(newNda);
    setStorageItem("dc_ndas", ndas);
    return buildJSONResponse(newNda);
  }

  if (url === "/api/ndas/sign" && method === "POST") {
    const { ndaId, role, signature } = parsedBody;
    const index = ndas.findIndex((n: any) => n.id === ndaId);
    if (index !== -1) {
      if (role === "RECRUITER") {
        ndas[index].recruiterSignature = signature;
        ndas[index].recruiterSignedAt = new Date().toISOString();
      } else {
        ndas[index].developerSignature = signature;
        ndas[index].developerSignedAt = new Date().toISOString();
      }
      setStorageItem("dc_ndas", ndas);
    }
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/disputes" && method === "GET") {
    return buildJSONResponse(disputes);
  }

  if (url === "/api/disputes" && method === "POST") {
    const newDisp = {
      ...parsedBody,
      id: `disp-${Math.random().toString(36).substr(2, 9)}`,
      raisedBy: currentUserId,
      status: "PENDING",
      mediatorDecision: null,
      createdAt: new Date().toISOString()
    };
    disputes.push(newDisp);
    setStorageItem("dc_disputes", disputes);
    return buildJSONResponse(newDisp);
  }

  if (url === "/api/notifications" && method === "GET") {
    return buildJSONResponse(notifications.filter((n: any) => n.userId === currentUserId));
  }

  if (url === "/api/notifications/read" && method === "POST") {
    notifications.forEach((n: any) => {
      if (n.userId === currentUserId) n.isRead = true;
    });
    setStorageItem("dc_notifications", notifications);
    return buildJSONResponse({ success: true });
  }

  if (url === "/api/reviews" && method === "GET") {
    return buildJSONResponse(reviews);
  }

  if (url === "/api/reviews" && method === "POST") {
    const newRev = {
      ...parsedBody,
      id: `rev-${Math.random().toString(36).substr(2, 9)}`,
      reviewerId: currentUserId,
      createdAt: new Date().toISOString()
    };
    reviews.push(newRev);
    setStorageItem("dc_reviews", reviews);
    return buildJSONResponse(newRev);
  }

  if (url === "/api/supabase/status" && method === "GET") {
    return buildJSONResponse({
      configured: false,
      latency: 0,
      activeUsers: users.length,
      activeProjects: projects.length,
      escrowSum: projectStages.reduce((sum: number, s: any) => sum + (s.cost || 0), 0)
    });
  }

  if (url === "/api/ai-analysis" && method === "POST") {
    return buildJSONResponse({
      analysis: JSON.stringify({
        summary: "This candidate exhibits solid capability in backend transactional workflows with robust scaling metrics.",
        experienceRating: "A",
        vettedScore: "94/100",
        verdict: "Fully recommended under BANTConfirm active mediation legal escrows."
      })
    });
  }

  // Fallback default
  return buildJSONResponse([]);
};

// ----------------------------------------------------
// FETCH DECORATOR INSTALLER
// ----------------------------------------------------
export const setupClientBackEnd = () => {
  initializeStorageDatabase();

  const originalFetch = window.fetch;

  const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as any).url || "";

    if (url.startsWith("/api/")) {
      // Dynamic probe activation
      if ((window as any)._isBackendChecked === undefined) {
        try {
          const testRes = await originalFetch("/api/session");
          const ct = testRes.headers.get("content-type");
          if (testRes.ok && ct && ct.includes("application/json")) {
            (window as any)._useClientMock = false;
          } else {
            (window as any)._useClientMock = true;
          }
        } catch (e) {
          (window as any)._useClientMock = true;
        }
        (window as any)._isBackendChecked = true;
      }

      if ((window as any)._useClientMock) {
        return handleMockRequest(url, init);
      }
    }

    return originalFetch.apply(window, [input, init]);
  };

  try {
    Object.defineProperty(window, "fetch", {
      value: customFetch,
      configurable: true,
      writable: true,
      enumerable: true
    });
  } catch (error) {
    console.warn("Could not redefine window.fetch with Object.defineProperty, trying direct reference update", error);
    try {
      (window as any).fetch = customFetch;
    } catch (err2) {
      console.error("Unable to patch window.fetch automatically", err2);
    }
  }
};
