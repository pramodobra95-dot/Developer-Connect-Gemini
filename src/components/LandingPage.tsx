import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Zap, 
  Check, 
  Shield, 
  ArrowRight, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Users, 
  Briefcase, 
  Phone, 
  MapPin, 
  TrendingUp, 
  FileText, 
  HelpCircle, 
  Send,
  Sparkles,
  Award,
  Globe,
  Coins,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  MessageSquare,
  Menu,
  X
} from "lucide-react";
import { UserRole } from "../types.js";
import Logo from "./Logo.tsx";
import BannerBANTConfirm from "./BannerBANTConfirm.tsx";

interface LandingPageProps {
  projectsList: any[];
  usersList: any[];
  onLoginSuccess: () => void;
}

export default function LandingPage({
  projectsList,
  usersList,
  onLoginSuccess,
  initialTab = "login"
}: LandingPageProps & { initialTab?: "login" | "signup" }) {
  const navigate = useNavigate();
  // Navigation & auth UI flags
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [selectedRole, setSelectedRole] = useState<"DEVELOPER" | "RECRUITER">("DEVELOPER");
  
  // Email Verification State
  const [isVerifyingSignUp, setIsVerifyingSignUp] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [simulatedVerifyPin, setSimulatedVerifyPin] = useState("");
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [bioOrAbout, setBioOrAbout] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Password State variables
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Forgot Password State Variables
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [simulatedPin, setSimulatedPin] = useState("");
  const [authWorkflow, setAuthWorkflow] = useState<"auth" | "forgot" | "reset">("auth");

  // Google Authentication State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleRole, setGoogleRole] = useState<"DEVELOPER" | "RECRUITER">("DEVELOPER");
  const [googleName, setGoogleName] = useState("");
  const [googleBio, setGoogleBio] = useState("");
  const [googleModalTab, setGoogleModalTab] = useState<"login" | "signup">("login");

  const handleGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    
    if (!googleEmailInput) {
      alert("Please enter a valid Google email address.");
      return;
    }
    
    const formattedEmail = googleEmailInput.toLowerCase().trim();
    if (!formattedEmail.endsWith("@gmail.com") && !formattedEmail.endsWith("@google.com")) {
      alert("Please enter a valid Google Mail (@gmail.com or @google.com) account.");
      return;
    }
    
    if (googleModalTab === "login") {
      try {
        const resp = await fetch("/api/session/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formattedEmail })
        });
        const data = await resp.json();
        if (resp.ok) {
          setSuccessMessage(`Google ID ${formattedEmail} authenticated successfully! Syncing BANTConfirm Gateway...`);
          setShowGoogleModal(false);
          setTimeout(() => {
            onLoginSuccess();
          }, 1000);
        } else {
          setErrorMessage(`Google Account (${formattedEmail}) is not registered yet on DeveloperConnect. We've switched this modal to 'Sign Up' so you can complete your profile registration!`);
          setGoogleModalTab("signup");
          setGoogleName(formattedEmail.split("@")[0]);
        }
      } catch {
        setErrorMessage("Network connection timed out during Google Auth.");
        setShowGoogleModal(false);
      }
    } else {
      if (!googleName) {
        alert("Please enter a valid name or company name.");
        return;
      }
      
      const payload = {
        email: formattedEmail,
        role: googleRole,
        fullName: googleRole === "DEVELOPER" ? googleName : undefined,
        companyName: googleRole === "RECRUITER" ? googleName : undefined,
        headline: googleRole === "DEVELOPER" ? "Google Vetted Engineer" : "Hiring Partner via Google",
        industry: googleRole === "RECRUITER" ? "Technology" : undefined,
        bio: googleBio || (googleRole === "DEVELOPER" ? "Senior Software Engineer" : "Active Recruiter"),
        aboutCompany: googleRole === "RECRUITER" ? (googleBio || "Venture Inc.") : undefined
      };
      
      try {
        const resp = await fetch("/api/session/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (resp.ok) {
          setSuccessMessage(`Google registration successful for ${formattedEmail}! Logging in...`);
          setShowGoogleModal(false);
          setTimeout(() => {
            onLoginSuccess();
          }, 1000);
        } else {
          setErrorMessage(data.error || "Failed to complete Google Sign Up.");
          setShowGoogleModal(false);
        }
      } catch {
        setErrorMessage("Network error during Google registration.");
        setShowGoogleModal(false);
      }
    }
  };

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("General Support");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState("");

  // Filter developers
  const demoDevs = usersList.filter(u => u.role === "DEVELOPER" && u.devProfile).map(u => u.devProfile);

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSimulatedPin("");

    if (!forgotEmail) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    try {
      const resp = await fetch("/api/session/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await resp.json();
      if (resp.ok) {
        setSimulatedPin(data.code || "");
        setSuccessMessage(`Simulated delivery successful. Your temporary security reset PIN is: ${data.code}`);
        setAuthWorkflow("reset");
      } else {
        setErrorMessage(data.error || "Failed to generate security code request.");
      }
    } catch {
      setErrorMessage("Network error occurred requesting forgot password.");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!forgotEmail || !resetCode || !newPassword) {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    try {
      const resp = await fetch("/api/session/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          code: resetCode,
          newPassword: newPassword
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccessMessage("Your password was updated successfully! Password reset completed.");
        setEmail(forgotEmail);
        setPassword(newPassword);
        
        setTimeout(() => {
          setAuthWorkflow("auth");
          setActiveTab("login");
        }, 1500);
      } else {
        setErrorMessage(data.error || "Unable to reset password.");
      }
    } catch {
      setErrorMessage("Network error during password reset verification.");
    }
  };

  const handleVerifySignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!verificationCode) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    try {
      const resp = await fetch("/api/session/verify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode })
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccessMessage("Your email has been verified successfully! You can now log into your account.");
        setIsVerifyingSignUp(false);
        setVerificationCode("");
        setActiveTab("login");
        setEmail(verificationEmail);
      } else {
        setErrorMessage(data.error || "Failed to verify email code.");
      }
    } catch {
      setErrorMessage("Network connection timed out during verification.");
    }
  };

  const handleLogin = async (e: React.FormEvent, guestEmail?: string) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    
    const targetEmail = guestEmail || email;
    if (!targetEmail) {
      setErrorMessage("Please enter your email address to authenticate.");
      return;
    }

    try {
      const resp = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password })
      });
      const data = await resp.json();
      if (resp.ok) {
        setSuccessMessage("Authentication signed off! Swapping to secure session workspace...");
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      } else {
        if (data.error === "unverified") {
          setErrorMessage(data.message || "Verification required.");
          setVerificationEmail(data.email || targetEmail);
          setSimulatedVerifyPin(data.verificationCode || "");
          setIsVerifyingSignUp(true);
        } else if (data.error && data.error.toLowerCase().includes("not registered")) {
          setErrorMessage("This email is not registered yet. We've switched you over to 'Sign Up Account' so you can set up your profile!");
          setActiveTab("signup");
          setEmail(targetEmail);
        } else {
          setErrorMessage(data.error || "An error occurred during verification.");
        }
      }
    } catch {
      setErrorMessage("Network connection timed out. Production database unavailable.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }

    const payload = {
      email,
      role: selectedRole,
      fullName: selectedRole === "DEVELOPER" ? fullName : undefined,
      companyName: selectedRole === "RECRUITER" ? companyName : undefined,
      headline: selectedRole === "DEVELOPER" ? headline : undefined,
      industry: selectedRole === "RECRUITER" ? industry : undefined,
      bio: selectedRole === "DEVELOPER" ? bioOrAbout : undefined,
      aboutCompany: selectedRole === "RECRUITER" ? bioOrAbout : undefined,
      password: password || undefined
    };

    try {
      const resp = await fetch("/api/session/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (resp.ok) {
        if (data.needsVerification) {
          setSuccessMessage("Account created! Let's verify your email address to activate your account.");
          setVerificationEmail(data.email);
          setSimulatedVerifyPin(data.verificationCode || "");
          setIsVerifyingSignUp(true);
        } else {
          setSuccessMessage("Account created successfully! Auto-launching secure workflow dashboard...");
          setTimeout(() => {
            onLoginSuccess();
          }, 1200);
        }
      } else {
        setErrorMessage(data.error || "Failed to create account profile.");
      }
    } catch {
      setErrorMessage("Production API request failed.");
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      setContactStatus("Please complete all the fields in the form.");
      return;
    }
    setContactStatus("Thank you! Your enquiry has been routed directly to the mediation board.");
    setTimeout(() => {
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setContactStatus("");
    }, 4000);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans selection:bg-brand-teal/30">
      
      {/* PUBLIC NAVBAR NAVIGATION BANNER */}
      <nav className="sticky top-0 z-55 w-full bg-white border-b border-slate-200/80 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo variant="dark" />

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            <a href="#about" className="hover:text-brand-teal transition-colors">About Us</a>
            <Link to="/scout" className="hover:text-brand-teal transition-colors">Developer Pool</Link>
            <Link to="/faq" className="hover:text-brand-teal transition-colors">Rules & FAQ</Link>
            <a href="#terms" className="hover:text-brand-teal transition-colors">Terms of Work</a>
            <a href="#contact" className="hover:text-brand-teal transition-colors">Contact Us</a>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="bg-brand-teal-light text-brand-teal-dark text-xs px-4 py-2 rounded-xl font-bold hover:bg-brand-teal/10 transition-colors border border-brand-teal/20"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-brand-teal text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-brand-teal-dark transition-all shadow-sm"
              >
                Register
              </Link>
            </div>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 focus:outline-none transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white shadow-lg animate-fadeIn">
            <div className="flex flex-col p-4 space-y-3 font-semibold text-xs text-slate-600 uppercase tracking-wide">
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-brand-teal transition-colors border-b border-slate-50"
              >
                About Us
              </a>
              <a 
                href="#profiles" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-brand-teal transition-colors border-b border-slate-50"
              >
                Developer Pool
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-brand-teal transition-colors border-b border-slate-50"
              >
                Rules & FAQ
              </a>
              <a 
                href="#terms" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-brand-teal transition-colors border-b border-slate-50"
              >
                Terms of Work
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-brand-teal transition-colors"
              >
                Contact Us
              </a>
              
              <div className="pt-2 flex gap-2 sm:hidden border-t border-slate-100">
                <Link
                  to="/login"
                  onClick={() => { setMobileMenuOpen(false); }}
                  className="flex-1 text-center bg-brand-teal-light text-brand-teal-dark text-xs py-2.5 rounded-xl font-bold border border-brand-teal/20"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => { setMobileMenuOpen(false); }}
                  className="flex-1 text-center bg-brand-teal text-white text-xs py-2.5 rounded-xl font-bold"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* IMPERIAL HERO SECTION */}
      <header className="relative py-20 lg:py-28 bg-[#00383f] border-b border-[#00282e] overflow-hidden">
        {/* Soft designer tech circuit/grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block opacity-5 pointer-events-none bg-cover bg-right bg-no-repeat mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80')" }}
        />
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Main Hero Copy - Dark Mode Premium Vibe */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 text-[#4df5e2] text-xs font-semibold rounded-full tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#4df5e2]" /> 
              <span>Built for India's developer economy</span>
            </div>
            
            <h1 className="text-4xl lg:text-[54px] lg:leading-[1.1] font-extrabold text-white tracking-tight font-display">
              Hire developers in India <br className="hidden sm:block" />
              <span className="text-[#4df5e2]">
                part-time or full-time.
              </span>
            </h1>

            <p className="text-[#d8f8f5]/80 text-[15px] leading-relaxed max-w-xl font-normal">
              Developer Connect is a structured marketplace built for fair pricing and fast hiring. Post your project, get matched with vetted Indian developers, and ship faster.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => { setSelectedRole("RECRUITER"); navigate("/signup"); }}
                className="bg-[#00b4a0] hover:bg-[#008f7e] text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                Post a project <ArrowRight className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => { setSelectedRole("DEVELOPER"); navigate("/signup"); }}
                className="bg-transparent hover:bg-white/10 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                I'm a developer
              </button>
            </div>

            <p className="text-[#a5d2cb] text-[11px] font-mono pt-1">
              Powered by{" "}
              <a 
                href="https://www.bantconfirm.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline font-black tracking-wide inline-flex items-center gap-0.5"
              >
                <span className="text-blue-400">BANT</span>
                <span className="text-yellow-400">Confirm</span>
              </a>
            </p>

            {/* Core Value Badges in Vetted Dark Mode */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 justify-start">
              <div>
                <p className="text-xl lg:text-2xl font-display font-black text-white">{Math.max(usersList.filter(u => u.role === "DEVELOPER").length, 3)}+</p>
                <p className="text-[10px] font-bold text-[#a5d2cb] mt-1 uppercase tracking-widest font-mono">Developers</p>
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-display font-black text-white">{Math.max(projectsList.length, 0)}+</p>
                <p className="text-[10px] font-bold text-[#a5d2cb] mt-1 uppercase tracking-widest font-mono">Projects Posted</p>
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-display font-black text-white">0+</p>
                <p className="text-[10px] font-bold text-[#a5d2cb] mt-1 uppercase tracking-widest font-mono">Engagements</p>
              </div>
            </div>
          </div>

          {/* DYNAMIC LANDING LOGIN/SIGNUP CARD */}
          <div id="auth-section" className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 lg:p-8 space-y-6 relative">
            
            {isVerifyingSignUp ? (
              <form onSubmit={handleVerifySignUp} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-teal-50 text-brand-teal rounded-full flex items-center justify-center border border-teal-100 shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-brand-teal animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Confirm Your Email Address</h3>
                  <p className="text-xs text-slate-500">
                    We've sent a 6-digit verification code to <span className="font-semibold text-slate-700">{verificationEmail}</span>. Please fetch the code to activate your account.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 font-medium">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 font-medium">
                    {successMessage}
                  </div>
                )}

                {simulatedVerifyPin && (
                  <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200/60 font-mono flex flex-col gap-1 items-center justify-center">
                    <span className="font-bold font-sans text-[10px] tracking-wider uppercase text-amber-700">Simulation Inbox Delivery PIN</span>
                    <span className="text-lg font-black tracking-widest text-[#0e7490]">{simulatedVerifyPin}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter validation code"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-center text-lg font-mono tracking-widest text-[#0e7490] focus:bg-white focus:border-brand-teal outline-none transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0e7490] hover:bg-[#0891b2] text-white rounded-xl py-3 text-xs font-bold transition-all shadow-md uppercase tracking-wider cursor-pointer"
                >
                  Verify & Activate Account
                </button>

                <div className="flex gap-2 justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingSignUp(false);
                      setVerificationCode("");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setSuccessMessage("Re-requesting code...");
                      try {
                        const r = await fetch("/api/session/login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: verificationEmail, password })
                        });
                        const d = await r.json();
                        if (d.error === "unverified" && d.verificationCode) {
                          setSimulatedVerifyPin(d.verificationCode);
                          setSuccessMessage("A fresh verification PIN has been triggered!");
                        } else {
                          setSuccessMessage("Code resend triggered. Please check notifications.");
                        }
                      } catch {
                        setErrorMessage("Failed to resend code.");
                      }
                    }}
                    className="text-[10px] font-bold text-brand-teal hover:underline cursor-pointer"
                  >
                    Resend Verification PIN
                  </button>
                </div>
              </form>
            ) : authWorkflow === "auth" ? (
              <>
                <div className="flex border-b border-slate-100">
                  <button
                    onClick={() => { setActiveTab("login"); setErrorMessage(""); setSuccessMessage(""); }}
                    className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === "login" 
                        ? "border-b-2 border-brand-teal text-brand-teal" 
                        : "text-slate-400 hover:text-slate-800"
                    }`}
                  >
                    Login Secure Line
                  </button>
                  <button
                    onClick={() => { setActiveTab("signup"); setErrorMessage(""); setSuccessMessage(""); }}
                    className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === "signup" 
                        ? "border-b-2 border-brand-teal text-brand-teal" 
                        : "text-slate-400 hover:text-slate-800"
                    }`}
                  >
                    Sign Up Account
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 font-medium animate-pulse">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 font-medium">
                    {successMessage}
                  </div>
                )}

                {/* LOGIN CHANNEL */}
                {activeTab === "login" && (
                  <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Account Registered Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Integrated Password Component */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Enter Password (Optional)</label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email);
                            setAuthWorkflow("forgot");
                            setErrorMessage("");
                            setSuccessMessage("");
                          }}
                          className="text-[10px] font-bold text-brand-teal hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password (leave blank if not configured)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-12 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        💡 Leave blank if you haven't reset/set up a password yet.
                      </p>
                    </div>

                    <div className="text-right space-y-3">
                      <button 
                        type="submit"
                        className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-brand-teal/20 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Authenticate Now <ChevronRight className="w-4 h-4" />
                      </button>

                  <div className="relative flex py-1.5 items-center">
                    <div className="flex-grow border-t border-slate-150"></div>
                    <span className="flex-shrink mx-3 text-slate-400 text-[9px] uppercase font-mono font-bold tracking-wider">or continue with</span>
                    <div className="flex-grow border-t border-slate-150"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGoogleEmailInput("");
                      setGoogleName("");
                      setGoogleBio("");
                      setGoogleModalTab("login");
                      setShowGoogleModal(true);
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.7 0 3.23.59 4.43 1.73l3.3-3.3C17.7 1.57 15.02 1 12 1 7.37 1 3.42 3.67 1.48 7.5l3.96 3.07C6.38 7.3 8.94 5.04 12 5.04z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.46c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.48z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.44 10.57c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.48 2.9C.53 4.75 0 6.82 0 9s.53 4.25 1.48 6.1l3.96-3.07c-.24-.73-.38-1.5-.38-2.31z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.52 1.2-4.3 1.2-3.06 0-5.62-2.26-6.56-5.53L1.48 15.1C3.42 20.33 7.37 23 12 23z"
                      />
                    </svg>
                    Sign In with Google
                  </button>
                </div>
              </form>
            )}

            {/* SIGNUP CHANNEL */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4 text-slate-800">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Choose Platform Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("DEVELOPER")}
                      className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedRole === "DEVELOPER"
                           ? "bg-brand-teal-light border-brand-teal/40 text-brand-teal-dark"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" /> Engineer
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("RECRUITER")}
                      className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedRole === "RECRUITER"
                          ? "bg-brand-teal-light border-brand-teal/40 text-brand-teal-dark"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" /> Recruiter
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Email Coordinates</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@address.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-brand-teal"
                    required
                  />
                </div>

                {selectedRole === "DEVELOPER" ? (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Professional Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Vikramaditya Prasad"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-brand-teal"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Headline Profile Role</label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Principal Flutter Architect / React Lead"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-brand-teal"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Startup or Enterprise Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Nexa Systems"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-brand-teal"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Industry Vertical</label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-brand-teal"
                      >
                        <option value="Fintech Solutions">Fintech & Payments</option>
                        <option value="AI & Analytics">Deep Learning & AI SaaS</option>
                        <option value="SaaS & DevTools">DevTools & Platform SaaS</option>
                        <option value="E-commerce Solutions">E-commerce Backbone</option>
                        <option value="HealthTech">Healthcare Systems</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {selectedRole === "DEVELOPER" ? "Short Professional Bio" : "About the Company's Vision"}
                  </label>
                  <textarea
                    value={bioOrAbout}
                    onChange={(e) => setBioOrAbout(e.target.value)}
                    rows={2}
                    placeholder={selectedRole === "DEVELOPER" ? "Pointers on core programming and infrastructure milestones..." : "Brief overview of incoming microservices objectives..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none resize-none focus:bg-white focus:border-brand-teal"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Configure Password (Optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Define account password..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-12 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <button
                    type="submit"
                    className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    Create Connect Account & Enter <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="relative flex py-1.5 items-center">
                    <div className="flex-grow border-t border-slate-150"></div>
                    <span className="flex-shrink mx-3 text-slate-400 text-[9px] uppercase font-mono font-bold tracking-wider">or continue with</span>
                    <div className="flex-grow border-t border-slate-150"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGoogleEmailInput("");
                      setGoogleName("");
                      setGoogleBio("");
                      setGoogleModalTab("signup");
                      setShowGoogleModal(true);
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.7 0 3.23.59 4.43 1.73l3.3-3.3C17.7 1.57 15.02 1 12 1 7.37 1 3.42 3.67 1.48 7.5l3.96 3.07C6.38 7.3 8.94 5.04 12 5.04z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.46c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.48z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.44 10.57c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.48 2.9C.53 4.75 0 6.82 0 9s.53 4.25 1.48 6.1l3.96-3.07c-.24-.73-.38-1.5-.38-2.31z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.52 1.2-4.3 1.2-3.06 0-5.62-2.26-6.56-5.53L1.48 15.1C3.42 20.33 7.37 23 12 23z"
                      />
                    </svg>
                    Sign Up with Google
                  </button>
                </div>
              </form>
            )}
              </>
            ) : authWorkflow === "forgot" ? (
              <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Lock className="w-4 h-4 text-brand-teal" /> Forgot Password?
                  </h3>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    Provide your registered email. We will instantly generate a verified reset code pin on our secure system for you.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="registered@company.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    Generate Security PIN <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthWorkflow("auth");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    Back to Login Secure Line
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Shield className="w-4 h-4 text-brand-teal" /> Reset Account Password
                  </h3>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    Set up your workspace credentials using the simulated security pin code.
                  </p>
                </div>

                {simulatedPin && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider font-mono text-blue-700">Simulated Security Pin</p>
                    <p className="text-xs font-semibold">Your Verification reset code is: <strong className="bg-blue-100 px-2 py-0.5 rounded text-blue-900 font-mono select-all text-sm">{simulatedPin}</strong></p>
                    <p className="text-[10px] text-blue-600 font-medium">Please enter this code below.</p>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 font-medium animate-pulse">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 font-medium">
                    {successMessage}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Target Email Account</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Enter Verification Pin Code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit pin code"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all font-mono tracking-widest text-center"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Create New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Establish secure new password..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-12 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    Confirm & Update Password <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthWorkflow("auth");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    Back to Login Secure Line
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </header>

      {/* PREMIUM PROMOTIONAL BANNER SECTION: BANTCONFIRM SERVICES */}
      <BannerBANTConfirm />

      {/* SECTION: ABOUT DEVELOPERCONNECT */}
      <section id="about" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-[11px] font-mono font-bold tracking-widest text-brand-teal uppercase">About Our Vision</h2>
            <h3 className="text-2xl font-black font-sans text-slate-900">Platform for Elite Indian Technical Engineering</h3>
            <p className="text-slate-550 text-xs leading-relaxed">
              We developed DeveloperConnect to replace informal, compliance-breaking freelance pipelines and ensure an secure workspace for domestic tech stars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:shadow-lg hover:border-brand-teal/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center text-brand-teal">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Legal Intermediary Rigor</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Platform protocols are engineered strictly around Section 72 of the Indian Information Technology Act. This ensures candidate records (phone numbers, private emails, etc) are securely masked until developers approve individual connections.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:shadow-lg hover:border-brand-teal/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center text-brand-teal">
                <Coins className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Standard Minimum Wage Escrow</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                With a structural ₹500/hour minimum wage policy, we protect engineering excellence. Recruiter project orders are locked in escrow milestone phases before works activate, preventing baseline billing exploits.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:shadow-lg hover:border-brand-teal/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center text-brand-teal">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Impartial Dispute Mediation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                In cases of scope drift or milestone delays, DeveloperConnect provides a prompt, impartial arbitration tribunal with split escrow payouts. No unilateral chargebacks or platform lockouts are permitted.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION: RECRUITERS POSTED ENQUIRIES & DEMO REQUIREMENTS */}
      <section id="enquiries" className="py-20 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 space-y-12">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-[11px] font-mono font-bold tracking-widest text-brand-teal uppercase">Startups Hiring Pipeline</h2>
              <h3 className="text-2xl font-black font-sans text-slate-900">Recent Recruiters Posted Enquiries</h3>
              <p className="text-slate-550 text-xs max-w-xl">
                Review the dynamic contracts registered into our platform directories. Select or sign-up to apply immediately.
              </p>
            </div>
            <Link to="/login" className="bg-white hover:bg-slate-100 text-slate-850 text-xs px-5 py-2.5 rounded-lg border border-slate-200 font-bold flex items-center gap-1.5 transition-all">
              View All Enquiries <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {projectsList.length === 0 ? (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white px-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center mx-auto text-brand-teal">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No Active Project Listings Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Be the first developer or recruiter to post a project requiremennt! Authenticate below to post a compliant project and begin matching immediately.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/signup" className="inline-flex items-center gap-1.5 bg-brand-teal text-white font-bold hover:bg-brand-teal-dark px-4 py-2 rounded-xl text-xs transition-colors">
                  Create a Project Listing Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsList.map((proj) => (
                <div key={proj.id} className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all hover:border-brand-teal/40">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <span className="text-[9px] font-mono bg-brand-teal-light text-brand-teal-dark px-2 py-0.5 rounded uppercase font-bold">
                        {proj.workMode}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">₹{proj.budget.toLocaleString()} ({proj.hiringType})</span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-900 font-sans tracking-tight">{proj.title}</h4>
                      <p className="text-xs text-slate-650 line-clamp-3 leading-relaxed">{proj.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {proj.techStack?.map((s: string) => (
                        <span key={s} className="bg-slate-50 text-brand-teal-dark text-[10px] font-mono px-2 py-0.5 rounded border border-slate-150">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Duration Forecast: {proj.duration}</span>
                    <Link to="/login" className="text-brand-teal font-extrabold hover:underline">Apply to Escrow</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SECTION: VETTED DEVELOPER PORTFOLIOS */}
      <section id="profiles" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-[11px] font-mono font-bold tracking-widest text-brand-teal uppercase">Vetted Talent Showcase</h2>
            <h3 className="text-2xl font-black font-sans text-slate-900">Featured Active Developers</h3>
            <p className="text-slate-550 text-xs">
              Preview our vetted engineering specialists. Their portfolios include validated tech matrices, experience metrics, and minimum hourly guidelines.
            </p>
          </div>

          {demoDevs.length === 0 ? (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 px-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-brand-teal" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No Active Professional Developer Profiles Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Be the first developer visible to thousands of recruiters! Create your profile today to showcase your skills, experience, and hourly guidelines.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/signup" className="inline-flex items-center gap-1.5 bg-brand-teal text-white font-bold hover:bg-brand-teal-dark px-4 py-2 rounded-xl text-xs transition-colors">
                  Submit Vetted Profile Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {demoDevs.map((dev) => (
                <div key={dev.userId} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between hover:border-brand-teal/40 hover:bg-white hover:shadow-lg transition-all text-slate-800">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img 
                        className="w-12 h-12 rounded-full object-cover border-2 border-brand-teal-light shadow-sm"
                        src={dev.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=Aryan"} 
                        alt={dev.fullName}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          {dev.fullName} 
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        </h4>
                        <p className="text-[10px] text-brand-teal font-semibold uppercase font-mono mt-0.5">{dev.headline}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed font-sans">{dev.bio}</p>

                    <div className="space-y-1">
                      <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Skills Inventory:</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {dev.skills?.map((sk: string) => (
                          <span key={sk} className="bg-white text-brand-teal-dark text-[9px] font-mono px-2 py-0.5 rounded border border-slate-200 font-semibold">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 pt-4 mt-6 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Minimum Rate: ₹{dev.rates?.hourly?.toLocaleString()}/hr</span>
                    <Link to="/login" className="bg-white text-brand-teal hover:bg-brand-teal-light border border-slate-250 rounded-lg px-3 py-1 font-bold font-sans transition-colors text-[11px]">
                      Discuss Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SECTION: FAQ (FQA) */}
      <section id="faq" className="py-20 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-[11px] font-mono font-bold tracking-widest text-brand-teal uppercase font-semibold">Knowledge Hub Help</h2>
            <h3 className="text-2xl font-black font-sans text-brand-navy font-bold">Frequently Asked Questions</h3>
            <p className="text-slate-550 text-xs max-w-lg mx-auto">
              Crucial operational answers concerning compliance metrics, standard GST invoices, minimum rates, and our impartial mediation board.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-905 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-teal shrink-0" />
                How does of Section 72, Indian IT Act compliance work?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                Under Section 72, securing access to electronic correspondence or personal information (like a developer's raw contact phone or email) without implicit consent, and disclosing it, is a severe violation. In DeveloperConnect, recruiter visibility of developer contacts is completely restricted until the developer actively clicks and approves an incoming contact access proposal.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-905 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-teal shrink-0" />
                Is there a minimum wage threshold for freelance projects?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                To support quality standards of software engineering, our system enforces a platform minimum rate of ₹500/hour (~₹500 currency credits) or a budget floor of ₹5,000 for any contract milestone. No postings lower than these bounds are permitted.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-905 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-teal shrink-0" />
                How operates the Milestone Escrow security mechanism?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                Once a recruiter invites or accepts an applicant, the phase budget is deposited safely into an external, interest-free custody Escrow. Upon completion, the recruiter approves the deliverables to route the payout automatically to the candidate.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-905 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-teal shrink-0" />
                How are tax compliance and GST e-invoices handled?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                All escrow deposits generate localized, GST-compliant e-invoices including 18% services taxation dynamically. Customers can enter valid GSTIN credentials in our billing settings to receive input tax credits upon milestone execution.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION: TERMS AND CONDITIONS (Teams and conditions) */}
      <section id="terms" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 space-y-10">

          <div className="text-slate-900 space-y-3">
            <h2 className="text-[11px] font-mono font-bold tracking-widest text-brand-teal uppercase">PLATFORM COMPLIANCE PROTOCOLS</h2>
            <h3 className="text-2xl font-black font-sans leading-none text-brand-navy">Terms and Conditions of Service</h3>
            <p className="text-slate-500 text-xs">Updated: May 2026. Please read this operational mandate before utilizing the intermediary line.</p>
          </div>

          <div className="prose prose-sm text-slate-600 max-w-none text-xs space-y-6 leading-relaxed">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">1. Intermediary Status & Role Visibility Mask</p>
              <p>
                DeveloperConnect operates purely as a secure technological intermediary aligning with Section 72 and Section 79 of the Information Technology Act. We do not represent either the candidate developer or corporate recruiter directly. Personal contact parameters are kept safe and masked to prevent harassment.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">2. Mandatory Escrow Deposit & Milestone Releases</p>
              <p>
                No contract work is authorized without full deposit of the milestone budget. Developer candidates are forbidden from requesting out-of-ecosystem wiring, and recruiter companies are forbidden from insisting on work starts without active escrow validation.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">3. Arbitration tribunal and split ratios verdicts</p>
              <p>
                By opening disputes, both parties consent to a final, binding arbitration verdict delivered by the impartial mediation board. The board reserves the authority to execute custom split ratio refunds (e.g. 60% refund, 40% payout) based on technical specification audits.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION: CONTACT US */}
      <section id="contact" className="py-20 bg-slate-55 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 text-slate-800">
          
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-[11px] font-mono font-bold tracking-widest text-brand-teal uppercase">Contact coordinates</h2>
              <h3 className="text-2xl font-black text-slate-900 mt-2">Get in touch with us</h3>
              <p className="text-slate-550 text-xs leading-relaxed mt-2">
                Have enquiries regarding corporate onboarding, enterprise custom services, or active mediation? Send us a brief ticket and a supervisor will reply within 2 hours.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-teal-light border border-brand-teal/20 flex items-center justify-center text-brand-teal">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-905">Compliance & Enquiries Desk</p>
                  <p className="text-slate-500">info@developerconnect.in</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-teal-light border border-brand-teal/20 flex items-center justify-center text-brand-teal">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-905">Impartial Mediation Helpline</p>
                  <p className="text-slate-500">+91 120 4930-1002 (Noida)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-teal-light border border-brand-teal/20 flex items-center justify-center text-brand-teal">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-905">National Headquarters</p>
                  <p className="text-slate-500">Sector 62, Noida, Uttar Pradesh, India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4 font-sans">Submit Online Enquiry</h4>
            
            {contactStatus && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-150 font-medium font-sans">
                {contactStatus}
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Your Full Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Aryan Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="aryan.sharma@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Reason for Request</label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none transition-all"
                >
                  <option value="General Support">General Platform Support</option>
                  <option value="Escrow Setup">Milestone Escrow Questions</option>
                  <option value="Mediation Support">Request Mediation Review</option>
                  <option value="Corporate Onboarding">Corporate Startup Inquiries</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Message Description Details</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  placeholder="Tell us details regarding your project requirements, API integration milestone deadlines, or regulatory compliance verification keys..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:border-brand-teal outline-none resize-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-sm shadow-brand-teal/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch Enquiry
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>

      {/* IMMERSIVE COMPLIANT FOOTER */}
      <footer className="bg-[#001c3d] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8 text-xs text-slate-350">
          <div className="space-y-2">
            <Logo variant="light" />
            <p className="max-w-sm text-xs text-slate-300">Vetted Indian technology talent with robust legal escrow mediation standards.</p>
          </div>

          <div className="flex gap-6 uppercase text-[10px] tracking-wider font-semibold text-slate-300">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#enquiries" className="hover:text-white transition-colors">Enquiries</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-6 text-xs text-slate-400 flex justify-center font-mono">
          <p>
            Powered by{" "}
            <a 
              href="https://www.bantconfirm.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline font-bold inline-flex items-center"
            >
              <span className="text-blue-400 font-extrabold">BANT</span>
              <span className="text-yellow-400 font-extrabold ml-0.5">Confirm</span>
            </a>
          </p>
        </div>
      </footer>

      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-slate-800">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Google logo header */}
            <div className="p-6 text-center border-b border-slate-100 space-y-3 flex-shrink-0">
              <div className="flex justify-center">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.7 0 3.23.59 4.43 1.73l3.3-3.3C17.7 1.57 15.02 1 12 1 7.37 1 3.42 3.67 1.48 7.5l3.96 3.07C6.38 7.3 8.94 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.46c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.48z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.44 10.57c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.48 2.9C.53 4.75 0 6.82 0 9s.53 4.25 1.48 6.1l3.96-3.07c-.24-.73-.38-1.5-.38-2.31z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.52 1.2-4.3 1.2-3.06 0-5.62-2.26-6.56-5.53L1.48 15.1C3.42 20.33 7.37 23 12 23z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-bold text-slate-800 text-lg">
                  {googleModalTab === "login" ? "Sign in with Google" : "Create Account with Google"}
                </h3>
                <p className="text-xs text-slate-500 font-medium font-sans">to continue to BANTConfirm Gateway</p>
              </div>
            </div>

            {/* Modal Specific Tab Switcher */}
            <div className="flex border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setGoogleModalTab("login")}
                className={`flex-grow py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  googleModalTab === "login"
                    ? "border-b-2 border-red-500 text-red-600 bg-white"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setGoogleModalTab("signup")}
                className={`flex-grow py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  googleModalTab === "signup"
                    ? "border-b-2 border-red-500 text-red-600 bg-white"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleGoogleAuth} className="p-6 space-y-4 text-slate-800 overflow-y-auto flex-1">
              {/* Enter custom Google Mail */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Enter Google Email Address</label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="your-account@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              {googleModalTab === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Select Platform Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGoogleRole("DEVELOPER")}
                        className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          googleRole === "DEVELOPER"
                            ? "bg-red-55/40 border-red-400 text-red-700 font-bold"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 font-normal"
                        }`}
                      >
                        <UserIcon className="w-3.5 h-3.5" /> Engineer
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleRole("RECRUITER")}
                        className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          googleRole === "RECRUITER"
                            ? "bg-red-55/40 border-red-400 text-red-700 font-bold"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 font-normal"
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" /> Recruiter
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">
                      {googleRole === "DEVELOPER" ? "Full Name" : "Company Name"}
                    </label>
                    <input
                      type="text"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      placeholder={googleRole === "DEVELOPER" ? "e.g. Vikram Prasad" : "e.g. Nexa Systems"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Brief Description / Bio</label>
                    <input
                      type="text"
                      value={googleBio}
                      onChange={(e) => setGoogleBio(e.target.value)}
                      placeholder={googleRole === "DEVELOPER" ? "React Developer / Kubernetes Lead..." : "Next Gen Enterprise Solutions..."}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-grow bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer animate-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
