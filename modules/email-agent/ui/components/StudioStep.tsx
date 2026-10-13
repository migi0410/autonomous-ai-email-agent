"use client";

import React, { useState } from "react";
import {
  Sparkles, Layers, RefreshCw, Eye, Code2, Smartphone, Monitor,
  PlusCircle, Trash2, Calendar, GitBranch, ArrowRight
} from "lucide-react";
import { DesignStyle, Language, SequenceStep, Tone } from "../../types";

interface StudioStepProps {
  campaignMode: "single" | "sequence";
  setCampaignMode: (m: "single" | "sequence") => void;
  aiProvider: "orcarouter" | "gemini" | "local";
  setAiProvider: (p: "orcarouter" | "gemini" | "local") => void;
  aiPrompt: string;
  setAiPrompt: (p: string) => void;
  tone: Tone;
  setTone: (t: Tone) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  designStyle: DesignStyle;
  setDesignStyle: (s: DesignStyle) => void;
  subject: string;
  setSubject: (s: string) => void;
  htmlContent: string;
  setHtmlContent: (h: string) => void;
  sequenceSteps: SequenceStep[];
  setSequenceSteps: (steps: SequenceStep[]) => void;
  activeStepIndex: number;
  setActiveStepIndex: (idx: number) => void;
  brandName: string;
  brandColor: string;
  senderInfo: string;
  logoUrl: string;
  websiteUrl: string;
}

export function StudioStep({
  campaignMode,
  setCampaignMode,
  aiProvider,
  setAiProvider,
  aiPrompt,
  setAiPrompt,
  tone,
  setTone,
  language,
  setLanguage,
  designStyle,
  setDesignStyle,
  subject,
  setSubject,
  htmlContent,
  setHtmlContent,
  sequenceSteps,
  setSequenceSteps,
  activeStepIndex,
  setActiveStepIndex,
  brandName,
  brandColor,
  senderInfo,
  logoUrl,
  websiteUrl,
}: StudioStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editorTab, setEditorTab] = useState<"preview" | "code">("preview");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      alert("Vui lòng nhập ý tưởng hoặc mục tiêu bức thư bạn muốn soạn.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/email-agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          campaignMode,
          forceProvider: aiProvider,
          tone,
          language,
          designStyle,
          brandName,
          brandColor,
          senderInfo,
          logoUrl,
          websiteUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.isSequence && Array.isArray(data.steps) && data.steps.length > 0) {
          setSequenceSteps(data.steps);
          setActiveStepIndex(0);
          setSubject(data.steps[0].subject);
          setHtmlContent(data.steps[0].html);
        } else {
          setSequenceSteps([]);
          if (data.subject) setSubject(data.subject);
          if (data.html) setHtmlContent(data.html);
        }
        setEditorTab("preview");
      } else {
        alert(data.error || "Không thể tạo mẫu thư bằng AI.");
      }
    } catch (err: any) {
      alert("Lỗi kết nối AI Studio: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectStep = (idx: number) => {
    setActiveStepIndex(idx);
    setSubject(sequenceSteps[idx].subject);
    setHtmlContent(sequenceSteps[idx].html);
  };

  const handleAddWeek = () => {
    const nextNum = sequenceSteps.length + 1;
    const newStep: SequenceStep = {
      step: nextNum,
      weekTitle: `Tuần ${nextNum}: Nhắc Lại Quyền Lợi`,
      delayDays: (nextNum - 1) * 7,
      condition: "opened_prev",
      subject: `Thông báo Tuần ${nextNum} từ ${brandName}`,
      preheader: "Thông tin cập nhật mới nhất dành cho Quý doanh nghiệp.",
      strategyNote: `Bước ${nextNum}: Tự động gửi sau ${ (nextNum - 1) * 7 } ngày cho khách hàng đã mở thư trước đó.`,
      html: htmlContent,
    };
    const updated = [...sequenceSteps, newStep];
    setSequenceSteps(updated);
    setActiveStepIndex(updated.length - 1);
    setSubject(newStep.subject);
    setHtmlContent(newStep.html);
  };

  const handleDeleteStep = () => {
    if (sequenceSteps.length <= 1) {
      alert("Chuỗi chiến dịch cần có ít nhất 1 bước.");
      return;
    }
    const updated = sequenceSteps
      .filter((_, idx) => idx !== activeStepIndex)
      .map((s, idx) => ({ ...s, step: idx + 1, weekTitle: `Tuần ${idx + 1}` }));
    setSequenceSteps(updated);
    const newIdx = Math.max(0, activeStepIndex - 1);
    setActiveStepIndex(newIdx);
    setSubject(updated[newIdx].subject);
    setHtmlContent(updated[newIdx].html);
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    if (sequenceSteps.length > 0) {
      setSequenceSteps(
        sequenceSteps.map((s, idx) => (idx === activeStepIndex ? { ...s, subject: val } : s))
      );
    }
  };

  const handleHtmlChange = (val: string) => {
    setHtmlContent(val);
    if (sequenceSteps.length > 0) {
      setSequenceSteps(
        sequenceSteps.map((s, idx) => (idx === activeStepIndex ? { ...s, html: val } : s))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Thanh Điều Khiển AI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Studio AI Soạn Email Marketing Chuẩn Chuyển Đổi
            </h3>
          </div>

          {/* Chọn Single vs Sequence */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCampaignMode("single")}
              className={`px-3 py-1 rounded-lg transition-all ${
                campaignMode === "single"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500"
              }`}
            >
              Thư Đơn Lẻ (Single)
            </button>
            <button
              type="button"
              onClick={() => setCampaignMode("sequence")}
              className={`px-3 py-1 rounded-lg transition-all ${
                campaignMode === "sequence"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500"
              }`}
            >
              Chuỗi Đa Tuần (Sequence 3+ Bước)
            </button>
          </div>
        </div>

        {/* Input Prompt & Tùy chọn */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
              Nhập mục tiêu, chủ đề hoặc ý tưởng email bạn muốn AI soạn:
            </label>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ví dụ: Thư ngỏ dịch vụ quyết toán thuế 2026 cho doanh nghiệp FDI, nhấn mạnh rủi ro bị phạt truy thu và tặng suất tư vấn 1-1 miễn phí..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <label className="block text-slate-500 mb-1">Model AI:</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              >
                <option value="orcarouter">DeepSeek V3 (OrcaRouter)</option>
                <option value="gemini">Google Gemini 2.5 Flash</option>
                <option value="local">AI Local / OpenAI</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Giọng văn (Tone):</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              >
                <option value="professional">Trang trọng B2B</option>
                <option value="persuasive">Thuyết phục cao</option>
                <option value="friendly">Thân thiện gần gũi</option>
                <option value="urgent">Cấp bách có hạn</option>
                <option value="concise">Súc tích 30s</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Phong cách UI:</label>
              <select
                value={designStyle}
                onChange={(e) => setDesignStyle(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              >
                <option value="luxury_premium">Luxury Corporate</option>
                <option value="modern_saas">Modern SaaS</option>
                <option value="minimal_apple">Apple Minimal</option>
                <option value="warm_friendly">Warm &amp; Friendly</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Ngôn ngữ:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ko">한국어 (Korean)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all text-xs"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={15} /> : <Sparkles size={15} />}
              <span>{isGenerating ? "AI đang kiến tạo kịch bản..." : "✨ Sinh Kịch Bản Email Bằng AI"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Điều Hướng Các Bước Trong Chuỗi (Nếu là Sequence) */}
      {sequenceSteps.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar size={15} className="text-indigo-500" />
              <span>Lộ Trình Chuỗi {sequenceSteps.length} Tuần Do AI Thiết Kế:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAddWeek}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 flex items-center gap-1 text-[11px]"
              >
                <PlusCircle size={12} /> Thêm Tuần
              </button>
              <button
                type="button"
                onClick={handleDeleteStep}
                className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 font-bold hover:bg-rose-50 text-[11px]"
              >
                <Trash2 size={12} /> Xóa Tuần Này
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {sequenceSteps.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeStepIndex === idx
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 font-bold shadow-xs text-indigo-950 dark:text-indigo-200"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Tuần {s.step} (Delay: {s.delayDays}d)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {s.condition === "all" ? "100% đối tượng" : s.condition === "opened_prev" ? "Đã mở thư" : "Đã bấm link"}
                  </span>
                </div>
                <div className="truncate text-xs">{s.subject}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Tiêu Đề Thư & Trình Xem Trước */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Tiêu đề thư (Subject line):
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none"
          />
        </div>

        {/* Device Switcher & Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditorTab("preview")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                editorTab === "preview"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              <Eye size={14} /> Xem Trước (Preview)
            </button>
            <button
              type="button"
              onClick={() => setEditorTab("code")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                editorTab === "code"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              <Code2 size={14} /> Mã HTML Code
            </button>
          </div>

          {editorTab === "preview" && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-md ${previewDevice === "desktop" ? "bg-white dark:bg-slate-700 text-slate-900 shadow-xs" : "text-slate-400"}`}
                title="Giao diện máy tính"
              >
                <Monitor size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-md ${previewDevice === "mobile" ? "bg-white dark:bg-slate-700 text-slate-900 shadow-xs" : "text-slate-400"}`}
                title="Giao diện điện thoại"
              >
                <Smartphone size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Frame xem trước */}
        {editorTab === "preview" ? (
          <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[450px]">
            <div
              className={`transition-all duration-300 w-full bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 ${
                previewDevice === "mobile" ? "max-w-[375px]" : "max-w-[650px]"
              }`}
            >
              <iframe
                title="Email Preview"
                srcDoc={htmlContent
                  .replace(/\{\{company_name\}\}/g, "Công ty TNHH Mẫu Đối Tác")
                  .replace(/\{\{contact_name\}\}/g, "Anh/Chị Giám Đốc")
                  .replace(/\{\{email\}\}/g, "doitac@doanhnghiep.vn")
                  .replace(/\{\{company_greeting\}\}/g, "Quý Doanh Nghiệp")}
                className="w-full h-[600px] border-none"
              />
            </div>
          </div>
        ) : (
          <textarea
            rows={20}
            value={htmlContent}
            onChange={(e) => handleHtmlChange(e.target.value)}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}
