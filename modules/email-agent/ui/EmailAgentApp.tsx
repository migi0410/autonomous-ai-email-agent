"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Server, Users, Rocket, BarChart3, ExternalLink,
  ChevronRight, CheckCircle2, ShieldCheck, Mail
} from "lucide-react";
import { ConfigStep } from "./components/ConfigStep";
import { StudioStep } from "./components/StudioStep";
import { AudienceStep } from "./components/AudienceStep";
import { ApprovalStep } from "./components/ApprovalStep";
import { LiveMonitor } from "./components/LiveMonitor";
import {
  AutonomousCampaign, AutonomousSubscriber, BrandPreset,
  ChannelType, DesignStyle, Language, RecipientContact,
  SegmentCounts, SequenceStep, SmtpConfig, Tone
} from "../types";
import { BRAND_PRESETS, SMTP_PRESETS } from "../constants";

export function EmailAgentApp() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"config" | "studio" | "audience" | "approval">("studio");

  // 1. Config State
  const [channelType, setChannelType] = useState<ChannelType>("smtp");
  const [smtp, setSmtp] = useState<SmtpConfig>(SMTP_PRESETS[0].config);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("tavitax_dunghm");
  const [gmailEmail, setGmailEmail] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [gmailFromName, setGmailFromName] = useState("");

  // Brand State
  const [brandName, setBrandName] = useState("Tavitax Group");
  const [brandColor, setBrandColor] = useState("#800020");
  const [senderInfo, setSenderInfo] = useState("Tavitax Group | Hotline: 0948 450 128 | Email: contact@tavitax.com");
  const [logoUrl, setLogoUrl] = useState("https://www.tavitax.com/logo.png");
  const [websiteUrl, setWebsiteUrl] = useState("https://www.tavitax.com");

  // 2. Studio State
  const [campaignMode, setCampaignMode] = useState<"single" | "sequence">("sequence");
  const [aiProvider, setAiProvider] = useState<"orcarouter" | "gemini" | "local">("orcarouter");
  const [aiPrompt, setAiPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [language, setLanguage] = useState<Language>("vi");
  const [designStyle, setDesignStyle] = useState<DesignStyle>("luxury_premium");
  const [subject, setSubject] = useState("Thư ngỏ hợp tác & Giải pháp Tối ưu hóa Thuế Doanh nghiệp 2026");
  const [htmlContent, setHtmlContent] = useState("");
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // 3. Audience State
  const [recipientMode, setRecipientMode] = useState<"excel" | "dataset" | "manual">("excel");
  const [contacts, setContacts] = useState<RecipientContact[]>([]);
  const [manualText, setManualText] = useState("");

  // 4. Approval & Monitor State
  const [campaignName, setCampaignName] = useState(`campaign_agent_${new Date().toISOString().slice(0, 10)}`);
  const [activeCampaign, setActiveCampaign] = useState<AutonomousCampaign | null>(null);
  const [subscribers, setSubscribers] = useState<AutonomousSubscriber[]>([]);
  const [segmentCounts, setSegmentCounts] = useState<SegmentCounts>({
    clicked: 0,
    opened: 0,
    unopened: 0,
    pending: 0,
    total: 0,
  });

  const isLoadedRef = useRef(false);

  // Load saved local settings
  useEffect(() => {
    try {
      const savedSmtp = localStorage.getItem("email_agent_smtp");
      if (savedSmtp) setSmtp(JSON.parse(savedSmtp));

      const savedGmail = localStorage.getItem("email_agent_gmail");
      if (savedGmail) {
        const p = JSON.parse(savedGmail);
        if (p.email) setGmailEmail(p.email);
        if (p.pass) setGmailAppPassword(p.pass);
        if (p.fromName) setGmailFromName(p.fromName);
      }

      const savedBrand = localStorage.getItem("email_agent_brand");
      if (savedBrand) {
        const p = JSON.parse(savedBrand);
        if (p.name) setBrandName(p.name);
        if (p.color) setBrandColor(p.color);
        if (p.sender) setSenderInfo(p.sender);
        if (p.logo) setLogoUrl(p.logo);
        if (p.website) setWebsiteUrl(p.website);
      }
    } catch (_) {}
    isLoadedRef.current = true;
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem("email_agent_smtp", JSON.stringify(smtp));
      localStorage.setItem("email_agent_gmail", JSON.stringify({ email: gmailEmail, pass: gmailAppPassword, fromName: gmailFromName }));
      localStorage.setItem("email_agent_brand", JSON.stringify({ name: brandName, color: brandColor, sender: senderInfo, logo: logoUrl, website: websiteUrl }));
    } catch (_) {}
  }, [smtp, gmailEmail, gmailAppPassword, gmailFromName, brandName, brandColor, senderInfo, logoUrl, websiteUrl]);

  // Fetch active campaign from server
  const fetchActiveCampaign = async () => {
    try {
      const res = await fetch("/api/email-agent/campaign");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.campaign) {
          setActiveCampaign(data.campaign);
          setSubscribers(data.subscribers || []);
          setSegmentCounts(data.segmentCounts || { clicked: 0, opened: 0, unopened: 0, pending: 0, total: 0 });
        } else {
          setActiveCampaign(null);
        }
      }
    } catch (err) {
      console.warn("fetchActiveCampaign error:", err);
    }
  };

  useEffect(() => {
    fetchActiveCampaign();
    const interval = setInterval(fetchActiveCampaign, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                AI Email Marketing Agent
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Autonomous Module v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hệ thống tự soạn, tự gửi và tự đánh giá hành vi khách hàng qua chuỗi email đa tuần
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/dashboard?tab=email"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition-all no-underline"
          >
            <BarChart3 size={14} />
            <span>Thống Kê Tracking</span>
            <ExternalLink size={12} className="opacity-60" />
          </a>
        </div>
      </div>

      {/* Live Monitor nếu đang có chiến dịch vận hành */}
      {activeCampaign && (
        <LiveMonitor
          campaign={activeCampaign}
          subscribers={subscribers}
          segmentCounts={segmentCounts}
          onRefresh={fetchActiveCampaign}
        />
      )}

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("studio")}
          className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "studio"
              ? "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 shadow-xs"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Sparkles size={16} />
          <span>1. Soạn Thư AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audience")}
          className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "audience"
              ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Users size={16} />
          <span>2. Nạp Đối Tượng ({contacts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "config"
              ? "border-purple-500 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 shadow-xs"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Server size={16} />
          <span>3. Tài Khoản &amp; Brand</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("approval")}
          className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "approval"
              ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Rocket size={16} />
          <span>4. Duyệt &amp; Kích Hoạt</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "studio" && (
        <StudioStep
          campaignMode={campaignMode}
          setCampaignMode={setCampaignMode}
          aiProvider={aiProvider}
          setAiProvider={setAiProvider}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          tone={tone}
          setTone={setTone}
          language={language}
          setLanguage={setLanguage}
          designStyle={designStyle}
          setDesignStyle={setDesignStyle}
          subject={subject}
          setSubject={setSubject}
          htmlContent={htmlContent}
          setHtmlContent={setHtmlContent}
          sequenceSteps={sequenceSteps}
          setSequenceSteps={setSequenceSteps}
          activeStepIndex={activeStepIndex}
          setActiveStepIndex={setActiveStepIndex}
          brandName={brandName}
          brandColor={brandColor}
          senderInfo={senderInfo}
          logoUrl={logoUrl}
          websiteUrl={websiteUrl}
        />
      )}

      {activeTab === "audience" && (
        <AudienceStep
          recipientMode={recipientMode}
          setRecipientMode={setRecipientMode}
          contacts={contacts}
          setContacts={setContacts}
          manualText={manualText}
          setManualText={setManualText}
        />
      )}

      {activeTab === "config" && (
        <ConfigStep
          channelType={channelType}
          setChannelType={setChannelType}
          smtp={smtp}
          setSmtp={setSmtp}
          selectedPresetId={selectedPresetId}
          setSelectedPresetId={setSelectedPresetId}
          gmailEmail={gmailEmail}
          setGmailEmail={setGmailEmail}
          gmailAppPassword={gmailAppPassword}
          setGmailAppPassword={setGmailAppPassword}
          gmailFromName={gmailFromName}
          setGmailFromName={setGmailFromName}
          brandName={brandName}
          setBrandName={setBrandName}
          brandColor={brandColor}
          setBrandColor={setBrandColor}
          senderInfo={senderInfo}
          setSenderInfo={setSenderInfo}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          websiteUrl={websiteUrl}
          setWebsiteUrl={setWebsiteUrl}
        />
      )}

      {activeTab === "approval" && (
        <ApprovalStep
          campaignName={campaignName}
          setCampaignName={setCampaignName}
          channelType={channelType}
          smtp={smtp}
          gmailEmail={gmailEmail}
          contacts={contacts}
          sequenceSteps={sequenceSteps}
          onLaunchSuccess={() => {
            fetchActiveCampaign();
            setActiveTab("studio");
          }}
        />
      )}
    </div>
  );
}
