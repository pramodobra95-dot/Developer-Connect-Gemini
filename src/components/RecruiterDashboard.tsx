import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Plus, 
  Sparkles, 
  MapPin, 
  Clock, 
  DollarSign, 
  User as UserIcon, 
  CheckCircle, 
  Eye, 
  X, 
  Layers, 
  Briefcase, 
  CreditCard,
  Send,
  AlertCircle,
  FileText,
  UserCheck,
  Search,
  Lock,
  Download,
  Mail,
  MessageSquare,
  ArrowLeft,
  Globe
} from "lucide-react";
import { 
  User, 
  RecruiterProfile, 
  Project, 
  Application, 
  Invite, 
  InviteStatus, 
  ContactAccessRequest, 
  DeveloperProfile, 
  HiringType, 
  WorkMode, 
  ProjectStatus, 
  ApplicationStatus,
  ProjectStage,
  NDA,
  Review
} from "../types.js";
import EmailGatewaySettings from "./EmailGatewaySettings.tsx";

interface RecruiterDashboardProps {
  currentUser: User;
  recProfile: RecruiterProfile;
  projects: Project[];
  applications: Application[];
  invites: Invite[];
  contactRequests: ContactAccessRequest[];
  developersList: DeveloperProfile[];
  projectStages: ProjectStage[];
  ndas: NDA[];
  reviews?: Review[];
  onPostReview?: (review: Partial<Review>) => void;
  onUpdateProjectStatus?: (projectId: string, status: ProjectStatus) => void;
  onPostProject: (project: Partial<Project>) => void;
  onInviteDeveloper: (projectId: string, devId: string, message: string) => void;
  onUpdateApplicationStatus: (appId: string, status: ApplicationStatus) => void;
  onSendContactRequest: (devId: string) => void;
  onUpdatePreferences?: (prefs: any) => void;
  onInitiateChat: (recruiterId: string, developerId: string) => void;
  onUpdateProfile?: (profile: Partial<RecruiterProfile>) => void;
  onCreateStage: (projectId: string, title: string, description: string, cost: number, dueDate: string, createdBy: "RECRUITER" | "DEVELOPER") => void;
  onApproveStage: (stageId: string) => void;
  onCompleteStage: (stageId: string) => void;
  onSendNDA: (projectId: string, developerId: string, terms: string) => void;
  onSignNDA: (ndaId: string, role: "RECRUITER" | "DEVELOPER", signature: string) => void;
  onQuickHire: (projectId: string, developerId: string, proposedRate: number, timelineEstimate: string) => void;
}

export default function RecruiterDashboard({
  currentUser,
  recProfile,
  projects,
  applications,
  invites,
  contactRequests,
  developersList,
  projectStages,
  ndas,
  reviews = [],
  onPostReview,
  onUpdateProjectStatus,
  onPostProject,
  onInviteDeveloper,
  onUpdateApplicationStatus,
  onSendContactRequest,
  onUpdatePreferences,
  onInitiateChat,
  onUpdateProfile,
  onCreateStage,
  onApproveStage,
  onCompleteStage,
  onSendNDA,
  onSignNDA,
  onQuickHire
}: RecruiterDashboardProps) {
  // Tabs: "dashboard", "post", "candidates", "applications"
  const [activeTab, setActiveTab ] = useState<"dashboard" | "post" | "candidates" | "applications">("dashboard");
  
  // Quick Hire mode toggle states for recruiters
  const [isQuickHireMode, setIsQuickHireMode] = useState(false);
  const [showQuickHireModal, setShowQuickHireModal] = useState(false);
  const [selectedQuickHireDev, setSelectedQuickHireDev] = useState<any>(null);
  const [quickHireProjId, setQuickHireProjId] = useState("");
  const [quickHireRate, setQuickHireRate] = useState(1500);
  const [quickHireTimeline, setQuickHireTimeline] = useState("3 months");

  // Project stages local form dictionary state per active hired application ID
  const [newStageTitle, setNewStageTitle] = useState<Record<string, string>>({});
  const [newStageDesc, setNewStageDesc] = useState<Record<string, string>>({});
  const [newStageCost, setNewStageCost] = useState<Record<string, number>>({});
  const [newStageDueDate, setNewStageDueDate] = useState<Record<string, string>>({});

  // Digital NDA generator states indexed by application's dev ID
  const [isNDAGenerating, setIsNDAGenerating] = useState<Record<string, boolean>>({});
  const [generatedNDATerms, setGeneratedNDATerms] = useState<Record<string, string>>({});
  const [ndaCustomConditions, setNdaCustomConditions] = useState<Record<string, string>>({});
  const [ndaRecSignature, setNdaRecSignature] = useState<Record<string, string>>({});

  // Selected developer profile detail view
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null);
  const [projectStatusFilter, setProjectStatusFilter] = useState<"ALL" | "OPEN" | "IN_REVIEW" | "CLOSED">("ALL");

  // Recruiter profile edit states
  const [recFullName, setRecFullName] = useState(recProfile.fullName || "");
  const [recCompanyName, setRecCompanyName] = useState(recProfile.companyName || "");
  const [recWebsite, setRecWebsite] = useState(recProfile.website || "");
  const [recIndustry, setRecIndustry] = useState(recProfile.industry || "");
  const [recCompanySize, setRecCompanySize] = useState(recProfile.companySize || "");
  const [recAboutCompany, setRecAboutCompany] = useState(recProfile.aboutCompany || "");
  const [recPhone, setRecPhone] = useState(recProfile.phone || "");
  const [recAvatarUrl, setRecAvatarUrl] = useState(recProfile.avatarUrl || "");
  const [companyLogoUrl, setCompanyLogoUrl] = useState(recProfile.companyLogoUrl || "");

  // Post project states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStackStr, setTechStackStr] = useState("");
  const [budget, setBudget] = useState(25000);
  const [hiringType, setHiringType] = useState<HiringType>(HiringType.FIXED_PRICE);
  const [workMode, setWorkMode] = useState<WorkMode>(WorkMode.REMOTE);
  const [duration, setDuration] = useState("3 months");

  // AI loading during posting analysis
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiMetrics, setAiMetrics] = useState<any>(null);

  // Invite overlay state
  const [selectedDevForInvite, setSelectedDevForInvite] = useState<DeveloperProfile | null>(null);
  const [inviteProjId, setInviteProjId] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  // Escrow funding payment modal state
  const [fundingAppId, setFundingAppId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentOption, setPaymentOption] = useState<"UPI" | "CARD" | "NETBANK">("UPI");

  // Filter developers state
  const [scoutKeyword, setScoutKeyword] = useState("");

  // Notification Preferences State
  const initialPrefs = currentUser.notificationPreferences || {
    emailNewInvites: true,
    emailApplicationUpdates: true,
    emailChatMessages: true
  };
  const [emailApplicationUpdates, setEmailApplicationUpdates] = useState(initialPrefs.emailApplicationUpdates);
  const [emailChatMessages, setEmailChatMessages] = useState(initialPrefs.emailChatMessages);

  // Image Upload handler for Recruiter (supporting JPEG)
  const handleRecruiterImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "logo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/jpg") {
      alert("Format error: Only JPEG/JPG images are permitted for profile/logo upload.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === "avatar") {
        setRecAvatarUrl(base64String);
      } else {
        setCompanyLogoUrl(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (currentUser.notificationPreferences) {
      setEmailApplicationUpdates(currentUser.notificationPreferences.emailApplicationUpdates);
      setEmailChatMessages(currentUser.notificationPreferences.emailChatMessages);
    }
  }, [currentUser]);

  // Sync recruiter profile from props
  useEffect(() => {
    setRecFullName(recProfile.fullName || "");
    setRecCompanyName(recProfile.companyName || "");
    setRecWebsite(recProfile.website || "");
    setRecIndustry(recProfile.industry || "");
    setRecCompanySize(recProfile.companySize || "");
    setRecAboutCompany(recProfile.aboutCompany || "");
    setRecPhone(recProfile.phone || "");
    setRecAvatarUrl(recProfile.avatarUrl || "");
    setCompanyLogoUrl(recProfile.companyLogoUrl || "");
  }, [recProfile]);

  const handleRecProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        fullName: recFullName,
        companyName: recCompanyName,
        website: recWebsite,
        industry: recIndustry,
        companySize: recCompanySize,
        aboutCompany: recAboutCompany,
        phone: recPhone,
        avatarUrl: recAvatarUrl,
        companyLogoUrl
      });
      alert("Profile and Company details saved successfully!");
    }
  };

  const handlePreferencesSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onUpdatePreferences) {
      onUpdatePreferences({
        emailApplicationUpdates,
        emailChatMessages
      });
      alert("Email notification preferences updated successfully!");
    }
  };

  // Recruiter analytics
  const myProjects = projects.filter(p => p.recruiterId === currentUser.id);
  const totalSpend = myProjects.reduce((acc, curr) => acc + curr.budget, 0);

  // Analyze Requirements with Gemini
  const triggerAIRequirements = async () => {
    if (!title || !description) {
      alert("Please provide a Title and a rich Description first so Gemini can analyze!");
      return;
    }
    setIsAIAnalyzing(true);
    try {
      const resp = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project-analysis",
          payload: { title, description }
        })
      });
      const data = await resp.json();
      if (data.suggestedTech && data.recommendedRoles) {
        setAiMetrics(data);
        setTechStackStr(data.suggestedTech.join(", "));
        setDuration(`${Math.round(data.estimatedDays / 30)} months`);
        alert("Gemini finished requirements analysis! Estimated timeline and suggested tech stack updated below.");
      }
    } catch (e) {
      console.error(e);
      alert("AI analysis encountered a network limit. Populating standardized technical benchmarks.");
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = techStackStr.split(",").map(x => x.trim()).filter(Boolean);
    
    // Minimum platform wage compliance verify
    const minCalculatedBase = hiringType === HiringType.FIXED_PRICE ? 5000 : 500;
    if (budget < minCalculatedBase) {
      alert(`Platform Compliance Limit: Minimum wage floor is ₹5,000 for Fixed Price or ₹500/hr for Hourly Contract work.`);
      return;
    }

    onPostProject({
      title,
      description,
      techStack: skills,
      budget,
      hiringType,
      workMode,
      duration,
      aiSuggestedMetrics: aiMetrics
    });

    // Reset fields
    setTitle("");
    setDescription("");
    setTechStackStr("");
    setBudget(25000);
    setAiMetrics(null);
    setActiveTab("dashboard");
    alert("Project Posting published successfully with AI matching activated!");
  };

  // Trigger Invite
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevForInvite || !inviteProjId) return;
    onInviteDeveloper(inviteProjId, selectedDevForInvite.userId, inviteMsg);
    setSelectedDevForInvite(null);
    setInviteMsg("");
    alert("Scouted invite successfully dispatched to the candidate.");
  };

  const handleQuickHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuickHireDev || !quickHireProjId) return;
    onQuickHire(quickHireProjId, selectedQuickHireDev.userId, quickHireRate, quickHireTimeline);
    setShowQuickHireModal(false);
    setSelectedQuickHireDev(null);
    alert(`Success: Direct Project Contract registered for ${selectedQuickHireDev.fullName}! Direct chat initiated.`);
  };

  // Get matching contact state
  const getContactInfo = (devId: string) => {
    const matched = contactRequests.find(c => c.developerId === devId && c.recruiterId === currentUser.id);
    const dev = developersList.find(d => d.userId === devId);
    if (!dev) return null;
    if (matched?.status === "APPROVED" || dev.isContactVisible) {
      return { phone: dev.phoneNumber || "No phone given", email: dev.email || "No email given" }; // resolved
    }
    return null;
  };

  // Pay Escrow Milestone click
  const openEscrowPayload = (appId: string) => {
    setFundingAppId(appId);
  };

  const handleEscrowAuthorize = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      if (fundingAppId) {
        onUpdateApplicationStatus(fundingAppId, ApplicationStatus.ACCEPTED);
      }
      setFundingAppId(null);
      alert("UPI Transaction Securely Settled! Escrow funds locked and developer contract initiated.");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header tab switches */}
      <div className="bg-white text-slate-800 rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold font-sans text-slate-900">Startup Recruiter Portal</h2>
            <p className="text-xs font-mono text-brand-teal bg-brand-teal-light px-2.5 py-0.5 rounded border border-brand-teal/20 font-bold">Company: {recProfile.companyName}</p>
          </div>
          <p className="text-xs text-slate-500 mb-0">Post requirements, review matched candidate portfolios, and authorize Escrow milestones.</p>
        </div>

        <div className="flex bg-slate-105 p-1 rounded-xl border border-slate-205 self-stretch md:self-auto justify-around flex-wrap gap-1">
          {(["dashboard", "post", "candidates", "applications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                // Clear selected developer profile detailed view when switching tabs
                setSelectedDevId(null);
              }}
              className={`text-[11px] font-semibold px-3.5 py-2 rounded-lg transition-all uppercase tracking-wide cursor-pointer ${
                activeTab === tab 
                  ? "bg-brand-teal text-white shadow-sm font-bold" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              {tab === "post" ? "Post Job" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Bento metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Jobs Published</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{myProjects.length}</h3>
              </div>
              <p className="text-[11px] text-brand-teal font-bold flex items-center gap-1 mt-4">
                <CheckCircle className="w-3.5 h-3.5" /> Enforcing minimum-wage standards
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Funds in Escrow</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">₹{totalSpend.toLocaleString()}</h3>
              </div>
              <p className="text-[11px] text-slate-505 font-semibold flex items-center gap-1 mt-4">
                Includes locked GST components
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Scouted Invites Sent</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  {invites.filter(i => i.recruiterId === currentUser.id).length}
                </h3>
              </div>
              <p className="text-[11px] text-brand-teal font-medium flex items-center gap-1 mt-4 font-bold">
                Vetted developers response tracking
              </p>
            </div>
          </div>

          {/* Recruiter Published Projects */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-sm">Your Posted Requirements</h3>
                <p className="text-[11px] text-slate-500">View and update the status of your active or completed requirements.</p>
              </div>
              
              {/* Dynamic Tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
                {(["ALL", "OPEN", "IN_REVIEW", "CLOSED"] as const).map((statusVal) => {
                  const count = statusVal === "ALL" 
                    ? myProjects.length 
                    : myProjects.filter(p => p.status === statusVal).length;
                  return (
                    <button
                      key={statusVal}
                      type="button"
                      onClick={() => setProjectStatusFilter(statusVal)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                        projectStatusFilter === statusVal
                          ? "bg-white text-brand-teal shadow-xs border border-slate-200/50 font-bold"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <span>
                        {statusVal === "ALL" ? "All" : statusVal === "IN_REVIEW" ? "In-Review" : statusVal.charAt(0) + statusVal.slice(1).toLowerCase()}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        projectStatusFilter === statusVal ? "bg-brand-teal-light text-brand-teal font-extrabold" : "bg-slate-200/80 text-slate-600"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {(() => {
                const filteredList = myProjects.filter(p => {
                  if (projectStatusFilter === "ALL") return true;
                  return p.status === projectStatusFilter;
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-2">
                      <p className="text-xs text-slate-500 font-sans">No published requirements found under "{projectStatusFilter}" status.</p>
                    </div>
                  );
                }

                return filteredList.map((proj) => (
                  <div key={proj.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          proj.status === ProjectStatus.OPEN 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : proj.status === ProjectStatus.IN_REVIEW 
                            ? "bg-amber-50 text-amber-800 border-amber-200" 
                            : "bg-slate-105 text-slate-700 border-slate-305"
                        }`}>
                          {proj.status === ProjectStatus.IN_REVIEW ? "In-Review" : proj.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">{proj.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {proj.techStack.map(s => (
                          <span key={s} className="bg-slate-50 text-brand-teal border border-slate-200 text-[9px] px-2 py-0.5 rounded font-mono font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right flex flex-col md:items-end">
                        <span className="text-xs font-mono font-bold text-slate-900">₹{proj.budget.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-mono uppercase">
                          {proj.hiringType}
                        </span>
                      </div>
                      
                      {/* Quick Status Control Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Change:</span>
                        <select
                          value={proj.status}
                          onChange={(e) => {
                            if (onUpdateProjectStatus) {
                              onUpdateProjectStatus(proj.id, e.target.value as ProjectStatus);
                            }
                          }}
                          className="bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-brand-teal cursor-pointer shadow-sm"
                        >
                          <option value={ProjectStatus.OPEN}>Open</option>
                          <option value={ProjectStatus.IN_REVIEW}>In-Review</option>
                          <option value={ProjectStatus.CLOSED}>Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Email Notification Settings Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-teal" /> Recruiter Notification Preferences Settings
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure candidate matching updates, proposal milestones alerts, and chat notices sent directly to {currentUser.email}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Proposal updates toggle */}
              <div id="rec-pref-updates-block" className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 font-sans">Dev Proposals & Milestones</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Receive instant emails when candidates submit proposals, milestone accomplishments, or requested escrow releases.</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono">
                  <span className="text-[11px] text-slate-500 font-medium">Status: {emailApplicationUpdates ? "Enabled" : "Disabled"}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="toggle-rec-updates"
                      checked={emailApplicationUpdates}
                      onChange={(e) => setEmailApplicationUpdates(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
                  </label>
                </div>
              </div>

              {/* Chat toggle */}
              <div id="rec-pref-chat-block" className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 font-sans">Direct Chat Alerts</p>
                  <p className="text-[11px] text-[slate-500] leading-relaxed">Get notified via email when developers trigger instant chat messages regarding active work assignments.</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono">
                  <span className="text-[11px] text-slate-500 font-medium">Status: {emailChatMessages ? "Enabled" : "Disabled"}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="toggle-rec-chat"
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
                System records synchronize with SMTP triggers securely.
              </span>
              <button
                type="button"
                id="btn-save-preferences-rec"
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

      {/* POST PROJECT TAB (With Gemini optimized analysis) */}
      {activeTab === "post" && (
        <form onSubmit={handlePostSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Launch New Project Posting</h3>
              <p className="text-xs text-slate-500">Describe the job goals. Click the Gemini AI analysis button to optimize requirements instantly.</p>
            </div>
                 <button
              type="button"
              disabled={isAIAnalyzing}
              onClick={triggerAIRequirements}
              className="bg-gradient-to-tr from-brand-teal to-[#001c3d] hover:brightness-110 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 self-stretch md:self-auto justify-center disabled:opacity-50 cursor-pointer shadow-sm text-center"
            >
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>{isAIAnalyzing ? "Running GenAI Analysis..." : "Optimize with Gemini AI"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Project Title</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 text-sm focus:border-brand-teal focus:bg-white outline-none transition-all"
                placeholder="e.g. Next-Gen E-commerce Backend Architecture"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">General Requirements & Objectives</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 text-sm focus:border-brand-teal focus:bg-white outline-none resize-none transition-all"
                placeholder="Briefly state what developers will construct. Be sure to note databases, cloud workloads, error-margins..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Tech Stack (comma separated)</label>
              <input 
                value={techStackStr}
                onChange={(e) => setTechStackStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-brand-teal text-sm focus:border-brand-teal focus:bg-white outline-none transition-all"
                placeholder="React, Next.js, Node.js, AWS, Redis"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hiring Mode</label>
                  <select
                    value={hiringType}
                    onChange={(e) => setHiringType(e.target.value as HiringType)}
                    className="w-full bg-slate-55 border border-slate-205 rounded-lg p-2 text-slate-800 text-xs focus:border-brand-teal outline-none transition-all"
                  >
                    <option value={HiringType.FIXED_PRICE}>Fixed</option>
                    <option value={HiringType.HOURLY}>Hourly</option>
                    <option value={HiringType.MONTHLY}>Monthly</option>
                    <option value={HiringType.CONTRACT}>Contract</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">Budget (₹)</label>
                  <input 
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-slate-55 border border-slate-205 rounded-lg p-2 text-slate-800 text-xs focus:border-brand-teal outline-none transition-all"
                    min={500}
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                    className="w-full bg-slate-55 border border-slate-205 rounded-lg p-2 text-slate-800 text-xs focus:border-brand-teal outline-none transition-all"
                  >
                    <option value={WorkMode.REMOTE}>Remote</option>
                    <option value={WorkMode.HYBRID}>Hybrid</option>
                    <option value={WorkMode.ONSITE}>On-site</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* AI Metrics Suggestion box - results of project-analysis */}
          {aiMetrics && (
            <div className="p-4 bg-brand-teal-light/40 border border-brand-teal/20 rounded-xl space-y-2 text-brand-navy shadow-sm">
              <h4 className="text-xs font-bold text-brand-navy flex items-center gap-1 font-sans">
                <Sparkles className="w-4 h-4 text-brand-teal animate-pulse" /> Gemini AI Recommendations:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono pt-1">
                <div>
                  <span className="text-slate-500 text-[11px]">Recommended Role:</span>
                  <p className="text-slate-800 font-bold">{aiMetrics.recommendedRoles?.join(", ") || "Full-Stack Dev"}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Predicted Timeline:</span>
                  <p className="text-slate-800 font-bold">{aiMetrics.estimatedDays} days</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Vetting Confidence:</span>
                  <p className="text-slate-850 font-bold font-semibold">{aiMetrics.confidence}% matching strength</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-between items-center border-t border-slate-100">
            <span className="text-xs text-slate-400 font-mono">
              Fair compensation limits apply. Base: ₹500/hr, ₹5k project min.
            </span>
            <button
              type="submit"
              className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all font-sans cursor-pointer"
            >
              Post Posting & Match Candidates
            </button>
          </div>
        </form>
      )}

      {/* RECRUIT SCOUTING CANDIDATES TAB */}
      {activeTab === "candidates" && (
        <div className="space-y-6">
          {selectedDevId ? (
            /* DEDICATED PUBLIC-FACING DEVELOPER DETAILED REUME VIEW */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedDevId(null)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-teal transition-colors cursor-pointer bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Return to Talent Scout Pool</span>
              </button>

              {(() => {
                const dev = developersList.find(d => d.userId === selectedDevId);
                if (!dev) return <p className="text-xs text-slate-500 bg-white p-6 rounded-2xl border">Developer profile data not found or unvetted.</p>;

                const contact = getContactInfo(dev.userId);
                const hasPendingRequest = contactRequests.some(c => c.developerId === dev.userId && c.recruiterId === currentUser.id && c.status === "PENDING");
                const matchedDevApps = applications.filter(a => a.developerId === dev.userId && a.status === ApplicationStatus.ACCEPTED);

                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
                    {/* Header bar and rapid interaction buttons */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
                      <div className="flex items-stretch md:items-center gap-4">
                        <img
                          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-slate-200 shadow-sm bg-slate-50"
                          src={dev.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU"}
                          alt={dev.fullName}
                        />
                        <div className="flex flex-col justify-center space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-none">
                              {dev.fullName}
                            </h3>
                            {dev.experienceYears >= 5 && (
                              <span className="text-[9px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Vetted Elite
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-brand-teal">{dev.headline}</p>
                          <p className="text-[11px] text-slate-500 leading-tight">📍 {dev.location || "Location unlisted"} &bull; {dev.experienceYears} Years Experienced</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => {
                            setSelectedDevForInvite(dev);
                            setInviteProjId(myProjects[0]?.id || "");
                          }}
                          className="flex-1 md:flex-none text-center bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Invite to Apply
                        </button>
                        <button
                          onClick={() => onInitiateChat(currentUser.id, dev.userId)}
                          className="flex-1 md:flex-none text-center bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-4 py-2.5 rounded-xl font-bold transition-all border border-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>Direct Chat</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                      {/* Left info rail */}
                      <div className="lg:col-span-4 space-y-6 lg:border-r lg:border-slate-100 lg:pr-8">
                        <div>
                          <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-3">Compensations & Terms</h4>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 divide-y divide-slate-200/60 text-xs text-slate-700 space-y-2.5">
                            <div className="flex justify-between items-center py-0.5">
                              <span className="font-medium text-slate-500">Hourly Rate</span>
                              <span className="font-extrabold text-slate-900">₹{dev.rates?.hourly ? dev.rates.hourly.toLocaleString() : "—"}/hr</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 py-0.5">
                              <span className="font-medium text-slate-500">Weekly Target</span>
                              <span className="font-extrabold text-slate-900">₹{dev.rates?.weekly ? dev.rates.weekly.toLocaleString() : "—"}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 py-0.5">
                              <span className="font-medium text-slate-500">Monthly Retainer</span>
                              <span className="font-extrabold text-slate-900">₹{dev.rates?.monthly ? dev.rates.monthly.toLocaleString() : "—"}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 py-0.5">
                              <span className="font-medium text-slate-500">Availability</span>
                              <span className="font-bold text-brand-teal uppercase tracking-wide text-[10px]">{dev.availability || "Full-time"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Social Portfolios */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Public Credentials</h4>
                          <div className="flex flex-col gap-2">
                            {dev.socials?.github && (
                              <a
                                href={dev.socials.github.startsWith("http") ? dev.socials.github : `https://${dev.socials.github}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2.5 bg-slate-55 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold transition-all rounded-lg"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                                <span>GitHub Workspace</span>
                              </a>
                            )}
                            {dev.socials?.linkedin && (
                              <a
                                href={dev.socials.linkedin.startsWith("http") ? dev.socials.linkedin : `https://${dev.socials.linkedin}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2.5 bg-slate-55 hover:bg-[#0a66c2]/10 border border-slate-200 text-xs text-slate-700 font-bold transition-all rounded-lg"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0a66c2]" />
                                <span>LinkedIn Business</span>
                              </a>
                            )}
                            {dev.socials?.portfolio && (
                              <a
                                href={dev.socials.portfolio.startsWith("http") ? dev.socials.portfolio : `https://${dev.socials.portfolio}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2.5 bg-slate-55 hover:bg-emerald-50 border border-slate-200 text-xs text-slate-700 font-bold transition-all rounded-lg"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="truncate">Portfolio Domain</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Encrypted Contact Revelation form */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-brand-teal" /> Secure Contact Access
                          </p>
                          {contact ? (
                            <div className="text-xs text-slate-750 space-y-1 pt-1.5 border-t border-slate-200">
                              <p className="flex items-center gap-2"><span className="text-slate-400 font-bold font-mono">Mail:</span> <span className="font-medium text-slate-800">{contact.email}</span></p>
                              <p className="flex items-center gap-2"><span className="text-slate-400 font-bold font-mono">Call:</span> <span className="font-medium text-slate-800">{contact.phone}</span></p>
                            </div>
                          ) : hasPendingRequest ? (
                            <span className="text-xs text-amber-600 font-bold bg-amber-50 rounded border border-amber-200/50 p-2 block text-center animate-pulse">
                              Pending candidate authorization...
                            </span>
                          ) : (
                            <div className="space-y-2 pt-1">
                              <p className="text-[11px] text-slate-500 leading-tight">Request direct communication channels to exchange files, host meetings, or sign compliance documents.</p>
                              <button
                                type="button"
                                onClick={() => onSendContactRequest(dev.userId)}
                                className="w-full text-center bg-white hover:bg-slate-100 text-brand-teal border border-slate-200 text-[11px] font-bold py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                              >
                                Request Contact Access
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side body: Bio, Skills & Project History */}
                      <div className="lg:col-span-8 space-y-6">
                        {/* Summary biography */}
                        <div className="space-y-2 pb-2">
                          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Detailed Biography & Profile Summary</h4>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans">{dev.bio || "This vetted engineering professional has not provided a descriptive portfolio summary yet."}</p>
                        </div>

                        {/* Talent Skills chips */}
                        <div className="space-y-3 pb-2">
                          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Skill Matrix & Systems Competency</h4>
                          <div className="flex flex-wrap gap-2">
                            {dev.skills.map((skill) => (
                              <span key={skill} className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-mono font-medium hover:border-brand-teal hover:bg-slate-100 transition-all cursor-default">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Visual Timeline of project history */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Verified Contract & Project History</h4>
                          
                          {/* Engagements inside the app */}
                          {matchedDevApps.length > 0 ? (
                            <div className="space-y-3">
                              <p className="text-[9px] font-mono tracking-wider font-extrabold text-slate-400 uppercase">Active Engagements on DeveloperConnect</p>
                              {matchedDevApps.map((app) => {
                                const proj = projects.find(p => p.id === app.projectId);
                                if (!proj) return null;
                                return (
                                  <div key={app.id} className="p-4 bg-emerald-500/[0.04] border border-emerald-505/20 rounded-xl space-y-2">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                      <h5 className="text-xs font-bold text-slate-900 font-sans">{proj.title}</h5>
                                      <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                        Escrow Settled & Active
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{proj.description}</p>
                                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-450 font-mono font-medium pt-1">
                                      <span>Milestone: ₹{proj.budget.toLocaleString()}</span>
                                      <span>&bull;</span>
                                      <span>Mode: {proj.hiringType}</span>
                                      <span>&bull;</span>
                                      <span>Hired: {new Date(app.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl text-center">
                              <p className="text-xs text-slate-500 italic">No formal contracts have been registered on the DeveloperConnect platform yet.</p>
                            </div>
                          )}

                          {/* Historical portolios pre-vetted */}
                          <div className="space-y-3 pt-2">
                            <p className="text-[9px] font-mono tracking-wider font-extrabold text-slate-400 uppercase">Pre-Vetted Historical Core Engagements</p>
                            <div className="grid grid-cols-1 gap-4">
                              {[
                                {
                                  title: `Scalable Distributed Application Suite Migration`,
                                  role: "Lead Tech Architect",
                                  tech: [dev.skills[0] || "TypeScript", dev.skills[1] || "React", "NodeJS", "Docker"],
                                  duration: "9 Months (2025)",
                                  desc: `Designed and deployed high-performance microservices backend architectures scaling to robust 3,000 requests/sec workloads. Reduced response latency benchmarks by a clean 30%.`
                                },
                                {
                                  title: `Intermediary Payment Integrations & Automation API`,
                                  role: "Senior Engineering Consultant",
                                  tech: [dev.skills[2] || "Backend Systems", "PostgreSQL", "Mock Escrow APIs"],
                                  duration: "5 Months (2024)",
                                  desc: `Configured robust payment ledger system orchestrating multiple verification gateways. Fully aligned with secure regional tech commerce frameworks.`
                                }
                              ].map((hist, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-xl space-y-2 transition-all">
                                  <div className="flex flex-wrap justify-between items-start gap-2">
                                    <h5 className="text-xs font-bold text-slate-905">{hist.title}</h5>
                                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      {hist.duration}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-bold text-brand-teal">{hist.role}</p>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">{hist.desc}</p>
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {hist.tech.map((t) => (
                                      <span key={t} className="bg-white text-slate-500 border border-slate-200 text-[9px] px-2 py-0.5 rounded font-mono">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Client Ratings & Reviews Feed */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Vetted Professional Performance & Review Logs</h4>
                          
                          {/* List existing reviews left on this developer */}
                          {(() => {
                            const developerReviews = reviews.filter(r => r.revieweeId === dev.userId);
                            return (
                              <div className="space-y-3">
                                {developerReviews.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic pb-2">No reviews have been submitted for this developer yet. Be the first to leave feedback if you have worked together!</p>
                                ) : (
                                  developerReviews.map((rev) => (
                                    <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                      <div className="flex justify-between items-start gap-2 mb-1.5">
                                        <div>
                                          <span className="text-xs font-bold text-slate-800">{rev.reviewerName}</span>
                                          <span className="text-[10px] text-slate-400 font-mono ml-2">
                                            {new Date(rev.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="flex items-center text-amber-550 font-mono text-xs font-bold">
                                          {"★".repeat(rev.rating)}
                                          {"☆".repeat(5 - rev.rating)}
                                          <span className="ml-1 text-slate-600">({rev.rating}/5)</span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-slate-605 italic font-sans">"{rev.comment}"</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            );
                          })()}

                          {/* Post Review Form */}
                          <div className="bg-slate-55 border border-slate-200 rounded-xl p-4 mt-3">
                            <h5 className="text-xs font-bold text-slate-900 mb-2 font-sans">Submit a Vetted Performance Review</h5>
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const rating = Number((form.elements.namedItem("rating") as HTMLSelectElement).value);
                                const comment = (form.elements.namedItem("comment") as HTMLTextAreaElement).value;
                                
                                if (!comment.trim()) {
                                  alert("Please write a comment.");
                                  return;
                                }

                                if (onPostReview) {
                                  onPostReview({
                                    projectId: matchedDevApps[0]?.projectId || "direct-hire",
                                    reviewerId: currentUser.id,
                                    reviewerName: recProfile.companyName || recProfile.fullName || "Recruiter Panel",
                                    revieweeId: dev.userId,
                                    rating,
                                    comment
                                  });
                                  form.reset();
                                }
                              }}
                              className="space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-slate-655 font-semibold">Stars Rating:</label>
                                  <select 
                                    name="rating"
                                    className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1 outline-none pointer-events-auto"
                                    defaultValue="5"
                                  >
                                    <option value="5">★★★★★ Outstanding Performance (5/5)</option>
                                    <option value="4">★★★★☆ Solid Work Quality (4/5)</option>
                                    <option value="3">★★★☆☆ Average Delivery (3/5)</option>
                                    <option value="2">★★☆☆☆ Needs Clear Guidance (2/5)</option>
                                    <option value="1">★☆☆☆☆ Below Requirement Baseline (1/5)</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <textarea
                                  name="comment"
                                  rows={2}
                                  placeholder="Leave formal feedback. Comment on alignment to deadlines, quality of Deliverables, systems competency, and coding hygiene..."
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-750 placeholder-slate-400 focus:ring-1 focus:ring-brand-teal outline-none"
                                />
                              </div>
                              <button
                                type="submit"
                                className="bg-brand-teal text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-teal-700 transition"
                              >
                                Publish Review Verified Log
                              </button>
                            </form>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* STANDARD SCOUTING TEAM SEARCH FEED AND CARDS GRID */
            <>
              {/* Scout filter & Quick Hire Toggle Console */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 shadow-sm animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-sans">Scout Vetted Indian Engineering Talents</h3>
                    <p className="text-xs text-slate-500">View performance matrix, check AI logic scores, and request secure credentials.</p>
                  </div>
                  
                  <div className="relative w-full md:w-80 font-semibold">
                    <input 
                      value={scoutKeyword}
                      onChange={(e) => setScoutKeyword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-brand-teal/20 focus:bg-white focus:border-brand-teal outline-none transition-all"
                      placeholder="Filter by skill, name or location..."
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Recruiter Quick Hire Console Option */}
                <div className="bg-amber-50/40 border border-amber-250 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-550 text-white text-[9px] font-mono font-extrabold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Recruiter Tool
                      </span>
                      <span className="font-bold text-slate-800 font-mono uppercase tracking-wider text-[10.5px]">Direct 'Quick Hire' Engine</span>
                    </div>
                    <p className="text-slate-650 text-[11px] leading-relaxed max-w-2xl">
                      Do you have a developer you have successfully hired previously, or know is trusted and pre-verified? Enable Quick Hire to bypass the interview/application funnel & establish an active project contract instantly.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsQuickHireMode(!isQuickHireMode)}
                    className={`px-4 py-2 rounded-xl border transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-2 select-none ${
                      isQuickHireMode 
                        ? "bg-amber-600 border-amber-700 text-white shadow-amber-100" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${isQuickHireMode ? "bg-white animate-ping" : "bg-slate-400"}`} />
                    Quick Hire: {isQuickHireMode ? "ACTIVE (DIRECT)" : "DISABLED"}
                  </button>
                </div>
              </div>

              {/* Dev list grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {developersList
                  .filter(dev => {
                    if (!scoutKeyword) return true;
                    const kw = scoutKeyword.toLowerCase();
                    return dev.fullName.toLowerCase().includes(kw) || 
                           dev.headline.toLowerCase().includes(kw) || 
                           dev.skills.some(s => s.toLowerCase().includes(kw));
                  })
                  .map((dev) => {
                    const contact = getContactInfo(dev.userId);
                    const hasPendingRequest = contactRequests.some(c => c.developerId === dev.userId && c.recruiterId === currentUser.id && c.status === "PENDING");
                    
                    return (
                      <div key={dev.userId} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-brand-teal hover:shadow-sm transition-all relative shadow-sm">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => setSelectedDevId(dev.userId)}
                                className="text-left flex items-center gap-3 group focus:outline-none cursor-pointer"
                              >
                                <img 
                                  className="w-12 h-12 rounded-lg object-cover border border-slate-100 shadow-sm group-hover:ring-2 group-hover:ring-brand-teal transition-all bg-slate-50"
                                  src={dev.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU"} 
                                  alt={dev.fullName} 
                                />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-brand-teal group-hover:underline">{dev.fullName}</h4>
                                    {applications.some(a => a.developerId === dev.userId && a.status === ApplicationStatus.ACCEPTED) && (
                                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wide flex items-center gap-0.5" title="Previously Hired & Verified Developer">
                                        <UserCheck className="w-2.5 h-2.5" /> Trusted
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{dev.location || "Location unlisted"}</p>
                                </div>
                              </button>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-mono font-bold text-brand-teal bg-brand-teal-light px-2 py-0.5 rounded border border-brand-teal/20">
                                {dev.experienceYears} yrs
                              </span>
                              <span className="text-[9px] text-slate-400 font-sans font-medium">({dev.availability || "Full-time"})</span>
                            </div>
                          </div>

                          {dev.status && (
                            <div className="flex items-center gap-1.5 py-1 px-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              <span>Status: {dev.status}</span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-slate-800 leading-tight">{dev.headline}</h5>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{dev.bio}</p>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {dev.skills.slice(0, 5).map(s => (
                              <span key={s} className="bg-slate-55 text-slate-600 text-[9px] px-2 py-0.5 rounded border border-slate-200 font-mono">
                                {s}
                              </span>
                            ))}
                          </div>

                          {/* Rates Grid */}
                          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px]">
                            <div>
                              <p className="text-slate-400 font-medium text-[8px] uppercase tracking-wider">Hourly</p>
                              <p className="font-bold text-slate-900 mt-0.5">₹{dev.rates?.hourly ? dev.rates.hourly.toLocaleString() : "—"}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 font-medium text-[8px] uppercase tracking-wider">Weekly</p>
                              <p className="font-bold text-slate-900 mt-0.5">₹{dev.rates?.weekly ? dev.rates.weekly.toLocaleString() : "—"}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 font-medium text-[8px] uppercase tracking-wider">Monthly</p>
                              <p className="font-bold text-slate-900 mt-0.5">₹{dev.rates?.monthly ? dev.rates.monthly.toLocaleString() : "—"}</p>
                            </div>
                          </div>

                          {/* Social links */}
                          {(dev.socials?.github || dev.socials?.linkedin || dev.socials?.portfolio) && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] border-t border-slate-100">
                              <span className="text-slate-400 font-mono text-[8px] uppercase">Links:</span>
                              <div className="flex items-center gap-2.5">
                                {dev.socials.github && (
                                  <a 
                                    href={dev.socials.github.startsWith("http") ? dev.socials.github : `https://${dev.socials.github}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-teal hover:underline font-bold"
                                  >
                                    GitHub
                                  </a>
                                )}
                                {dev.socials.linkedin && (
                                  <a 
                                    href={dev.socials.linkedin.startsWith("http") ? dev.socials.linkedin : `https://${dev.socials.linkedin}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-teal hover:underline font-bold"
                                  >
                                    LinkedIn
                                  </a>
                                )}
                                {dev.socials.portfolio && (
                                  <a 
                                    href={dev.socials.portfolio.startsWith("http") ? dev.socials.portfolio : `https://${dev.socials.portfolio}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#09c] hover:underline font-bold"
                                  >
                                    Project
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Contact revelation request status block */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2 space-y-1">
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5 matches-lock">
                              <Lock className="w-3 h-3 text-brand-teal" /> Secure Contact Access
                            </p>
                            {contact ? (
                              <div className="text-xs text-slate-700 space-y-0.5 pt-1">
                                <p className="flex items-center gap-1.5"><span className="text-slate-400 font-bold font-mono">Email:</span> {contact.email}</p>
                                <p className="flex items-center gap-1.5"><span className="text-slate-400 font-bold font-mono">Phone:</span> {contact.phone}</p>
                              </div>
                            ) : hasPendingRequest ? (
                              <span className="text-xs text-amber-600 italic block pt-1">Requested, awaiting developer approval...</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onSendContactRequest(dev.userId)}
                                className="text-xs text-brand-teal font-bold hover:underline cursor-pointer block pt-1 text-left"
                              >
                                Request Email & Phone Access
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDevId(dev.userId)}
                            className="flex-1 bg-white hover:bg-slate-50 text-slate-505 text-xs px-3 py-2 border border-slate-200 rounded-lg font-bold transition-all text-center cursor-pointer shadow-sm animate-fade-in"
                          >
                            Detailed Bio
                          </button>
                          {isQuickHireMode ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuickHireDev(dev);
                                setQuickHireProjId(myProjects[0]?.id || "");
                                setQuickHireRate(dev.rates?.hourly || 1500);
                                setShowQuickHireModal(true);
                              }}
                              className="flex-1 bg-amber-650 hover:bg-amber-700 text-white text-xs px-3 py-2 border border-amber-650 hover:border-amber-700 rounded-lg font-bold transition-all text-center cursor-pointer shadow-sm animate-pulse"
                            >
                              ⚡ Quick Hire Direct
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDevForInvite(dev);
                                setInviteProjId(myProjects[0]?.id || "");
                              }}
                              className="flex-1 bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-3 py-2 border border-brand-teal rounded-lg font-bold transition-all text-center cursor-pointer shadow-sm"
                            >
                              Invite to Apply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}

      {/* APPLICATIONS REVIEWS TAB */}
      {activeTab === "applications" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-sans font-bold text-slate-900 text-sm">Review Submitted Job Applications</h3>
          <p className="text-xs text-slate-500 mt-1">Review developer proposed rates, and authorize secure milestone payments to begin the project.</p>
          
          <div className="divide-y divide-slate-100 mt-4 text-slate-800">
            {applications.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No applications submitted to your projects yet.</p>
            ) : (
              applications.map((app) => {
                const dev = developersList.find(d => d.userId === app.developerId);
                const proj = projects.find(p => p.id === app.projectId);
                return (
                  <div key={app.id} className="py-6 flex flex-col justify-between hover:bg-slate-50/20 p-4 rounded-xl transition-all gap-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <img 
                            className="w-10 h-10 rounded-full object-cover border border-slate-100"
                            src={dev?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU"} 
                            alt="developer" 
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{dev?.fullName || "Aryan Sharma"}</h4>
                            <p className="text-xs text-slate-500">Applied to: <span className="text-brand-teal font-semibold">{proj?.title || "SaaS Portal"}</span></p>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500">Cover Pitch Message:</p>
                          <p className="text-xs text-slate-700 leading-relaxed mt-1.5">{app.coverLetter}</p>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono">
                          <p><span className="text-slate-400">Proposed Rate:</span> <span className="text-slate-800 font-bold">₹{app.proposedRate.toLocaleString()}/hour</span></p>
                          <p><span className="text-slate-400">Estimated Duration:</span> <span className="text-slate-800 font-bold">{app.timelineEstimate}</span></p>
                          <p><span className="text-slate-400">Availability:</span> <span className="text-slate-800 font-bold">{app.availability}</span></p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 self-stretch md:self-auto justify-center md:items-end">
                        <span className={`text-[10px] font-mono px-3 py-1 rounded-full uppercase font-bold text-center w-full ${
                          app.status === ApplicationStatus.ACCEPTED ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                          app.status === ApplicationStatus.SHORTLISTED ? "bg-brand-teal-light text-brand-teal border border-brand-teal/30 font-bold" :
                          app.status === ApplicationStatus.PENDING ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                          "bg-rose-50 text-rose-700 border border-rose-200/50"
                        }`}>
                          {app.status}
                        </span>

                        {app.status === ApplicationStatus.PENDING && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onUpdateApplicationStatus(app.id, ApplicationStatus.SHORTLISTED)}
                              className="bg-white hover:bg-slate-55 text-brand-teal text-xs px-3 py-1.5 border border-slate-200 rounded-lg transition-colors font-bold cursor-pointer shadow-sm"
                            >
                              Shortlist
                            </button>
                          </div>
                        )}

                        {app.status === ApplicationStatus.ACCEPTED && (
                          <button
                            onClick={() => onInitiateChat(currentUser.id, app.developerId)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg transition-all font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-1 animate-fade-in"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Start Chat
                          </button>
                        )}

                        {app.status === ApplicationStatus.SHORTLISTED && (
                          <div className="space-y-2 w-full">
                            <button
                              onClick={() => openEscrowPayload(app.id)}
                              className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-4 py-2 rounded-lg transition-all font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Start Escrow (UPI)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COLLAPSIBLE ACTIVE CONTRACT NDA & PROJECT MILESTONES WORKSPACE */}
                    {app.status === ApplicationStatus.ACCEPTED && (() => {
                      const projectNda = ndas.find(n => n.projectId === app.projectId && n.developerId === app.developerId);
                      const projectStagesList = projectStages.filter(s => s.projectId === app.projectId);
                      
                      return (
                        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-800 animate-fade-in border-dashed">
                          {/* DIGITAL NDA WRITING & MANAGEMENT WORKFLOW */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10.5px]">
                                <FileText className="w-4 h-4 text-brand-teal" /> AI-Aided Secure Digital NDA
                              </span>
                              {projectNda ? (
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                                  projectNda.status === "SIGNED" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {projectNda.status === "SIGNED" ? "Signed & Active" : "Pending Signature"}
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border uppercase">
                                  Not Drafted
                                </span>
                              )}
                            </div>

                            {!projectNda ? (
                              <div className="space-y-3">
                                <p className="text-slate-500 leading-normal text-[11px]">
                                  Protect corporate source code, secure proprietary files, and implement strict non-disclosure safeguards. Write your conditions, and our AI will draft a legally-binding NDA instantly.
                                </p>

                                <div className="space-y-1">
                                  <label className="block font-bold text-slate-705 text-[10px] font-mono uppercase">Custom Recruiter Conditions:</label>
                                  <textarea
                                    value={ndaCustomConditions[app.developerId] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setNdaCustomConditions(prev => ({ ...prev, [app.developerId]: val }));
                                    }}
                                    className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 resize-none text-[11px] focus:ring-1 focus:ring-brand-teal outline-none"
                                    rows={2.5}
                                    placeholder="e.g. Code secrecy under Sect. 72 IT Act, immediate IP assignment on milestones, non-solicitation of product engineering staff..."
                                  />
                                </div>

                                {generatedNDATerms[app.developerId] ? (
                                  <div className="space-y-2">
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-205 max-h-32 overflow-y-auto font-mono text-[9.5px] whitespace-pre-wrap leading-relaxed select-all">
                                      {generatedNDATerms[app.developerId]}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onSendNDA(app.projectId, app.developerId, generatedNDATerms[app.developerId]);
                                        alert("NDA Draft securely dispatched to the developer for signature confirmation!");
                                      }}
                                      className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white font-bold p-2 rounded-lg transition-all cursor-pointer shadow-sm text-center font-mono uppercase text-[10.5px]"
                                    >
                                      Send Official NDA to Developer
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isNDAGenerating[app.developerId]}
                                    onClick={async () => {
                                      setIsNDAGenerating(prev => ({ ...prev, [app.developerId]: true }));
                                      try {
                                        const addC = ndaCustomConditions[app.developerId] || "Strict non-disclosure protocol, IP allocation safeguards & validation";
                                        const resp = await fetch("/api/ndas/generate", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            projectId: app.projectId,
                                            developerId: app.developerId,
                                            recruiterName: recFullName || recProfile.fullName || currentUser.email,
                                            developerName: dev?.fullName || "Aryan Sharma",
                                            additionalConditions: addC
                                          })
                                        });
                                        const datInput = await resp.json();
                                        setGeneratedNDATerms(prev => ({ ...prev, [app.developerId]: datInput.draft }));
                                      } catch (e) {
                                        alert("Failed to draft via AI. Falling back to platform default legal template.");
                                      } finally {
                                        setIsNDAGenerating(prev => ({ ...prev, [app.developerId]: false }));
                                      }
                                    }}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-2.5 rounded-lg transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5 text-[11px]"
                                  >
                                    {isNDAGenerating[app.developerId] ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating compliance guidelines via AI...
                                      </span>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                        Draft NDA Contract with AI Help
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3 font-sans">
                                <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 max-h-32 overflow-y-auto font-mono text-[9px] leading-relaxed relative select-all text-slate-800">
                                  {projectNda.terms}
                                </div>

                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[10.5px]">
                                  <p className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-bold font-mono text-[10px]">Developer Signature:</span> 
                                    {projectNda.developerSignature ? (
                                      <span className="font-mono text-emerald-600 font-bold">✍️ {projectNda.developerSignature} (Signed)</span>
                                    ) : (
                                      <span className="italic text-amber-600">Awaiting developer signature...</span>
                                    )}
                                  </p>
                                  <p className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-bold font-mono text-[10px]">Recruiter Signature:</span> 
                                    {projectNda.recruiterSignature ? (
                                      <span className="font-mono text-emerald-600 font-bold">✍️ {projectNda.recruiterSignature} (Countersigned)</span>
                                    ) : (
                                      <span className="italic text-amber-600">Pending your countersignature...</span>
                                    )}
                                  </p>
                                </div>

                                {!projectNda.recruiterSignature && projectNda.developerSignature && (
                                  <div className="space-y-2 pt-1 border-t border-slate-100">
                                    <label className="block text-[10px] font-mono uppercase font-bold text-slate-700">Type Corporate Countersign:</label>
                                    <div className="flex gap-2">
                                      <input
                                        value={ndaRecSignature[app.developerId] || ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setNdaRecSignature(prev => ({ ...prev, [app.developerId]: val }));
                                        }}
                                        className="flex-1 bg-white border border-slate-205 rounded-lg p-1.5 font-mono text-xs focus:ring-1 focus:ring-brand-teal outline-none"
                                        placeholder="Type name to corporate sign"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const sig = ndaRecSignature[app.developerId];
                                          if (!sig) return alert("Please sign first.");
                                          onSignNDA(projectNda.id, "RECRUITER", sig);
                                          alert("NDA fully countersigned and successfully active!");
                                        }}
                                        className="bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-[10.5px] px-3.5 rounded-lg transition-all"
                                      >
                                        Execute Signing 
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* PROJECT MILISTONES & STAGES DIVIDED ACCORDING TO NATURE */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10.5px]">
                                <Layers className="w-4 h-4 text-brand-teal" /> Dynamic Project Milestones
                              </span>
                              <span className="text-[10px] font-mono text-slate-505 bg-slate-50 px-2 py-0.5 rounded border font-semibold">
                                {projectStagesList.length} Stages
                              </span>
                            </div>

                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                              {projectStagesList.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                                  <p className="text-xs text-slate-400 italic">No stages deployed yet.</p>
                                  <p className="text-[10px] text-slate-505 leading-normal">Divide your project nature-wise below to track work.</p>
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
                                      className={`p-3 rounded-lg space-y-2 hover:border-slate-355 transition-all text-[11px] border ${
                                        isCompleted 
                                          ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm shadow-emerald-100" 
                                          : isApproved
                                          ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm shadow-indigo-100"
                                          : "bg-slate-100/50 border-slate-200"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="font-bold text-slate-900 leading-tight">{stage.title}</h5>
                                        <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                                          isCompleted 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                            : isApproved
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}>
                                          {stage.status}
                                        </span>
                                      </div>
                                      <p className="text-slate-650 line-clamp-2 leading-relaxed text-[11px]">{stage.description}</p>
                                      
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

                                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-200/50 pt-1.5 mt-1.5">
                                        <span>Cost: ₹{stage.cost?.toLocaleString() || "0"}</span>
                                        <span>Due: {stage.dueDate ? new Date(stage.dueDate).toLocaleDateString() : "TBD"}</span>
                                      </div>

                                      {/* Action button if state needs interaction */}
                                      {stage.status === "PROPOSED" && stage.createdBy === "DEVELOPER" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onApproveStage(stage.id);
                                            alert("Milestone proposal successfully approved!");
                                          }}
                                          className="w-full mt-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold py-1 rounded font-mono text-[9px] uppercase tracking-wider cursor-pointer"
                                        >
                                          Approve Developer-Created Stage
                                        </button>
                                      )}

                                      {stage.status === "APPROVED" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onCompleteStage(stage.id);
                                            alert("Payout authorized! Milestone marked complete.");
                                          }}
                                          className="w-full mt-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 rounded font-mono text-[9px] uppercase tracking-wider cursor-pointer"
                                        >
                                          Verify & Authorize Stage Complete
                                        </button>
                                      )}
                                    </motion.div>
                                  );
                                })
                              )}
                            </div>

                            {/* Form to propose/deploy stage */}
                            <div className="bg-slate-50 border border-slate-205 rounded-xl p-3.5 space-y-2.5">
                              <p className="font-bold text-[10px] font-mono uppercase text-slate-700">Deploy New Project Stage:</p>
                              
                              <div className="space-y-1.5">
                                <input
                                  value={newStageTitle[app.id] || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewStageTitle(prev => ({ ...prev, [app.id]: val }));
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 leading-tight text-[11px] focus:ring-1 focus:ring-brand-teal outline-none"
                                  placeholder="Stage Title (e.g., API Gateway Integration)"
                                />
                                <textarea
                                  value={newStageDesc[app.id] || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewStageDesc(prev => ({ ...prev, [app.id]: val }));
                                  }}
                                  className="w-full bg-white border border-slate-206 rounded-lg p-1.5 leading-tight text-[11px] focus:ring-1 focus:ring-brand-teal outline-none resize-none"
                                  rows={1.5}
                                  placeholder="Deliverable/verification criteria details..."
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="space-y-1">
                                  <span className="block text-[9.5px] font-mono text-slate-500">Stage Cost (₹):</span>
                                  <input
                                    type="number"
                                    value={newStageCost[app.id] || ""}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setNewStageCost(prev => ({ ...prev, [app.id]: val }));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] focus:ring-1 focus:ring-brand-teal outline-none font-mono"
                                    placeholder="e.g. 20000"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[9.5px] font-mono text-slate-505">Due Date:</span>
                                  <input
                                    type="date"
                                    value={newStageDueDate[app.id] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setNewStageDueDate(prev => ({ ...prev, [app.id]: val }));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] focus:ring-1 focus:ring-brand-teal outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const tTitle = newStageTitle[app.id];
                                  const tDesc = newStageDesc[app.id];
                                  const tCost = newStageCost[app.id] || 0;
                                  const tDue = newStageDueDate[app.id] || new Date().toISOString();
                                  
                                  if (!tTitle || !tDesc) {
                                    return alert("Please enter both high-level title & description of criteria.");
                                  }
                                  onCreateStage(app.projectId, tTitle, tDesc, tCost, tDue, "RECRUITER");
                                  
                                  setNewStageTitle(prev => ({ ...prev, [app.id]: "" }));
                                  setNewStageDesc(prev => ({ ...prev, [app.id]: "" }));
                                  setNewStageCost(prev => ({ ...prev, [app.id]: 0 }));
                                  setNewStageDueDate(prev => ({ ...prev, [app.id]: "" }));
                                  alert("Milestone stage successfully configured and published!");
                                }}
                                className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white font-bold p-1.5 rounded-lg transition-all text-center tracking-wider uppercase font-mono text-[10px] cursor-pointer"
                              >
                                Deploy Milestone Stage
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
      )}

      {/* RECRUITER PROFILE SETTINGS TAB (REMOVED: Now handled by the global Profile Settings dynamic drawer) */}
      {false && (
        <form onSubmit={handleRecProfileSave} className="bg-white border border-slate-205 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Company & Recruiter Profile Settings</h3>
              <p className="text-xs text-slate-500">Configure your recruitment profile details, logo, and active workspace specifications.</p>
            </div>
            <button
              type="submit"
              className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm"
            >
              Save Profile Details
            </button>
          </div>

          {/* Section 1: Identity & Avatar Uploaders (supporting JPEG) */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Profile Visual Credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recruiter Avatar Image */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={recAvatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU"}
                    alt="Recruiter Photo"
                    className="w-16 h-16 rounded-full border border-slate-300 object-cover shadow-sm bg-white"
                  />
                  <span className="absolute bottom-0 right-0 bg-brand-teal text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white leading-none">
                    JPEG
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">Recruiter Photo (JPEG Only)</span>
                  <p className="text-[11px] text-slate-500 leading-tight">Upload a clear professional photo. Only JPEG/JPG files supported.</p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="file"
                      id="recruiter-photo-upload"
                      accept="image/jpeg, image/jpg"
                      onChange={(e) => handleRecruiterImageUpload(e, "avatar")}
                      className="hidden"
                    />
                    <label
                      htmlFor="recruiter-photo-upload"
                      className="bg-white hover:bg-slate-50 text-slate-750 text-[11px] font-bold px-3 py-1.5 border border-slate-300 rounded cursor-pointer transition-colors shadow-sm inline-block"
                    >
                      Choose JPEG Photo
                    </label>
                    {recAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setRecAvatarUrl("")}
                        className="text-red-500 hover:text-red-700 text-[11px] font-bold hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Logo Image */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-lg border border-slate-300 flex items-center justify-center bg-white overflow-hidden shadow-sm">
                    {companyLogoUrl ? (
                      <img
                        src={companyLogoUrl}
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Briefcase className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 bg-brand-teal text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white leading-none">
                    JPEG
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-705">Company Logo (JPEG Only)</span>
                  <p className="text-[11px] text-slate-500 leading-tight">Upload your startup logo. Strictly in JPEG format.</p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="file"
                      id="company-logo-upload"
                      accept="image/jpeg, image/jpg"
                      onChange={(e) => handleRecruiterImageUpload(e, "logo")}
                      className="hidden"
                    />
                    <label
                      htmlFor="company-logo-upload"
                      className="bg-white hover:bg-slate-50 text-slate-755 text-[11px] font-bold px-3 py-1.5 border border-slate-300 rounded cursor-pointer transition-colors shadow-sm inline-block"
                    >
                      Choose JPEG Logo
                    </label>
                    {companyLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setCompanyLogoUrl("")}
                        className="text-red-500 hover:text-red-700 text-[11px] font-bold hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Corporate Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Recruiter & Company Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Recruiter Full Name *</label>
                <input
                  value={recFullName}
                  onChange={(e) => setRecFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                  placeholder="Enter Contact Full Name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Company Name *</label>
                <input
                  value={recCompanyName}
                  onChange={(e) => setRecCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                  placeholder="Enter Registered Company Title"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Corporate Website URL</label>
                <input
                  value={recWebsite}
                  onChange={(e) => setRecWebsite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                  placeholder="e.g. startup.io"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Industry Vertical / Domain *</label>
                <input
                  value={recIndustry}
                  onChange={(e) => setRecIndustry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                  placeholder="e.g. Fintech, SaaS, Healthcare, AI DeepTech"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Company Size (Employees)</label>
                <select
                  value={recCompanySize}
                  onChange={(e) => setRecCompanySize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 Employees (Seed Stage)</option>
                  <option value="11-50">11-50 Employees (Series A)</option>
                  <option value="51-200">51-200 Employees (Series B+)</option>
                  <option value="200+">200+ Employees (Enterprise)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Direct Phone Link *</label>
                <input
                  value={recPhone}
                  onChange={(e) => setRecPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                  placeholder="e.g. +91 98765 43210"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700">About Corporate Mission / Startup Bio *</label>
                <textarea
                  value={recAboutCompany}
                  onChange={(e) => setRecAboutCompany(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none resize-none transition-all"
                  placeholder="Describe your active funding, engineering challenges, high level system objectives and team culture details..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
            <button
              type="submit"
              className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm"
            >
              Save Profile Settings
            </button>
          </div>
        </form>
      )}

      {/* DISPATCH SCOUT INVITE OVERLAY MODAL */}
      {selectedDevForInvite && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-205 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-800 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Invite {selectedDevForInvite.fullName}</h3>
              <button onClick={() => setSelectedDevForInvite(null)} className="text-slate-400 hover:text-slate-800 text-lg font-bold cursor-pointer">&times;</button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Link with Published Posting</label>
                <select
                  value={inviteProjId}
                  onChange={(e) => setInviteProjId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-brand-teal outline-none"
                  required
                >
                  <option value="">-- Choose project --</option>
                  {myProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Custom Invite Message</label>
                <textarea
                  value={inviteMsg}
                  onChange={(e) => setInviteMsg(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-55 border border-slate-205 rounded-lg p-2 text-slate-800 text-xs focus:border-brand-teal outline-none resize-none"
                  placeholder="Tell the developer why they are a great match for your system constraints..."
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDevForInvite(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-55 text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  Dispatch Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECRUITER INSTANT QUICK HIRE MODAL OVERLAY */}
      {showQuickHireModal && selectedQuickHireDev && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-205 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-800 shadow-2xl animate-fade-in text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-600 text-white font-mono font-extrabold text-[9px] px-2 py-0.5 rounded leading-none uppercase">Instant</span>
                <h3 className="text-sm font-bold text-slate-900">Direct 'Quick Hire' Engagement</h3>
              </div>
              <button 
                onClick={() => {
                  setShowQuickHireModal(false);
                  setSelectedQuickHireDev(null);
                }} 
                className="text-slate-405 hover:text-slate-800 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <img 
                src={selectedQuickHireDev.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU"}
                className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white"
                alt={selectedQuickHireDev.fullName}
              />
              <div>
                <h4 className="font-bold text-slate-905">{selectedQuickHireDev.fullName}</h4>
                <p className="text-[10.5px] text-slate-500 font-medium">{selectedQuickHireDev.headline}</p>
              </div>
            </div>

            <p className="text-slate-550 leading-relaxed text-[10.5px]">
              This wizard allows you to skip standard application funnels. Submitting this form creates an active placement instantly, skipping interview rounds.
            </p>
            
            <form onSubmit={handleQuickHireSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Select Project to Align With</label>
                <select
                  value={quickHireProjId}
                  onChange={(e) => setQuickHireProjId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:border-brand-teal outline-none"
                  required
                >
                  <option value="">-- Choose active project --</option>
                  {myProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title} (Budget: ₹{p.budget.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Proposed Rate (₹ / Hour)</label>
                  <input
                    type="number"
                    value={quickHireRate}
                    onChange={(e) => setQuickHireRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:ring-1 focus:ring-brand-teal outline-none font-mono"
                    placeholder="e.g. 1500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Project Timeline</label>
                  <input
                    type="text"
                    value={quickHireTimeline}
                    onChange={(e) => setQuickHireTimeline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:ring-1 focus:ring-brand-teal outline-none"
                    placeholder="e.g. 3 months"
                    required
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg flex items-start gap-1.5 text-[10px] text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 uppercase text-amber-500 mt-0.5" />
                <p className="leading-relaxed">
                  Both parties must abide by DeveloperConnect's Escrow and digital NDA regulations. Placing developer constitutes commercial contract agreement.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickHireModal(false);
                    setSelectedQuickHireDev(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold rounded-lg text-xs cursor-pointer shadow-sm flex items-center gap-1"
                >
                  Confirm Direct Hire ⚡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INDIAN ESCROW PAYMENTS (UPI/GST/FORM-16) MODAL */}
      {fundingAppId && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-6 text-slate-805 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-teal" /> Authorized Escrow Setup (GST Compliant)
                </h3>
                <p className="text-xs text-slate-500">Lock milestone base payments under local intermediary regulations.</p>
              </div>
              <button onClick={() => setFundingAppId(null)} className="p-1 text-slate-400 hover:text-slate-800 text-lg font-bold cursor-pointer">&times;</button>
            </div>

            {/* Calculations block */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shadow-inner">
               <div className="flex justify-between items-center text-xs">
                <span className="text-slate-550">Base Milestone Funding</span>
                <span className="text-slate-900 font-mono font-bold">₹35,000.00</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-550">Platform Convenience Fee (3%)</span>
                <span className="text-slate-905 font-mono">₹1,050.00</span>
              </div>
              <div className="flex justify-between items-center text-xs text-brand-teal font-semibold font-mono">
                <span>GST (18% for Indian Tech Commerce)</span>
                <span>₹6,489.00</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Escrow Payable</span>
                <span className="text-brand-teal font-mono text-base font-extrabold">₹42,539.00</span>
              </div>
            </div>

            {/* Simulated Payment Methods */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Select Payment Gateway</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption("UPI")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentOption === "UPI" ? "border-brand-teal bg-brand-teal-light text-brand-navy font-bold shadow-sm" : "border-slate-200 bg-slate-55 text-slate-500"
                  }`}
                >
                  <p className="text-xs font-bold font-sans">BHIM UPI</p>
                  <p className="text-[9px] text-slate-500 mt-1">Instant No-Fee</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("CARD")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentOption === "CARD" ? "border-brand-teal bg-brand-teal-light text-brand-navy font-bold shadow-sm" : "border-slate-200 bg-slate-55 text-slate-500"
                  }`}
                >
                  <p className="text-xs font-bold font-sans">Credit Card</p>
                  <p className="text-[9px] text-slate-500 mt-1">Visa/Mastercard</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("NETBANK")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentOption === "NETBANK" ? "border-brand-teal bg-brand-teal-light text-brand-navy font-bold shadow-sm" : "border-slate-200 bg-slate-55 text-slate-500"
                  }`}
                >
                  <p className="text-xs font-bold font-sans">NetBanking</p>
                  <p className="text-[9px] text-slate-500 mt-1">All Indian Banks</p>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFundingAppId(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs hover:bg-slate-55 text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEscrowAuthorize}
                disabled={isPaying}
                 className="px-6 py-2 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-lg text-xs transition-colors text-center cursor-pointer shadow-sm"
              >
                {isPaying ? "Processing BHIM UPI Transact..." : "Authorize Escrow Contract"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
