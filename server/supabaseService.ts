import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    console.log("🟢 SUPABASE DATABASE CONNECTION OK: Active and listening.");
  } catch (err) {
    console.error("🔴 Failed to initialize Supabase client:", err);
  }
} else {
  console.log("ℹ️ SUPABASE NOT CONFIGURED: Falling back to lightning-fast, secure in-memory sandbox database state.");
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

/**
 * SQL generation command script for users to initialize their Supabase PostgreSQL tables easily.
 */
export const SUPABASE_SETUP_SQL = `-- Supabase Schema Creation SQL Commands for the Indian Outstaffing Sandbox Marketplace
-- Paste this script inside your Supabase Project SQL Editor and execute to build real tables.

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS ndas CASCADE;
DROP TABLE IF EXISTS contact_access_requests CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS project_stages CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS recruiter_profiles CASCADE;
DROP TABLE IF EXISTS developer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  notification_preferences JSONB
);

CREATE TABLE IF NOT EXISTS developer_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  skills JSONB,
  tech_stack JSONB,
  experience_years INT DEFAULT 0,
  availability TEXT,
  rates JSONB,
  location TEXT,
  socials JSONB,
  is_contact_visible BOOLEAN DEFAULT FALSE,
  phone_number TEXT,
  email TEXT,
  status TEXT,
  avatar_url TEXT,
  analytics JSONB
);

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  about_company TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  recruiter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack JSONB,
  budget NUMERIC DEFAULT 0,
  hiring_type TEXT,
  work_mode TEXT,
  duration TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  ai_suggested_metrics JSONB
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  developer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  proposed_rate NUMERIC DEFAULT 0,
  availability TEXT,
  timeline_estimate TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  recruiter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  developer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS contact_access_requests (
  id TEXT PRIMARY KEY,
  recruiter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  developer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  developer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  recruiter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  last_message_text TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  keep_open BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  file_url TEXT,
  file_type TEXT,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  milestone_title TEXT,
  claimant_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  opponent_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  details TEXT,
  escrow_amount NUMERIC DEFAULT 0,
  proposed_resolution TEXT,
  status TEXT,
  mediator_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS project_stages (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost NUMERIC DEFAULT 0,
  due_date TEXT,
  created_by TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS ndas (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  developer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  recruiter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  terms TEXT,
  status TEXT,
  recruiter_signature TEXT,
  developer_signature TEXT,
  recruiter_signed_at TEXT,
  developer_signed_at TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
`;

/**
 * Generic operations mapped safely to SQL or client memory fallback.
 */

// Users
export async function dbGetUsers(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    return data.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isVerified: u.is_verified,
      isSuspended: u.is_suspended,
      createdAt: u.created_at,
      notificationPreferences: u.notification_preferences
    }));
  } catch (err) {
    console.warn("Supabase getUsers failed. Using local storage container.", err);
    return fallback;
  }
}

export async function dbSaveUser(user: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      is_verified: user.isVerified,
      is_suspended: user.isSuspended,
      created_at: user.createdAt,
      notification_preferences: user.notificationPreferences
    };
    const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveUser failed:", err);
    return false;
  }
}

// Developer Profiles
export async function dbGetDeveloperProfiles(fallback: Record<string, any>): Promise<Record<string, any>> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("developer_profiles").select("*");
    if (error) throw error;
    const profiles: Record<string, any> = {};
    for (const p of data) {
      profiles[p.user_id] = {
        userId: p.user_id,
        fullName: p.full_name,
        headline: p.headline,
        bio: p.bio,
        skills: typeof p.skills === "string" ? JSON.parse(p.skills) : p.skills,
        techStack: typeof p.tech_stack === "string" ? JSON.parse(p.tech_stack) : p.tech_stack,
        experienceYears: p.experience_years,
        availability: p.availability,
        rates: typeof p.rates === "string" ? JSON.parse(p.rates) : p.rates,
        location: p.location,
        socials: typeof p.socials === "string" ? JSON.parse(p.socials) : p.socials,
        isContactVisible: p.is_contact_visible,
        phoneNumber: p.phone_number,
        email: p.email,
        status: p.status,
        avatarUrl: p.avatar_url,
        analytics: typeof p.analytics === "string" ? JSON.parse(p.analytics) : p.analytics
      };
    }
    return profiles;
  } catch (err) {
    console.warn("Supabase dbGetDeveloperProfiles failed.", err);
    return fallback;
  }
}

export async function dbSaveDeveloperProfile(userId: string, profile: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      user_id: userId,
      full_name: profile.fullName || "Unspecified",
      headline: profile.headline,
      bio: profile.bio,
      skills: profile.skills,
      tech_stack: profile.techStack,
      experience_years: profile.experienceYears,
      availability: profile.availability,
      rates: profile.rates,
      location: profile.location,
      socials: profile.socials,
      is_contact_visible: profile.isContactVisible,
      phone_number: profile.phoneNumber,
      email: profile.email,
      status: profile.status,
      avatar_url: profile.avatarUrl,
      analytics: profile.analytics
    };
    const { error } = await supabase.from("developer_profiles").upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveDeveloperProfile failed:", err);
    return false;
  }
}

// Recruiter Profiles
export async function dbGetRecruiterProfiles(fallback: Record<string, any>): Promise<Record<string, any>> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("recruiter_profiles").select("*");
    if (error) throw error;
    const profiles: Record<string, any> = {};
    for (const p of data) {
      profiles[p.user_id] = {
        userId: p.user_id,
        companyName: p.company_name,
        companyLogoUrl: p.company_logo_url,
        website: p.website,
        industry: p.industry,
        companySize: p.company_size,
        aboutCompany: p.about_company,
        fullName: p.full_name,
        phone: p.phone,
        avatarUrl: p.avatar_url
      };
    }
    return profiles;
  } catch (err) {
    console.warn("Supabase dbGetRecruiterProfiles failed.", err);
    return fallback;
  }
}

export async function dbSaveRecruiterProfile(userId: string, profile: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      user_id: userId,
      company_name: profile.companyName || "Unspecified",
      company_logo_url: profile.companyLogoUrl,
      website: profile.website,
      industry: profile.industry,
      company_size: profile.companySize,
      about_company: profile.aboutCompany,
      full_name: profile.fullName || "Unspecified",
      phone: profile.phone,
      avatar_url: profile.avatarUrl
    };
    const { error } = await supabase.from("recruiter_profiles").upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveRecruiterProfile failed:", err);
    return false;
  }
}

// Projects
export async function dbGetProjects(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("projects").select("*");
    if (error) throw error;
    return data.map(p => ({
      id: p.id,
      recruiterId: p.recruiter_id,
      title: p.title,
      description: p.description,
      techStack: typeof p.tech_stack === "string" ? JSON.parse(p.tech_stack) : p.tech_stack,
      budget: Number(p.budget),
      hiringType: p.hiring_type,
      workMode: p.work_mode,
      duration: p.duration,
      status: p.status,
      createdAt: p.created_at,
      aiSuggestedMetrics: typeof p.ai_suggested_metrics === "string" ? JSON.parse(p.ai_suggested_metrics) : p.ai_suggested_metrics
    }));
  } catch (err) {
    console.warn("Supabase dbGetProjects failed.", err);
    return fallback;
  }
}

export async function dbSaveProject(project: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: project.id,
      recruiter_id: project.recruiterId,
      title: project.title,
      description: project.description,
      tech_stack: project.techStack,
      budget: project.budget,
      hiring_type: project.hiringType,
      work_mode: project.workMode,
      duration: project.duration,
      status: project.status,
      created_at: project.createdAt,
      ai_suggested_metrics: project.aiSuggestedMetrics
    };
    const { error } = await supabase.from("projects").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveProject failed:", err);
    return false;
  }
}

// Applications
export async function dbGetApplications(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("applications").select("*");
    if (error) throw error;
    return data.map(a => ({
      id: a.id,
      projectId: a.project_id,
      developerId: a.developer_id,
      coverLetter: a.cover_letter,
      proposedRate: Number(a.proposed_rate),
      availability: a.availability,
      timelineEstimate: a.timeline_estimate,
      status: a.status,
      createdAt: a.created_at
    }));
  } catch (err) {
    console.warn("Supabase dbGetApplications failed.", err);
    return fallback;
  }
}

export async function dbSaveApplication(app: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: app.id,
      project_id: app.projectId,
      developer_id: app.developerId,
      cover_letter: app.coverLetter,
      proposed_rate: app.proposedRate,
      availability: app.availability,
      timeline_estimate: app.timelineEstimate,
      status: app.status,
      created_at: app.createdAt
    };
    const { error } = await supabase.from("applications").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveApplication failed:", err);
    return false;
  }
}

// Invites
export async function dbGetInvites(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("invites").select("*");
    if (error) throw error;
    return data.map(i => ({
      id: i.id,
      projectId: i.project_id,
      recruiterId: i.recruiter_id,
      developerId: i.developer_id,
      message: i.message,
      status: i.status,
      createdAt: i.created_at
    }));
  } catch (err) {
    console.warn("Supabase dbGetInvites failed.", err);
    return fallback;
  }
}

export async function dbSaveInvite(invite: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: invite.id,
      project_id: invite.projectId,
      recruiter_id: invite.recruiterId,
      developer_id: invite.developerId,
      message: invite.message,
      status: invite.status,
      created_at: invite.createdAt
    };
    const { error } = await supabase.from("invites").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveInvite failed:", err);
    return false;
  }
}

// Contact requests
export async function dbGetContactRequests(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("contact_access_requests").select("*");
    if (error) throw error;
    return data.map(c => ({
      id: c.id,
      recruiterId: c.recruiter_id,
      developerId: c.developer_id,
      status: c.status,
      createdAt: c.created_at
    }));
  } catch (err) {
    console.warn("Supabase dbGetContactRequests failed.", err);
    return fallback;
  }
}

export async function dbSaveContactRequest(req: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: req.id,
      recruiter_id: req.recruiterId,
      developer_id: req.developerId,
      status: req.status,
      created_at: req.createdAt
    };
    const { error } = await supabase.from("contact_access_requests").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveContactRequest failed:", err);
    return false;
  }
}

// Chats
export async function dbGetChats(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("chats").select("*");
    if (error) throw error;
    return data.map(c => ({
      id: c.id,
      developerId: c.developer_id,
      recruiterId: c.recruiter_id,
      lastMessageText: c.last_message_text,
      updatedAt: c.updated_at,
      keepOpen: c.keep_open
    }));
  } catch (err) {
    console.warn("Supabase dbGetChats failed.", err);
    return fallback;
  }
}

export async function dbSaveChat(chat: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: chat.id,
      developer_id: chat.developerId,
      recruiter_id: chat.recruiterId,
      last_message_text: chat.lastMessageText,
      updated_at: chat.updatedAt,
      keep_open: chat.keepOpen
    };
    const { error } = await supabase.from("chats").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveChat failed:", err);
    return false;
  }
}

// Messages
export async function dbGetMessages(chatId: string, fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("messages").select("*").eq("chat_id", chatId);
    if (error) throw error;
    return data.map(m => ({
      id: m.id,
      chatId: m.chat_id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      text: m.text,
      fileUrl: m.file_url,
      fileType: m.file_type,
      seen: m.seen,
      createdAt: m.created_at
    }));
  } catch (err) {
    console.warn(`Supabase dbGetMessages for chat: ${chatId} failed.`, err);
    return fallback;
  }
}

export async function dbSaveMessage(msg: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: msg.id,
      chat_id: msg.chatId,
      sender_id: msg.senderId,
      receiver_id: msg.receiverId,
      text: msg.text,
      file_url: msg.fileUrl,
      file_type: msg.fileType,
      seen: msg.seen,
      created_at: msg.createdAt
    };
    const { error } = await supabase.from("messages").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveMessage failed:", err);
    return false;
  }
}

// Project Stages
export async function dbGetProjectStages(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("project_stages").select("*");
    if (error) throw error;
    return data.map(s => ({
      id: s.id,
      projectId: s.project_id,
      title: s.title,
      description: s.description,
      cost: Number(s.cost),
      dueDate: s.due_date,
      createdBy: s.created_by,
      status: s.status
    }));
  } catch (err) {
    console.warn("Supabase dbGetProjectStages failed.", err);
    return fallback;
  }
}

export async function dbSaveProjectStage(stage: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: stage.id,
      project_id: stage.projectId,
      title: stage.title,
      description: stage.description,
      cost: stage.cost,
      due_date: stage.dueDate,
      created_by: stage.createdBy,
      status: stage.status
    };
    const { error } = await supabase.from("project_stages").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveProjectStage failed:", err);
    return false;
  }
}

// NDAs
export async function dbGetNDAs(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("ndas").select("*");
    if (error) throw error;
    return data.map(n => ({
      id: n.id,
      projectId: n.project_id,
      developerId: n.developer_id,
      recruiterId: n.recruiter_id,
      terms: n.terms,
      status: n.status,
      recruiterSignature: n.recruiter_signature,
      developerSignature: n.developer_signature,
      recruiterSignedAt: n.recruiter_signed_at,
      developerSignedAt: n.developer_signed_at,
      createdAt: n.created_at
    }));
  } catch (err) {
    console.warn("Supabase dbGetNDAs failed.", err);
    return fallback;
  }
}

export async function dbSaveNDA(nda: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: nda.id,
      project_id: nda.projectId,
      developer_id: nda.developerId,
      recruiter_id: nda.recruiterId,
      terms: nda.terms,
      status: nda.status,
      recruiter_signature: nda.recruiterSignature,
      developer_signature: nda.developerSignature,
      recruiter_signed_at: nda.recruiterSignedAt,
      developer_signed_at: nda.developerSignedAt,
      created_at: nda.createdAt
    };
    const { error } = await supabase.from("ndas").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveNDA failed:", err);
    return false;
  }
}

// Notifications
export async function dbGetNotifications(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("notifications").select("*");
    if (error) throw error;
    return data.map(n => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      description: n.description,
      type: n.type,
      isRead: n.is_read,
      createdAt: n.created_at
    }));
  } catch (err) {
    console.warn("Supabase dbGetNotifications failed.", err);
    return fallback;
  }
}

export async function dbSaveNotification(notif: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: notif.id,
      user_id: notif.userId,
      title: notif.title,
      description: notif.description,
      type: notif.type,
      is_read: notif.isRead,
      created_at: notif.createdAt
    };
    const { error } = await supabase.from("notifications").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveNotification failed:", err);
    return false;
  }
}

// Disputes
export async function dbGetDisputes(fallback: any[]): Promise<any[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from("disputes").select("*");
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      projectId: d.project_id,
      milestoneTitle: d.milestone_title,
      claimantId: d.claimant_id,
      opponentId: d.opponent_id,
      reason: d.reason,
      details: d.details,
      escrowAmount: Number(d.escrow_amount),
      proposedResolution: d.proposed_resolution,
      status: d.status,
      mediatorId: d.mediator_id,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  } catch (err) {
    console.warn("Supabase dbGetDisputes failed.", err);
    return fallback;
  }
}

export async function dbSaveDispute(dispute: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: dispute.id,
      project_id: dispute.projectId,
      milestone_title: dispute.milestoneTitle,
      claimant_id: dispute.claimantId,
      opponent_id: dispute.opponentId,
      reason: dispute.reason,
      details: dispute.details,
      escrow_amount: dispute.escrowAmount,
      proposed_resolution: dispute.proposedResolution,
      status: dispute.status,
      mediator_id: dispute.mediatorId,
      created_at: dispute.createdAt,
      updated_at: dispute.updatedAt
    };
    const { error } = await supabase.from("disputes").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase dbSaveDispute failed:", err);
    return false;
  }
}
