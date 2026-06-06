import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

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
 * Resilient upsert helper that filters out un-migrated or missing columns from payloads
 * to avoid schema cache and PostgreSQL constraint errors when syncing.
 */
async function resilientUpsert(tableName: string, payload: any, onConflict: string): Promise<boolean> {
  if (!supabase) return false;
  let currentPayload = { ...payload };
  const maxRetries = 10;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const { error } = await supabase.from(tableName).upsert(currentPayload, { onConflict });
      if (!error) {
        return true;
      }

      const errMsg = error.message || "";
      
      // If the table itself is completely missing, log neutrally and return false
      if (
        errMsg.includes("Could not find the table") || 
        (errMsg.includes("relation") && errMsg.includes("does not exist") && !errMsg.includes("column"))
      ) {
        console.info(`ℹ️ [SCHEMA NOTICE] Table "${tableName}" is missing in the database. Synchronization deferred for this table.`);
        return false;
      }

      let foundMissingCol = false;
      const lowerErr = errMsg.toLowerCase();
      
      // Attempt 1: Check standard payload keys present in error text
      for (const key of Object.keys(currentPayload)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerErr.includes(`'${lowerKey}'`) || 
          lowerErr.includes(`"${lowerKey}"`) || 
          lowerErr.includes(`column ${lowerKey}`) ||
          lowerErr.includes(`column "${lowerKey}"`) ||
          lowerErr.includes(`column '${lowerKey}'`) ||
          lowerErr.includes(`field ${lowerKey}`)
        ) {
          console.info(`🔧 [RECOVERY] Column "${key}" not in schema for "${tableName}". Stripping property and retrying.`);
          delete currentPayload[key];
          foundMissingCol = true;
          break; // remove one column and retry
        }
      }

      if (foundMissingCol) {
        attempts++;
        continue;
      }

      // Attempt 2: Use regex to extract single quoted or double quoted column names
      const matchSchemaCache = errMsg.match(/Could not find the '([^'\s]+)' column/i);
      const matchPostgres = errMsg.match(/column "([^"\s]+)"/i);
      const missingColumn = (matchSchemaCache && matchSchemaCache[1]) || (matchPostgres && matchPostgres[1]);

      if (missingColumn && missingColumn in currentPayload) {
        console.info(`🔧 [RECOVERY] Strip schema-mismatched column "${missingColumn}" from "${tableName}". Retrying.`);
        delete currentPayload[missingColumn];
        attempts++;
      } else {
        // Unrecoverable
        console.info(`ℹ️ [SYNC INFO] Table "${tableName}" upsert notice: ${errMsg}`);
        return false;
      }
    } catch (err: any) {
      console.info(`ℹ️ [SYNC INFO] Error writing to table "${tableName}":`, err?.message || err);
      return false;
    }
  }
  return false;
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
  notification_preferences JSONB,
  password TEXT
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

-- Recreate trigger function for automated auth.users replication to public.users & profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_fullName text;
  v_companyName text;
BEGIN
  -- Extract variables from raw_user_meta_data using standard JSON operators
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'DEVELOPER');
  v_fullName := COALESCE(new.raw_user_meta_data->>'fullName', 'New User');
  v_companyName := COALESCE(new.raw_user_meta_data->>'companyName', 'Startup Solutions Ltd');

  -- Log execution to postgres engine console for visibility
  RAISE NOTICE 'Executing handle_new_user trigger for user %: role=%, name=%, company=%', 
    new.id, v_role, v_fullName, v_companyName;

  -- Insert profile metadata row into public.users
  INSERT INTO public.users (
    id,
    email,
    role,
    is_verified,
    is_suspended,
    created_at,
    notification_preferences
  ) VALUES (
    new.id,
    new.email,
    v_role,
    CASE WHEN v_role = 'ADMIN' THEN TRUE ELSE FALSE END,
    FALSE,
    COALESCE(new.created_at, now()),
    jsonb_build_object(
      'emailNewInvites', true,
      'emailApplicationUpdates', true,
      'emailChatMessages', true,
      'emailGlobalAlerts', CASE WHEN v_role = 'ADMIN' THEN true ELSE false END
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  -- Selectively insert appropriate metadata matching the role
  IF v_role = 'RECRUITER' THEN
    INSERT INTO public.recruiter_profiles (
      user_id,
      company_name,
      company_logo_url,
      website,
      industry,
      company_size,
      about_company,
      full_name,
      avatar_url
    ) VALUES (
      new.id,
      v_companyName,
      NULL,
      NULL,
      'Information Technology',
      '11-50',
      'Next-generation high performance product incubator.',
      v_fullName,
      'https://api.dicebear.com/7.x/identicon/svg?seed=' || md5(v_companyName)
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.developer_profiles (
      user_id,
      full_name,
      headline,
      bio,
      skills,
      tech_stack,
      experience_years,
      availability,
      rates,
      location,
      socials,
      is_contact_visible,
      phone_number,
      email,
      status,
      avatar_url,
      analytics
    ) VALUES (
      new.id,
      v_fullName,
      'Full-Stack Engineer',
      'Passionate React & TypeScript systems engineer.',
      '["React", "TypeScript", "Node.js", "Tailwind CSS"]'::jsonb,
      '["React", "Tailwind CSS"]'::jsonb,
      3,
      'Both',
      '{"hourly": 600, "weekly": 22000, "monthly": 85000, "projectMin": 10000}'::jsonb,
      'Bengaluru, India',
      '{}'::jsonb,
      FALSE,
      NULL,
      new.email,
      'Available for contract',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=' || md5(v_fullName),
      '{"profileViews": 0, "invitesCount": 0, "applicationsSent": 0, "acceptedProjects": 0}'::jsonb
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in trigger handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Securely bind trigger after inserts ON auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Disable Row Level Security on all public tables to prevent permission blocks in the Sandbox
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.developer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recruiter_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_access_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ndas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;

-- Grant broad operational rights to connection roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
`;

/**
 * Generic operations mapped safely to SQL or client memory fallback.
 */

export async function dbAuthSignUp(email: string, role: string, fullName: string, companyName: string): Promise<any> {
  if (!supabase) return null;
  console.log(`[SUPABASE AUTH SIGNUP] Initiating for ${email}, role=${role}, name=${fullName}, company=${companyName}`);
  try {
    // 1. Attempt admin creation if we have service_role privileges which bypasses verification
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: "DC-" + Math.random().toString(36).substring(2, 12) + "!", // random compliance password 
        email_confirm: true,
        user_metadata: {
          role,
          fullName,
          companyName
        }
      });
      if (!error && data?.user) {
        console.log(`🟢 [SUPABASE AUTH] Successfully registered user via admin client:`, data.user.id);
        return data.user;
      } else if (error) {
        console.warn(`⚠️ [SUPABASE AUTH] admin.createUser failed, falling back to signUp:`, error.message);
      }
    } catch (adminErr: any) {
      console.warn(`[SUPABASE AUTH] Admin creation failed/unauthorized, falling back to standard signUp.`, adminErr?.message);
    }

    // 2. Standard signUp fallback
    const { data, error } = await supabase.auth.signUp({
      email,
      password: "DC-" + Math.random().toString(36).substring(2, 12) + "!",
      options: {
        data: {
          role,
          fullName,
          companyName
        }
      }
    });

    if (error) {
      console.error(`🔴 [SUPABASE AUTH SIGNUP ERROR]:`, error.message);
      throw error;
    }
    
    console.log(`🟢 [SUPABASE AUTH] Successfully registered user via standard signUp:`, data?.user?.id);
    return data?.user || null;
  } catch (err: any) {
    console.error("🔴 dbAuthSignUp general error:", err);
    throw err;
  }
}

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
      notificationPreferences: u.notification_preferences,
      password: u.password || undefined
    }));
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetUsers: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveUser(user: any): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    is_verified: user.isVerified,
    is_suspended: user.isSuspended,
    created_at: user.createdAt,
    notification_preferences: user.notificationPreferences,
    password: user.password || null
  };
  return resilientUpsert("users", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetDeveloperProfiles: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveDeveloperProfile(userId: string, profile: any): Promise<boolean> {
  if (!supabase) return false;

  // Optimize base64 images by uploading them to public storage buckets
  if (profile.avatarUrl && profile.avatarUrl.startsWith("data:")) {
    try {
      profile.avatarUrl = await dbUploadFile(profile.avatarUrl, `dev_${userId}.jpeg`);
    } catch (e) {
      console.error("Failed to upload base64 candidate photo:", e);
    }
  }

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
  return resilientUpsert("developer_profiles", payload, "user_id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetRecruiterProfiles: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveRecruiterProfile(userId: string, profile: any): Promise<boolean> {
  if (!supabase) return false;

  // Optimize base64 images by uploading them to public storage buckets
  if (profile.avatarUrl && profile.avatarUrl.startsWith("data:")) {
    try {
      profile.avatarUrl = await dbUploadFile(profile.avatarUrl, `rec_${userId}.jpeg`);
    } catch (e) {
      console.error("Failed to upload base64 recruiter photo:", e);
    }
  }
  if (profile.companyLogoUrl && profile.companyLogoUrl.startsWith("data:")) {
    try {
      profile.companyLogoUrl = await dbUploadFile(profile.companyLogoUrl, `logo_${userId}.jpeg`);
    } catch (e) {
      console.error("Failed to upload base64 company logo:", e);
    }
  }

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
  return resilientUpsert("recruiter_profiles", payload, "user_id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetProjects: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveProject(project: any): Promise<boolean> {
  if (!supabase) return false;
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
  return resilientUpsert("projects", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetApplications: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveApplication(app: any): Promise<boolean> {
  if (!supabase) return false;
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
  return resilientUpsert("applications", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetInvites: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveInvite(invite: any): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    id: invite.id,
    project_id: invite.projectId,
    recruiter_id: invite.recruiterId,
    developer_id: invite.developerId,
    message: invite.message,
    status: invite.status,
    created_at: invite.createdAt
  };
  return resilientUpsert("invites", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetContactRequests: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveContactRequest(req: any): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    id: req.id,
    recruiter_id: req.recruiterId,
    developer_id: req.developerId,
    status: req.status,
    created_at: req.createdAt
  };
  return resilientUpsert("contact_access_requests", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetChats: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveChat(chat: any): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    id: chat.id,
    developer_id: chat.developerId,
    recruiter_id: chat.recruiterId,
    last_message_text: chat.lastMessageText,
    updated_at: chat.updatedAt,
    keep_open: chat.keepOpen
  };
  return resilientUpsert("chats", payload, "id");
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
  } catch (err: any) {
    console.info(`ℹ️ [SCHEMA NOTICE] dbGetMessages for chat ${chatId}: using local fallback.`, err?.message || err);
    return fallback;
  }
}

export async function dbSaveMessage(msg: any): Promise<boolean> {
  if (!supabase) return false;
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
  return resilientUpsert("messages", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetProjectStages: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveProjectStage(stage: any): Promise<boolean> {
  if (!supabase) return false;
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
  return resilientUpsert("project_stages", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetNDAs: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveNDA(nda: any): Promise<boolean> {
  if (!supabase) return false;
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
  return resilientUpsert("ndas", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetNotifications: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveNotification(notif: any): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    id: notif.id,
    user_id: notif.userId,
    title: notif.title,
    description: notif.description,
    type: notif.type,
    is_read: notif.isRead,
    created_at: notif.createdAt
  };
  return resilientUpsert("notifications", payload, "id");
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
  } catch (err: any) {
    console.info("ℹ️ [SCHEMA NOTICE] dbGetDisputes: using local fallback.", err?.message || err);
    return fallback;
  }
}

export async function dbSaveDispute(dispute: any): Promise<boolean> {
  if (!supabase) return false;
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
  return resilientUpsert("disputes", payload, "id");
}

/**
 * Uploads a base64-encoded file directly to a specified Supabase Storage bucket.
 * Supported buckets: avatars, company-logos, resumes, project-files, chat-attachments.
 */
export async function dbUploadFile(base64Data: string, fileName: string, bucketName: string = "chat-attachments"): Promise<string> {
  if (!supabase) return base64Data;
  if (!base64Data || !base64Data.startsWith("data:")) return base64Data;

  // Validate bucket name
  const validBuckets = ["avatars", "company-logos", "resumes", "project-files", "chat-attachments"];
  const targetBucket = validBuckets.includes(bucketName) ? bucketName : "chat-attachments";

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length < 3) return base64Data;

    const contentType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Clean filename and generate a unique path
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniquePath = `${Date.now()}_${cleanFileName}`;

    // Try to upload
    const { error } = await supabase.storage
      .from(targetBucket)
      .upload(uniquePath, buffer, {
        contentType,
        upsert: true
      });

    // Handle bucket auto-creation
    if (error && error.message.includes("does not exist")) {
      console.log(`🪣 Storage Bucket "${targetBucket}" not found. Auto-creating public bucket now...`);
      const { error: createBucketError } = await supabase.storage.createBucket(targetBucket, {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (!createBucketError) {
        const { error: retryError } = await supabase.storage
          .from(targetBucket)
          .upload(uniquePath, buffer, {
            contentType,
            upsert: true
          });
        if (retryError) throw retryError;
      } else {
        throw error;
      }
    } else if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(targetBucket).getPublicUrl(uniquePath);
    console.log(`🟢 [SUPABASE STORAGE SUCCESS] Asset linked in ${targetBucket} at: ${data?.publicUrl}`);
    return data?.publicUrl || base64Data;
  } catch (err: any) {
    console.error(`🔴 [SUPABASE STORAGE FAIL] Bucket: ${targetBucket}`, err?.message || err);
    return base64Data;
  }
}

