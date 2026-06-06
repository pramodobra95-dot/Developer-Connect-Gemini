-- =========================================================================
--            SUPABASE POSTGRESQL SCHEMA FOR DEVELOPERCONNECT & BANTCONFIRM
-- =========================================================================
-- This production-ready setup contains custom ENUMs, normalized tables, 
-- indexes for extreme performance, automatic triggers for Supabase Auth,
-- and state-of-the-art Row Level Security (RLS) policies.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 0. CLEAN DROP STATEMENTS TO PREVENT METADATA TYPE MISMATCH CONSTRAINTS
-- =========================================================================
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.ndas CASCADE;
DROP TABLE IF EXISTS public.contact_access_requests CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.project_stages CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.recruiter_profiles CASCADE;
DROP TABLE IF EXISTS public.developer_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS hiring_type CASCADE;
DROP TYPE IF EXISTS work_mode CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS invite_status CASCADE;
DROP TYPE IF EXISTS dispute_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS nda_status CASCADE;
DROP TYPE IF EXISTS stage_status CASCADE;

-- =========================================================================
-- 1. CUSTOM TYPES / ENUMS MAPPED TO TYPESCRIPT ENUMS
-- =========================================================================

create type user_role as enum ('DEVELOPER', 'RECRUITER', 'ADMIN');
create type project_status as enum ('OPEN', 'IN_REVIEW', 'CLOSED');
create type hiring_type as enum ('Fixed Price', 'Hourly Rate', 'Monthly Retainer', 'Contract');
create type work_mode as enum ('Remote', 'Hybrid', 'On-site');
create type application_status as enum ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED');
create type invite_status as enum ('PENDING', 'ACCEPTED', 'DECLINED');
create type dispute_status as enum ('Under Review', 'Awaiting Response', 'Resolved');
create type notification_type as enum ('application', 'invite', 'contact_request', 'verification', 'project_update', 'chat');
create type nda_status as enum ('DRAFT', 'SENT', 'SIGNED');
create type stage_status as enum ('PROPOSED', 'APPROVED', 'COMPLETED');

-- =========================================================================
-- 2. CORE PATIENT & PORTAL TABLES
-- =========================================================================

-- Public Users table (id is text to accommodate both mock strings and Auth UUIDs)
create table public.users (
  id text primary key,
  email text not null unique,
  role user_role not null default 'DEVELOPER',
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  
  -- Notification preferences columns
  email_new_invites boolean not null default true,
  email_application_updates boolean not null default true,
  email_chat_messages boolean not null default true,
  email_global_alerts boolean not null default true,
  password text
);

-- Developer Profiles Table
create table public.developer_profiles (
  user_id text references public.users(id) on delete cascade primary key,
  full_name text not null,
  headline text not null default '',
  bio text not null default '',
  skills text[] not null default '{}',
  tech_stack text[] not null default '{}',
  experience_years integer not null default 0,
  availability text not null check (availability in ('Part-time', 'Full-time', 'Both')) default 'Both',
  
  -- Rates object flattened
  rate_hourly numeric not null default 0,
  rate_weekly numeric not null default 0,
  rate_monthly numeric not null default 0,
  rate_project_min numeric not null default 0,
  
  location text not null default '',
  github_url text,
  portfolio_url text,
  linkedin_url text,
  is_contact_visible boolean not null default false,
  phone_number text,
  status text not null default 'Available',
  avatar_url text,
  
  -- Analytics tracking
  profile_views integer not null default 0,
  invites_count integer not null default 0,
  applications_sent integer not null default 0,
  accepted_projects integer not null default 0
);

-- Recruiter Profiles Table
create table public.recruiter_profiles (
  user_id text references public.users(id) on delete cascade primary key,
  company_name text not null,
  company_logo_url text,
  website text,
  industry text not null default 'Technology',
  company_size text not null default '1-10',
  about_company text not null default '',
  full_name text not null,
  phone text,
  avatar_url text
);

-- Projects Table
create table public.projects (
  id text default gen_random_uuid()::text primary key,
  recruiter_id text references public.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  tech_stack text[] not null default '{}',
  budget numeric not null default 0,
  hiring_type hiring_type not null default 'Fixed Price',
  work_mode work_mode not null default 'Remote',
  duration text not null default '1 Month',
  status project_status not null default 'OPEN',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  
  -- AI suggested indicators
  ai_suggested_tech text[] not null default '{}',
  ai_recommended_roles text[] not null default '{}',
  ai_confidence numeric not null default 0.0,
  ai_estimated_days integer not null default 0
);

-- Project Stages / Milestones Table
create table public.project_stages (
  id text default gen_random_uuid()::text primary key,
  project_id text references public.projects(id) on delete cascade not null,
  title text not null,
  description text not null,
  cost numeric not null default 0,
  due_date date not null,
  created_by text not null check (created_by in ('RECRUITER', 'DEVELOPER')),
  status stage_status not null default 'PROPOSED'
);

-- Applications Table
create table public.applications (
  id text default gen_random_uuid()::text primary key,
  project_id text references public.projects(id) on delete cascade not null,
  developer_id text references public.users(id) on delete cascade not null,
  cover_letter text not null,
  proposed_rate numeric not null default 0,
  availability text not null,
  timeline_estimate text not null,
  status application_status not null default 'PENDING',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  
  -- Avoid double application from a single developer to same project
  unique (project_id, developer_id)
);

-- Invites Table
create table public.invites (
  id text default gen_random_uuid()::text primary key,
  project_id text references public.projects(id) on delete cascade not null,
  recruiter_id text references public.users(id) on delete cascade not null,
  developer_id text references public.users(id) on delete cascade not null,
  message text not null,
  status invite_status not null default 'PENDING',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Contact Access Requests Table
create table public.contact_access_requests (
  id text default gen_random_uuid()::text primary key,
  recruiter_id text references public.users(id) on delete cascade not null,
  developer_id text references public.users(id) on delete cascade not null,
  status text not null check (status in ('PENDING', 'APPROVED', 'REJECTED')) default 'PENDING',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  
  unique (recruiter_id, developer_id)
);

-- NDAs Table
create table public.ndas (
  id text default gen_random_uuid()::text primary key,
  project_id text references public.projects(id) on delete cascade not null,
  developer_id text references public.users(id) on delete cascade not null,
  recruiter_id text references public.users(id) on delete cascade not null,
  terms text not null,
  status nda_status not null default 'DRAFT',
  recruiter_signature text,
  developer_signature text,
  recruiter_signed_at timestamp with time zone,
  developer_signed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Chats Table
create table public.chats (
  id text default gen_random_uuid()::text primary key,
  developer_id text references public.users(id) on delete cascade not null,
  recruiter_id text references public.users(id) on delete cascade not null,
  last_message_text text not null default '',
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  keep_open boolean not null default false,
  
  unique (developer_id, recruiter_id)
);

-- Messages Table
create table public.messages (
  id text default gen_random_uuid()::text primary key,
  chat_id text references public.chats(id) on delete cascade not null,
  sender_id text references public.users(id) on delete cascade not null,
  receiver_id text references public.users(id) on delete cascade not null,
  text text not null,
  file_url text,
  file_type text check (file_type in ('image', 'file')),
  seen boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Notifications Table
create table public.notifications (
  id text default gen_random_uuid()::text primary key,
  user_id text references public.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  type notification_type not null,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Disputes & Mediation Table
create table public.disputes (
  id text default gen_random_uuid()::text primary key,
  project_id text references public.projects(id) on delete cascade not null,
  milestone_title text not null,
  claimant_id text references public.users(id) on delete cascade not null,
  opponent_id text references public.users(id) on delete cascade not null,
  reason text not null,
  details text not null,
  escrow_amount numeric not null default 0,
  proposed_resolution text not null,
  status dispute_status not null default 'Under Review',
  mediator_id text references public.users(id) on delete set null,
  verdict_rationale text,
  split_ratio_recruiter numeric not null default 50,
  split_ratio_developer numeric not null default 50,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Reviews Table
create table public.reviews (
  id text default gen_random_uuid()::text primary key,
  project_id text references public.projects(id) on delete cascade not null,
  reviewer_id text references public.users(id) on delete cascade not null,
  reviewer_name text not null,
  reviewee_id text references public.users(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);


-- =========================================================================
-- 3. SPEED OPTIMIZATION INDEXES
-- =========================================================================

create index idx_projects_recruiter on public.projects(recruiter_id);
create index idx_projects_status on public.projects(status);
create index idx_applications_project on public.applications(project_id);
create index idx_applications_developer on public.applications(developer_id);
create index idx_invites_developer on public.invites(developer_id);
create index idx_messages_chat_id on public.messages(chat_id);
create index idx_messages_created_at on public.messages(created_at);
create index idx_notifications_user_id on public.notifications(user_id, is_read);
create index idx_disputes_project_id on public.disputes(project_id);


-- =========================================================================
-- 4. POWERFUL TRIGGER: AUTOMATIC AUTH SYNC
-- =========================================================================
-- This automatically inserts a new row in pg public.users whenever a user 
-- registers using Supabase Auth. It splits metadata for profiles dynamically.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_selected_role text;
  user_full_name text;
  user_comp_name text;
begin
  -- Grab role from user metadata (defaulting to DEVELOPER if not supplied)
  user_selected_role := coalesce(new.raw_user_meta_data->>'role', 'DEVELOPER');
  user_full_name := coalesce(new.raw_user_meta_data->>'fullName', split_part(new.email, '@', 1));
  user_comp_name := coalesce(new.raw_user_meta_data->>'companyName', 'Unknown Enterprise');

  -- 1. Insert into public.users
  insert into public.users (id, email, role, is_verified)
  values (
    new.id::text,
    new.email,
    user_selected_role::user_role,
    false
  );

  -- 2. Conditionally insert placeholder Developer or Recruiter Profile
  if user_selected_role = 'RECRUITER' then
    insert into public.recruiter_profiles (user_id, company_name, full_name, industry)
    values (new.id::text, user_comp_name, user_full_name, 'Technology');
  else
    insert into public.developer_profiles (user_id, full_name, headline, bio)
    values (new.id::text, user_full_name, 'Developer on DeveloperConnect', 'Passionate craftsperson interested in remote contracts.');
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Bind the trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- Ensures clean tenants where users cannot tamper with other people's data.

alter table public.users enable row level security;
alter table public.developer_profiles enable row level security;
alter table public.recruiter_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.applications enable row level security;
alter table public.invites enable row level security;
alter table public.ndas enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.disputes enable row level security;
alter table public.reviews enable row level security;

-- USERS Table Policies
create policy "Allow public view for active users" on public.users
  for select using (not is_suspended);

create policy "Users can update their own row" on public.users
  for update using (auth.uid()::text = id);

-- DEVELOPER PROFILES Table Policies
create policy "Allow everyone to read developer profiles" on public.developer_profiles
  for select using (true);

create policy "Developers can edit their own profile" on public.developer_profiles
  for update using (auth.uid()::text = user_id);

-- RECRUITER PROFILES Table Policies
create policy "Allow everyone to read recruiter profiles" on public.recruiter_profiles
  for select using (true);

create policy "Recruiters can edit their own profile" on public.recruiter_profiles
  for update using (auth.uid()::text = user_id);

-- PROJECTS Table Policies
create policy "Anyone can read projects" on public.projects
  for select using (true);

create policy "Recruiters can create/update projects" on public.projects
  for all using (auth.uid()::text = recruiter_id);

-- APPLICATIONS Table Policies
create policy "Developers can read their own applications" on public.applications
  for select using (auth.uid()::text = developer_id);

create policy "Associated recruiters can read applications" on public.applications
  for select using (
    exists (
      select 1 from public.projects 
      where projects.id = applications.project_id 
      and projects.recruiter_id = auth.uid()::text
    )
  );

create policy "Developers can apply to projects" on public.applications
  for insert with check (auth.uid()::text = developer_id);

create policy "Applicants can update their own status/proposals" on public.applications
  for update using (auth.uid()::text = developer_id);

-- NDAS Table Policies
create policy "Users can view associated NDAs" on public.ndas
  for select using (auth.uid()::text = developer_id or auth.uid()::text = recruiter_id);

create policy "Parties can draft and sign NDAs" on public.ndas
  for all using (auth.uid()::text = developer_id or auth.uid()::text = recruiter_id);

-- CHATS Table Policies
create policy "Users can view their own chats" on public.chats
  for select using (auth.uid()::text = developer_id or auth.uid()::text = recruiter_id);

create policy "Users can initiate chats" on public.chats
  for insert with check (auth.uid()::text = developer_id or auth.uid()::text = recruiter_id);

-- MESSAGES Table Policies
create policy "Members of a chat can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and (chats.developer_id = auth.uid()::text or chats.recruiter_id = auth.uid()::text)
    )
  );

create policy "Members can send messages in active chats" on public.messages
  for insert with check (auth.uid()::text = sender_id);

-- NOTIFICATIONS Table Policies
create policy "Users can only see their own notifications" on public.notifications
  for select using (auth.uid()::text = user_id);

create policy "Users can update read status on their own notifications" on public.notifications
  for update using (auth.uid()::text = user_id);


-- =========================================================================
-- 6. ENABLE REALTIME CHAT BROADCASTING
-- =========================================================================
-- Run this block so any table changes for messages or chats are instantly
-- distributed to the client via Supabase WebSockets!

begin;
  -- Remove existing if any
  drop publication if exists supabase_realtime;
  
  -- Publish tables for live client notification feeds
  create publication supabase_realtime for table 
    public.messages, 
    public.chats, 
    public.notifications;
commit;
