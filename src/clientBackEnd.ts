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
  { id: "admin", email: "info.bouuz@gmail.com", role: UserRole.ADMIN, isVerified: true, isSuspended: false, createdAt: "2025-01-01T00:00:00Z", notificationPreferences: { emailNewInvites: true, emailApplicationUpdates: true, emailChatMessages: true, emailGlobalAlerts: true } }
];

const defaultDeveloperProfiles = {};

const defaultRecruiterProfiles = {};

const defaultProjects: any[] = [];

const defaultApplications: any[] = [];

const defaultInvites: any[] = [];

const defaultContactRequests: any[] = [];

const defaultChats: any[] = [];

const defaultMessages: any[] = [];

const defaultDisputes: any[] = [];

const defaultProjectStages: any[] = [];

const defaultNdas: any[] = [];

const defaultReviews: any[] = [];

const defaultNotifications: any[] = [];

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
    setStorageItem("dc_currentUserId", "");
    localStorage.setItem("dc_initialized", "true");
  }
  if (!localStorage.getItem("dc_landing_force_v1")) {
    setStorageItem("dc_currentUserId", "");
    localStorage.setItem("dc_landing_force_v1", "true");
  }
};

// ----------------------------------------------------
// UNIVERSAL API INTERCEPT ROUTER
// ----------------------------------------------------
const handleMockRequest = async (urlStr: string, init?: RequestInit): Promise<Response> => {
  initializeStorageDatabase();

  let url = urlStr;
  try {
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://") || urlStr.includes("/api/")) {
      const parsed = new URL(urlStr, window.location.origin || "http://localhost");
      url = parsed.pathname;
    }
  } catch (e) {
    // ignore
  }

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
  let currentUserId = getStorageItem("dc_currentUserId", "");

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
  let backendCheckPromise: Promise<boolean> | null = null;

  const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as any).url || "";
    let pathname = url;
    try {
      if (url.startsWith("http://") || url.startsWith("https://") || url.includes("/api/")) {
        const parsed = new URL(url, window.location.origin || "http://localhost");
        pathname = parsed.pathname;
      }
    } catch {
      // ignore
    }

    if (pathname.startsWith("/api/")) {
      // Dynamic probe activation with promise deduplication
      if ((window as any)._useClientMock === undefined) {
        if (!backendCheckPromise) {
          backendCheckPromise = (async () => {
            try {
              const testRes = await originalFetch("/api/session");
              const ct = testRes.headers.get("content-type");
              if (testRes.ok && ct && ct.includes("application/json")) {
                (window as any)._useClientMock = false;
                return false;
              }
            } catch (e) {
              // Ignore probe failure and default to mock database
            }
            (window as any)._useClientMock = true;
            return true;
          })();
        }
        await backendCheckPromise;
      }

      if ((window as any)._useClientMock) {
        return handleMockRequest(url, init);
      } else {
        try {
          const res = await originalFetch.apply(window, [input, init]);
          const ct = res.headers.get("content-type");
          if (res.ok || (ct && ct.includes("application/json"))) {
            return res;
          }
          console.warn("⚠️ Real backend returned non-JSON or error page. Falling back to local mock state.", pathname);
          return handleMockRequest(url, init);
        } catch (err) {
          console.warn("⚠️ Real backend failed to fetch. Falling back to local mock state.", pathname, err);
          return handleMockRequest(url, init);
        }
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
