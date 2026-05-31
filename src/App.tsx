import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Users, 
  MessageSquare, 
  Gavel, 
  HelpCircle, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Database,
  ArrowRight,
  TrendingUp,
  FileText,
  BadgeAlert,
  Sparkles,
  Award,
  Coins
} from "lucide-react";
import Header from "./components/Header.tsx";
import DeveloperDashboard from "./components/DeveloperDashboard.tsx";
import RecruiterDashboard from "./components/RecruiterDashboard.tsx";
import AdminPanel from "./components/AdminPanel.tsx";
import ChatSystem from "./components/ChatSystem.tsx";
import LandingPage from "./components/LandingPage.tsx";

import { 
  User, 
  UserRole, 
  DeveloperProfile, 
  RecruiterProfile, 
  Project, 
  Application, 
  Invite, 
  ContactAccessRequest, 
  Message, 
  Chat, 
  Notification, 
  Dispute, 
  DisputeStatus,
  ProjectStatus,
  ApplicationStatus,
  InviteStatus,
  ProjectStage,
  NDA,
  Review
} from "./types.js";

type WorkspaceTab = "dashboard" | "projects" | "scout" | "chats" | "disputes" | "supabase" | "faq";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [devProfile, setDevProfile] = useState<DeveloperProfile | null>(null);
  const [recProfile, setRecProfile] = useState<RecruiterProfile | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactAccessRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [projectStages, setProjectStages] = useState<ProjectStage[]>([]);
  const [ndas, setNdas] = useState<NDA[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Projects Board Filter states
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [selectedHiringTypes, setSelectedHiringTypes] = useState<string[]>([]);
  const [selectedBudgetRanges, setSelectedBudgetRanges] = useState<string[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("dashboard");
  const [isLoading, setIsLoading] = useState(true);

  // New dispute form state
  const [disputeProjId, setDisputeProjId] = useState("");
  const [disputeMilestone, setDisputeMilestone] = useState("");
  const [disputeReason, setDisputeReason] = useState("Quality Issues");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [disputeAmount, setDisputeAmount] = useState(50000);
  const [disputeResolution, setDisputeResolution] = useState("");

  // Fetch full data suite from backend
  const fetchData = async () => {
    try {
      // Load Supabase Status in parallel
      fetch("/api/supabase/status")
        .then(r => r.json())
        .then(data => setSupabaseStatus(data))
        .catch(err => console.error("Could not fetch database metrics", err));

      const sessionResp = await fetch("/api/session");
      const sessionData = await sessionResp.json();
      setCurrentUser(sessionData.user);
      setDevProfile(sessionData.devProfile);
      setRecProfile(sessionData.recProfile);

      const [
        projResp, 
        appResp, 
        invResp, 
        conResp, 
        chatsResp, 
        usersResp, 
        dispResp, 
        notifResp,
        stagesResp,
        ndasResp,
        reviewsResp
      ] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/applications"),
        fetch("/api/invites"),
        fetch("/api/contacts"),
        fetch("/api/chats"),
        fetch("/api/users"),
        fetch("/api/disputes"),
        fetch("/api/notifications"),
        fetch("/api/project-stages"),
        fetch("/api/ndas"),
        fetch("/api/reviews")
      ]);

      setProjects(await projResp.json());
      setApplications(await appResp.json());
      setInvites(await invResp.json());
      setContactRequests(await conResp.json());
      setProjectStages(await stagesResp.json());
      setNdas(await ndasResp.json());
      setReviews(await reviewsResp.json());
      
      const chatsData = await chatsResp.json();
      setChats(chatsData);

      // Fetch message logs for all chats dynamically
      if (chatsData.length > 0) {
        const msgsPromises = chatsData.map((c: Chat) => fetch(`/api/messages/${c.id}`));
        const msgsResponses = await Promise.all(msgsPromises);
        let allMsgs: Message[] = [];
        for (const r of msgsResponses) {
          const mList = await r.json();
          allMsgs = [...allMsgs, ...mList];
        }
        setMessages(allMsgs);
      } else {
        setMessages([]);
      }

      setAllUsers(await usersResp.json());
      setDisputes(await dispResp.json());
      setNotifications(await notifResp.json());
      setIsLoading(false);
    } catch (e) {
      console.error("Error loading secure session records", e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll for real-time chat updates when on the chats tab
  useEffect(() => {
    if (activeTab !== "chats") return;
    const interval = setInterval(() => {
      fetchData();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Character switch handler
  const handleSwitchSession = async (userId: string) => {
    setIsLoading(true);
    await fetch("/api/session/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    await fetchData();
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await fetch("/api/session/logout", {
      method: "POST"
    });
    await fetchData();
  };

  const handleUpdateProfile = async (profile: Partial<DeveloperProfile | RecruiterProfile>) => {
    const isDev = currentUser?.role === UserRole.DEVELOPER;
    const url = isDev ? "/api/profile/developer" : "/api/profile/recruiter";
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    fetchData();
  };

  const handleUpdatePreferences = async (prefs: any) => {
    await fetch("/api/users/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs)
    });
    fetchData();
  };

  const handlePostProject = async (proj: Partial<Project>) => {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proj)
    });
    fetchData();
  };

  const handlePostReview = async (review: Partial<Review>) => {
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review)
    });
    fetchData();
  };

  const handleUpdateProjectStatus = async (projectId: string, status: ProjectStatus) => {
    await fetch("/api/projects/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, status })
    });
    fetchData();
  };

  const handleCreateStage = async (projectId: string, title: string, description: string, cost: number, dueDate: string, createdBy: "RECRUITER" | "DEVELOPER") => {
    await fetch("/api/project-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, title, description, cost, dueDate, createdBy })
    });
    fetchData();
  };

  const handleApproveStage = async (stageId: string) => {
    await fetch("/api/project-stages/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId })
    });
    fetchData();
  };

  const handleCompleteStage = async (stageId: string) => {
    await fetch("/api/project-stages/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId })
    });
    fetchData();
  };

  const handleSendNDA = async (projectId: string, developerId: string, terms: string) => {
    await fetch("/api/ndas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, developerId, terms })
    });
    fetchData();
  };

  const handleSignNDA = async (ndaId: string, role: "RECRUITER" | "DEVELOPER", signature: string) => {
    await fetch("/api/ndas/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ndaId, role, signature })
    });
    fetchData();
  };

  const handleQuickHire = async (projectId: string, developerId: string, proposedRate: number, timelineEstimate: string) => {
    const resp = await fetch("/api/projects/quick-hire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, developerId, proposedRate, timelineEstimate })
    });
    const parsed = await resp.json();
    await fetchData();
    if (parsed?.chat?.id) {
      setSelectedChatId(parsed.chat.id);
    }
    setActiveTab("chats");
  };

  const handleApplyToProject = async (projectId: string, cover: string, proposedRate: number, avail: string, timeline: string) => {
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, coverLetter: cover, proposedRate, availability: avail, timelineEstimate: timeline })
    });
    fetchData();
  };

  const handleRespondInvite = async (inviteId: string, status: InviteStatus) => {
    await fetch("/api/invites/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId, status })
    });
    // Store current state of invites to find the recruiterId before updating the view
    const matchInvite = invites.find(i => i.id === inviteId);
    await fetchData();

    if (status === InviteStatus.ACCEPTED && matchInvite && currentUser) {
      await handleInitiateChat(matchInvite.recruiterId, currentUser.id);
    }
  };

  const handleInviteDeveloper = async (projectId: string, devId: string, message: string) => {
    await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, developerId: devId, message })
    });
    fetchData();
  };

  const handleRespondContact = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    await fetch("/api/contacts/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status })
    });
    fetchData();
  };

  const handleSendMessage = async (chatId: string, receiverId: string, text: string, fileUrl?: string, fileType?: "image" | "file") => {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, receiverId, text, fileUrl, fileType })
    });
    fetchData();
  };

  const handleToggleKeepOpen = async (chatId: string, keepOpen: boolean) => {
    await fetch(`/api/chats/${chatId}/keep-open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepOpen })
    });
    fetchData();
  };

  const handleInitiateChat = async (recruId: string, devId: string) => {
    const resp = await fetch("/api/chats/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiterId: recruId, developerId: devId })
    });
    const chatData = await resp.json();
    await fetchData();
    if (chatData?.chat?.id) {
      setSelectedChatId(chatData.chat.id);
    }
    setActiveTab("chats");
  };

  const handleSendContactRequest = async (developerId: string) => {
    await fetch("/api/contacts/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerId })
    });
    fetchData();
    alert("Contact Details Access request initiated! Subject notified.");
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    await fetch("/api/applications/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status })
    });
    const matchApp = applications.find(a => a.id === applicationId);
    await fetchData();

    if (status === ApplicationStatus.ACCEPTED && matchApp) {
      await handleInitiateChat(currentUser?.id || matchApp.recruiterId, matchApp.developerId);
    }
  };

  const handleUpdateUserStatus = async (userId: string, updates: any) => {
    await fetch("/api/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates })
    });
    fetchData();
  };

  const handleResolveDispute = async (disputeId: string, rationaleText: string, ratio?: { recruiter: number; developer: number }, status?: DisputeStatus) => {
    await fetch("/api/disputes/verdict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disputeId, verdictRationale: rationaleText, splitRatio: ratio, status })
    });
    fetchData();
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeProjId || !disputeMilestone || !disputeDetails) {
      alert("Please fill in all dispute fields before filing.");
      return;
    }
    const targetProj = projects.find(p => p.id === disputeProjId);
    if (!targetProj) return;

    await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: disputeProjId,
        milestoneTitle: disputeMilestone,
        opponentId: currentUser?.role === UserRole.DEVELOPER ? targetProj.recruiterId : currentUser?.id || "",
        reason: disputeReason,
        details: disputeDetails,
        escrowAmount: disputeAmount,
        proposedResolution: disputeResolution
      })
    });

    setDisputeProjId("");
    setDisputeMilestone("");
    setDisputeDetails("");
    setDisputeAmount(50000);
    setDisputeResolution("");
    fetchData();
    alert("Dispute Case raised! Impartial Mediator Елена assigned coordinates.");
  };

  const handleMarkNotificationsRead = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: "all" })
    });
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 flex-col gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-teal border-t-transparent animate-spin"></div>
        <p className="font-mono text-xs text-brand-teal-dark font-semibold tracking-wide">CONNECTING TO SECURE SERVER...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LandingPage 
        projectsList={projects} 
        usersList={allUsers} 
        onLoginSuccess={fetchData} 
      />
    );
  }

  const developersOnly = allUsers.filter(u => u.role === "DEVELOPER").map(u => u.devProfile).filter(Boolean) as DeveloperProfile[];

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-800 font-sans flex flex-col">
      {/* Navbar Header */}
      <Header 
        currentUser={currentUser} 
        onSwitchSession={handleSwitchSession} 
        usersList={allUsers}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">
        {/* Workspace Operations Side Menu */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-900 uppercase">Interactive Workspace</h3>
            <p className="text-[10px] text-brand-teal-dark font-mono mt-0.5 font-bold">
              {currentUser.role === UserRole.ADMIN 
                ? "Administrator Operations Center" 
                : currentUser.role === UserRole.RECRUITER 
                  ? "Recruiter Portal Hub" 
                  : "Developer Active Workspace"}
            </p>
          </div>

          <nav className="space-y-1">
            {(currentUser.role === UserRole.ADMIN 
              ? [
                  { id: "dashboard", label: "Admin Control Panel", icon: ShieldCheck },
                  { id: "disputes", label: "Mediator Disputes", icon: Gavel },
                  { id: "supabase", label: "Supabase SQL Sync", icon: Database },
                  { id: "faq", label: "Compliance & FAQ", icon: HelpCircle }
                ]
              : [
                  { id: "dashboard", label: "Control Center", icon: Layers },
                  { id: "projects", label: "Projects Board", icon: Briefcase },
                  { id: "scout", label: "Talent Scout Pool", icon: Users },
                  { id: "chats", label: "Frictionless Chat", icon: MessageSquare },
                  { id: "faq", label: "Compliance & FAQ", icon: HelpCircle }
                ]
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? "bg-brand-teal-light text-brand-teal-dark border border-brand-teal/20 shadow-sm font-bold" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Compliance Widget */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 font-mono text-[11px]">
              <ShieldCheck className="w-4 h-4 text-brand-teal" /> SECURE ESCROW ENFORCED
            </h4>
            <p className="text-slate-550 leading-relaxed text-[11px]">
              Compliance-ready contracts aligned with Section 72, Indian IT Act protect all funds until approved milestones are resolved.
            </p>
          </div>
        </aside>

        {/* Primary Workspace View Area */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* Mobile quick switcher - extremely responsive */}
          <div className="block lg:hidden bg-slate-900 border border-slate-850 rounded-2xl p-4 shadow-xl">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 mb-2">
              🛡️ ACTIVE SYSTEMS MODULE ({currentUser.role})
            </label>
            <select 
              value={activeTab} 
              onChange={(e) => setActiveTab(e.target.value as WorkspaceTab)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold uppercase tracking-wider text-emerald-300 focus:outline-none cursor-pointer shadow-inner font-mono"
            >
              {currentUser.role === UserRole.ADMIN ? (
                <>
                  <option value="dashboard" className="bg-slate-900 text-slate-200">📊 Admin Control Panel</option>
                  <option value="disputes" className="bg-slate-900 text-slate-200">⚖️ Mediator Dispute Center</option>
                  <option value="supabase" className="bg-slate-900 text-slate-200">⚡ Supabase SQL Sync</option>
                  <option value="faq" className="bg-slate-900 text-slate-200">📝 Compliance & FAQ Hub</option>
                </>
              ) : (
                <>
                  <option value="dashboard" className="bg-slate-900 text-slate-200">📊 Control Center</option>
                  <option value="projects" className="bg-slate-900 text-slate-200">💼 Projects Board Pool</option>
                  <option value="scout" className="bg-slate-900 text-slate-200">👥 Talent Scout Pool</option>
                  <option value="chats" className="bg-slate-900 text-slate-200">💬 Frictionless Chat Client</option>
                  <option value="faq" className="bg-slate-900 text-slate-200">📝 Compliance & FAQ Hub</option>
                </>
              )}
            </select>
          </div>

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div>
              {currentUser.role === UserRole.DEVELOPER && devProfile && (
                <DeveloperDashboard 
                  currentUser={currentUser}
                  devProfile={devProfile}
                  projects={projects}
                  applications={applications}
                  invites={invites}
                  contactRequests={contactRequests}
                  projectStages={projectStages}
                  ndas={ndas}
                  reviews={reviews}
                  onPostReview={handlePostReview}
                  onApply={handleApplyToProject}
                  onRespondInvite={handleRespondInvite}
                  onRespondContact={handleRespondContact}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdatePreferences={handleUpdatePreferences}
                  onInitiateChat={handleInitiateChat}
                  onCreateStage={handleCreateStage}
                  onApproveStage={handleApproveStage}
                  onCompleteStage={handleCompleteStage}
                  onSignNDA={handleSignNDA}
                />
              )}

              {currentUser.role === UserRole.RECRUITER && recProfile && (
                <RecruiterDashboard 
                  currentUser={currentUser}
                  recProfile={recProfile}
                  projects={projects}
                  applications={applications}
                  invites={invites}
                  contactRequests={contactRequests}
                  developersList={developersOnly}
                  projectStages={projectStages}
                  ndas={ndas}
                  reviews={reviews}
                  onPostReview={handlePostReview}
                  onUpdateProjectStatus={handleUpdateProjectStatus}
                  onPostProject={handlePostProject}
                  onInviteDeveloper={handleInviteDeveloper}
                  onUpdateApplicationStatus={handleUpdateApplicationStatus}
                  onSendContactRequest={handleSendContactRequest}
                  onUpdatePreferences={handleUpdatePreferences}
                  onInitiateChat={handleInitiateChat}
                  onUpdateProfile={handleUpdateProfile}
                  onCreateStage={handleCreateStage}
                  onApproveStage={handleApproveStage}
                  onCompleteStage={handleCompleteStage}
                  onSendNDA={handleSendNDA}
                  onSignNDA={handleSignNDA}
                  onQuickHire={handleQuickHire}
                />
              )}

              {currentUser.role === UserRole.ADMIN && (
                <AdminPanel 
                  currentUser={currentUser}
                  usersList={allUsers}
                  disputes={disputes}
                  onUpdateUser={handleUpdateUserStatus}
                  onResolveDispute={handleResolveDispute}
                  onUpdatePreferences={handleUpdatePreferences}
                />
              )}
            </div>
          )}

          {/* PROJECTS BOARD TAB (Global Browsing View) */}
          {activeTab === "projects" && (() => {
            const BUDGET_RANGES = [
              { id: "under-50k", label: "Under ₹50,000", min: 0, max: 50000 },
              { id: "50k-200k", label: "₹50,000 - ₹2,00,000", min: 50000, max: 200000 },
              { id: "200k-500k", label: "₹2,00,000 - ₹5,00,000", min: 200000, max: 500000 },
              { id: "above-500k", label: "Above ₹5,00,000", min: 500000, max: Infinity }
            ];

            const filteredProjectsForBoard = projects.filter(proj => {
              if (selectedTechs.length > 0) {
                const matchesTech = proj.techStack.some(t => selectedTechs.includes(t));
                if (!matchesTech) return false;
              }
              if (selectedHiringTypes.length > 0) {
                if (!selectedHiringTypes.includes(proj.hiringType)) return false;
              }
              if (selectedBudgetRanges.length > 0) {
                const matchesRange = BUDGET_RANGES.some(range => {
                  if (!selectedBudgetRanges.includes(range.id)) return false;
                  return proj.budget >= range.min && proj.budget < range.max;
                });
                if (!matchesRange) return false;
              }
              return true;
            });

            return (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-sans">Active Project Requirements Pool</h3>
                      <p className="text-xs text-slate-500">Explore technical contracts across deep tech startups and unicorns.</p>
                    </div>
                    <span className="text-xs font-mono bg-brand-teal-light text-brand-teal-dark px-3 py-1 rounded-full border border-brand-teal/20 font-semibold">
                      {filteredProjectsForBoard.length} matches
                    </span>
                  </div>

                  {/* Modern Filter Cockpit */}
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[11px]">
                        <Coins className="w-4.5 h-4.5 text-brand-teal animate-pulse" /> Multi-Select Filter Controls
                      </span>
                      {(selectedTechs.length > 0 || selectedHiringTypes.length > 0 || selectedBudgetRanges.length > 0) && (
                        <button
                          onClick={() => {
                            setSelectedTechs([]);
                            setSelectedHiringTypes([]);
                            setSelectedBudgetRanges([]);
                          }}
                          className="text-[10px] uppercase font-mono font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          [Clear All Filters]
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Tech Stack Multi-Select */}
                      <div className="space-y-2">
                        <span className="block font-bold text-slate-700">Technology Stack:</span>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                          {Array.from(new Set(projects.flatMap(p => p.techStack || []))).map(tech => {
                            const isSelected = selectedTechs.includes(tech);
                            return (
                              <button
                                key={tech}
                                onClick={() => {
                                  setSelectedTechs(prev => 
                                    prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
                                  );
                                }}
                                className={`px-2 py-1 rounded transition-all text-[10px] font-mono border ${
                                  isSelected 
                                    ? "bg-brand-teal text-white border-brand-teal font-bold" 
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {tech}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hiring Type Multi-Select */}
                      <div className="space-y-2">
                        <span className="block font-bold text-slate-700">Contract Hiring Type:</span>
                        <div className="flex flex-col gap-1.5">
                          {["Fixed-Price", "Hourly Contract"].map(type => {
                            const isSelected = selectedHiringTypes.includes(type);
                            return (
                              <label key={type} className="flex items-center gap-2 cursor-pointer font-mono text-[10.5px] text-slate-600 select-none">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedHiringTypes(prev =>
                                      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                                    );
                                  }}
                                  className="accent-brand-teal h-3.5 w-3.5 rounded border-slate-300"
                                />
                                {type}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Budget Range Multi-Select */}
                      <div className="space-y-2">
                        <span className="block font-bold text-slate-700">Budget Range Filters:</span>
                        <div className="flex flex-col gap-1.5">
                          {BUDGET_RANGES.map(range => {
                            const isSelected = selectedBudgetRanges.includes(range.id);
                            return (
                              <label key={range.id} className="flex items-center gap-2 cursor-pointer font-mono text-[10.5px] text-slate-600 select-none">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedBudgetRanges(prev =>
                                      prev.includes(range.id) ? prev.filter(r => r !== range.id) : [...prev, range.id]
                                    );
                                  }}
                                  className="accent-brand-teal h-3.5 w-3.5 rounded border-slate-300"
                                />
                                {range.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {filteredProjectsForBoard.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-6 space-y-2">
                      <p className="text-sm text-slate-500 font-medium">No projects match the currently selected filters.</p>
                      <button
                        onClick={() => {
                          setSelectedTechs([]);
                          setSelectedHiringTypes([]);
                          setSelectedBudgetRanges([]);
                        }}
                        className="text-xs text-brand-teal font-semibold hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {filteredProjectsForBoard.map((proj) => {
                        const recruiter = allUsers.find(u => u.id === proj.recruiterId);
                        return (
                          <div key={proj.id} className="bg-slate-50/40 p-5 rounded-xl border border-slate-200/80 hover:border-brand-teal/30 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <h4 className="text-sm font-bold text-slate-900 font-sans leading-snug">{proj.title}</h4>
                                <span className="text-[10px] font-mono text-brand-teal bg-brand-teal-light px-2.5 py-0.5 rounded border border-brand-teal/20 uppercase font-bold">
                                  {proj.workMode}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{proj.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {proj.techStack.map(s => (
                                  <span key={s} className="bg-white text-brand-teal text-[9px] px-2 py-0.5 rounded font-mono border border-slate-200">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
                              <span>Timeline: {proj.duration}</span>
                              <span className="font-bold text-slate-900">₹{proj.budget.toLocaleString()} ({proj.hiringType})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* SCOUT TEAM TALENT POOL TAB */}
          {activeTab === "scout" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 font-sans">Browse Vetted Engineering Talents</h3>
                <p className="text-xs text-slate-500">Search for specialized engineers, evaluate coding capabilities and contact access profiles.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {developersOnly.map((dev) => (
                    <div key={dev.userId} className="bg-slate-50/40 p-5 rounded-xl border border-slate-200/85 flex flex-col justify-between hover:border-brand-teal/30 hover:bg-white hover:shadow-sm transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            src={dev.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU"} 
                            alt={dev.fullName} 
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-909">{dev.fullName}</h4>
                            <p className="text-[10px] text-brand-teal-dark font-medium font-semibold">{dev.headline}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{dev.bio}</p>
                        
                        <div className="flex flex-wrap gap-1">
                          {dev.skills.map(s => (
                            <span key={s} className="bg-white text-brand-teal text-[9px] px-2 py-0.5 rounded font-mono border border-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>Min Rate: ₹{dev.rates.hourly.toLocaleString()}/hr</span>
                        {currentUser.role === UserRole.RECRUITER ? (
                          <button 
                            onClick={() => handleInitiateChat(currentUser.id, dev.userId)}
                            className="text-brand-teal font-bold hover:text-brand-teal-dark transition-colors cursor-pointer"
                          >
                            Open Discussion
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">Vetted Premium</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FRICTIONLESS CHAT TAB */}
          {activeTab === "chats" && (
            <ChatSystem 
              currentUser={currentUser}
              chats={chats}
              messages={messages}
              usersList={allUsers}
              onSendMessage={handleSendMessage}
              onInitiateChat={(opId) => handleInitiateChat(currentUser.role === UserRole.RECRUITER ? currentUser.id : opId, currentUser.role === UserRole.DEVELOPER ? currentUser.id : opId)}
              onToggleKeepOpen={handleToggleKeepOpen}
              selectedChatId={selectedChatId}
              onSelectChat={setSelectedChatId}
            />
          )}

          {/* ARBITRATION MEDIATOR DISPUTES TAB */}
          {activeTab === "disputes" && (
            <div className="space-y-6">
              {/* Creator form for developers and recruiters */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Gavel className="w-5 h-5 text-rose-500" />
                  <h3 className="text-sm font-bold text-slate-900">Raise Official Intermediary Dispute</h3>
                </div>

                <form onSubmit={handleCreateDispute} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Link with Proj Contract</label>
                    <select
                      value={disputeProjId}
                      onChange={(e) => setDisputeProjId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      required
                    >
                      <option value="">-- Choose project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Milestone Phase Title</label>
                    <input 
                      value={disputeMilestone}
                      onChange={(e) => setDisputeMilestone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="e.g., Sprint 4: Webhook Integration"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Reason for Intervention</label>
                    <select
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="Quality Issues">Quality & Spec Failures</option>
                      <option value="Missed Milestone">Missed Milestone Deadline</option>
                      <option value="Communication Gap">Unresponsive Counterpart Response</option>
                      <option value="Other">Non-conforming deliverable scope</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Amount at Risk (₹)</label>
                    <input 
                      type="number"
                      value={disputeAmount}
                      onChange={(e) => setDisputeAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      min={1}
                      required
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">Describe the conflict (with commit pointers)</label>
                    <textarea
                      value={disputeDetails}
                      onChange={(e) => setDisputeDetails(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none resize-none transition-all"
                      placeholder="e.g. Server response schema failed security audit compliance on commit: ab391c..."
                      required
                    />
                  </div>

                  <div className="pt-2 md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Initialize Mediation Case
                    </button>
                  </div>
                </form>
              </div>

              {/* View Admin resolution and active cases */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-slate-800 shadow-sm">
                <h3 className="font-sans font-bold text-slate-900 text-sm">Mediation Log Records</h3>
                <div className="divide-y divide-slate-100">
                  {disputes.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">No active mediation disputes filed.</p>
                  ) : (
                    disputes.map((disp) => (
                      <div key={disp.id} className="py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">{disp.milestoneTitle}</h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            disp.status === DisputeStatus.RESOLVED ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-rose-50 text-rose-700 border border-rose-200/50 animate-pulse"
                          }`}>
                            {disp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">Dispute details: <span className="italic">"{disp.details}"</span></p>
                        <p className="text-[11px] text-slate-400 font-mono">Assigned mediator: Elena Vance • Escrow Funds: ₹{disp.escrowAmount.toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUPABASE DEPLOYMENT & DATABASE PANEL */}
          {activeTab === "supabase" && (
            <div className="space-y-6 text-slate-800">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-sans text-left">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-600 animate-pulse" />
                      Supabase PostgreSQL Sync Control
                    </h2>
                    <p className="text-xs text-slate-500">Live configuration checks and one-click SQL initialization tables builder.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold">Integration Status:</span>
                    {supabaseStatus?.configured ? (
                      <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        CONNECTED TO SUPABASE (ACTIVE)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1">
                        ⚠️ FALLBACK DEVELOPMENT MODE
                      </span>
                    )}
                  </div>
                </div>

                {!supabaseStatus?.configured && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs leading-relaxed text-amber-900 text-left">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Sparkles className="w-4.5 h-4.5 text-amber-600" />
                      Local Database Fallback Active
                    </p>
                    <p>
                      The application is fully configured to operate using our high-fidelity, persistent memory database engine. To bind your live production database cluster, register <strong>SUPABASE_URL</strong> and <strong>SUPABASE_KEY</strong> environment variables.
                    </p>
                  </div>
                )}

                {/* DB Sync Table Counters */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-slate-900 uppercase">Hydrated Database Records</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "users", label: "Users" },
                      { key: "projects", label: "Projects" },
                      { key: "applications", label: "Applications" },
                      { key: "stages", label: "Project Stages" },
                      { key: "developerProfiles", label: "Developer Profiles" },
                      { key: "chats", label: "Chat Threads" },
                      { key: "messages", label: "Messages" },
                      { key: "disputes", label: "Disputes File" }
                    ].map((tbl) => {
                      const count = supabaseStatus?.tablesHydrated?.[tbl.key] ?? 0;
                      return (
                        <div key={tbl.key} className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex flex-col justify-between">
                          <span className="text-[10px] font-semibold text-slate-500 block leading-tight">{tbl.label}</span>
                          <span className="text-xl font-bold text-slate-900 font-mono mt-1">{count} <span className="text-[9px] text-slate-400 font-normal font-sans">Replicated</span></span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vercel and Supabase Setup Steps */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-xs font-mono font-bold text-slate-900 uppercase">Self-Guided SQL Installation Scripts</h3>
                  <p className="text-xs text-slate-600 leading-normal">
                    To make deployment robust, copy this unified schema generator setup script directly into your Supabase Dashboard SQL editor query panel:
                  </p>

                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[10px] leading-relaxed max-h-64 overflow-y-auto overflow-x-auto whitespace-pre select-all border border-slate-800">
                      {supabaseStatus?.setupSql || "-- Hydrating SQL..."}
                    </pre>
                    <button
                      onClick={() => {
                        if (supabaseStatus?.setupSql) {
                          navigator.clipboard.writeText(supabaseStatus.setupSql);
                          alert("SQL schema setup copy string stored in clipboard!");
                        }
                      }}
                      className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[9px] px-2.5 py-1.5 rounded-lg font-bold border border-slate-700 transition-all cursor-pointer"
                    >
                      COPY SQL DDL
                    </button>
                  </div>

                  <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-150 text-xs space-y-2 leading-relaxed text-left">
                    <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 font-mono text-[11px]">
                      🚀 Ready for Vercel Deployment?
                    </h4>
                    <p className="text-indigo-900">
                      The codebase is fully structured with a standardized bundled single CommonJS Express distribution (using <code>dist/server.cjs</code>) or fully compliant static site outputs. To deploy:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 text-indigo-900">
                      <li>Paste your Supabase URL and SERVICE Key into Vercel's Environment Variables block.</li>
                      <li>Run <code>npm run build</code> inside your deploy script fields.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KNOWLEDGE HUB / FAQ TAB */}
          {activeTab === "faq" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 text-slate-800 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-slate-900">Compliance & Knowledge Hub</h2>
                <p className="text-xs text-slate-500">Review Indian IT regulations and platform minimum wage guarantees.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-teal" /> Data Confidentiality & Section 72, Indian IT Act
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Under Section 72 of the Indian Information Technology Act, securing access to electronic records or correspondances without consent and disclosing it constitutes a severe regulatory violation. DeveloperConnect restricts recruiter visibility of developer contacts (phones & emails) until explicitly approved by the developer candidate.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Awards className="w-5 h-5 text-brand-teal" /> ₹500/Hour Global Minimum Wage Policy
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    To safeguard engineering standards, DeveloperConnect does not permit projects with an effective hourly rate below ₹500, or a fixed budget below ₹5,000. Contracts are automatically audited under smart-compliance guidelines to protect freelancer compensation.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-brand-teal" /> GST and Intermediary Tax Compliance
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    All escrow deposits generate localized, GST-compliant e-invoices including 18% services taxation dynamically routed according to State codes. Corporate clients can input valid GSTIN credentials to reclaim input tax credits upon milestone signoffs.
                  </p>
                </div>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}

// Simple fallback helper component
function Awards({ className }: { className?: string }) {
  return <Award className={className} />;
}
