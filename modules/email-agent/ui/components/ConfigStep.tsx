"use client";

import React, { useState } from "react";
import {
  Server, Mail, ShieldCheck, RefreshCw, CheckCircle2,
  AlertCircle, ExternalLink, Eye, EyeOff, Palette
} from "lucide-react";
import { BrandPreset, ChannelType, SmtpConfig, SmtpPreset } from "../../types";
import { BRAND_PRESETS, COLOR_SWATCHES, SMTP_PRESETS } from "../../constants";

interface ConfigStepProps {
  channelType: ChannelType;
  setChannelType: (c: ChannelType) => void;
  smtp: SmtpConfig;
  setSmtp: (s: SmtpConfig) => void;
  selectedPresetId: string;
  setSelectedPresetId: (id: string) => void;
  gmailEmail: string;
  setGmailEmail: (email: string) => void;
  gmailAppPassword: string;
  setGmailAppPassword: (p: string) => void;
  gmailFromName: string;
  setGmailFromName: (n: string) => void;
  brandName: string;
  setBrandName: (n: string) => void;
  brandColor: string;
  setBrandColor: (c: string) => void;
  senderInfo: string;
  setSenderInfo: (s: string) => void;
  logoUrl: string;
  setLogoUrl: (l: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (w: string) => void;
}

export function ConfigStep({
  channelType,
  setChannelType,
  smtp,
  setSmtp,
  selectedPresetId,
  setSelectedPresetId,
  gmailEmail,
  setGmailEmail,
  gmailAppPassword,
  setGmailAppPassword,
  gmailFromName,
  setGmailFromName,
  brandName,
  setBrandName,
  brandColor,
  setBrandColor,
  senderInfo,
  setSenderInfo,
  logoUrl,
  setLogoUrl,
  websiteUrl,
  setWebsiteUrl,
}: ConfigStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  const handleApplyBrandPreset = (preset: BrandPreset) => {
    setBrandName(preset.brandName);
    setBrandColor(preset.brandColor);
    setSenderInfo(preset.senderInfo);
    setLogoUrl(preset.logoUrl);
    setWebsiteUrl(preset.websiteUrl);
  };

  const handleSelectSmtpPreset = (preset: SmtpPreset) => {
    setSelectedPresetId(preset.id);
    setSmtp({ ...preset.config });
    setTestStatus("idle");
    setTestMsg("");
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestMsg("Đang kiểm tra kết nối tới máy chủ email...");

    const activeConfig: SmtpConfig =
      channelType === "gmail"
        ? {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            user: gmailEmail.trim(),
            pass: gmailAppPassword.trim().replace(/\s+/g, ""),
            fromName: gmailFromName.trim() || brandName,
            fromEmail: gmailEmail.trim(),
            replyTo: gmailEmail.trim(),
          }
        : {
            ...smtp,
            fromName: smtp.fromName.trim() || brandName,
          };

    if (!activeConfig.user || !activeConfig.pass) {
      setTestStatus("error");
      setTestMsg(`Vui lòng nhập đầy đủ tài khoản và mật khẩu ${channelType === "gmail" ? "Gmail" : "SMTP"}.`);
      return;
    }

    try {
      const res = await fetch("/api/email-campaign/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeConfig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus("success");
        setTestMsg(data.message || "✅ Kết nối thành công 100%! Sẵn sàng gửi thư.");
      } else {
        setTestStatus("error");
        setTestMsg(data.error || "Kết nối thất bại.");
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestMsg("Lỗi mạng: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Chọn Kênh Gửi */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Server size={18} className="text-rose-600 dark:text-rose-400" />
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            1. Cấu Hình Tài Khoản Gửi (Gmail &amp; SMTP)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setChannelType("smtp")}
            className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
              channelType === "smtp"
                ? "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            <Server size={18} />
            <span>Máy Chủ SMTP Doanh Nghiệp</span>
          </button>
          <button
            type="button"
            onClick={() => setChannelType("gmail")}
            className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
              channelType === "gmail"
                ? "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            <Mail size={18} />
            <span>Google Gmail (Mật khẩu App)</span>
          </button>
        </div>

        {channelType === "smtp" ? (
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-500 font-medium">Chọn cấu hình có sẵn:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SMTP_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectSmtpPreset(p)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedPresetId === p.id
                        ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div>{p.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-500 mb-1">Máy chủ SMTP Host:</label>
                <input
                  type="text"
                  value={smtp.host}
                  onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Cổng Port:</label>
                <input
                  type="number"
                  value={smtp.port}
                  onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Tài khoản User:</label>
                <input
                  type="text"
                  value={smtp.user}
                  onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Mật khẩu Pass:</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtp.pass}
                    onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>Cần tạo Mật khẩu ứng dụng 16 ký tự của Google:</span>
              </div>
              <p>Google chặn mật khẩu Gmail thông thường khi gửi thư từ phần mềm. Bạn hãy vào Google Account để tạo mật khẩu 16 ký tự.</p>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-rose-600 hover:underline pt-0.5"
              >
                <span>Tạo Mật khẩu ứng dụng (16 ký tự)</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Địa chỉ Gmail:</label>
                <input
                  type="email"
                  value={gmailEmail}
                  onChange={(e) => setGmailEmail(e.target.value)}
                  placeholder="tenban@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Mật khẩu ứng dụng (16 chữ):</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={gmailAppPassword}
                    onChange={(e) => setGmailAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nút Test kết nối */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === "testing"}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {testStatus === "testing" ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
            <span>Kiểm Tra Kết Nối Gửi Thư</span>
          </button>

          {testStatus === "success" && (
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} /> Kết nối sẵn sàng 100%
            </span>
          )}
          {testStatus === "error" && (
            <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle size={15} /> Xác thực thất bại
            </span>
          )}

          {testMsg && (
            <div className="w-full text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
              {testMsg}
            </div>
          )}
        </div>
      </div>

      {/* 2. Cài Đặt Nhãn Hiệu & White-label */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Palette size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            2. Bộ Nhận Diện Thương Hiệu &amp; Nhãn Riêng (White-label)
          </h3>
        </div>

        {/* Preset Chọn Nhanh */}
        <div className="space-y-1.5 text-xs">
          <label className="text-slate-500 font-medium">Chọn nhanh Preset nhãn hiệu:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BRAND_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyBrandPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  brandName === p.brandName
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-bold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div>{p.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.badge}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <label className="block text-slate-500 mb-1">Tên thương hiệu:</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Màu sắc chủ đạo (Hex):</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-9 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Link Logo ảnh:</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://domain.com/logo.png"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Link Website đích (Nút CTA):</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.tavitax.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 mb-1">Thông tin Footer / Hotline:</label>
            <input
              type="text"
              value={senderInfo}
              onChange={(e) => setSenderInfo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
