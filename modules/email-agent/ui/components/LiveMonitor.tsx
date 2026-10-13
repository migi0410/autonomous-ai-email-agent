"use client";

import React, { useState } from "react";
import {
  Zap, Pause, Play, RefreshCw, Trash2, Clock, ChevronDown, ChevronUp,
  Flame, Eye, Snowflake, Target, CheckCircle2, AlertCircle
} from "lucide-react";
import { AutonomousCampaign, AutonomousSubscriber, SegmentCounts } from "../../types";

interface LiveMonitorProps {
  campaign: AutonomousCampaign;
  subscribers: AutonomousSubscriber[];
  segmentCounts: SegmentCounts;
  onRefresh: () => Promise<void>;
}

export function LiveMonitor({
  campaign,
  subscribers,
  segmentCounts,
  onRefresh,
}: LiveMonitorProps) {
  const [isWorkerRunning, setIsWorkerRunning] = useState(false);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);

  const handleForceRun = async () => {
    if (!confirm("⚡ Bạn có muốn cho AI tiến hành Đánh giá hành vi & Gửi bước tiếp theo NGAY BÂY GIỜ?")) {
      return;
    }
    setIsWorkerRunning(true);
    try {
      const res = await fetch("/api/email-agent/cron?forceRun=true");
      const data = await res.json();
      if (res.ok && data.success) {
        alert("🎉 " + data.message);
        await onRefresh();
      } else {
        alert("Lỗi thực thi: " + (data.error || "Thất bại"));
      }
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message);
    } finally {
      setIsWorkerRunning(false);
    }
  };

  const handleAction = async (action: "pause" | "resume" | "reset") => {
    if (action === "reset" && !confirm("Bạn có chắc chắn muốn xóa chiến dịch tự động hiện tại và bắt đầu lại?")) {
      return;
    }
    try {
      const res = await fetch("/api/email-agent/campaign/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, campaignId: campaign.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        await onRefresh();
      } else {
        alert("Lỗi: " + (data.error || "Không thể thực hiện"));
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 md:p-6 shadow-xl text-white space-y-5">
      {/* 1. Header Trạng Thái Chiến Dịch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-md">
            <Zap size={22} className="animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-white">AI Chiến Dịch Đang Tự Động Vận Hành</h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  campaign.status === "running"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : campaign.status === "paused"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    campaign.status === "running" ? "bg-emerald-400 animate-ping" : "bg-amber-400"
                  }`}
                />
                {campaign.status === "running"
                  ? "AUTONOMOUS ACTIVE"
                  : campaign.status === "paused"
                  ? "ĐANG TẠM DỪNG"
                  : "HOÀN THÀNH"}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Chiến dịch: <strong className="text-white">{campaign.name}</strong> • Kênh:{" "}
              <strong className="text-white uppercase">{campaign.channel_type}</strong> • Tiến độ:{" "}
              <strong className="text-amber-300">
                Tuần {campaign.current_week}/{campaign.total_weeks}
              </strong>
            </p>
          </div>
        </div>

        {/* Nút Thao Tác Nhanh */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleForceRun}
            disabled={isWorkerRunning}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Đánh giá hành vi và gửi bước tiếp theo ngay lập tức"
          >
            <Zap size={14} className={isWorkerRunning ? "animate-spin" : ""} />
            <span>{isWorkerRunning ? "Đang xử lý..." : "⚡ Cho AI Gửi & Đánh Giá Ngay"}</span>
          </button>

          {campaign.status === "running" ? (
            <button
              type="button"
              onClick={() => handleAction("pause")}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Pause size={13} /> Tạm dừng
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAction("resume")}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Play size={13} /> Tiếp tục
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors cursor-pointer"
            title="Làm mới trạng thái"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={() => handleAction("reset")}
            className="px-2.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-bold text-xs transition-colors cursor-pointer"
            title="Xóa chiến dịch này"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 2. Bốn Thẻ Phân Khúc Hành Vi Real-time */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-3.5 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 flex items-center justify-center gap-1 mb-1">
            <Flame size={12} /> ĐÃ BẤM LINK (HOT)
          </span>
          <span className="text-2xl font-black text-purple-400">{segmentCounts.clicked}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tự nhận thư Chốt 1-1</span>
        </div>

        <div className="bg-slate-950/60 border border-blue-500/30 rounded-xl p-3.5 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 flex items-center justify-center gap-1 mb-1">
            <Eye size={12} /> ĐÃ MỞ THƯ (WARM)
          </span>
          <span className="text-2xl font-black text-blue-400">{segmentCounts.opened}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tự nhận Case Study</span>
        </div>

        <div className="bg-slate-950/60 border border-rose-500/30 rounded-xl p-3.5 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 flex items-center justify-center gap-1 mb-1">
            <Snowflake size={12} /> CHƯA MỞ (COLD)
          </span>
          <span className="text-2xl font-black text-rose-400">{segmentCounts.unopened}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tự đổi Hook &amp; Tiêu đề</span>
        </div>

        <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-3.5 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 flex items-center justify-center gap-1 mb-1">
            <Target size={12} /> TỔNG ĐỐI TƯỢNG
          </span>
          <span className="text-2xl font-black text-emerald-400">{segmentCounts.total}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Chuỗi {campaign.total_weeks} tuần</span>
        </div>
      </div>

      {/* 3. Lần Gửi Tiếp Theo & Nút Mở Rộng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-indigo-200/80 bg-indigo-950/40 border border-indigo-900/60 rounded-xl px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-amber-400 shrink-0" />
          <span>
            Lần gửi &amp; đánh giá tiếp theo:{" "}
            <strong className="text-amber-300">
              {campaign.next_run_at
                ? new Date(campaign.next_run_at).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Đang tiến hành hoặc đã kết thúc"}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowSubscribers(!showSubscribers)}
          className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{showSubscribers ? "Ẩn danh sách đối tượng" : "Xem chi tiết đối tượng & nhánh hành vi"}</span>
          {showSubscribers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 4. Danh Sách Đối Tượng (Collapsible) */}
      {showSubscribers && (
        <div className="border border-indigo-900/60 rounded-xl bg-slate-950/80 overflow-hidden text-xs">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-indigo-950/70 text-indigo-300 text-[11px] sticky top-0">
                <tr>
                  <th className="p-2 pl-3">#</th>
                  <th className="p-2">Doanh nghiệp / Email</th>
                  <th className="p-2">Bước Hiện Tại</th>
                  <th className="p-2">Nhánh Hành Vi</th>
                  <th className="p-2">Gửi Gần Nhất</th>
                  <th className="p-2">Tiến Độ AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {subscribers.map((s, idx) => {
                  const latestLog = s.logs && s.logs.length > 0 ? s.logs[s.logs.length - 1] : null;
                  const isExpanded = expandedSubId === s.id;
                  return (
                    <React.Fragment key={s.id || idx}>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-2 pl-3 text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-semibold text-white">{s.company_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.email}</div>
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold text-[11px]">
                            Tuần {s.current_step}
                          </span>
                        </td>
                        <td className="p-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              s.behavior_segment === "clicked"
                                ? "bg-purple-950 text-purple-300 border-purple-700"
                                : s.behavior_segment === "opened"
                                ? "bg-blue-950 text-blue-300 border-blue-700"
                                : s.behavior_segment === "unopened"
                                ? "bg-rose-950 text-rose-300 border-rose-700"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            {s.behavior_segment === "clicked"
                              ? "🔥 Đã Click"
                              : s.behavior_segment === "opened"
                              ? "👀 Đã Mở"
                              : s.behavior_segment === "unopened"
                              ? "💤 Chưa Mở"
                              : "⏳ Chờ gửi"}
                          </span>
                        </td>
                        <td className="p-2 text-slate-400 text-[11px]">
                          {s.last_sent_at ? new Date(s.last_sent_at).toLocaleString("vi-VN") : "Chưa gửi"}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`truncate max-w-[180px] text-[11px] ${
                                s.status === "failed" ? "text-rose-400 font-bold" : "text-slate-300"
                              }`}
                            >
                              {latestLog ? latestLog.message : "Đang chờ chu kỳ"}
                            </span>
                            {s.logs && s.logs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedSubId(isExpanded ? null : s.id)}
                                className="text-[10px] text-indigo-400 hover:text-white underline shrink-0 cursor-pointer"
                              >
                                {isExpanded ? "Đóng log" : `Xem log (${s.logs.length})`}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && s.logs && s.logs.length > 0 && (
                        <tr className="bg-slate-900/90">
                          <td colSpan={6} className="p-3 pl-8">
                            <div className="space-y-1.5 border-l-2 border-indigo-500/40 pl-3 text-[11px]">
                              <div className="font-bold text-indigo-300 mb-1">
                                Nhật ký thực thi của {s.email}:
                              </div>
                              {s.logs.map((log: any, lIdx: number) => (
                                <div key={lIdx} className="flex items-center gap-2 font-mono">
                                  <span className="text-slate-500">[{new Date(log.timestamp).toLocaleString("vi-VN")}]</span>
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-bold text-[10px]">
                                    Bước {log.step}
                                  </span>
                                  <span
                                    className={
                                      log.status === "error" || log.status === "failed"
                                        ? "text-rose-400"
                                        : "text-emerald-400"
                                    }
                                  >
                                    {log.status === "error" || log.status === "failed" ? "✗ Lỗi" : "✓ Thành công"}
                                  </span>
                                  <span className="text-slate-300 font-sans">{log.message}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
