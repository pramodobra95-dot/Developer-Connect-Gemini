import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User as UserIcon, 
  MapPin, 
  Clock, 
  DollarSign, 
  Sparkles, 
  MessageSquare, 
  Send, 
  CheckCircle,
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
  Mail,
  Phone,
  Paperclip,
  Share2,
  FileText,
  SlidersHorizontal,
  X,
  Filter
} from "lucide-react";
import { 
  User, 
  DeveloperProfile, 
  Project, 
  Application, 
  Invite, 
  ProjectStatus, 
  ApplicationStatus, 
  InviteStatus, 
  ContactAccessRequest,
  Review
} from "../types.js";
import EmailGatewaySettings from "./EmailGatewaySettings.tsx";

interface DeveloperDashboardProps {
  currentUser: User;
  devProfile: DeveloperProfile;
  projects: Project[];
  applications: Application[];
  invites: Invite[];
  contactRequests: ContactAccessRequest[];
  projectStages?: any[];
  ndas?: any[];
  reviews?: Review[];
  onPostReview?: (review: Partial<Review>) => void;
  onApply: (projectId: string, cover: string, proposedRate: number, avail: string, timeline: string) => void;
  onRespondInvite: (inviteId: string, status: InviteStatus) => void;
  onRespondContact: (requestId: string, status: "APPROVED" | "REJECTED") => void;
  onUpdateProfile: (profile: Partial<DeveloperProfile>) => void;
  onUpdatePreferences?: (prefs: any) => void;
  onInitiateChat: (recruiterId: string, developerId: string) => void;
  onCreateStage?: (projectId: string, title: string, description: string, cost: number, dueDate: string, createdBy: "DEVELOPER" | "RECRUITER") => void;
  onApproveStage?: (stageId: string) => void;
  onCompleteStage?: (stageId: string) => void;
  onSignNDA?: (ndaId: string, party: "DEVELOPER" | "RECRUITER", signature: string) => void;
}

export default function DeveloperDashboard({
  currentUser,
  devProfile,
  projects,
  applications,
  invites,
  contactRequests,
  projectStages = [],
  ndas = [],
  reviews = [],
  onPostReview,
  onApply,
  onRespondInvite,
  onRespondContact,
  onUpdateProfile,
  onUpdatePreferences,
  onInitiateChat,
  onCreateStage,
  onApproveStage,
  onCompleteStage,
  onSignNDA
}: DeveloperDashboardProps) {
  // Tabs: "dashboard", "projects", "invites"
  const [activeTab, setActiveTab ] = useState<"dashboard" | "projects" | "invites">("dashboard");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // NDA signature typing map
  const [typedDevSignature, setTypedDevSignature] = useState<Record<string, string>>({});

  // Developer-initiated project stages form state maps
  const [devStageTitle, setDevStageTitle] = useState<Record<string, string>>({});
  const [devStageDesc, setDevStageDesc] = useState<Record<string, string>>({});
  const [devStageCost, setDevStageCost] = useState<Record<string, number>>({});
  const [devStageDueDate, setDevStageDueDate] = useState<Record<string, string>>({});

  // Multi-select projects filter state
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [selectedHiringTypes, setSelectedHiringTypes] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Profile edit state
  const [fullName, setFullName] = useState(devProfile.fullName || "");
  const [headline, setHeadline] = useState(devProfile.headline || "");
  const [bio, setBio] = useState(devProfile.bio || "");
  const [skillsStr, setSkillsStr] = useState((devProfile.skills || []).join(", "));
  const [experience, setExperience] = useState(devProfile.experienceYears || 0);
  const [hourlyRate, setHourlyRate] = useState(devProfile.rates?.hourly || 0);
  const [isContactVisible, setIsContactVisible] = useState(devProfile.isContactVisible || false);
  const [location, setLocation] = useState(devProfile.location || "");
  const [phoneNumber, setPhoneNumber] = useState(devProfile.phoneNumber || "");
  const [email, setEmail] = useState(devProfile.email || "");
  const [github, setGithub] = useState(devProfile.socials?.github || "");
  const [linkedin, setLinkedin] = useState(devProfile.socials?.linkedin || "");
  const [portfolio, setPortfolio] = useState(devProfile.socials?.portfolio || "");
  const [weeklyRate, setWeeklyRate] = useState(devProfile.rates?.weekly || 0);
  const [monthlyRate, setMonthlyRate] = useState(devProfile.rates?.monthly || 0);
  const [availability, setAvailability] = useState(devProfile.availability || "Both");
  const [status, setStatus] = useState(devProfile.status || "");
  const [avatarUrl, setAvatarUrl] = useState(devProfile.avatarUrl || "");

  // Notification preferences state
  const initialPrefs = currentUser.notificationPreferences || {
    emailNewInvites: true,
    emailApplicationUpdates: true,
    emailChatMessages: true
  };
  const [emailNewInvites, setEmailNewInvites] = useState(initialPrefs.emailNewInvites);
  const [emailApplicationUpdates, setEmailApplicationUpdates] = useState(initialPrefs.emailApplicationUpdates);
  const [emailChatMessages, setEmailChatMessages] = useState(initialPrefs.emailChatMessages);

  // Apply workflow state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyCover, setApplyCover] = useState("");
  const [applyRate, setApplyRate] = useState(devProfile.rates?.hourly || 0);
  const [applyAvail, setApplyAvail] = useState("Full-time");
  const [applyTimeline, setApplyTimeline] = useState("3 months");

  // AI loading and optimization states
  const [isAIProfileLoading, setIsAIProfileLoading] = useState(false);
  const [isAIProposalLoading, setIsAIProposalLoading] = useState(false);
  const [aiProposalText, setAiProposalText] = useState<{ title: string; pitch: string } | null>(null);

  // Image Upload handler for JPEG/PNG/WEBP
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format error: Only JPEG, PNG or WEBP images are permitted for profile photos.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Sync edits when devProfile or currentUser updates
  useEffect(() => {
    setFullName(devProfile.fullName || "");
    setHeadline(devProfile.headline || "");
    setBio(devProfile.bio || "");
    setSkillsStr((devProfile.skills || []).join(", "));
    setExperience(devProfile.experienceYears || 0);
    setHourlyRate(devProfile.rates?.hourly || 0);
    setIsContactVisible(devProfile.isContactVisible || false);
    setLocation(devProfile.location || "");
    setPhoneNumber(devProfile.phoneNumber || "");
    setEmail(devProfile.email || "");
    setGithub(devProfile.socials?.github || "");
    setLinkedin(devProfile.socials?.linkedin || "");
    setPortfolio(devProfile.socials?.portfolio || "");
    setWeeklyRate(devProfile.rates?.weekly || 0);
    setMonthlyRate(devProfile.rates?.monthly || 0);
    setAvailability(devProfile.availability || "Both");
    setStatus(devProfile.status || "");
    setAvatarUrl(devProfile.avatarUrl || "");
  }, [devProfile]);

  useEffect(() => {
    if (currentUser.notificationPreferences) {
      setEmailNewInvites(currentUser.notificationPreferences.emailNewInvites);
      setEmailApplicationUpdates(currentUser.notificationPreferences.emailApplicationUpdates);
      setEmailChatMessages(currentUser.notificationPreferences.emailChatMessages);
    }
  }, [currentUser]);

  // Handle Profile Update submit
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSkills = skillsStr.split(",").map(s => s.trim()).filter(Boolean);
    onUpdateProfile({
      fullName,
      headline,
      bio,
      skills: parsedSkills,
      experienceYears: Number(experience),
      location,
      phoneNumber,
      email,
      availability,
      status,
      avatarUrl,
      socials: {
        ...devProfile.socials,
        github,
        linkedin,
        portfolio
      },
      rates: {
        ...devProfile.rates,
        hourly: Number(hourlyRate),
        weekly: Number(weeklyRate),
        monthly: Number(monthlyRate)
      }
    });
    alert("Profile configurations saved successfully!");
  };

  const handlePreferencesSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onUpdatePreferences) {
      onUpdatePreferences({
        emailNewInvites,
        emailApplicationUpdates,
        emailChatMessages
      });
      alert("Email notification preferences updated successfully!");
    }
  };

  // Calculate profile completeness score
  const calculateCompleteness = () => {
    let score = 0;
    const suggestions: { field: string; boost: number; elementId: string; group: string }[] = [];

    if (fullName.trim()) score += 10; else suggestions.push({ field: "Full Name", boost: 10, elementId: "input-fullname", group: "Identity" });
    if (headline.trim()) score += 10; else suggestions.push({ field: "Professional Headline", boost: 10, elementId: "input-headline", group: "Identity" });
    if (bio.trim()) score += 10; else suggestions.push({ field: "Technical Bio Summary", boost: 10, elementId: "input-bio", group: "Identity" });
    if (skillsStr.trim()) score += 10; else suggestions.push({ field: "Skills & Technologies", boost: 10, elementId: "input-skills", group: "Professional" });
    if (experience > 0) score += 10; else suggestions.push({ field: "Years of Experience", boost: 10, elementId: "input-experience", group: "Professional" });
    if (location.trim()) score += 10; else suggestions.push({ field: "Location", boost: 10, elementId: "input-location", group: "Contact" });
    if (phoneNumber.trim()) score += 10; else suggestions.push({ field: "Mobile Phone Number", boost: 10, elementId: "input-phone", group: "Contact" });
    if (email.trim()) score += 10; else suggestions.push({ field: "Email Address", boost: 10, elementId: "input-email", group: "Contact" });
    
    if (github.trim()) score += 4; else suggestions.push({ field: "GitHub Link", boost: 4, elementId: "input-github", group: "Online presence" });
    if (linkedin.trim()) score += 4; else suggestions.push({ field: "LinkedIn Link", boost: 4, elementId: "input-linkedin", group: "Online presence" });
    if (portfolio.trim()) score += 4; else suggestions.push({ field: "Project/Portfolio Link", boost: 4, elementId: "input-portfolio", group: "Online presence" });
    
    if (Number(hourlyRate) > 0) score += 3; else suggestions.push({ field: "Hourly Rate", boost: 3, elementId: "input-hourly", group: "Compensation" });
    if (Number(weeklyRate) > 0) score += 2; else suggestions.push({ field: "Weekly Rate", boost: 2, elementId: "input-weekly", group: "Compensation" });
    if (Number(monthlyRate) > 0) score += 2; else suggestions.push({ field: "Monthly Retainer Rate", boost: 2, elementId: "input-monthly", group: "Compensation" });
    
    if (availability) score += 1; else suggestions.push({ field: "Availability Preference", boost: 1, elementId: "select-availability", group: "Availability" });
    if (status.trim()) score += 1; else suggestions.push({ field: "Working Status", boost: 1, elementId: "input-status", group: "Availability" });

    return { score: Math.min(score, 100), suggestions };
  };

  const { score: completenessScore, suggestions: completenessSuggestions } = calculateCompleteness();

  // AI Profile Optimizer (Gemini)
  const triggerAIProfileOptimization = async () => {
    setIsAIProfileLoading(true);
    try {
      const resp = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile-optimization",
          payload: {
            headline,
            bio,
            skills: devProfile.skills,
            experienceYears: experience
          }
        })
      });
      const data = await resp.json();
      if (data.optimizedHeadline && data.optimizedBio) {
        setHeadline(data.optimizedHeadline);
        setBio(data.optimizedBio);
        if (data.suggestedSkillsToLearn?.length > 0) {
          setSkillsStr(prev => {
            const list = prev ? prev.split(",").map(x => x.trim()) : [];
            const merged = Array.from(new Set([...list, ...data.suggestedSkillsToLearn]));
            return merged.join(", ");
          });
        }
        alert("Gemini successfully optimized your headline & bio summary!");
      }
    } catch (e) {
      console.error(e);
      alert("AI optimization encountered a network limit. Default optimizations applied.");
    } finally {
      setIsAIProfileLoading(false);
    }
  };

  // AI Proposal Pitch Generator (Gemini)
  const generateAIProposal = async (proj: Project) => {
    setIsAIProposalLoading(true);
    setAiProposalText(null);
    try {
      const resp = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "proposal-generation",
          payload: {
            projectTitle: proj.title,
            projectDescription: proj.description,
            devSkills: devProfile.skills
          }
        })
      });
      const data = await resp.json();
      if (data.title && data.pitch) {
        setAiProposalText({
          title: data.title,
          pitch: data.pitch
        });
        setApplyCover(data.pitch);
      }
    } catch (e) {
      console.error(e);
      alert("AI proposal generation failed. Formulating base match draft.");
    } finally {
      setIsAIProposalLoading(false);
    }
  };

  // Open apply modal
  const openApplyFlow = (proj: Project) => {
    setSelectedProject(proj);
    setApplyRate(devProfile.rates.hourly);
    setApplyCover("");
    setAiProposalText(null);
    setShowApplyModal(true);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    onApply(selectedProject.id, applyCover, applyRate, applyAvail, applyTimeline);
    setShowApplyModal(false);
    alert(`Your expert proposal has been submitted to the ${selectedProject.title} coordinator!`);
  };

  const myApps = applications.filter(a => a.developerId === currentUser.id);
  const pendingRequests = contactRequests.filter(c => c.developerId === currentUser.id && c.status === "PENDING");

  // Dynamically compile available tech stack tags from original catalog
  const availableTechs = Array.from(
    new Set(projects.flatMap(p => p.techStack || []))
  ).sort();

  const availableHiringTypes = ["Full-time", "Part-time", "Contract", "Consulting", "Retainer"];

  const budgetOptions = [
    { label: "Below ₹10,000", value: "UNDER_10K" },
    { label: "₹10,000 - ₹50,000", value: "10K_TO_50K" },
    { label: "₹50,000 - ₹1,50,000", value: "50K_TO_150K" },
    { label: "Above ₹1,50,000", value: "ABOVE_150K" }
  ];

  const filteredProjects = projects.filter(proj => {
    const techMatches = selectedTechs.length === 0 || proj.techStack.some(t => selectedTechs.includes(t));
    const hiringMatches = selectedHiringTypes.length === 0 || selectedHiringTypes.includes(proj.hiringType);
    
    let budgetMatches = selectedBudgets.length === 0;
    if (selectedBudgets.length > 0) {
      if (selectedBudgets.includes("UNDER_10K") && proj.budget < 10000) budgetMatches = true;
      if (selectedBudgets.includes("10K_TO_50K") && proj.budget >= 10000 && proj.budget <= 50000) budgetMatches = true;
      if (selectedBudgets.includes("50K_TO_150K") && proj.budget > 50000 && proj.budget <= 150000) budgetMatches = true;
      if (selectedBudgets.includes("ABOVE_150K") && proj.budget > 150000) budgetMatches = true;
    }

    return techMatches && hiringMatches && budgetMatches;
  });

  return (
    <div className="space-y-6">
      {/* Tab bar header */}
      <div className="bg-white text-slate-800 rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-sans font-bold text-slate-900">Welcome back, {devProfile.fullName}</h2>
            <div className="bg-brand-teal-light text-brand-teal-dark text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-brand-teal/20 uppercase tracking-wide">
              Top 1% Vetted
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-0">Managing your tech credentials, rate settings, and project applications.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-105 p-1 rounded-xl border border-slate-200/60 self-stretch md:self-auto justify-around">
          {(["dashboard", "projects"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all uppercase tracking-wide cursor-pointer ${
                activeTab === tab 
                  ? "bg-brand-teal text-white shadow-sm font-bold" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              {tab}
            </button>
          ))}
          {/* Pending invites mini marker */}
          <button
            onClick={() => setActiveTab("invites")}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all uppercase tracking-wide relative cursor-pointer ${
              activeTab === "invites"
                ? "bg-brand-teal text-white shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-800 hover:bg-white"
            }`}
          >
            Invites
            {invites.filter(i => i.status === InviteStatus.PENDING).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-bounce" />
            )}
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Analytics Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Profile Views</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{devProfile?.analytics?.profileViews ?? 0}</h3>
              </div>
              <p className="text-[11px] text-brand-teal font-bold flex items-center gap-1 mt-4">
                <TrendingUp className="w-3.5 h-3.5" /> +14.2% from search indices
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Recruiter Invites</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{devProfile?.analytics?.invitesCount ?? 0}</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-4">
                {invites.filter(i => i.status === InviteStatus.PENDING).length} pending response
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Proposals Sent</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{myApps.length}</h3>
              </div>
              <p className="text-[11px] text-brand-teal font-bold flex items-center gap-1 mt-4">
                {myApps.filter(a => a.status === ApplicationStatus.SHORTLISTED).length} shortlisted
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Assigned Hires</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  {myApps.filter(a => a.status === ApplicationStatus.ACCEPTED).length}
                </h3>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-4">
                Active Escrow contract enabled
              </p>
            </div>
          </div>

          {/* Contact access requests from recruiters */}
          {pendingRequests.length > 0 && (
            <div className="p-4 bg-brand-teal-light border border-brand-teal/20 rounded-xl text-brand-teal-dark space-y-3">
              <div className="flex items-center gap-2 text-brand-navy">
                <Sparkles className="w-5 h-5 text-brand-teal animate-pulse" />
                <h3 className="font-bold text-sm">Action Required: Recruiter Contact Request</h3>
              </div>
              <p className="text-xs text-slate-600">
                Startups on our system want to schedule call interviews or send contracts. Accept to reveal your email and phone credentials safely.
              </p>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">
                      Recruiter ID: <span className="font-mono text-brand-teal font-bold">{req.recruiterId.substring(0, 8)}...</span> wants your details.
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onRespondContact(req.id, "APPROVED")}
                        className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        Approve Details
                      </button>
                      <button 
                        onClick={() => onRespondContact(req.id, "REJECTED")}
                        className="bg-white hover:bg-slate-50 text-slate-500 text-xs px-3 py-1.5 rounded-lg border border-slate-205 transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Job Applications tracker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-teal" /> Active Applications Status Tracker
            </h3>
            <div className="divide-y divide-slate-100">
              {myApps.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No submitted proposals. Head over to the "Projects" tab to browse matched jobs!</p>
              ) : (
                myApps.map((appl) => {
                  const proj = projects.find(p => p.id === appl.projectId);
                  return (
                    <div key={appl.id} className="py-5 border-b border-sidebar-divider flex flex-col hover:bg-slate-50/25 p-4 rounded-xl transition-all gap-4 text-xs text-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{proj?.title || "SaaS Project"}</h4>
                          <p className="text-xs text-slate-500 font-mono mt-1">
                            Proposed Base Rate: ₹{appl.proposedRate.toLocaleString()}/hour • Proposed Duration: {appl.timelineEstimate}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            appl.status === ApplicationStatus.ACCEPTED ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50 animate-pulse" :
                            appl.status === ApplicationStatus.SHORTLISTED ? "bg-brand-teal-light text-brand-teal-dark border border-brand-teal/20" :
                            appl.status === ApplicationStatus.PENDING ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                            "bg-rose-50 text-rose-700 border border-rose-200/50"
                          }`}>
                            {appl.status}
                          </span>
                          {appl.status === ApplicationStatus.ACCEPTED && proj && (
                            <button
                              onClick={() => onInitiateChat(proj.recruiterId, currentUser.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 animate-fade-in"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Start Chat</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ACTIVE CONTRACT WORKSPACE PANELS */}
                      {appl.status === ApplicationStatus.ACCEPTED && proj && (() => {
                        const projectNda = ndas.find(n => n.projectId === appl.projectId && n.developerId === currentUser.id);
                        const projectStagesList = projectStages.filter(s => s.projectId === appl.projectId);
                        
                        return (
                          <div className="mt-2 pt-4 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-800 border-dashed animate-fade-in">
                            
                            {/* DIGITAL NDA AGREEMENT DISPLAY */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
                                  <FileText className="w-4 h-4 text-brand-teal" /> Legally Bound Digital NDA
                                </span>
                                {projectNda ? (
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                                    projectNda.status === "SIGNED" 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                                  }`}>
                                    {projectNda.status === "SIGNED" ? "Mutually Signed" : "Signature Required"}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border uppercase">
                                    Not Prepared
                                  </span>
                                )}
                              </div>

                              {projectNda ? (
                                <div className="space-y-3">
                                  <p className="text-slate-550 leading-normal text-[11px]">
                                    Please read this NDA and compliance document drafted by the recruiter carefully. Typographically authorize your signature to execute.
                                  </p>

                                  <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 max-h-32 overflow-y-auto font-mono text-[9px] leading-relaxed whitespace-pre-wrap select-all text-slate-800">
                                    {projectNda.terms}
                                  </div>

                                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10.5px] space-y-1">
                                    <p className="flex items-center gap-1.5">
                                      <span className="text-slate-400 font-bold font-mono text-[10px]">Recruiter Signature:</span> 
                                      {projectNda.recruiterSignature ? (
                                        <span className="font-mono text-emerald-600 font-bold">✍️ {projectNda.recruiterSignature}</span>
                                      ) : (
                                        <span className="italic text-amber-600">Pending recruiter countersign...</span>
                                      )}
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                      <span className="text-slate-400 font-bold font-mono text-[10px]">Developer Signature:</span> 
                                      {projectNda.developerSignature ? (
                                        <span className="font-mono text-emerald-600 font-bold">✍️ {projectNda.developerSignature} (Mutual Active)</span>
                                      ) : (
                                        <span className="italic text-amber-600">Your Signature Required</span>
                                      )}
                                    </p>
                                  </div>

                                  {!projectNda.developerSignature && (
                                    <div className="space-y-2 pt-1 border-t border-slate-100">
                                      <label className="block text-[10px] font-mono uppercase font-bold text-slate-700">Type Your Full Name to Sign:</label>
                                      <div className="flex gap-2">
                                        <input
                                          value={typedDevSignature[appl.id] || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setTypedDevSignature(prev => ({ ...prev, [appl.id]: val }));
                                          }}
                                          className="flex-1 bg-white border border-slate-205 rounded-lg p-1.5 font-mono text-xs focus:ring-1 focus:ring-brand-teal outline-none"
                                          placeholder="e.g. Aryan Sharma"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const sig = typedDevSignature[appl.id];
                                            if (!sig) return alert("Please type your signing name first.");
                                            if (onSignNDA) {
                                              onSignNDA(projectNda.id, "DEVELOPER", sig);
                                              alert("NDA Contract signed successfully! The legal documents are active.");
                                            }
                                          }}
                                          className="bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-[10.5px] px-4 rounded-lg transition-all cursor-pointer"
                                        >
                                          Sign NDA
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 border border-dashed rounded-lg">
                                  Recruiter has not sent the draft NDA yet. Let them know in Direct Chat!
                                </p>
                              )}
                            </div>

                            {/* PROJECT STAGES AND MILESTONES (DEVELOPER CO-CREATION SUPPORTED) */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
                                  <Layers className="w-4 h-4 text-brand-teal" /> Nature-Based Project Stages
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border font-semibold">
                                  {projectStagesList.length} Milestones
                                </span>
                              </div>

                              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                {projectStagesList.length === 0 ? (
                                  <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed">
                                    <p className="text-xs text-slate-400 italic font-medium">No stages scheduled yet.</p>
                                    <p className="text-[10px] text-slate-505 leading-normal mt-0.5 font-medium">Use the constructor below to propose nature-certified milestones!</p>
                                  </div>
                                ) : (
                                  projectStagesList.map(stage => {
                                    const isApproved = stage.status === "APPROVED";
                                    const isCompleted = stage.status === "COMPLETED";
                                    const isSpecial = isApproved || isCompleted;

                                    let warningMessage = null;
                                    let warningSeverity: "critical" | "warning" = "warning";
                                    if (stage.dueDate && !isCompleted) {
                                      const dueTime = new Date(stage.dueDate).getTime();
                                      const nowTime = Date.now();
                                      const diffMs = dueTime - nowTime;
                                      const diffHrs = diffMs / (1000 * 60 * 60);
                                      if (diffHrs < 0) {
                                        warningMessage = "Overdue project milestone!";
                                        warningSeverity = "critical";
                                      } else if (diffHrs <= 48) {
                                        const roundedHrs = Math.max(0, Math.round(diffHrs));
                                        warningMessage = `Stage due within 48 hours (${roundedHrs === 0 ? "less than 1h" : `${roundedHrs}h`} left)`;
                                        warningSeverity = "warning";
                                      }
                                    }

                                    return (
                                      <motion.div
                                        key={`${stage.id}-${stage.status}`}
                                        initial={isSpecial ? { opacity: 0, y: 12, scale: 0.94 } : { opacity: 0, y: 6 }}
                                        animate={isSpecial ? {
                                          opacity: [0, 1, 1],
                                          y: [12, -2, 0],
                                          scale: [0.94, 1.04, 1]
                                        } : {
                                          opacity: 1,
                                          y: 0,
                                          scale: 1
                                        }}
                                        transition={{
                                          duration: isSpecial ? 0.45 : 0.25,
                                          ease: "easeOut"
                                        }}
                                        className={`p-3 rounded-lg space-y-2 text-[11px] border ${
                                          isCompleted 
                                            ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm shadow-emerald-100" 
                                            : isApproved
                                            ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm shadow-indigo-100"
                                            : "bg-slate-105 border-slate-200"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <h5 className="font-bold text-slate-900 leading-tight">{stage.title}</h5>
                                          <span className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                                            isCompleted 
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                              : isApproved
                                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                              : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                                          }`}>
                                            {stage.status}
                                          </span>
                                        </div>
                                        <p className="text-slate-600 text-xs leading-relaxed">{stage.description}</p>
                                        
                                        {warningMessage && (
                                          <div className={`p-2 rounded border text-[10px] font-medium flex items-center gap-1.5 transition-all ${
                                            warningSeverity === "critical"
                                              ? "bg-rose-50 text-rose-700 border-rose-200"
                                              : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                                          }`}>
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>{warningMessage}</span>
                                          </div>
                                        )}

                                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-150 pt-1.5 mt-1">
                                          <span>Value: ₹{stage.cost?.toLocaleString() || "0"}</span>
                                          <span>Due: {stage.dueDate ? new Date(stage.dueDate).toLocaleDateString() : "TBD"}</span>
                                        </div>

                                        {stage.status === "PROPOSED" && stage.createdBy === "DEVELOPER" && (
                                          <div className="text-[9px] font-mono font-medium text-amber-600 bg-amber-50 border border-amber-100 p-1 rounded text-center">
                                            Proposing, waiting for recruiter approval...
                                          </div>
                                        )}
                                      </motion.div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Form to co-create stage */}
                              <div className="bg-slate-50 border border-slate-205 rounded-xl p-3.5 space-y-2.5">
                                <p className="font-bold text-[10px] font-mono uppercase text-slate-700">Propose Nature-Wise Stage / Milestone:</p>
                                
                                <div className="space-y-1.5">
                                  <input
                                    value={devStageTitle[appl.id] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDevStageTitle(prev => ({ ...prev, [appl.id]: val }));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] focus:ring-1 focus:ring-brand-teal outline-none"
                                    placeholder="Stage Title (e.g., GraphQL Schema Deployment)"
                                  />
                                  <textarea
                                    value={devStageDesc[appl.id] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDevStageDesc(prev => ({ ...prev, [appl.id]: val }));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] focus:ring-1 focus:ring-brand-teal outline-none resize-none"
                                    rows={1.5}
                                    placeholder="Detail the deliverable specifications NatureOfWork..."
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="space-y-1">
                                    <span className="block text-[9.5px] font-mono text-slate-500">Milestone Cost (₹):</span>
                                    <input
                                      type="number"
                                      value={devStageCost[appl.id] || ""}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDevStageCost(prev => ({ ...prev, [appl.id]: val }));
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-mono focus:ring-1 focus:ring-brand-teal outline-none"
                                      placeholder="e.g. 15000"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="block text-[9.5px] font-mono text-slate-500">DueDate:</span>
                                    <input
                                      type="date"
                                      value={devStageDueDate[appl.id] || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDevStageDueDate(prev => ({ ...prev, [appl.id]: val }));
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-mono focus:ring-1 focus:ring-brand-teal outline-none"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const titleStr = devStageTitle[appl.id];
                                    const descStr = devStageDesc[appl.id];
                                    const costVal = devStageCost[appl.id] || 0;
                                    const dueStr = devStageDueDate[appl.id] || new Date().toISOString();
                                    
                                    if (!titleStr || !descStr) {
                                      return alert("Please enter both title and description.");
                                    }
                                    if (onCreateStage) {
                                      onCreateStage(appl.projectId, titleStr, descStr, costVal, dueStr, "DEVELOPER");
                                      
                                      setDevStageTitle(prev => ({ ...prev, [appl.id]: "" }));
                                      setDevStageDesc(prev => ({ ...prev, [appl.id]: "" }));
                                      setDevStageCost(prev => ({ ...prev, [appl.id]: 0 }));
                                      setDevStageDueDate(prev => ({ ...prev, [appl.id]: "" }));
                                      alert("Proposed milestone stage successfully sent to recruiter for check & activation!");
                                    }
                                  }}
                                  className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white font-bold p-1.5 rounded-lg transition-all text-center tracking-wider uppercase font-mono text-[10px] cursor-pointer"
                                >
                                  Propose Project Stage
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROJECTS LIST TAB */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">Discover Open Opportunities</h3>
              <p className="text-xs text-slate-500">Apply to prime start-up requirements with fair minimum wage guarantees.</p>
            </div>
            <div className="flex gap-2 font-mono">
              <span className="text-xs text-brand-teal bg-brand-teal-light px-3 py-1.5 rounded-lg border border-brand-teal/20 font-bold">
                Platform wage floors: Min ₹500/hr
              </span>
            </div>
          </div>

          {/* ADAPTIVE FILTER CONTROLS HUBS */}
          {/* 1. Desktop View Inline Filters */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in text-xs text-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">Filter Workspace ({filteredProjects.length} results)</span>
                <h4 className="text-sm font-bold text-slate-800">Dynamic Matching Core Filters</h4>
              </div>
              {(selectedTechs.length > 0 || selectedHiringTypes.length > 0 || selectedBudgets.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTechs([]);
                    setSelectedHiringTypes([]);
                    setSelectedBudgets([]);
                  }}
                  className="text-xs font-mono font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tech Stack Filter Multi select */}
              <div className="space-y-2">
                <span className="block text-[10px] font-mono uppercase font-bold text-slate-500">Technology Stack</span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {availableTechs.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No technology tags indexed.</span>
                  ) : (
                    availableTechs.map(tech => {
                      const isSelected = selectedTechs.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTechs(prev => prev.filter(t => t !== tech));
                            } else {
                              setSelectedTechs(prev => [...prev, tech]);
                            }
                          }}
                          className={`text-[10px] font-mono px-2.5 py-1 rounded transition-all border font-semibold outline-none cursor-pointer ${
                            isSelected 
                              ? "bg-brand-teal text-white border-brand-teal shadow-xs font-bold" 
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          {tech} {isSelected ? "✕" : ""}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Hiring Type Filter Multi-select */}
              <div className="space-y-2">
                <span className="block text-[10px] font-mono uppercase font-bold text-slate-500">Hiring Nature Scope</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableHiringTypes.map(type => {
                    const isSelected = selectedHiringTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedHiringTypes(prev => prev.filter(h => h !== type));
                          } else {
                            setSelectedHiringTypes(prev => [...prev, type]);
                          }
                        }}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded transition-all border font-semibold outline-none cursor-pointer ${
                          isSelected 
                            ? "bg-brand-teal text-white border-brand-teal shadow-xs font-bold" 
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {type} {isSelected ? "✕" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Range Filter Multi-select */}
              <div className="space-y-2">
                <span className="block text-[10px] font-mono uppercase font-bold text-slate-500">Budget Bracket (₹)</span>
                <div className="flex flex-wrap gap-1.5">
                  {budgetOptions.map(opt => {
                    const isSelected = selectedBudgets.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBudgets(prev => prev.filter(b => b !== opt.value));
                          } else {
                            setSelectedBudgets(prev => [...prev, opt.value]);
                          }
                        }}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded transition-all border font-semibold outline-none cursor-pointer ${
                          isSelected 
                            ? "bg-brand-teal text-white border-brand-teal shadow-xs font-bold" 
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {opt.label} {isSelected ? "✕" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Adaptive Compact Mobile/Tablet Trigger Bar */}
          <div className="lg:hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-fade-in text-xs text-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800">Job Parameters Matching</h4>
                <p className="text-[10px] text-slate-500">{filteredProjects.length} candidate projects filtered</p>
              </div>
              <button
                type="button"
                id="toggle-mobile-filters-btn"
                onClick={() => setIsMobileFilterOpen(true)}
                className="bg-brand-teal text-white hover:bg-[#0d6e66] active:scale-98 font-bold text-[11px] px-3.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all outline-none"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {(selectedTechs.length + selectedHiringTypes.length + selectedBudgets.length) > 0 && (
                  <span className="bg-[#001c3d] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black ml-1">
                    {selectedTechs.length + selectedHiringTypes.length + selectedBudgets.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tap-to-remove active filters list */}
            {(selectedTechs.length > 0 || selectedHiringTypes.length > 0 || selectedBudgets.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[9px] font-mono uppercase text-slate-400 mr-1 font-bold">Active:</span>
                {selectedTechs.map(tech => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => setSelectedTechs(prev => prev.filter(t => t !== tech))}
                    className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 text-[9px] font-mono pl-2 pr-1.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1 outline-none transition-all cursor-pointer"
                  >
                    <span>{tech}</span>
                    <X className="w-2.5 h-2.5 opacity-60" />
                  </button>
                ))}
                {selectedHiringTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedHiringTypes(prev => prev.filter(h => h !== type))}
                    className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 text-[9px] font-mono pl-2 pr-1.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1 outline-none transition-all cursor-pointer"
                  >
                    <span>{type}</span>
                    <X className="w-2.5 h-2.5 opacity-60" />
                  </button>
                ))}
                {selectedBudgets.map(val => {
                  const label = budgetOptions.find(o => o.value === val)?.label || val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelectedBudgets(prev => prev.filter(b => b !== val))}
                      className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 text-[9px] font-mono pl-2 pr-1.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1 outline-none transition-all cursor-pointer"
                    >
                      <span>{label}</span>
                      <X className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTechs([]);
                    setSelectedHiringTypes([]);
                    setSelectedBudgets([]);
                  }}
                  className="text-[9px] font-mono font-bold text-rose-600 hover:underline cursor-pointer ml-auto pl-2"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* 3. Off-Canvas Drawer Implementation utilizing AnimatePresence */}
          <AnimatePresence>
            {isMobileFilterOpen && (
              <div id="mobile-filter-drawer-system" className="relative z-50 lg:hidden">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
                />

                {/* Sliding Drawer Container */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl flex flex-col h-full z-50 text-slate-800"
                >
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                    <div>
                      <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                        <Filter className="w-4 h-4 text-brand-teal" /> Filter Projects
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">{filteredProjects.length} matching result{filteredProjects.length === 1 ? "" : "s"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors outline-none cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
                    {/* Technology Stack filter */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Technology Stack</span>
                        {selectedTechs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedTechs([])}
                            className="text-[10px] font-mono text-rose-500 font-semibold hover:underline cursor-pointer"
                          >
                            clear stack
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTechs.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No technology tags indexed.</span>
                        ) : (
                          availableTechs.map(tech => {
                            const isSelected = selectedTechs.includes(tech);
                            return (
                              <button
                                key={tech}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedTechs(prev => prev.filter(t => t !== tech));
                                  } else {
                                    setSelectedTechs(prev => [...prev, tech]);
                                  }
                                }}
                                className={`text-[10px] font-mono px-3 py-1.5 rounded-lg transition-all border font-semibold outline-none cursor-pointer ${
                                  isSelected 
                                    ? "bg-brand-teal text-white border-brand-teal font-bold" 
                                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                                }`}
                              >
                                {tech} {isSelected ? "✕" : ""}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Hiring Nature filter */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Hiring Nature Scope</span>
                        {selectedHiringTypes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedHiringTypes([])}
                            className="text-[10px] font-mono text-rose-500 font-semibold hover:underline cursor-pointer"
                          >
                            clear scope
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableHiringTypes.map(type => {
                          const isSelected = selectedHiringTypes.includes(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedHiringTypes(prev => prev.filter(h => h !== type));
                                } else {
                                  setSelectedHiringTypes(prev => [...prev, type]);
                                }
                              }}
                              className={`text-[10px] font-mono px-3 py-1.5 rounded-lg transition-all border font-semibold outline-none cursor-pointer ${
                                isSelected 
                                  ? "bg-brand-teal text-white border-brand-teal font-bold" 
                                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                              }`}
                            >
                              {type} {isSelected ? "✕" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Budget Bracket filter */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Budget Bracket (₹)</span>
                        {selectedBudgets.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedBudgets([])}
                            className="text-[10px] font-mono text-rose-500 font-semibold hover:underline cursor-pointer"
                          >
                            clear budget
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {budgetOptions.map(opt => {
                          const isSelected = selectedBudgets.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedBudgets(prev => prev.filter(b => b !== opt.value));
                                } else {
                                  setSelectedBudgets(prev => [...prev, opt.value]);
                                }
                              }}
                              className={`text-left text-[11px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between font-medium outline-none transition-all cursor-pointer ${
                                isSelected 
                                  ? "bg-brand-teal/5 text-brand-teal border-brand-teal font-bold" 
                                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <span className="text-brand-teal font-bold">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sticky Bottom Actions Bar */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-2.5">
                    {(selectedTechs.length > 0 || selectedHiringTypes.length > 0 || selectedBudgets.length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTechs([]);
                          setSelectedHiringTypes([]);
                          setSelectedBudgets([]);
                        }}
                        className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl transition-all cursor-pointer flex-1 outline-none text-[11px]"
                      >
                        Reset All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="bg-brand-teal hover:bg-[#0d6e66] text-white font-bold px-5 py-3 rounded-xl shadow-xs transition-all cursor-pointer flex-1 text-center outline-none text-[11px]"
                    >
                      {filteredProjects.length === 0 
                        ? "Close Filters" 
                        : `Show ${filteredProjects.length} project${filteredProjects.length === 1 ? "" : "s"}`
                      }
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm animate-fade-in text-xs text-slate-800">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Open Opportunities Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                No recruiter requirements match your active criteria parameters. Try removing some filters or resetting to original.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTechs([]);
                  setSelectedHiringTypes([]);
                  setSelectedBudgets([]);
                }}
                className="mt-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Reset Matching Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {filteredProjects.map((proj) => {
                const applied = myApps.some(a => a.projectId === proj.id);
                return (
                  <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-teal/30 hover:shadow-sm transition-all project-card relative shadow-sm text-xs text-slate-800">
                    {proj.aiSuggestedMetrics && (
                      <div className="absolute top-4 right-4 bg-brand-teal-light text-brand-teal-dark text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-brand-teal/20 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 animate-pulse" /> High AI Match
                      </div>
                    )}
                    <div className="space-y-3">
                      <h4 className="text-base font-bold text-slate-900 leading-snug">{proj.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{proj.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {proj.techStack.map(s => (
                          <span key={s} className="bg-slate-50 text-brand-teal text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Recruiter / Employer Reputation Log */}
                      {(() => {
                        const recruiterReviews = reviews.filter(r => r.revieweeId === proj.recruiterId);
                        const avgRating = recruiterReviews.length > 0 
                          ? (recruiterReviews.reduce((acc, curr) => acc + curr.rating, 0) / recruiterReviews.length).toFixed(1)
                          : null;
                        return (
                          <div className="mt-3 bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Recruiter Scorecard:</span>
                              {avgRating ? (
                                <div className="flex items-center text-amber-500 font-mono text-[11px] font-bold">
                                  {"★".repeat(Math.round(Number(avgRating)))}
                                  {"☆".repeat(5 - Math.round(Number(avgRating)))}
                                  <span className="ml-1 text-slate-700 font-bold">({avgRating}/5)</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-450 italic font-medium">New Employer (No Ratings Yet)</span>
                              )}
                            </div>

                            {/* Accordion or expand/collapse for employer reviews */}
                            <div className="space-y-2">
                              {recruiterReviews.length > 0 && (
                                <div className="max-h-24 overflow-y-auto space-y-1.5 divide-y divide-slate-200/50 pr-1 select-text">
                                  {recruiterReviews.map(rev => (
                                    <div key={rev.id} className="pt-1.5 first:pt-0">
                                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                                        <span className="font-semibold text-slate-600">{rev.reviewerName}</span>
                                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-600 italic">"{rev.comment}"</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Form to leave a review of this recruiter */}
                              <details className="group border-t border-slate-200/60 pt-2 pointer-events-auto">
                                <summary className="text-[10px] text-brand-teal font-extrabold hover:underline cursor-pointer list-none flex items-center gap-1 focus:outline-none">
                                  <span className="transition-transform group-open:rotate-90">▶</span>
                                  <span>Write a Review for Employer</span>
                                </summary>
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const rating = Number((form.elements.namedItem("rating") as HTMLSelectElement).value);
                                    const comment = (form.elements.namedItem("comment") as HTMLTextAreaElement).value;
                                    
                                    if (!comment.trim()) {
                                      alert("Please write feedback first.");
                                      return;
                                    }

                                    if (onPostReview) {
                                      onPostReview({
                                        projectId: proj.id,
                                        reviewerId: currentUser.id,
                                        reviewerName: devProfile.fullName || "Vetted Developer",
                                        revieweeId: proj.recruiterId,
                                        rating,
                                        comment
                                      });
                                      form.reset();
                                      alert("Employer review posted successfully!");
                                    }
                                  }}
                                  className="space-y-2 mt-2 bg-white p-2.5 rounded-lg border border-slate-200"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <label className="text-[10px] text-slate-500 font-bold">Select Stars:</label>
                                    <select
                                      name="rating"
                                      className="bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-bold rounded-md px-1.5 py-0.5"
                                      defaultValue="5"
                                    >
                                      <option value="5">5/5 - Prompt & Clean Coordination</option>
                                      <option value="4">4/5 - Professional Engagement</option>
                                      <option value="3">3/5 - Solid Response Delivery</option>
                                      <option value="2">2/5 - Delayed Payments / Comm</option>
                                      <option value="1">1/5 - Poor Cooperation</option>
                                    </select>
                                  </div>
                                  <textarea
                                    name="comment"
                                    rows={1}
                                    placeholder="Help other freelancers. Share deadline flexibility, clear specifications, and payment transparency..."
                                    className="w-full bg-slate-50 border border-slate-205 text-[10px] rounded p-1.5 placeholder-slate-400 font-light focus:outline-none focus:ring-1 focus:ring-brand-teal"
                                  />
                                  <button
                                    type="submit"
                                    className="w-full text-center bg-brand-teal/10 hover:bg-brand-teal text-brand-teal hover:text-white text-[9px] font-bold py-1 rounded transition-colors cursor-pointer"
                                  >
                                    Publish Employer Feedback
                                  </button>
                                </form>
                              </details>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="pt-6 border-t border-slate-100 mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs font-semibold text-slate-500">
                        Budget: <span className="font-bold text-slate-900">₹{proj.budget.toLocaleString()}</span> ({proj.hiringType})
                      </div>
                      {applied ? (
                        <span className="text-xs text-brand-teal font-bold flex items-center gap-1.5 bg-brand-teal-light px-3 py-1.5 rounded-lg border border-brand-teal/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => openApplyFlow(proj)}
                          className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          Apply Proposal
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROFILE CONFIG TAB (REMOVED: Now handled by the global Profile Settings dynamic drawer) */}
      {false && (
        <div className="space-y-6 animate-fade-in">
          {/* Profile Completeness Dashboard */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-[#0c1c2b] rounded-2xl p-6 text-white shadow-lg space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-teal-500/20 text-teal-300 text-[10px] font-mono uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border border-teal-500/30">
                    Profile Diagnostic
                  </span>
                  <span className="text-slate-400 text-xs font-mono">• Completeness Score</span>
                </div>
                <h3 className="text-lg font-bold mt-1">Profile Excellence Score</h3>
                <p className="text-xs text-slate-300 mt-0.5">Maintain a high score to rank better in recruiter developer searches and match filters.</p>
              </div>

              <div className="flex items-baseline gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Rating:</span>
                <span className="font-bold text-xs text-yellow-300">
                  {completenessScore <= 40 ? "Needs Work ⚠️" : completenessScore <= 75 ? "Looking Good 👍" : completenessScore <= 95 ? "Excellent Profile! ✨" : "Elite Status 🔥"}
                </span>
                <span className="text-teal-400 font-extrabold text-2xl ml-2">{completenessScore}%</span>
              </div>
            </div>

            {/* Progress bar container */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="font-medium">Excellence Criteria Checklist</span>
                <span className="font-mono text-teal-300 font-bold">{completenessScore}/100%</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${completenessScore}%` }}
                />
              </div>
            </div>

            {/* Dynamic Suggestions List */}
            {completenessSuggestions.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Recommended actions to reach 100% profile completeness:</h4>
                  <span className="text-[10px] bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded px-2 py-0.5 font-mono">{completenessSuggestions.length} pending settings</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {completenessSuggestions.map((sug) => (
                    <button
                      key={sug.field}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(sug.elementId);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.focus();
                        }
                      }}
                      className="flex items-center justify-between text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-slate-800/60 hover:border-teal-400/50 transition-all cursor-pointer group shrink-0"
                    >
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono font-medium">{sug.group}</p>
                        <p className="text-xs font-semibold text-slate-100 group-hover:text-teal-300 transition-colors mt-0.5">{sug.field}</p>
                      </div>
                      <span className="text-[11px] font-bold font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0 ml-2">
                        +{sug.boost}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex gap-3 items-center p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-200 text-xs">
                <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Perfect Score Achieved!</p>
                  <p className="text-slate-300 text-xs leading-relaxed mt-0.5">Every diagnostic field has been configured perfectly. Your profile maintains top priority in match algorithms.</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleProfileSave} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Professional Developer Profile Settings</h3>
                <p className="text-xs text-slate-500">Configure experience settings, active status parameters, location, rates and links.</p>
              </div>
              
              <button
                type="button"
                disabled={isAIProfileLoading}
                onClick={triggerAIProfileOptimization}
                className="bg-gradient-to-tr from-brand-teal to-[#001c3d] hover:brightness-110 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 self-stretch md:self-auto justify-center disabled:opacity-50 cursor-pointer shadow-sm text-center"
              >
                <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>{isAIProfileLoading ? "Optimizing with Gemini..." : "Optimize with Gemini AI"}</span>
              </button>
            </div>

            {/* Section 1: Identity & Status */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">1. Developer Profile Identity</h4>
              
              {/* Profile Image (JPEG Format Only) Uploader */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU"}
                    alt="Profile Avatar"
                    className="w-16 h-16 rounded-full border border-slate-300 object-cover shadow-sm bg-white"
                  />
                  <div className="absolute bottom-0 right-0 bg-brand-teal text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white leading-none">
                    JPEG
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">Display Profile Picture</span>
                  <p className="text-[11px] text-slate-500 leading-tight">Upload a professional face photo. File can be JPEG, PNG or WebP format.</p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="file"
                      id="dev-photo-upload"
                      accept="image/jpeg, image/jpg, image/png, image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="dev-photo-upload"
                      className="bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold px-3 py-1.5 border border-slate-300 rounded cursor-pointer transition-colors shadow-sm inline-block"
                    >
                      Choose Profile Image
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="text-red-500 hover:text-red-700 text-[11px] font-bold hover:underline"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                  <input 
                    id="input-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="Enter Full Name" 
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Headline *</label>
                  <input 
                    id="input-headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="e.g. Senior Frontend Architect & Rust Developer" 
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Technical Bio Summary *</label>
                  <textarea 
                    id="input-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none resize-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="Discuss master technologies, scalable service orchestrations, or framework architecture preferences..." 
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Availability & Contract Status</label>
                  <input 
                    id="input-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="e.g. Ready for immediate full-time hire; Active on secondary projects; Consulting part-time" 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Experience & Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">2. Core Tech Stack & Experience</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Skills & Technologies (comma separated) *</label>
                  <input 
                    id="input-skills"
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="e.g. React, GO, PostgreSQL, TypeScript, Docker" 
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Ex. Years *</label>
                    <input 
                      id="input-experience"
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                      min={0}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Availability *</label>
                    <select
                      id="select-availability"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20 h-[38px] cursor-pointer"
                      required
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">Physical Location</label>
                  <input 
                    id="input-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="e.g. Bangalore, Karnataka, India" 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Secure Contacts */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">3. Direct Contact details</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Toggle contact access visibility below to safeguard lists from scraping pools.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Direct Email ID Contact</label>
                  <input 
                    id="input-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="developer@example.com" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mobile Phone Number Contact</label>
                  <input 
                    id="input-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="+91 XXXXX XXXXX" 
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Retainers & Salary Rates */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">4. Client Retainer Rates (INR ₹)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Define your requested pay rates for hourly, weekly retainer, and monthly contracts.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Rate per Hour (₹) *</label>
                  <input 
                    id="input-hourly"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    min={0}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Weekly Rate (₹)</label>
                  <input 
                    id="input-weekly"
                    type="number"
                    value={weeklyRate}
                    onChange={(e) => setWeeklyRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    min={0}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Monthly Rate (₹)</label>
                  <input 
                    id="input-monthly"
                    type="number"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    min={0}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Online Social Ports */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">5. Professional Links & Social Profiles</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">GitHub URL</label>
                  <input 
                    id="input-github"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="github.com/username" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">LinkedIn URL</label>
                  <input 
                    id="input-linkedin"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="linkedin.com/in/username" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Project / Portfolio Link</label>
                  <input 
                    id="input-portfolio"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="portfolio.dev / liveproject.com" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <span className="text-xs text-slate-400 font-mono">
                IP Protection is active (Section 72 IT Act compliant).
              </span>
              <button
                type="submit"
                className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-8 py-3 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-brand-teal/40 outline-none cursor-pointer"
              >
                Save Configurations
              </button>
            </div>
          </form>

          {/* Email Notification Preferences Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-teal" /> Email Notification Preferences Settings
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure client match invitations and system alerts sent directly to {currentUser.email}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Invite toggle */}
              <div id="pref-invites-block" className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 font-sans">New Client & Project Invites</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Receive instant notifications when high-tier startups send invites matching your target stack rates.</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">Status: {emailNewInvites ? "Enabled" : "Disabled"}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="toggle-email-invites"
                      checked={emailNewInvites}
                      onChange={(e) => setEmailNewInvites(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
                  </label>
                </div>
              </div>

              {/* Updates toggle */}
              <div id="pref-updates-block" className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 font-sans">Application Status Updates</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Get notified immediately when recruiter authorities shortlist, approve, or fund your proposal milestones.</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">Status: {emailApplicationUpdates ? "Enabled" : "Disabled"}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="toggle-email-updates"
                      checked={emailApplicationUpdates}
                      onChange={(e) => setEmailApplicationUpdates(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
                  </label>
                </div>
              </div>

              {/* Chat toggle */}
              <div id="pref-chat-block" className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 font-sans">Direct Messages (Chat Alerts)</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Receive notices in your mailbox when client stakeholders send messages concerning active contracts.</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">Status: {emailChatMessages ? "Enabled" : "Disabled"}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="toggle-email-chat"
                      checked={emailChatMessages}
                      onChange={(e) => setEmailChatMessages(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <span className="text-xs text-slate-400 font-mono">
                Changes persist instantly across platform mail daemons.
              </span>
              <button
                type="button"
                id="btn-save-preferences-dev"
                onClick={handlePreferencesSave}
                className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-brand-teal/40 outline-none cursor-pointer font-sans"
              >
                Save Preferences
              </button>
            </div>
          </div>

          <EmailGatewaySettings />
        </div>
      )}

      {/* RECRUITER INVITES TAB */}
      {activeTab === "invites" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-sans font-bold text-slate-900 text-sm">Recruiter Invitations Pool</h3>
          <p className="text-xs text-slate-500 mt-1">Accept invitations to coordinate project scope directly in Chat.</p>
          
          <div className="divide-y divide-slate-100 mt-4">
            {invites.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No active recruiter invitations received yet.</p>
            ) : (
              invites.map((inv) => {
                const proj = projects.find(p => p.id === inv.projectId);
                return (
                  <div key={inv.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">Project: {proj?.title || "Fintech System"}</h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                          inv.status === InviteStatus.PENDING ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                          inv.status === InviteStatus.ACCEPTED ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                          "bg-slate-100 text-slate-500 border border-slate-200/70"
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-body-sm">{inv.message}</p>
                    </div>

                    {inv.status === InviteStatus.PENDING && (
                      <div className="flex gap-2 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => onRespondInvite(inv.id, InviteStatus.ACCEPTED)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                        >
                          Accept Scope
                        </button>
                        <button
                          onClick={() => onRespondInvite(inv.id, InviteStatus.DECLINED)}
                          className="bg-white hover:bg-slate-50 text-slate-500 text-xs px-3 py-1.5 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {inv.status === InviteStatus.ACCEPTED && (
                      <div className="flex gap-2 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => onInitiateChat(inv.recruiterId, currentUser.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 animate-fade-in"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Recruiter</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* APPLY FLOW MODAL (With AI Proposal Generator!) */}
      {showApplyModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-6 text-slate-800 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Project Proposal Configuration</h3>
                <p className="text-xs text-slate-500">Apply to: {selectedProject.title}</p>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="p-1 cursor-pointer rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-brand-teal-light/40 p-4 rounded-xl border border-brand-teal/20 flex items-start gap-4">
              <div className="p-2 bg-gradient-to-tr from-brand-teal to-[#001c3d] rounded-lg text-white shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse text-emerald-300" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-brand-navy uppercase tracking-widest font-mono">Gemini Proposal Assist</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instantly craft a highly aligned proposal brief specifically tailored to match your skills with this project description.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isAIProposalLoading}
                    onClick={() => generateAIProposal(selectedProject)}
                    className="bg-white hover:bg-slate-50 text-brand-teal text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {isAIProposalLoading ? "Drafting Cover Letter..." : "Generate Cover with Gemini"}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Proposed Rate (₹/hour)</label>
                  <input 
                    type="number" 
                    value={applyRate}
                    onChange={(e) => setApplyRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none"
                    min={500}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Your Availability</label>
                  <select
                    value={applyAvail}
                    onChange={(e) => setApplyAvail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Estimated Timeline / Duration</label>
                <input 
                  type="text" 
                  value={applyTimeline}
                  onChange={(e) => setApplyTimeline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none"
                  placeholder="e.g. 3 months, 6 weeks"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Proposal / Cover Message</label>
                <textarea 
                  value={applyCover}
                  onChange={(e) => setApplyCover(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none resize-none"
                  placeholder="Please state how your technical milestones match this project requirements..."
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-slate-500 text-[10px] leading-relaxed border border-slate-150">
                By submitting this proposal, you agree that pay remains bound under Escrow guidelines. Our minimum wage guarantee of ₹500/hr applies to ensure premium quality.
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs hover:bg-slate-55 text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-lg text-xs shadow-sm cursor-pointer"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
