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
  onUpdateUser: (userId: string, updates: any) => void;
  onResolveDispute: (disputeId: string, rationale: string, ratio?: { recruiter: number; developer: number }, status?: DisputeStatus) => void;
  onUpdatePreferences?: (prefs: any) => void;
}

export default function AdminPanel({
  currentUser,
  usersList,
  disputes,
  onUpdateUser,
  onResolveDispute,
  onUpdatePreferences
}: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  
  // Custom split ratio resolution variables
  const [rationale, setRationale] = useState("");
  const [recruiterPct, setRecruiterPct] = useState(50);

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

      {/* ACTIVE USERS MANAGER */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans">Active User Base Management Control</h3>
            <p className="text-xs text-slate-500">Suspend accounts, verify developer portfolios, or change roles.</p>
          </div>
          <div className="flex gap-2">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all font-sans" 
              placeholder="Search by email..."
            />
          </div>
        </div>

        <div className="overflow-x-auto text-slate-800">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-200/80">
                <th className="p-4 font-bold">Persona</th>
                <th className="p-4 font-bold">Contact</th>
                <th className="p-4 font-bold">Verification</th>
                <th className="p-4 font-bold">Email preferences (Admin Override)</th>
                <th className="p-4 font-bold">Sanction Status</th>
                <th className="p-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body-sm text-xs">
              {usersList
                .filter(u => !searchQuery || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((usr) => {
                  const prefs = usr.notificationPreferences || {
                    emailNewInvites: true,
                    emailApplicationUpdates: true,
                    emailChatMessages: true
                  };
                  return (
                    <tr key={usr.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block mb-1">
                          {usr.devProfile?.fullName || usr.recProfile?.companyName || usr.email.split('@')[0]}
                        </span>
                        
                        {/* Interactive Role Management */}
                        {usr.email.toLowerCase().trim() === "info.bouuz@gmail.com" ? (
                          <p className="text-[10px] font-bold text-rose-600 tracking-wide uppercase font-mono bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md inline-block">
                            ADMIN (SYSTEM OWNER)
                          </p>
                        ) : (
                          <div className="inline-block">
                            <select
                              value={usr.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                if (window.confirm(`Are you sure you want to change the role of ${usr.email} to ${newRole}?`)) {
                                  onUpdateUser(usr.id, { role: newRole });
                                }
                              }}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-250 text-[10px] font-bold text-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-brand-teal transition-all cursor-pointer font-sans"
                            >
                              <option value="DEVELOPER">DEVELOPER ROLE</option>
                              <option value="RECRUITER">RECRUITER ROLE</option>
                              <option value="ADMIN">ADMIN ROLE</option>
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-650">{usr.email}</td>
                      <td className="p-4">
                        {usr.isVerified ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 w-max">
                            <CheckCircle className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => onUpdateUser(usr.id, { isVerified: true })}
                            className="text-brand-teal hover:underline font-bold text-xs cursor-pointer"
                          >
                            Approve Verification
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 font-mono text-[10px] text-slate-600">
                          {usr.role === "DEVELOPER" && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={prefs.emailNewInvites !== false}
                                onChange={(e) => {
                                  onUpdateUser(usr.id, {
                                    notificationPreferences: {
                                      ...prefs,
                                      emailNewInvites: e.target.checked
                                    }
                                  });
                                }}
                                className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal w-3.5 h-3.5 cursor-pointer"
                              />
                              <span>New Invites Email: {prefs.emailNewInvites !== false ? "ON" : "OFF"}</span>
                            </label>
                          )}
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={prefs.emailApplicationUpdates !== false}
                              onChange={(e) => {
                                onUpdateUser(usr.id, {
                                  notificationPreferences: {
                                    ...prefs,
                                    emailApplicationUpdates: e.target.checked
                                  }
                                });
                              }}
                              className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>Updates Email: {prefs.emailApplicationUpdates !== false ? "ON" : "OFF"}</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={prefs.emailChatMessages !== false}
                              onChange={(e) => {
                                onUpdateUser(usr.id, {
                                  notificationPreferences: {
                                    ...prefs,
                                    emailChatMessages: e.target.checked
                                  }
                                });
                              }}
                              className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>Direct Chat Email: {prefs.emailChatMessages !== false ? "ON" : "OFF"}</span>
                          </label>
                        </div>
                      </td>
                      <td className="p-4">
                        {usr.isSuspended ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-0.5 w-max">
                            <AlertCircle className="w-3.5 h-3.5" /> Suspended
                          </span>
                        ) : (
                          <span className="text-slate-450 italic font-medium">Good Standing</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {usr.isSuspended ? (
                            <button
                              onClick={() => onUpdateUser(usr.id, { isSuspended: false })}
                              className="bg-white hover:bg-slate-50 text-slate-700 text-[11px] px-2.5 py-1 border border-slate-205 rounded-lg font-bold transition-all cursor-pointer shadow-sm"
                            >
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateUser(usr.id, { isSuspended: true })}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] px-2.5 py-1 rounded border border-rose-200 transition-all cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

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
    </div>
  );
}
