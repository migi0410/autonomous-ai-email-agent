"use client";

import React, { useState } from "react";
import {
  Rocket, ShieldCheck, CheckCircle2, GitBranch, ArrowRight,
  Clock, RefreshCw, AlertTriangle
} from "lucide-react";
import { ChannelType, RecipientContact, SequenceStep, SmtpConfig } from "../../types";

interface ApprovalStepProps {
  campaignName: string;
  setCampaignName: (name: string) => void;
  channelType: ChannelType;
  smtp: SmtpConfig;
  gmailEmail: string;
  contacts: RecipientContact[];
  sequenceSteps: SequenceStep[];
  onLaunchSuccess: () => void;
}

export function ApprovalStep({
  campaignName,
  setCampaignName,
  channelType,
  smtp,
  gmailEmail,
  contacts,
  sequenceSteps,
  onLaunchSuccess,
}: ApprovalStepProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const senderAddress = channelType === "gmail" ? gmailEmail : smtp.fromEmail || smtp.user;

  const handleLaunch = async () => {
    if (!campaignName.trim()) {
      alert("Vui lòng đặt tên cho chiến dịch.");
      return;
    }
    if (contacts.length === 0) {
      alert("Chưa có danh sách đối tượng người nhận.");
      return;
    }
    if (sequenceSteps.length === 0) {
      alert("Chưa có kịch bản kịch bản chuỗi (Sequence Blueprint). Hãy để AI soạn trước!");
      return;
    }

    const confirmMsg =
      `🚀 DUYỆT PLAN & KÍCH HOẠT TỰ ĐỘNG 100%:\n\n` +
      `- Chiến dịch: ${campaignName}\n` +
      `- Kênh gửi: ${channelType.toUpperCase()} (${senderAddress})\n` +
      `- Số đối tượng: ${contacts.length} người nhận\n` +
      `- Lộ trình: ${sequenceSteps.length} Tuần (Bước 1 gửi ngay, các bước sau AI tự động đánh giá hành vi và gửi đúng nhánh)\n\n` +
      `Sau khi kích hoạt, bạn KHÔNG cần treo máy. AI sẽ tự động vận hành ngầm trên Server 24/7.\n\nBắt đầu ngay?`;

    if (!confirm(confirmMsg)) return;

    setIsLaunching(true);
    setErrorMsg("");

    try {
      const activeConfig: SmtpConfig =
        channelType === "gmail"
          ? {
              host: "smtp.gmail.com",
              port: 465,
              secure: true,
              user: gmailEmail.trim(),
              pass: smtp.pass,
              fromName: smtp.fromName,
              fromEmail: gmailEmail.trim(),
            }
          : smtp;

      const res = await fetch("/api/email-agent/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          channel_type: channelType,
          smtp_config: activeConfig,
          sequence_blueprint: sequenceSteps,
          tracking_config: { openTracking: true, clickTracking: true },
          subscribers: contacts.map((c) => ({
            email: c.email,
            company_name: c.companyName || "Quý Doanh nghiệp",
            contact_name: c.contactName || "Quý Khách",
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Kích hoạt tick đầu tiên chạy ngầm
        fetch("/api/email-agent/cron?forceRun=true").catch(() => {});
        alert(data.message || "🎉 Đã kích hoạt chiến dịch tự động thành công!");
        onLaunchSuccess();
      } else {
        setErrorMsg(data.error || "Không thể kích hoạt chiến dịch.");
      }
    } catch (err: any) {
      setErrorMsg("Lỗi kết nối: " + err.message);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Tóm Tắt Kế Hoạch Đã Lập */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShieldCheck size={20} className="text-emerald-500" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            3. Duyệt Kế Hoạch Tự Động Hóa (Plan Review &amp; 1-Click Launch)
          </h3>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            Đặt tên chiến dịch:
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-sm focus:outline-none"
          />
        </div>

        {/* 3 Thẻ Thông Số Tổng Quan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-1">Kênh gửi &amp; Tài khoản:</span>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase block">
              {channelType}
            </span>
            <span className="text-[11px] text-slate-500 font-mono truncate block mt-0.5">
              {senderAddress || "Chưa cấu hình"}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-1">Quy mô tệp người nhận:</span>
            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 block">
              {contacts.length} doanh nghiệp
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Đã chuẩn hóa danh xưng &amp; lời chào
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-1">Lộ trình kịch bản:</span>
            <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400 block">
              {sequenceSteps.length > 0 ? `${sequenceSteps.length} Tuần liên tiếp` : "Thư đơn lẻ"}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Tự động phân nhánh hành vi 100%
            </span>
          </div>
        </div>

        {/* Sơ đồ Phân Nhánh Trực Quan */}
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
            <GitBranch size={16} />
            <span>Sơ đồ vận hành tự động (Set &amp; Forget):</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-indigo-500 block">BƯỚC 1 (NGÀY 0)</span>
              <div className="font-bold text-slate-900 dark:text-white">Gửi mở màn cho 100% danh sách</div>
              <p className="text-[11px] text-slate-500">Trao giá trị, cẩm nang, cảnh báo rủi ro thuế miễn phí.</p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-purple-500 block">BƯỚC 2 (+7 NGÀY)</span>
              <div className="font-bold text-slate-900 dark:text-white">AI tự động đánh giá hành vi</div>
              <p className="text-[11px] text-slate-500">
                - Nhóm Đã Click: Nhận thư Chốt 1-1.<br />
                - Nhóm Đã Mở: Nhận Case Study gỡ phạt.<br />
                - Nhóm Chưa Mở: Nhận Hook &amp; Tiêu đề mới.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-amber-500 block">BƯỚC 3 (+14 NGÀY)</span>
              <div className="font-bold text-slate-900 dark:text-white">Chốt hạ ưu đãi kỳ hạn</div>
              <p className="text-[11px] text-slate-500">Tạo tính cấp bách trước kỳ thanh tra quyết toán thuế.</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Nút Launch Toàn Diện */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLaunch}
            disabled={isLaunching || contacts.length === 0}
            className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:opacity-95 text-white shadow-xl flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 transition-all uppercase tracking-wide"
          >
            {isLaunching ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Rocket size={18} />
            )}
            <span>
              {isLaunching
                ? "Đang thiết lập chiến dịch ngầm..."
                : `🚀 Duyệt Plan & Kích Hoạt Tự Động Toàn Diện (${contacts.length} Đối Tượng)`}
            </span>
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Sau khi bấm duyệt, AI sẽ tiếp quản và tự động chạy ngầm trên Server. Bạn có thể tắt trình duyệt.
          </p>
        </div>
      </div>
    </div>
  );
}
