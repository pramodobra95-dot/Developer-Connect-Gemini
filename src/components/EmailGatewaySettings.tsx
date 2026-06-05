import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Settings, 
  Info, 
  Terminal, 
  Eye, 
  CheckCircle, 
  XSquare, 
  Trash2, 
  Play, 
  ChevronRight, 
  Layers
} from "lucide-react";
import { 
  EmailGatewayType, 
  EmailLog, 
  getEmailConfig, 
  saveEmailConfig, 
  getEmailLogs, 
  clearEmailLogs,
  dispatchEmail
} from "../services/emailService.ts";

export default function EmailGatewaySettings() {
  const [config, setConfig] = useState(getEmailConfig());
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [testRecipient, setTestRecipient] = useState("tester@example.com");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const refreshLogs = () => {
    setLogs(getEmailLogs());
  };

  useEffect(() => {
    refreshLogs();
    
    // Listen for update events dispatched by emailService
    const handleLogsUpdate = () => {
      refreshLogs();
    };

    window.addEventListener("dc_email_logs_updated", handleLogsUpdate);
    return () => {
      window.removeEventListener("dc_email_logs_updated", handleLogsUpdate);
    };
  }, []);

  const handleGatewayChange = (type: EmailGatewayType) => {
    const updated = { ...config, gatewayType: type };
    setConfig(updated);
    saveEmailConfig(updated);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...config, [name]: value };
    setConfig(updated);
    saveEmailConfig(updated);
  };

  const handleSaveAll = () => {
    saveEmailConfig(config);
    alert("Email Gateway settings saved securely! Ready for transaction dispatches.");
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to purge all transaction dispatch mail logs?")) {
      clearEmailLogs();
      setSelectedLog(null);
    }
  };

  const triggerTestEmail = async () => {
    if (!testRecipient) {
      alert("Please enter a valid recipient email to run the diagnostic.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testSubject = "🧪 [DeveloperCentral] Dynamic Gateway Test Email";
    const testHtml = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 12px; color: #333;">
        <h2 style="color: #0f766e; margin-top: 0;">DeveloperCentral Transporter Test</h2>
        <p>This is a successful diagnostic test trigger dispatched from the <strong>DeveloperCentral Integration Suite</strong> on the client-side.</p>
        <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13.5px; opacity: 0.95;">
          <strong>Target Transporter:</strong> ${config.gatewayType}<br/>
          <strong>Timestamp:</strong> ${new Date().toLocaleString()}<br/>
          <strong>Trigger Action:</strong> Client-Side Event Intercept
        </div>
        <p style="font-size: 11px; color: #666; margin-top: 20px;">Safe to delete. This is an engineered test trace.</p>
      </div>
    `;

    try {
      const resp = await dispatchEmail(testRecipient, testSubject, testHtml);
      if (resp.success) {
        setTestResult({ success: true, msg: `Diagnostics succeeded! Test mail dispatched via ${config.gatewayType}.` });
      } else {
        setTestResult({ success: false, msg: `Diagnostics warning: ${resp.error || "Execution failed"}` });
      }
    } catch (e: any) {
      setTestResult({ success: false, msg: `Exception during post: ${e.message}` });
    } finally {
      setIsTesting(false);
      refreshLogs();
    }
  };

  return (
    <div id="email-gateway-integration-panel" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-teal" /> Email Notification Gateway Configurator
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose either simulated local sandbox dispatching (zero-config) or integrate live Third-Party REST APIs / Supabase Edge triggers.
          </p>
        </div>
        <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase tracking-widest px-2.5 py-1 rounded bg-opacity-70">
          Client-Side Trigger
        </span>
      </div>

      <div className="space-y-4">
        {/* Gateway selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Active Transaction Provider</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { type: EmailGatewayType.SIMULATION, label: "✉️ Sandbox Simulation", desc: "No keys needed" },
              { type: EmailGatewayType.RESEND, label: "🚀 Resend API", desc: "auth rest endpoints" },
              { type: EmailGatewayType.EMAILJS, label: "🪄 EmailJS API", desc: "user client templates" },
              { type: EmailGatewayType.SUPABASE_EDGE, label: "⚡ Supabase Edge", desc: "database webhooks" }
            ].map((gw) => (
              <button
                key={gw.type}
                type="button"
                onClick={() => handleGatewayChange(gw.type)}
                className={`text-left p-3 rounded-xl border text-xs transition-all outline-none ${
                  config.gatewayType === gw.type
                    ? "bg-slate-50 border-brand-teal text-brand-teal ring-2 ring-brand-teal/10 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <p>{gw.label}</p>
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">{gw.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic configurations form */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-700 space-y-4">
          <h4 className="font-bold flex items-center gap-1.5 text-slate-800 font-sans">
            <Info className="w-4 h-4 text-brand-teal" /> Configure Provider Targets:
          </h4>

          {config.gatewayType === EmailGatewayType.SIMULATION && (
            <div className="text-slate-600 leading-relaxed space-y-1 bg-white border border-slate-100 p-3 rounded-lg">
              <p>🟢 Current: <strong>Sandbox Simulator Transport is active.</strong></p>
              <p>Emails triggered by candidate status changes or applications will instantly register in the local diagnostic panel below. The HTML design body is reviewable and requires zero network access key setup.</p>
            </div>
          )}

          {config.gatewayType === EmailGatewayType.RESEND && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">Resend Authorization Bearer API Key</label>
                <input
                  type="password"
                  name="resendApiKey"
                  value={config.resendApiKey}
                  onChange={handleInputChange}
                  placeholder="re_xxxxxxxxxxxxxx"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-[11px] focus:border-brand-teal outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">Authorized Sender Email Address</label>
                <input
                  type="text"
                  name="resendSender"
                  value={config.resendSender}
                  onChange={handleInputChange}
                  placeholder="onboarding@resend.dev"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-[11px] focus:border-brand-teal outline-none transition-all"
                />
                <span className="text-[10px] text-slate-400">Resend default testing key accepts emails sent to owners only.</span>
              </div>
            </div>
          )}

          {config.gatewayType === EmailGatewayType.EMAILJS && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">EmailJS Service ID</label>
                <input
                  type="text"
                  name="emailjsServiceId"
                  value={config.emailjsServiceId}
                  onChange={handleInputChange}
                  placeholder="service_xxxxx"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-[11px] focus:border-brand-teal outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">EmailJS Template ID</label>
                <input
                  type="text"
                  name="emailjsTemplateId"
                  value={config.emailjsTemplateId}
                  onChange={handleInputChange}
                  placeholder="template_xxxxx"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-[11px] focus:border-brand-teal outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">EmailJS Public Key</label>
                <input
                  type="text"
                  name="emailjsPublicKey"
                  value={config.emailjsPublicKey}
                  onChange={handleInputChange}
                  placeholder="user_xxxxxxxx"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-[11px] focus:border-brand-teal outline-none"
                />
              </div>
            </div>
          )}

          {config.gatewayType === EmailGatewayType.SUPABASE_EDGE && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">Edge Function Target URL Endpoint</label>
                <input
                  type="text"
                  name="supabaseEdgeUrl"
                  value={config.supabaseEdgeUrl}
                  onChange={handleInputChange}
                  placeholder="https://xxxxx.supabase.co/functions/v1/send-email"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-[11px] focus:border-brand-teal outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">Authorization Anon/Service Role Header (Optional)</label>
                <input
                  type="password"
                  name="supabaseAnonKey"
                  value={config.supabaseAnonKey}
                  onChange={handleInputChange}
                  placeholder="eyJhbGciOi..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-[11px] focus:border-brand-teal outline-none transition-all"
                />
              </div>
            </div>
          )}

          {config.gatewayType !== EmailGatewayType.SIMULATION && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAll}
                className="bg-brand-teal text-white hover:bg-brand-teal-dark px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                Apply Gateways Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gateway Diagnostic Testing Section */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-brand-teal" /> Gateway Diagnostics Test Bench
        </h4>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="email"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:bg-white outline-none"
          />
          <button
            type="button"
            onClick={triggerTestEmail}
            disabled={isTesting}
            className="bg-[#001c3d] hover:brightness-115 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isTesting ? "Firing Diagnostic..." : "Fire Test Transaction"}</span>
          </button>
        </div>

        {testResult && (
          <div className={`p-3 rounded-lg text-xs leading-relaxed ${testResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
            <p className="font-semibold">{testResult.success ? "✅ Diagnostic Passed!" : "❌ Diagnostic Failed!"}</p>
            <p className="text-[11px] mt-0.5">{testResult.msg}</p>
          </div>
        )}
      </div>

      {/* Interactive Gateway logs container */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-brand-teal" /> Client Email Gateway Logs ({logs.length})
          </h4>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 text-[11px] outline-none cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Logs
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 bg-slate-25/50 border border-dashed border-slate-200 rounded-xl">
            <Mail className="w-8 h-8 text-slate-300 mx-auto opacity-70 mb-2" />
            <p className="text-xs text-slate-500">No emails triggered yet. Try applying to a project, updating status, or firing a test!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Logs List */}
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
              {logs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setSelectedLog(log)}
                  className={`w-full text-left p-3 text-xs transition-colors hover:bg-slate-50 flex justify-between items-center gap-3 outline-none ${
                    selectedLog?.id === log.id ? "bg-slate-50/70 border-l-4 border-brand-teal pl-2" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-bold text-slate-800 truncate">{log.subject}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="truncate">To: {log.recipient}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-800"
                        : log.status === "SIMULATED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {log.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Email Panel details */}
            <div className="border border-slate-200 rounded-xl bg-slate-25 p-4 flex flex-col justify-between space-y-4 max-h-56 overflow-y-auto">
              {selectedLog ? (
                <div className="space-y-3 text-xs flex-1">
                  <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                    <div>
                      <h5 className="font-bold text-slate-900 leading-tight truncate">{selectedLog.subject}</h5>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">Recipent: {selectedLog.recipient}</p>
                    </div>
                    <span className="text-[9px] font-mono bg-slate-100 border text-slate-600 px-2 py-0.5 rounded">
                      Gateway: {selectedLog.gateway}
                    </span>
                  </div>

                  {selectedLog.errorMessage && (
                    <div className="bg-rose-50 border border-rose-100 p-2 rounded text-[11px] text-rose-700 font-medium">
                      ❌ {selectedLog.errorMessage}
                    </div>
                  )}

                  {/* Mail Body Frame */}
                  <div className="bg-white border border-slate-100 p-3 rounded-lg overflow-y-auto max-h-32 text-[11.5px] text-slate-700 leading-relaxed font-sans shadow-inner">
                    <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">HTML Styled Mail Preview:</p>
                    <div dangerouslySetInnerHTML={{ __html: selectedLog.body }} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-slate-400 py-12 flex-1">
                  <Eye className="w-8 h-8 opacity-40 mb-1" />
                  <p className="text-[11px]">Select a transaction log from the feed list to preview the HTML structured template.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
