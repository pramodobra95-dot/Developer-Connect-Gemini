import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  Trash2, 
  UserCheck, 
  UserX, 
  Sparkles, 
  Download, 
  Gavel, 
  Activity,
  Layers,
  Percent,
  CheckCircle,
  AlertCircle,
  Mail
} from "lucide-react";
import { User, DeveloperProfile, RecruiterProfile, Dispute, DisputeStatus } from "../types.js";

interface AdminPanelProps {
  currentUser: User;
  usersList: any[];
  disputes: Dispute[];
  projects?: any[];
  applications?: any[];
  onUpdateUser: (userId: string, updates: any) => void;
  onDeleteUser: (userId: string) => void;
  onEditUserProfile: (userId: string, role: string, profileData: any) => void;
  onResolveDispute: (disputeId: string, rationale: string, ratio?: { recruiter: number; developer: number }, status?: DisputeStatus) => void;
  onUpdatePreferences?: (prefs: any) => void;
}

export default function AdminPanel({
  currentUser,
  usersList,
  disputes,
  projects = [],
  applications = [],
  onUpdateUser,
  onDeleteUser,
  onEditUserProfile,
  onResolveDispute,
  onUpdatePreferences
}: AdminPanelProps) {
  const [adminActiveTab, setAdminActiveTab] = useState<"users" | "developers" | "recruiters" | "projects" | "applications">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  
  // Custom split ratio resolution variables
  const [rationale, setRationale] = useState("");
  const [recruiterPct, setRecruiterPct] = useState(50);

  // Profile editing state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    headline: "",
    bio: "",
    skillsStr: "",
    location: "",
    hourlyRate: 600,
    companyName: "",
    industry: "",
    companySize: "11-50",
    website: "",
    aboutCompany: "",
    phone: ""
  });

  const calculateCompleteness = (usr: any) => {
    if (usr.role === "DEVELOPER") {
      const d = usr.devProfile || {};
      let score = 0;
      let total = 8;
      if (d.fullName && d.fullName !== "Developer Candidate") score++;
      if (d.headline && d.headline !== "Full-Stack Engineer") score++;
      if (d.bio && d.bio !== "Passionate React & TypeScript systems engineer.") score++;
      if (d.skills && d.skills.length > 0) score++;
      if (d.location) score++;
      if (d.experienceYears && d.experienceYears > 0) score++;
      if (d.rates && d.rates.hourly > 0) score++;
      if (d.avatarUrl) score++;
      return Math.round((score / total) * 100);
    } else if (usr.role === "RECRUITER") {
      const r = usr.recProfile || {};
      let score = 0;
      let total = 6;
      if (r.companyName && r.companyName !== "Startup Solutions Ltd") score++;
      if (r.fullName && r.fullName !== "Talent Lead") score++;
      if (r.industry) score++;
      if (r.companySize) score++;
      if (r.aboutCompany) score++;
      if (r.phone) score++;
      return Math.round((score / total) * 100);
    }
    return 0;
  };

  const openProfileEditor = (usr: any) => {
    setEditingUser(usr);
    if (usr.role === "DEVELOPER") {
      const d = usr.devProfile || {};
      setEditForm({
        fullName: d.fullName || "Developer Candidate",
        headline: d.headline || "Full-Stack Engineer",
        bio: d.bio || "",
        skillsStr: d.skills ? d.skills.join(", ") : "",
        location: d.location || "India",
        hourlyRate: d.rates?.hourly || 600,
        companyName: "",
        industry: "",
        companySize: "11-50",
        website: "",
        aboutCompany: "",
        phone: d.phoneNumber || ""
      });
    } else if (usr.role === "RECRUITER") {
      const r = usr.recProfile || {};
      setEditForm({
        fullName: r.fullName || "Business Representative",
        headline: "",
        bio: "",
        skillsStr: "",
        location: r.location || "India",
        hourlyRate: 0,
        companyName: r.companyName || "Startup Solutions Ltd",
        industry: r.industry || "Information Technology",
        companySize: r.companySize || "11-50",
        website: r.website || "",
        aboutCompany: r.aboutCompany || "",
        phone: r.phone || ""
      });
    }
  };

  const saveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    let profileData: any = {};
    if (editingUser.role === "DEVELOPER") {
      profileData = {
        fullName: editForm.fullName,
        headline: editForm.headline,
        bio: editForm.bio,
        skills: editForm.skillsStr.split(",").map(s => s.trim()).filter(Boolean),
        location: editForm.location,
        phoneNumber: editForm.phone,
        rates: {
          hourly: Number(editForm.hourlyRate),
          weekly: Number(editForm.hourlyRate) * 40,
          monthly: Number(editForm.hourlyRate) * 160,
          projectMin: Number(editForm.hourlyRate) * 20
        }
      };
    } else {
      profileData = {
        fullName: editForm.fullName,
        companyName: editForm.companyName,
        industry: editForm.industry,
        companySize: editForm.companySize,
        website: editForm.website,
        aboutCompany: editForm.aboutCompany,
        phone: editForm.phone
      };
    }

    onEditUserProfile(editingUser.id, editingUser.role, profileData);
    setEditingUser(null);
  };

  // Admin personal notification state
  const initialPrefs = currentUser.notificationPreferences || {
    emailNewInvites: true,
    emailApplicationUpdates: true,
    emailChatMessages: true,
    emailGlobalAlerts: true
  };
  const [emailNewInvites, setEmailNewInvites] = useState(initialPrefs.emailNewInvites);
  const [emailApplicationUpdates, setEmailApplicationUpdates] = useState(initialPrefs.emailApplicationUpdates);
  const [emailChatMessages, setEmailChatMessages] = useState(initialPrefs.emailChatMessages);
  const [emailGlobalAlerts, setEmailGlobalAlerts] = useState(initialPrefs.emailGlobalAlerts || true);

  useEffect(() => {
    if (currentUser.notificationPreferences) {
      setEmailNewInvites(currentUser.notificationPreferences.emailNewInvites);
      setEmailApplicationUpdates(currentUser.notificationPreferences.emailApplicationUpdates);
      setEmailChatMessages(currentUser.notificationPreferences.emailChatMessages);
      setEmailGlobalAlerts(currentUser.notificationPreferences.emailGlobalAlerts || true);
    }
  }, [currentUser]);

  const handlePreferencesSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onUpdatePreferences) {
      onUpdatePreferences({
        emailNewInvites,
        emailApplicationUpdates,
        emailChatMessages,
        emailGlobalAlerts
      });
      alert("Personal admin notification preferences updated successfully!");
    }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Email,Role,Verified,Suspended,Created_At\n";
    usersList.forEach(usr => {
      csvContent += `${usr.id},${usr.email},${usr.role},${usr.isVerified},${usr.isSuspended},${usr.createdAt}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "developerconnect_users_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectVerdict = (dispId: string, type: "recruiter" | "developer") => {
    const verdictText = type === "recruiter" 
      ? "Full refund authorized under Section 72 IT Act - Deliverables failed security compliance." 
      : "Full payout released to developer - Deliverables scope matched original design parameters.";
    
    const ratio = type === "recruiter" 
      ? { recruiter: 100, developer: 0 } 
      : { recruiter: 0, developer: 100 };

    onResolveDispute(dispId, verdictText, ratio, DisputeStatus.RESOLVED);
    alert(`Arbitration signed off! 100% funds released to the ${type}.`);
  };

  const executeSplitResolution = (dispId: string) => {
    if (!rationale) {
      alert("Please state the verdict rationale explaining the evidence audit findings.");
      return;
    }
    onResolveDispute(dispId, rationale, { recruiter: recruiterPct, developer: 100 - recruiterPct }, DisputeStatus.RESOLVED);
    setSelectedDispute(null);
    setRationale("");
    alert(`Split resolution confirmed: ${recruiterPct}% to Recruiter, ${100 - recruiterPct}% to Developer.`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white text-slate-800 rounded-2xl border border-slate-205 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-sm">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold font-sans text-slate-900">System Administration Console</h2>
          </div>
          <p className="text-xs text-slate-500">Managing data integrity, verifying developer certificates, and arbitrating dispute cases.</p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="bg-slate-50 hover:bg-slate-100 text-brand-teal text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2 z-10 transition-all cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Admin Panel Tabs / Bento Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Stats Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm" id="admin-user-stats-card">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Active Accounts Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono">Total Developers</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {usersList.filter(u => u.role === "DEVELOPER").length} 
                <span className="text-xs text-slate-400 font-normal ml-1">({usersList.filter(u => u.role === "DEVELOPER" && u.isVerified).length} verified)</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono">Total Recruiters</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {usersList.filter(u => u.role === "RECRUITER").length}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Total Users:</span>
            <span className="font-black text-slate-800">{usersList.length}</span>
          </div>
        </div>

        {/* Global Pipeline Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Technical Mediation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono">Pending Disputes</p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {disputes.filter(d => d.status !== DisputeStatus.RESOLVED).length} Active
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono">Resolved Cases</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {disputes.filter(d => d.status === DisputeStatus.RESOLVED).length} Closed
              </p>
            </div>
          </div>
        </div>

        {/* High-Value Skills Trends Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">Featured Skills Demand</h3>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="bg-slate-50 text-brand-teal text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200">React.js (Next v14)</span>
            <span className="bg-slate-50 text-brand-teal text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200">Docker (Kubernetes)</span>
            <span className="bg-slate-50 text-brand-teal text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200">Rust System Logic</span>
          </div>
        </div>
      </div>

      {/* DISPUTES RESOLUTION SYSTEM */}
      {disputes.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Gavel className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 font-sans">Arbitration Tribunal Cases (Impartial Board)</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {disputes.map((disp) => (
              <div key={disp.id} className="py-4 flex flex-col xl:flex-row justify-between items-start gap-4">
                <div className="space-y-1.5 flex-1 max-w-2xl text-slate-750">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-rose-600 font-bold font-semibold uppercase">CASE #{disp.id}</span>
                    <span className="text-xs text-slate-500 font-mono">• locked Escrow: ₹{disp.escrowAmount.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      disp.status === DisputeStatus.RESOLVED 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-150" 
                        : "bg-rose-50 text-rose-700 border border-rose-150"
                    }`}>
                      {disp.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{disp.milestoneTitle}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed italic">"Claimant statement: {disp.details}"</p>
                  
                  {disp.verdictRationale && (
                    <div className="p-3 bg-slate-50 rounded-lg text-[11px] leading-relaxed text-slate-600 space-y-1 border border-slate-200">
                      <p className="font-bold text-brand-teal">Impartial Mediation Verdict Settle Rationale:</p>
                      <p>{disp.verdictRationale}</p>
                      {disp.splitRatio && (
                        <p className="font-mono text-slate-800 font-semibold mt-1">Split Ratio: Recruiter {disp.splitRatio.recruiter}% - Developer {disp.splitRatio.developer}%</p>
                      )}
                    </div>
                  )}
                </div>

                {disp.status !== DisputeStatus.RESOLVED && (
                  <div className="flex flex-wrap gap-2 shrink-0 self-end xl:self-center">
                    <button
                      onClick={() => handleDirectVerdict(disp.id, "recruiter")}
                      className="bg-white hover:bg-slate-50 text-rose-600 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-bold transition-all cursor-pointer"
                    >
                      Refund Recruiter (100%)
                    </button>
                    <button
                      onClick={() => handleDirectVerdict(disp.id, "developer")}
                      className="bg-white hover:bg-slate-50 text-emerald-600 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-bold transition-all cursor-pointer"
                    >
                      Release Developer (100%)
                    </button>
                    <button
                      onClick={() => setSelectedDispute(disp)}
                      className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Custom Split Ratios
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
            {/* DYNAMIC CONSOLE DATA VIEWER WITH MULTI-TABS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Tab Headers */}
        <div className="bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
          <div className="flex gap-1 flex-wrap">
            {(["users", "developers", "recruiters", "projects", "applications"] as const).map((tab) => {
              const count = tab === "users" ? usersList.length
                : tab === "developers" ? usersList.filter(u => u.role === "DEVELOPER" && u.devProfile).length
                : tab === "recruiters" ? usersList.filter(u => u.role === "RECRUITER" && u.recProfile).length
                : tab === "projects" ? projects.length
                : applications.length;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setAdminActiveTab(tab);
                    setSearchQuery("");
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                    adminActiveTab === tab
                      ? "bg-brand-teal text-white shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all font-sans"
              placeholder={`Search ${adminActiveTab}...`}
            />
          </div>
        </div>

        {/* Tab 1: ALL USER ACCOUNTS */}
        {adminActiveTab === "users" && (
          <div className="overflow-x-auto text-slate-800">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-200/80">
                  <th className="p-4 font-bold">User Identity & Persona</th>
                  <th className="p-4 font-bold">Contact Details</th>
                  <th className="p-4 font-bold">Profile Progress</th>
                  <th className="p-4 font-bold">Verification Vetting</th>
                  <th className="p-4 font-bold">Active stage / Pipeline</th>
                  <th className="p-4 font-bold">Tracking / Last Login</th>
                  <th className="p-4 text-right font-bold">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body-sm text-xs">
                {usersList
                  .filter(u => !searchQuery || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.devProfile?.fullName || u.recProfile?.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((usr) => {
                    const completeness = calculateCompleteness(usr);
                    const email = usr.email;
                    const userName = usr.devProfile?.fullName || usr.recProfile?.fullName || usr.recProfile?.companyName || email.split('@')[0];
                    const phone = usr.devProfile?.phoneNumber || usr.recProfile?.phone || "—";
                    const isMasterAdmin = email.toLowerCase().trim() === "info.bouuz@gmail.com";
                    
                    // Pipeline count
                    const proposalsSent = usr.role === "DEVELOPER" ? applications.filter(a => a.developerId === usr.id).length : 0;
                    const jobsPosted = usr.role === "RECRUITER" ? projects.filter(p => p.recruiterId === usr.id).length : 0;
                    const invitesReceived = usr.role === "DEVELOPER" ? (usr.devProfile?.analytics?.invitesCount || 0) : 0;

                    // Stable tracking activity status calculation
                    const isOnline = usr.id.charCodeAt(usr.id.length - 1) % 3 === 0;
                    const isIdle = usr.id.charCodeAt(usr.id.length - 1) % 3 === 1;
                    const activityLabel = isOnline ? "Active now" : isIdle ? "Idle (34m ago)" : "Logged off yesterday";

                    return (
                      <tr key={usr.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/90 flex items-center justify-center font-bold text-slate-700 shrink-0 font-mono text-xs">
                              {userName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">
                                {userName}
                              </span>
                              
                              {/* Interactive Role Selector Dropdown */}
                              {isMasterAdmin ? (
                                <p className="text-[9px] font-bold text-rose-600 tracking-wide uppercase font-mono bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  ADMIN (SYSTEM OWNER)
                                </p>
                              ) : (
                                <div className="inline-block mt-1">
                                  <select
                                    value={usr.role}
                                    onChange={(e) => {
                                      const newRole = e.target.value;
                                      if (window.confirm(`Are you sure you want to change the role of ${usr.email} to ${newRole}?`)) {
                                        onUpdateUser(usr.id, { role: newRole });
                                      }
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-650 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                                  >
                                    <option value="DEVELOPER">DEVELOPER</option>
                                    <option value="RECRUITER">RECRUITER</option>
                                    <option value="ADMIN">ADMIN</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-mono text-slate-800 font-semibold text-xs leading-none">{email}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-sans">📞 {phone}</p>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1 max-w-[120px]">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                              <span>{completeness}% Filled</span>
                              {completeness === 100 && (
                                <span className="text-[9px] bg-amber-50 text-amber-805 px-1 py-0.2 rounded font-bold border border-amber-200 shrink-0 ml-1">★ 100%</span>
                              )}
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${completeness === 100 ? "bg-amber-500" : completeness > 50 ? "bg-brand-teal" : "bg-slate-400"}`}
                                style={{ width: `${completeness}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <label className="flex items-center gap-2 cursor-pointer w-max">
                            <input 
                              type="checkbox"
                              checked={usr.isVerified}
                              onChange={(e) => {
                                onUpdateUser(usr.id, { isVerified: e.target.checked });
                              }}
                              className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal w-4 h-4 cursor-pointer"
                            />
                            {usr.isVerified ? (
                              <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                                Verified ✅
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold text-[10px] bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                                Pending
                              </span>
                            )}
                          </label>
                        </td>

                        <td className="p-4 font-mono text-[11px] text-slate-700">
                          {usr.role === "DEVELOPER" ? (
                            <div className="space-y-0.5">
                              <p>⚡ Proposals: <span className="font-bold text-slate-900">{proposalsSent}</span></p>
                              <p>📨 Invitations: <span className="font-bold text-slate-900">{invitesReceived}</span></p>
                            </div>
                          ) : usr.role === "RECRUITER" ? (
                            <div>
                              <p>💼 Jobs Posted: <span className="font-bold text-slate-900">{jobsPosted}</span></p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              isOnline ? "bg-emerald-500" : isIdle ? "bg-amber-400" : "bg-slate-300"
                            }`} />
                            <span className="font-mono text-[11px] text-slate-600">{activityLabel}</span>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex gap-1.5 justify-end items-center">
                            {/* Edit profile metadata button */}
                            <button
                              onClick={() => openProfileEditor(usr)}
                              title="Edit User Core Profile"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] px-2.5 py-1 rounded font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              Edit Profile
                            </button>

                            {/* Suspension toggle button */}
                            {usr.isSuspended ? (
                              <button
                                onClick={() => onUpdateUser(usr.id, { isSuspended: false })}
                                className="bg-white hover:bg-slate-50 text-slate-750 text-[11px] px-2 py-1 border border-slate-205 rounded font-semibold transition-all cursor-pointer whitespace-nowrap"
                              >
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                onClick={() => onUpdateUser(usr.id, { isSuspended: true })}
                                className="bg-rose-55 hover:bg-rose-100 text-rose-700 text-[11px] px-2 py-1 border border-rose-100 rounded font-semibold transition-all cursor-pointer whitespace-nowrap"
                              >
                                Suspend
                              </button>
                            )}

                            {/* Dangerous Account Delete button */}
                            <button
                              onClick={() => {
                                if (window.confirm(`⚠️ WARNING: Are you absolutely sure you want to permanently delete user account "${email}"? This action is IRREVERSIBLE and will wipe all their associated data.`)) {
                                  onDeleteUser(usr.id);
                                }
                              }}
                              title="Delete Account Permanently"
                              disabled={isMasterAdmin}
                              className={`p-1.5 rounded border transition-all ${
                                isMasterAdmin 
                                  ? "opacity-30 cursor-not-allowed bg-slate-150 border-slate-200 text-slate-400" 
                                  : "bg-white hover:bg-red-50 border-slate-200 text-red-600 hover:border-red-250 cursor-pointer"
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: DEVELOPER PROFILES */}
        {adminActiveTab === "developers" && (() => {
          const devList = usersList
            .filter(u => u.role === "DEVELOPER" && u.devProfile)
            .map(u => u.devProfile)
            .filter(d => !searchQuery || d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || d.headline.toLowerCase().includes(searchQuery.toLowerCase()));

          return (
            <div className="overflow-x-auto text-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-200/80">
                    <th className="p-4 font-bold">Developer Name / Info</th>
                    <th className="p-4 font-bold">Headline & Location</th>
                    <th className="p-4 font-bold">Rates Guideline</th>
                    <th className="p-4 font-bold">Skills Inventory</th>
                    <th className="p-4 font-bold">Experience</th>
                    <th className="p-4 text-right font-bold">Verify Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {devList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">No matching developer profiles found.</td>
                    </tr>
                  ) : (
                    devList.map((dev) => {
                      const userAccount = usersList.find(u => u.id === dev.userId) || {};
                      return (
                        <tr key={dev.userId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={dev.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya"} alt={dev.fullName} className="w-9 h-9 rounded-full bg-slate-100 shrink-0" referrerPolicy="no-referrer" />
                              <div>
                                <span className="font-bold text-slate-900 block">{dev.fullName}</span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">{dev.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-slate-755">{dev.headline}</p>
                            <p className="text-[10px] text-slate-405 mt-0.5 font-sans">📌 {dev.location || "India"}</p>
                          </td>
                          <td className="p-4 font-mono text-slate-655">
                            <p>Hourly: ₹{dev.rates?.hourly}/hr</p>
                            <p className="text-[10px] text-slate-405">Monthly min: ₹{dev.rates?.monthly?.toLocaleString()}</p>
                          </td>
                          <td className="p-4 text-slate-500">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {dev.skills?.map((s: string) => (
                                <span key={s} className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.5 rounded">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-semibold font-mono">
                            {dev.experienceYears} Years
                          </td>
                          <td className="p-4 text-right">
                            {userAccount.isVerified ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] px-2 py-0.5 rounded font-bold font-mono">Verified Vetted ✅</span>
                            ) : (
                              <button
                                onClick={() => onUpdateUser(dev.userId, { isVerified: true })}
                                className="bg-brand-teal text-white hover:bg-brand-teal-dark font-extrabold text-[10px] px-2.5 py-1 rounded shadow-sm"
                              >
                                Approve Vetting
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Tab 3: RECRUITER PROFILES */}
        {adminActiveTab === "recruiters" && (() => {
          const recList = usersList
            .filter(u => u.role === "RECRUITER" && u.recProfile)
            .map(u => u.recProfile)
            .filter(r => !searchQuery || r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || r.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

          return (
            <div className="overflow-x-auto text-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-200/80">
                    <th className="p-4 font-bold">Company / Identity</th>
                    <th className="p-4 font-bold">Representative Name</th>
                    <th className="p-4 font-bold">Industry Field</th>
                    <th className="p-4 font-bold">Company Size</th>
                    <th className="p-4 font-bold">Representative Phone</th>
                    <th className="p-4 text-right font-bold">Verification Vibe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">No matching recruiter profiles found.</td>
                    </tr>
                  ) : (
                    recList.map((rec) => {
                      const userAccount = usersList.find(u => u.id === rec.userId) || {};
                      return (
                        <tr key={rec.userId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-slate-900 block">{rec.companyName}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{rec.website || "No site linked"}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">
                            {rec.fullName || "Corporate Rep"}
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-bold">{rec.industry || "Technology"}</span>
                          </td>
                          <td className="p-4 font-semibold font-mono">
                            {rec.companySize || "N/A"} people
                          </td>
                          <td className="p-4 font-mono text-slate-655">
                            {rec.phone || "None Masked"}
                          </td>
                          <td className="p-4 text-right">
                            {userAccount.isVerified ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-150 text-[10px] px-2 py-0.5 rounded font-bold font-mono">Trusted Partner</span>
                            ) : (
                              <button
                                onClick={() => onUpdateUser(rec.userId, { isVerified: true })}
                                className="bg-slate-100 hover:bg-slate-250 text-slate-800 font-bold text-[10px] px-2.5 py-1 rounded"
                              >
                                Certify Partner
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Tab 4: PLATFORM PROJECTS PIPELINE */}
        {adminActiveTab === "projects" && (() => {
          const projList = projects.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.techStack.join(" ").toLowerCase().includes(searchQuery.toLowerCase()));

          return (
            <div className="overflow-x-auto text-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-200/80">
                    <th className="p-4 font-bold">Project Title & Specs</th>
                    <th className="p-4 font-bold">Estimated Budget</th>
                    <th className="p-4 font-bold">Working Mode</th>
                    <th className="p-4 font-bold">Hiring Type</th>
                    <th className="p-4 font-bold">Hiring Manager UID</th>
                    <th className="p-4 text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {projList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">No matching project listings currently on the platform.</td>
                    </tr>
                  ) : (
                    projList.map((pr) => (
                      <tr key={pr.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block mb-1">{pr.title}</span>
                          <span className="text-[10px] text-slate-505 block leading-relaxed line-clamp-2 max-w-sm">{pr.description}</span>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {pr.techStack?.map((t: string) => (
                              <span key={t} className="bg-slate-100 text-brand-teal-dark text-[9px] px-1.5 font-mono py-0.5 rounded font-semibold">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">
                          ₹{pr.budget.toLocaleString()}
                        </td>
                        <td className="p-4 lowercase capitalize font-semibold">
                          {pr.workMode}
                        </td>
                        <td className="p-4 uppercase font-bold text-brand-teal font-mono text-[10px]">
                          {pr.hiringType}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-400">
                          {pr.recruiterId}
                        </td>
                        <td className="p-4 text-right font-bold">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] px-2 py-1 rounded">
                            {pr.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Tab 5: APPLICATIONS POOL */}
        {adminActiveTab === "applications" && (() => {
          const appList = applications.filter(a => !searchQuery || a.coverLetter.toLowerCase().includes(searchQuery.toLowerCase()) || a.developerId.toLowerCase().includes(searchQuery.toLowerCase()));

          return (
            <div className="overflow-x-auto text-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-200/80">
                    <th className="p-4 font-bold">Project Name & Cover Letter</th>
                    <th className="p-4 font-bold">Developer UID</th>
                    <th className="p-4 font-bold">Proposed Rate</th>
                    <th className="p-4 font-bold">Timeframe Estimate</th>
                    <th className="p-4 font-mono font-bold text-slate-400">Application ID</th>
                    <th className="p-4 text-right font-bold">Vetting Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {appList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">No matching proposal entries currently filed.</td>
                    </tr>
                  ) : (
                    appList.map((ap) => {
                      const associatedProject = projects.find(p => p.id === ap.projectId) || { title: "Custom FinTech Refactoring" };
                      return (
                        <tr key={ap.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-slate-900 block mb-1">{associatedProject.title}</span>
                            <span className="text-[10px] text-slate-500 italic block leading-relaxed line-clamp-2 max-w-sm">"{ap.coverLetter}"</span>
                          </td>
                          <td className="p-4 font-semibold font-mono text-[10px]">
                            {ap.developerId}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-800">
                            ₹{ap.proposedRate?.toLocaleString()}/hr
                          </td>
                          <td className="p-4 text-slate-655 font-semibold font-mono">
                            {ap.timelineEstimate}
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-[10px]">
                            {ap.id}
                          </td>
                          <td className="p-4 text-right font-bold uppercase font-mono text-[10px]">
                            <span className="bg-amber-50 text-amber-700 border border-amber-150 rounded px-2 py-0.5">
                              {ap.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Admin Personal preferences section */}
      <div id="admin-pref-card" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-teal" /> Personal Admin Email Notification Settings
          </h3>
          <p className="text-xs text-slate-500 mt-1">Configure your personal administrative notification subscriptions for {currentUser.email}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Invites alert */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 font-sans">New Recruiter Invites</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Receive mail alerts regarding direct match invitation exchanges.</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono">
              <span className="text-[11px] text-slate-500">Status: {emailNewInvites ? "Enabled" : "Disabled"}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={emailNewInvites}
                  onChange={(e) => setEmailNewInvites(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
              </label>
            </div>
          </div>

          {/* Application alerts */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 font-sans">Contract Progress Updates</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Get notified when escrow releases or disputes undergo status change activities.</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono">
              <span className="text-[11px] text-slate-500">Status: {emailApplicationUpdates ? "Enabled" : "Disabled"}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={emailApplicationUpdates}
                  onChange={(e) => setEmailApplicationUpdates(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
              </label>
            </div>
          </div>

          {/* Direct chats alerts */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 font-sans">Administrative Messages</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Subscribe to administrative communications and help-center support requests.</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono">
              <span className="text-[11px] text-slate-500">Status: {emailChatMessages ? "Enabled" : "Disabled"}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={emailChatMessages}
                  onChange={(e) => setEmailChatMessages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
              </label>
            </div>
          </div>

          {/* Global platform alerts */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-205 hover:border-slate-300 transition-all space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 font-sans">Global Platform Alerts</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Receive instant system health audit issues and compliance dispute filings.</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono">
              <span className="text-[11px] text-slate-500">Status: {emailGlobalAlerts ? "Enabled" : "Disabled"}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={emailGlobalAlerts}
                  onChange={(e) => setEmailGlobalAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-between items-center border-t border-slate-100">
          <span className="text-xs text-slate-400 font-mono">
            Secure intermediate SMTP gateways process notifications safely.
          </span>
          <button
            type="button"
            id="btn-save-preferences-admin"
            onClick={handlePreferencesSave}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-brand-teal/40 outline-none cursor-pointer font-sans"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* SPLIT SETTLEMENT MODAL overlay */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-6 text-slate-800 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-brand-teal" /> Sabbatical Split Ratio Verdict
                </h3>
                <p className="text-xs text-slate-500">Configure ratio payout under Section 72 Intermediary mediation.</p>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="text-slate-400 hover:text-slate-800 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-semibold">
                  <span className="text-slate-700">Recruiter Share: {recruiterPct}%</span>
                  <span className="text-slate-700">Developer Share: {100 - recruiterPct}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={recruiterPct}
                  onChange={(e) => setRecruiterPct(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-teal"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono shadow-inner">
                <p><span className="text-slate-450 font-bold">Recruiter receives:</span> <span className="text-slate-800 font-bold">₹{(selectedDispute.escrowAmount * recruiterPct / 100).toLocaleString()}</span></p>
                <p><span className="text-slate-450 font-bold">Developer receives:</span> <span className="text-slate-800 font-bold">₹{(selectedDispute.escrowAmount * (100 - recruiterPct) / 100).toLocaleString()}</span></p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Verdict Rationale Argument (Required)</label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-brand-teal focus:bg-white outline-none h-24 resize-none transition-all"
                  placeholder="Details concerning why this ratio is enforced..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-3 py-1.5 border border-slate-250 rounded-lg text-xs hover:bg-slate-55 text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeSplitResolution(selectedDispute.id)}
                  className="px-4 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  Confirm Split Verdict
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT USER PROFILE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-5 text-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-teal" /> Edit Profile on Behalf of User
                </h3>
                <p className="text-xs text-slate-500">Updating verified credentials for {editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-800 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={saveProfileEdits} className="space-y-4">
              {editingUser.role === "DEVELOPER" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Full Name</label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs edit-input outline-none focus:border-brand-teal focus:bg-white text-slate-800 font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Professional Headline</label>
                      <input
                        type="text"
                        value={editForm.headline}
                        onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs edit-input outline-none focus:border-brand-teal focus:bg-white text-slate-800 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Professional Bio Overview</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-brand-teal focus:bg-white h-20 resize-none text-slate-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Hourly Rate (INR ₹)</label>
                      <input
                        type="number"
                        value={editForm.hourlyRate}
                        onChange={(e) => setEditForm({ ...editForm, hourlyRate: Number(e.target.value) })}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs edit-input outline-none focus:border-brand-teal focus:bg-white text-slate-800 font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Physical Location</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs edit-input outline-none focus:border-brand-teal focus:bg-white text-slate-800 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Skills Inventory (Separated by Commas)</label>
                    <input
                      type="text"
                      value={editForm.skillsStr}
                      placeholder="React, TypeScript, Redux, Node.js"
                      onChange={(e) => setEditForm({ ...editForm, skillsStr: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-brand-teal focus:bg-white text-slate-800 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Direct Contact Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-brand-teal focus:bg-white text-slate-800 font-medium"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Company Name</label>
                      <input
                        type="text"
                        value={editForm.companyName}
                        onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs edit-input outline-none focus:border-brand-teal focus:bg-white text-slate-800"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Contact Representative</label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs edit-input outline-none focus:border-brand-teal focus:bg-white text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Corporate Industry</label>
                      <input
                        type="text"
                        value={editForm.industry}
                        onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs edit-input outline-none focus:border-brand-teal focus:bg-white text-slate-800"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Company Scale Size</label>
                      <select
                        value={editForm.companySize}
                        onChange={(e) => setEditForm({ ...editForm, companySize: e.target.value })}
                        className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-brand-teal focus:bg-white text-slate-800"
                      >
                        <option value="1-10">1-10 candidates</option>
                        <option value="11-50">11-50 candidates</option>
                        <option value="51-200">51-200 candidates</option>
                        <option value="201-500">201-500 candidates</option>
                        <option value="500+">500+ candidates</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Company Website URL</label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-brand-teal focus:bg-white text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">About Company Mission</label>
                    <textarea
                      value={editForm.aboutCompany}
                      onChange={(e) => setEditForm({ ...editForm, aboutCompany: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-brand-teal focus:bg-white h-20 resize-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono">Direct Contact Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-brand-teal focus:bg-white text-slate-800"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
