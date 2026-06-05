import React, { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, CheckCircle, HelpCircle } from "lucide-react";
// @ts-ignore
import bannerImg from "../assets/images/bantconfirm_banner_1780687829895.png";

export default function BannerBANTConfirm() {
  const [clickNotification, setClickNotification] = useState(false);

  // Click tracking and redirection function
  const handleBannerClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Open bantconfirm in a new tab securely
    window.open("https://bantconfirm.com", "_blank");

    // 2. Event tracking with exact "bantconfirm_banner_click" event_name
    try {
      if (typeof window !== "undefined") {
        console.log(`[Analytics Event] Tracked: event_name = "bantconfirm_banner_click"`);
        
        // Dispatch custom global JS event
        const trackerEvent = new CustomEvent("bantconfirm_banner_click", {
          detail: {
            brandName: "BANTConfirm",
            destinationUrl: "https://bantconfirm.com",
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(trackerEvent);

        // Feed GTM DataLayer
        const win = window as any;
        if (!win.dataLayer) win.dataLayer = [];
        win.dataLayer.push({
          event: "bantconfirm_banner_click",
          event_name: "bantconfirm_banner_click",
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("Analytics tracker encountered error: ", err);
    }

    // 3. Trigger alert visual inside screen
    setClickNotification(true);
    setTimeout(() => {
      setClickNotification(false);
    }, 4000);
  };

  // Structured SEO Schema Markup for indexing search visibility
  const seoSchemaMarkup = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "name": "BANTConfirm Smart IT & Communication Solutions Banner",
    "contentUrl": window?.location?.origin + "/src/assets/images/bantconfirm_banner_1780687829895.png",
    "url": "https://bantconfirm.com",
    "description": "BANTConfirm infograph detailing Lease Line, SIP Trunk, Cloud Telephony, WhatsApp API, Bulk Email/SMS and Microsoft 365 solutions.",
    "creator": {
      "@type": "Organization",
      "name": "BANTConfirm"
    },
    "acquireLicensePage": "https://bantconfirm.com"
  };

  return (
    <section 
      id="bantconfirm-image-promo"
      aria-labelledby="promo-banner-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* HTML Structured Schema for Google/SEO context index */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoSchemaMarkup) }} 
      />

      {/* Hidden heading for screen readers & A11y compliance */}
      <h2 id="promo-banner-heading" className="sr-only">
        BANTConfirm - Smart IT and Communication Solutions Enterprise Banner
      </h2>

      <div className="space-y-4">
        {/* Responsive Infographic Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onClick={handleBannerClick}
          className="group relative cursor-pointer overflow-hidden rounded-[24px] bg-slate-950 border border-slate-800/80 shadow-xl transition-all duration-300 hover:shadow-blue-500/10 hover:border-blue-400/30"
          title="Explore BANTConfirm Solutions (Opens in new tab)"
        >
          {/* Subtle Hover Glow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/0 via-blue-500/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Lazy Loaded Banner Image with aspect-ratio preservation */}
          <img
            src={bannerImg}
            alt="BANTConfirm Infographics - Powering Your Business with Smart IT and Communication Solutions including Lease Line Connectivity, SIP Trunking, Cloud Telephony solutions, WhatsApp Business API, Bulk Email, Bulk SMS, MS365 licenses and Cloud services."
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover md:object-contain transition-transform duration-500 group-hover:scale-[1.005]"
          />

          {/* Interactive floating badge on hover */}
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md text-white/90 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span>Explore Solutions</span>
            <ExternalLink className="w-3 h-3 text-[#FFC107]" />
          </div>
        </motion.div>

        {/* CTA Secondary Guidance Text & Support Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-center sm:text-left">
          <p className="text-xs text-slate-500 font-sans">
            🇮🇳 Visit{" "}
            <a 
              href="https://bantconfirm.com" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleBannerClick}
              className="font-bold text-slate-700 hover:text-[#0057FF] underline transition-colors cursor-pointer"
            >
              Bantconfirm.com
            </a>{" "}
            for complete enterprise grade IT and Communication Solutions.
          </p>
          
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Trusted by 1000+ Enterprises
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              24x7 Dedicated Support
            </span>
          </div>
        </div>
      </div>

      {/* Embedded confirmation notifier */}
      {clickNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white max-w-sm p-3.5 rounded-2xl border border-blue-500 shadow-2xl flex items-center gap-3 animate-fade-in animate-bounce">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-[#FFC107] flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold font-sans">Opening BANTConfirm Portal</p>
            <p className="text-[10px] text-slate-350">Dispatched analytical metric event: <code className="text-[#FFC107] font-mono">"bantconfirm_banner_click"</code></p>
          </div>
        </div>
      )}
    </section>
  );
}
