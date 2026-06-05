export enum EmailGatewayType {
  SIMULATION = "SIMULATION",
  RESEND = "RESEND",
  EMAILJS = "EMAILJS",
  SUPABASE_EDGE = "SUPABASE_EDGE"
}

export interface EmailServiceConfig {
  gatewayType: EmailGatewayType;
  resendApiKey: string;
  resendSender: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
  supabaseEdgeUrl: string;
  supabaseAnonKey: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  gateway: EmailGatewayType;
  status: "SUCCESS" | "FAILED" | "SIMULATED";
  errorMessage?: string;
  timestamp: string;
}

// Default settings from environment or fallback
const metaEnv = (import.meta as any).env || {};

const DEFAULT_CONFIG: EmailServiceConfig = {
  gatewayType: (metaEnv.VITE_EMAIL_GATEWAY_TYPE as EmailGatewayType) || EmailGatewayType.SIMULATION,
  resendApiKey: metaEnv.VITE_RESEND_API_KEY || "",
  resendSender: metaEnv.VITE_RESEND_SENDER || "onboarding@resend.dev",
  emailjsServiceId: metaEnv.VITE_EMAILJS_SERVICE_ID || "",
  emailjsTemplateId: metaEnv.VITE_EMAILJS_TEMPLATE_ID || "",
  emailjsPublicKey: metaEnv.VITE_EMAILJS_PUBLIC_KEY || "",
  supabaseEdgeUrl: metaEnv.VITE_SUPABASE_EDGE_FUNCTION_URL || "",
  supabaseAnonKey: metaEnv.VITE_SUPABASE_ANON_KEY || ""
};

// Key for storage
const CONFIG_STORAGE_KEY = "dc_email_config";
const LOGS_STORAGE_KEY = "dc_email_logs";

export const getEmailConfig = (): EmailServiceConfig => {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to read email config", e);
  }
  return DEFAULT_CONFIG;
};

export const saveEmailConfig = (config: EmailServiceConfig): void => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save email config", e);
  }
};

export const getEmailLogs = (): EmailLog[] => {
  try {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to read email logs", e);
    return [];
  }
};

const addEmailLog = (log: Omit<EmailLog, "id" | "timestamp">): void => {
  try {
    const logs = getEmailLogs();
    const newLog: EmailLog = {
      ...log,
      id: "elog-" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep max 50 logs
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
    // Dispatch custom event to notify components of updated logs
    window.dispatchEvent(new CustomEvent("dc_email_logs_updated"));
  } catch (e) {
    console.error("Failed to add email log", e);
  }
};

export const clearEmailLogs = (): void => {
  try {
    localStorage.removeItem(LOGS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("dc_email_logs_updated"));
  } catch (e) {
    console.error("Failed to clear email logs", e);
  }
};

/**
 * Dispatch an email using the active gateway config
 */
export const dispatchEmail = async (
  recipientEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> => {
  const config = getEmailConfig();
  const targetEmail = recipientEmail || "simulated-recipient@developercentral.co";

  console.log(`[EmailService] Attempting to dispatch email to ${targetEmail} via ${config.gatewayType}`);

  // 1. Simulation Gateway
  if (config.gatewayType === EmailGatewayType.SIMULATION) {
    addEmailLog({
      recipient: targetEmail,
      subject,
      body: htmlContent,
      gateway: EmailGatewayType.SIMULATION,
      status: "SIMULATED"
    });
    return { success: true };
  }

  // 2. Resend Gateway
  if (config.gatewayType === EmailGatewayType.RESEND) {
    if (!config.resendApiKey) {
      const errMsg = "Resend API key is missing in config settings.";
      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.RESEND,
        status: "FAILED",
        errorMessage: errMsg
      });
      return { success: false, error: errMsg };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.resendApiKey}`
        },
        body: JSON.stringify({
          from: config.resendSender || "onboarding@resend.dev",
          to: [targetEmail],
          subject: subject,
          html: htmlContent
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend API returned status ${response.status}: ${errText}`);
      }

      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.RESEND,
        status: "SUCCESS"
      });
      return { success: true };
    } catch (e: any) {
      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.RESEND,
        status: "FAILED",
        errorMessage: e.message || "Unknown error during Resend request"
      });
      return { success: false, error: e.message };
    }
  }

  // 3. EmailJS Gateway
  if (config.gatewayType === EmailGatewayType.EMAILJS) {
    if (!config.emailjsServiceId || !config.emailjsTemplateId || !config.emailjsPublicKey) {
      const errMsg = "Required EmailJS configuration properties are missing.";
      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.EMAILJS,
        status: "FAILED",
        errorMessage: errMsg
      });
      return { success: false, error: errMsg };
    }

    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service_id: config.emailjsServiceId,
          template_id: config.emailjsTemplateId,
          user_id: config.emailjsPublicKey,
          template_params: {
            to_email: targetEmail,
            subject: subject,
            message_html: htmlContent
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`EmailJS API returned ${response.status}: ${errText}`);
      }

      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.EMAILJS,
        status: "SUCCESS"
      });
      return { success: true };
    } catch (e: any) {
      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.EMAILJS,
        status: "FAILED",
        errorMessage: e.message || "Unknown error during EmailJS request"
      });
      return { success: false, error: e.message };
    }
  }

  // 4. Supabase Edge Function Gateway
  if (config.gatewayType === EmailGatewayType.SUPABASE_EDGE) {
    if (!config.supabaseEdgeUrl) {
      const errMsg = "Supabase Edge Function endpoint URL is missing.";
      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.SUPABASE_EDGE,
        status: "FAILED",
        errorMessage: errMsg
      });
      return { success: false, error: errMsg };
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (config.supabaseAnonKey) {
        headers["Authorization"] = `Bearer ${config.supabaseAnonKey}`;
      }

      const response = await fetch(config.supabaseEdgeUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: targetEmail,
          subject: subject,
          html: htmlContent
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Supabase Edge function returned status ${response.status}: ${errText}`);
      }

      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.SUPABASE_EDGE,
        status: "SUCCESS"
      });
      return { success: true };
    } catch (e: any) {
      addEmailLog({
        recipient: targetEmail,
        subject,
        body: htmlContent,
        gateway: EmailGatewayType.SUPABASE_EDGE,
        status: "FAILED",
        errorMessage: e.message || "Unknown error during Supabase Edge request"
      });
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: "Unsupported gateway type configured." };
};

/**
 * Trigger email when a developer submits an application to a project
 */
export const triggerNewApplicationNotification = async (
  recruiterEmail: string | undefined,
  recruiterName: string | undefined,
  projectTitle: string,
  developerName: string,
  proposedRate: number,
  timelineEstimate: string,
  coverLetter: string
): Promise<void> => {
  const recipient = recruiterEmail || "recruiter.client@developercentral.co";
  const name = recruiterName || "Valued Recruiter";

  const emailSubject = `[DeveloperCentral] 🚀 New Application on your project "${projectTitle}"`;
  const emailHtml = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #0f766e; padding-bottom: 16px;">
        <h1 style="color: #0f766e; font-size: 24px; margin: 0; font-weight: 800;">DeveloperCentral</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-family: monospace;">Secure Smart Contract Talent Hub</p>
      </div>

      <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 12px 0;">Hello ${name},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
        We are thrilled to let you know that <strong>${developerName}</strong> has just submitted a formal application/proposal to your open project listing <strong>"${projectTitle}"</strong>.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <h3 style="color: #0f766e; font-size: 14px; margin: 0 0 12px 0; font-family: monospace; text-transform: uppercase; letter-spacing: 0.05em;">Proposal Fast-Facts:</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500; width: 35%;">Developer Account:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${developerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Rate Offered:</td>
            <td style="padding: 6px 0; color: #0f766e; font-weight: 700;">$${proposedRate}/hr or fixed</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Est. Delivery:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${timelineEstimate}</td>
          </tr>
        </table>
        
        <div style="margin-top: 14px; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
          <p style="color: #64748b; font-size: 12px; font-weight: 600; margin: 0 0 4px 0;">Cover Letter Excerpt:</p>
          <blockquote style="margin: 0; padding-left: 12px; border-left: 3px solid #0f766e; color: #475569; font-style: italic; font-size: 13.5px; line-height: 1.5;">
            "${coverLetter ? (coverLetter.length > 250 ? coverLetter.substring(0, 250) + "..." : coverLetter) : "No cover letter provided."}"
          </blockquote>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${window.location.origin}" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; transition: background-color 0.2s;">
          Review Application in App
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
        You are receiving this automated diagnostic transactional email because you have Enabled proposal submissions in your DeveloperCentral Recruiter Notification settings dashboard.
      </p>
    </div>
  `;

  await dispatchEmail(recipient, emailSubject, emailHtml);
};

/**
 * Trigger email when a project or developer application status changes
 */
export const triggerProjectStatusChangeNotification = async (
  userEmail: string | undefined,
  userName: string | undefined,
  projectTitle: string,
  newStatus: string,
  details?: string
): Promise<void> => {
  const recipient = userEmail || "developer.client@developercentral.co";
  const name = userName || "Professional Talent";

  const emailSubject = `[DeveloperCentral] 🛠️ Project Status Update: "${projectTitle}" is now ${newStatus}`;
  const emailHtml = `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #0f766e; padding-bottom: 16px;">
        <h1 style="color: #0f766e; font-size: 24px; margin: 0; font-weight: 800;">DeveloperCentral</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-family: monospace;">Secure Smart Contract Talent Hub</p>
      </div>

      <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 12px 0;">Hello ${name},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
        We wanted to provide a quick operational update about your associated project listing <strong>"${projectTitle}"</strong> on DeveloperCentral.
      </p>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #166534; background-color: #dcfce7; padding: 4px 10px; border-radius: 9999px;">
          Status Modified
        </span>
        <h2 style="color: #166534; font-size: 26px; font-weight: 800; margin: 12px 0 6px 0;">${newStatus}</h2>
        <p style="color: #475569; font-size: 13px; margin: 0;">This change has been logged securely in the smart ledger.</p>
      </div>

      ${details ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #0f766e; padding: 14px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Update Details:</p>
        <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5;">${details}</p>
      </div>
      ` : ""}

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${window.location.origin}" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; transition: background-color 0.2s;">
          Open Dashboard Board
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
        This is a diagnostic transactional alert. If you have any questions or concern regarding this project progression, please contact our administrative desk through direct chat.
      </p>
    </div>
  `;

  await dispatchEmail(recipient, emailSubject, emailHtml);
};
