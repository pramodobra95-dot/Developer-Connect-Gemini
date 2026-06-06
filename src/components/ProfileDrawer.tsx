import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  User as UserIcon, 
  MapPin, 
  Briefcase, 
  Mail, 
  Phone, 
  Globe, 
  Sparkles, 
  FileText, 
  Camera, 
  CheckCircle, 
  TrendingUp,
  Building,
  DollarSign,
  Github,
  Linkedin,
  ShieldAlert
} from "lucide-react";
import { User, UserRole, DeveloperProfile, RecruiterProfile } from "../types.js";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  devProfile: DeveloperProfile | null;
  recProfile: RecruiterProfile | null;
  onUpdateProfile: (profile: Partial<DeveloperProfile | RecruiterProfile>) => Promise<void>;
  onUpdatePreferences?: (prefs: any) => Promise<void>;
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  currentUser,
  devProfile,
  recProfile,
  onUpdateProfile,
  onUpdatePreferences
}: ProfileDrawerProps) {
  // Developer form state
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
  const [experience, setExperience] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [isContactVisible, setIsContactVisible] = useState(false);
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [weeklyRate, setWeeklyRate] = useState<number>(0);
  const [monthlyRate, setMonthlyRate] = useState<number>(0);
  const [availability, setAvailability] = useState<"Part-time" | "Full-time" | "Both">("Both");
  const [status, setStatus] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Recruiter form state
  const [recFullName, setRecFullName] = useState("");
  const [recCompanyName, setRecCompanyName] = useState("");
  const [recWebsite, setRecWebsite] = useState("");
  const [recIndustry, setRecIndustry] = useState("");
  const [recCompanySize, setRecCompanySize] = useState("");
  const [recAboutCompany, setRecAboutCompany] = useState("");
  const [recPhone, setRecPhone] = useState("");
  const [recAvatarUrl, setRecAvatarUrl] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");

  // Notification Preferences
  const [emailNewInvites, setEmailNewInvites] = useState(true);
  const [emailApplicationUpdates, setEmailApplicationUpdates] = useState(true);
  const [emailChatMessages, setEmailChatMessages] = useState(true);

  // Loading indicator for Gemini optimizers
  const [isAIProfileLoading, setIsAIProfileLoading] = useState(false);

  // Sync edits when properties mount or load
  useEffect(() => {
    if (currentUser.role === UserRole.DEVELOPER && devProfile) {
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
    } else if (currentUser.role === UserRole.RECRUITER && recProfile) {
      setRecFullName(recProfile.fullName || "");
      setRecCompanyName(recProfile.companyName || "");
      setRecWebsite(recProfile.website || "");
      setRecIndustry(recProfile.industry || "");
      setRecCompanySize(recProfile.companySize || "");
      setRecAboutCompany(recProfile.aboutCompany || "");
      setRecPhone(recProfile.phone || "");
      setRecAvatarUrl(recProfile.avatarUrl || "");
      setCompanyLogoUrl(recProfile.companyLogoUrl || "");
    }

    if (currentUser.notificationPreferences) {
      setEmailNewInvites(currentUser.notificationPreferences.emailNewInvites);
      setEmailApplicationUpdates(currentUser.notificationPreferences.emailApplicationUpdates);
      setEmailChatMessages(currentUser.notificationPreferences.emailChatMessages);
    }
  }, [devProfile, recProfile, currentUser, isOpen]);

  // Image Upload handler for JPEG
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "recAvatar" | "companyLogo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/jpg") {
      alert("Format error: Only JPEG/JPG images are permitted for profile credentials.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === "avatar") setAvatarUrl(base64String);
      if (target === "recAvatar") setRecAvatarUrl(base64String);
      if (target === "companyLogo") setCompanyLogoUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Profile Completeness Score (Developer Only)
  const calculateCompleteness = () => {
    let score = 0;
    const suggestions: { field: string; boost: number; elementId: string; group: string }[] = [];

    if (fullName.trim()) score += 15; else suggestions.push({ field: "Full Name", boost: 15, elementId: "drawer-input-fullname", group: "Identity" });
    if (headline.trim()) score += 15; else suggestions.push({ field: "Headline Role", boost: 15, elementId: "drawer-input-headline", group: "Identity" });
    if (bio.trim()) score += 15; else suggestions.push({ field: "Professional Bio", boost: 15, elementId: "drawer-textarea-bio", group: "Identity" });
    if (skillsStr.trim()) score += 15; else suggestions.push({ field: "Skills List", boost: 15, elementId: "drawer-input-skills", group: "Tech Stack" });
    if (experience > 0) score += 10; else suggestions.push({ field: "Years of Experience", boost: 10, elementId: "drawer-input-experience", group: "Tech Stack" });
    if (hourlyRate > 0) score += 10; else suggestions.push({ field: "Hourly Rate", boost: 10, elementId: "drawer-input-hourly", group: "Financials" });
    if (github.trim() || linkedin.trim() || portfolio.trim()) score += 10; else suggestions.push({ field: "Social Link (GitHub/LinkedIn)", boost: 10, elementId: "drawer-input-github", group: "Social" });
    if (phoneNumber.trim()) score += 10; else suggestions.push({ field: "Phone Number", boost: 10, elementId: "drawer-input-phone", group: "Contact" });
    
    if (avatarUrl) score += 10; else suggestions.push({ field: "Profile Photograph", boost: 10, elementId: "drawer-avatar-upload-file", group: "Identity" });
    if (location) score += 5; else suggestions.push({ field: "Location City", boost: 5, elementId: "drawer-input-location", group: "Contact" });
    if (availability) score += 1; else suggestions.push({ field: "Availability Preference", boost: 1, elementId: "drawer-select-availability", group: "Availability" });
    if (status && status.trim()) score += 1; else suggestions.push({ field: "Working Status", boost: 1, elementId: "drawer-input-status", group: "Availability" });

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
            skills: devProfile?.skills || [],
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

  // Submit profile edit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser.role === UserRole.DEVELOPER) {
        const parsedSkills = skillsStr.split(",").map(s => s.trim()).filter(Boolean);
        await onUpdateProfile({
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
          isContactVisible,
          socials: {
            ...devProfile?.socials,
            github,
            linkedin,
            portfolio
          },
          rates: {
            ...devProfile?.rates,
            hourly: Number(hourlyRate),
            weekly: Number(weeklyRate),
            monthly: Number(monthlyRate)
          }
        } as any);
      } else if (currentUser.role === UserRole.RECRUITER) {
        await onUpdateProfile({
          fullName: recFullName,
          companyName: recCompanyName,
          website: recWebsite,
          industry: recIndustry,
          companySize: recCompanySize,
          aboutCompany: recAboutCompany,
          phone: recPhone,
          avatarUrl: recAvatarUrl,
          companyLogoUrl
        } as any);
      }

      // Save notification preferences
      if (onUpdatePreferences) {
        await onUpdatePreferences({
          emailNewInvites,
          emailApplicationUpdates,
          emailChatMessages
        });
      }

      alert("Profile and communications dashboard configurations updated successfully!");
      onClose();
    } catch (err) {
      console.error("Failed to commit profile updates", err);
      alert("Error: Failed to save changes.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="relative z-50">
          {/* Backstage ambient backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />

          {/* Off-canvas right sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl flex flex-col h-full z-50 text-slate-800"
          >
            {/* Header section */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-brand-teal" /> Personal Portal Credentials
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.email} • Settings Panel</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-slate-800 transition-colors outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Container Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              
              {/* DEVELOPER SETTINGS FLOW */}
              {currentUser.role === UserRole.DEVELOPER && (
                <div className="space-y-6">
                  
                  {/* Dynamic Diagnostic & Profile Completeness Progress Tracker */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-[#0c1c2b] rounded-2xl p-5 text-white shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="bg-teal-500/20 text-teal-300 text-[9px] font-mono uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border border-teal-500/30">
                          Profile Diagnostic
                        </span>
                        <h4 className="text-sm font-bold mt-1">Profile Excellence Score</h4>
                      </div>
                      <div className="flex items-baseline gap-1.5 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10 text-[11px]">
                        <span className="text-teal-400 font-extrabold text-lg">{completenessScore}%</span>
                        <span className="font-bold text-[9px] text-yellow-300">
                          {completenessScore <= 40 ? "Needs Work" : completenessScore <= 75 ? "Looking Good" : "Elite Status 🔥"}
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking line */}
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${completenessScore}%` }}
                      />
                    </div>

                    {/* Dynamic Pending checklist links */}
                    {completenessSuggestions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase font-mono">Unlock 100% Core Relevance:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {completenessSuggestions.slice(0, 4).map((sug) => (
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
                              className="text-[9px] font-mono text-left px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-teal-400 text-slate-300 hover:text-white transition-all cursor-pointer"
                            >
                              + Add {sug.field} (+{sug.boost}%)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 1: Developer Profile Identity */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest">1. Developer Profile Identity</h4>
                      <button
                        type="button"
                        onClick={triggerAIProfileOptimization}
                        disabled={isAIProfileLoading}
                        className="bg-purple-50 hover:bg-purple-100 border border-purple-200/60 text-purple-700 hover:text-purple-800 text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all outline-none disabled:opacity-50 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>{isAIProfileLoading ? "Optimizing..." : "AI Optimize"}</span>
                      </button>
                    </div>

                    {/* Profile image JPEG crop */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="col-span-1 flex flex-col items-center">
                        <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-slate-250 bg-slate-100 shadow-inner flex items-center justify-center">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-8 h-8 text-slate-400" />
                          )}
                          <label htmlFor="drawer-avatar-upload-file" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white text-[9px] font-bold gap-1">
                            <Camera className="w-4 h-4" />
                            <span>JPEG Only</span>
                          </label>
                        </div>
                        <input
                          id="drawer-avatar-upload-file"
                          type="file"
                          accept=".jpg,.jpeg"
                          onChange={(e) => handleImageUpload(e, "avatar")}
                          className="hidden"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <p className="font-bold text-slate-700">Display Profile Photo</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Required standard: JPEG/JPG graphic format. Uploading custom logo assets establishes trustworthy workspace matching.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Full Legal Name</label>
                        <input
                          id="drawer-input-fullname"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="Your official designation"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Headline Professional Role</label>
                        <input
                          id="drawer-input-headline"
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="e.g. Senior Full-Stack Cloud & TypeScript Engineer"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Professional Biography Speech Summary</label>
                        <textarea
                          id="drawer-textarea-bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="Introduce your capabilities, cloud credentials, major engineering milestones, and design values..."
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Core Tech Stack & Experience */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">2. Core Tech Stack & Experience</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Skills (Comma Separated)</label>
                        <input
                          id="drawer-input-skills"
                          type="text"
                          value={skillsStr}
                          onChange={(e) => setSkillsStr(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="React, CSS, Go, PostgreSQL"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Years of Professional Experience</label>
                        <input
                          id="drawer-input-experience"
                          type="number"
                          value={experience}
                          onChange={(e) => setExperience(Number(e.target.value))}
                          min={0}
                          max={50}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Availability Parameter</label>
                        <select
                          id="drawer-select-availability"
                          value={availability}
                          onChange={(e) => setAvailability(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                        >
                          <option value="Part-time">Part-time Matching</option>
                          <option value="Full-time">Full-time Retainer</option>
                          <option value="Both">Flexible Scope Portfolio</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Working status indicator</label>
                        <input
                          id="drawer-input-status"
                          type="text"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="e.g. Active matching hourly roles"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Direct Contact details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">3. Direct Contact details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Location City / Region</label>
                        <input
                          id="drawer-input-location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="Bengaluru, Karnataka"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Corporate Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 text-xs outline-none cursor-not-allowed"
                          disabled
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Phone Number (UPI Verified)</label>
                        <input
                          id="drawer-input-phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2 bg-slate-50 hover:bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/60 cursor-pointer select-none transition-all">
                      <input
                        type="checkbox"
                        checked={isContactVisible}
                        onChange={(e) => setIsContactVisible(e.target.checked)}
                        className="mt-0.5 pointer-events-auto rounded border-slate-300 text-brand-teal focus:ring-brand-teal w-4 h-4 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">Public Contact Visibility</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Enable trusted recruiters to bypass the Chat client and contact you directly via phone or email for fast contract onboarding processes.</p>
                      </div>
                    </label>
                  </div>

                  {/* Section 4: Budget Retainer Rates */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">4. Client Retainer Rates (INR ₹)</h4>
                    <div className="bg-slate-50 border border-[#b2eae2]/30 rounded-xl p-4 flex gap-3 text-slate-750">
                      <DollarSign className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[10.5px]">Standard Compliance Rate Rules Locked</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">This marketplace enforces a base standard of absolutely no less than ₹500/hr, protecting standard legal retainers across all roles.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Hourly Rate (₹/hr)</label>
                        <input
                          id="drawer-input-hourly"
                          type="number"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(Number(e.target.value))}
                          min={500}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all font-bold font-mono text-brand-navy"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Weekly Standard (₹)</label>
                        <input
                          type="number"
                          value={weeklyRate}
                          onChange={(e) => setWeeklyRate(Number(e.target.value))}
                          min={0}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all font-bold font-mono text-brand-navy"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Monthly Retainer (₹)</label>
                        <input
                          type="number"
                          value={monthlyRate}
                          onChange={(e) => setMonthlyRate(Number(e.target.value))}
                          min={0}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all font-bold font-mono text-brand-navy"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Professional Links & Social Profiles */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">5. Professional Links & Social Profiles</h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">GitHub profile URL</label>
                        <input
                          id="drawer-input-github"
                          type="url"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="https://github.com/yourhandle"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">LinkedIn profile URL</label>
                        <input
                          type="url"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="https://linkedin.com/in/yourhandle"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Online Portfolio Link</label>
                        <input
                          type="url"
                          value={portfolio}
                          onChange={(e) => setPortfolio(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="https://mycodeportfolio.dev"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* RECRUITER SETTINGS FLOW */}
              {currentUser.role === UserRole.RECRUITER && (
                <div className="space-y-6">
                  
                  {/* Section 1: Identity & Logo Uploads (supporting JPEG) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Profile Visual Credentials</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Recruiter Photograph */}
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
                          <p className="font-bold text-slate-850">Personal Photo</p>
                          <label htmlFor="drawer-rec-avatar-upload" className="inline-block bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] shadow-xs cursor-pointer transition-colors">
                            Change Avatar
                          </label>
                          <input
                            id="drawer-rec-avatar-upload"
                            type="file"
                            accept=".jpg,.jpeg"
                            onChange={(e) => handleImageUpload(e, "recAvatar")}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Company Brand Logo */}
                      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img
                            src={companyLogoUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAE1SMwdmyLIju7Ox7ppeEf0bl2ZA-kl8JU9liRcngr4ZoDtexxBK1OisNtbfLpMGyIXBEAVWMPzKZPx0-HrR4-sc65L1bMNsyn7y_WBE1H568KCIwG1AO8A2MZV9il0fc_D7X_Ev6pDqYMUihIj4OT62yi9DAa8yCMKYQNiq0s_u_nUwzJY8b4v5W53KM-quuT0B4kk-HH0vyn-El7WW8IkxIU_bfe5c1sO71QxMpXmG3-0wHWnTcrh5x7TisEuZdpp5D2drNHukU"}
                            alt="Company Logo"
                            className="w-16 h-16 rounded-xl border border-slate-300 object-cover shadow-sm bg-white"
                          />
                          <span className="absolute bottom-0 right-0 bg-brand-teal text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white leading-none">
                            JPEG
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-850">Company Brand Logo</p>
                          <label htmlFor="drawer-rec-logo-upload" className="inline-block bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] shadow-xs cursor-pointer transition-colors">
                            Change Logo
                          </label>
                          <input
                            id="drawer-rec-logo-upload"
                            type="file"
                            accept=".jpg,.jpeg"
                            onChange={(e) => handleImageUpload(e, "companyLogo")}
                            className="hidden"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Section 2: Recruiter & Company Specifications */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">2. Recruiter & Company Specifications</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Recruiter Representative Name</label>
                        <input
                          type="text"
                          value={recFullName}
                          onChange={(e) => setRecFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="e.g. Aryan Sharma"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Official Registered Company</label>
                        <input
                          type="text"
                          value={recCompanyName}
                          onChange={(e) => setRecCompanyName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="e.g. GreenTech Systems Ltd."
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Company Website URL</label>
                        <input
                          type="url"
                          value={recWebsite}
                          onChange={(e) => setRecWebsite(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="https://greentechsystems.org"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Active Industry Sector</label>
                        <input
                          type="text"
                          value={recIndustry}
                          onChange={(e) => setRecIndustry(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="e.g. Clean Energy Systems"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Global Team headcount size</label>
                        <select
                          value={recCompanySize}
                          onChange={(e) => setRecCompanySize(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all"
                        >
                          <option value="1-10">1-10 Micro Startup</option>
                          <option value="11-50">11-50 Early Venture</option>
                          <option value="51-200">51-200 Scaling Enterprise</option>
                          <option value="200+">200+ Corporate Fleet</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wide">Phone Number Contact</label>
                        <input
                          type="tel"
                          value={recPhone}
                          onChange={(e) => setRecPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all placeholder-slate-400"
                          placeholder="+91 91234 56789"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 uppercase tracking-wide">Describe Company Bio & Workspace Objectives</label>
                      <textarea
                        value={recAboutCompany}
                        onChange={(e) => setRecAboutCompany(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-brand-teal focus:bg-white outline-none transition-all resize-none placeholder-slate-400"
                        placeholder="Describe your funding, focus area, engineering challenges and high-level tech initiatives..."
                        required
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* INTEGRATED EMAIL ALERTS & SYSTEM PREFERENCES FOR ALL ROLES */}
              <div className="space-y-4 pt-4 border-t border-slate-150">
                <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">Communications Preferences Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex flex-col justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-all space-y-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-[10px]">Opportunities & Invites</p>
                      <p className="text-[9px] text-slate-500 leading-normal">Instant system updates and candidate match suggestions.</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Alert Alerts:</span>
                      <input
                        type="checkbox"
                        checked={emailNewInvites}
                        onChange={(e) => setEmailNewInvites(e.target.checked)}
                        className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </label>

                  <label className="flex flex-col justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-all space-y-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-[10px]">Contracts & Applications</p>
                      <p className="text-[9px] text-slate-500 leading-normal font-sans">Recruitment updates and match negotiations.</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Status updates:</span>
                      <input
                        type="checkbox"
                        checked={emailApplicationUpdates}
                        onChange={(e) => setEmailApplicationUpdates(e.target.checked)}
                        className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </label>

                  <label className="flex flex-col justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-all space-y-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-[10px]">Real-Time Chat Messages</p>
                      <p className="text-[9px] text-slate-500 leading-normal">Email logs when you receive direct chat client messages offline.</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-mono font-bold text-slate-400 uppercase">Chat Alerts:</span>
                      <input
                        type="checkbox"
                        checked={emailChatMessages}
                        onChange={(e) => setEmailChatMessages(e.target.checked)}
                        className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </label>
                </div>
              </div>

            </form>

            {/* Bottom action buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer outline-none ml-auto text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-brand-teal hover:bg-[#0d6e66] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer outline-none text-xs"
              >
                Save Live Configurations
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
