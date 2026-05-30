export enum UserRole {
  DEVELOPER = "DEVELOPER",
  RECRUITER = "RECRUITER",
  ADMIN = "ADMIN"
}

export interface NotificationPreferences {
  emailNewInvites: boolean;
  emailApplicationUpdates: boolean;
  emailChatMessages: boolean;
  emailGlobalAlerts?: boolean;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  notificationPreferences?: NotificationPreferences;
}

export interface DeveloperProfile {
  userId: string;
  fullName: string;
  headline: string;
  bio: string;
  skills: string[];
  techStack: string[];
  experienceYears: number;
  availability: "Part-time" | "Full-time" | "Both";
  rates: {
    hourly: number;
    weekly: number;
    monthly: number;
    projectMin: number;
  };
  location: string;
  socials: {
    github?: string;
    portfolio?: string;
    linkedin?: string;
  };
  isContactVisible: boolean;
  phoneNumber?: string;
  email?: string;
  status?: string;
  avatarUrl?: string;
  analytics: {
    profileViews: number;
    invitesCount: number;
    applicationsSent: number;
    acceptedProjects: number;
  };
}

export interface RecruiterProfile {
  userId: string;
  companyName: string;
  companyLogoUrl?: string;
  website?: string;
  industry: string;
  companySize: string;
  aboutCompany: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
}

export enum ProjectStatus {
  OPEN = "OPEN",
  IN_REVIEW = "IN_REVIEW",
  CLOSED = "CLOSED"
}

export enum HiringType {
  FIXED_PRICE = "Fixed Price",
  HOURLY = "Hourly Rate",
  MONTHLY = "Monthly Retainer",
  CONTRACT = "Contract"
}

export enum WorkMode {
  REMOTE = "Remote",
  HYBRID = "Hybrid",
  ONSITE = "On-site"
}

export interface Project {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  techStack: string[];
  budget: number;
  hiringType: HiringType;
  workMode: WorkMode;
  duration: string;
  status: ProjectStatus;
  createdAt: string;
  aiSuggestedMetrics?: {
    suggestedTech: string[];
    recommendedRoles: string[];
    confidence: number;
    estimatedDays: number;
  };
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  SHORTLISTED = "SHORTLISTED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED"
}

export interface Application {
  id: string;
  projectId: string;
  developerId: string;
  coverLetter: string;
  proposedRate: number;
  availability: string;
  timelineEstimate: string;
  status: ApplicationStatus;
  createdAt: string;
}

export enum InviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED"
}

export interface Invite {
  id: string;
  projectId: string;
  recruiterId: string;
  developerId: string;
  message: string;
  status: InviteStatus;
  createdAt: string;
}

export interface ContactAccessRequest {
  id: string;
  recruiterId: string;
  developerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  fileUrl?: string;
  fileType?: "image" | "file";
  seen: boolean;
  createdAt: string;
}

export interface Chat {
  id: string;
  developerId: string;
  recruiterId: string;
  lastMessageText: string;
  updatedAt: string;
  keepOpen?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "application" | "invite" | "contact_request" | "verification" | "project_update" | "chat";
  isRead: boolean;
  createdAt: string;
}

export enum DisputeStatus {
  UNDER_REVIEW = "Under Review",
  AWAITING_RESPONSE = "Awaiting Response",
  RESOLVED = "Resolved"
}

export interface Dispute {
  id: string;
  projectId: string;
  milestoneTitle: string;
  claimantId: string;
  opponentId: string;
  reason: string;
  details: string;
  escrowAmount: number;
  proposedResolution: string;
  status: DisputeStatus;
  mediatorId?: string;
  verdictRationale?: string;
  splitRatio?: { recruiter: number; developer: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  title: string;
  description: string;
  cost: number;
  dueDate: string;
  createdBy: "RECRUITER" | "DEVELOPER";
  status: "PROPOSED" | "APPROVED" | "COMPLETED";
}

export interface NDA {
  id: string;
  projectId: string;
  developerId: string;
  recruiterId: string;
  terms: string;
  status: "DRAFT" | "SENT" | "SIGNED";
  recruiterSignature?: string;
  developerSignature?: string;
  recruiterSignedAt?: string;
  developerSignedAt?: string;
  createdAt: string;
}

