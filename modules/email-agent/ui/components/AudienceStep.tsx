"use client";

import React, { useState, useEffect } from "react";
import {
  Upload, FileSpreadsheet, Database, Users, Trash2, CheckCircle2,
  Building2, Search, RefreshCw
} from "lucide-react";
import * as XLSX from "xlsx";
import { cleanCompanyName } from "@/lib/company-formatter";
import { RecipientContact } from "../../types";

interface AudienceStepProps {
  recipientMode: "excel" | "dataset" | "manual";
  setRecipientMode: (m: "excel" | "dataset" | "manual") => void;
  contacts: RecipientContact[];
  setContacts: (contacts: RecipientContact[]) => void;
  manualText: string;
  setManualText: (t: string) => void;
}

export function AudienceStep({
  recipientMode,
  setRecipientMode,
  contacts,
  setContacts,
  manualText,
  setManualText,
}: AudienceStepProps) {
  const [fileName, setFileName] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);

  // Tải danh sách Datasets từ Portal API
  useEffect(() => {
    async function loadDatasets() {
      try {
        setIsLoadingDatasets(true);
        const res = await fetch("/api/portal/datasets");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.datasets)) {
            setDatasets(data.datasets);
          }
        }
      } catch (err) {
        console.warn("Load datasets error:", err);
      } finally {
        setIsLoadingDatasets(false);
      }
    }
    loadDatasets();
  }, []);

  // Xử lý nạp file Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const list: RecipientContact[] = [];
        const seen = new Set<string>();

        for (const row of rawRows) {
          const emailKey = Object.keys(row).find((k) => /email|e-mail|thư điện tử/i.test(k));
          const email = String(row[emailKey || "Email"] || "").trim();
          if (!email || !email.includes("@")) continue;

          const lower = email.toLowerCase();
          if (seen.has(lower)) continue;
          seen.add(lower);

          const compKey = Object.keys(row).find((k) => /công ty|doanh nghiệp|tên cty|company/i.test(k));
          const nameKey = Object.keys(row).find((k) => /người liên hệ|họ tên|đại diện|contact|tên/i.test(k));

          const rawCompany = String(row[compKey || "Công ty"] || "").trim();
          const companyName = cleanCompanyName(rawCompany, email);
          const contactName = String(row[nameKey || "Người liên hệ"] || "").trim();

          list.push({
            email,
            companyName: companyName || "Quý Doanh nghiệp",
            contactName: contactName || "Quý Khách",
          });
        }

        setContacts(list);
      } catch (err: any) {
        alert("Lỗi đọc file Excel: " + err.message);
      } finally {
        setIsLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Chọn Dataset có sẵn từ hệ thống
  const handleSelectDataset = (dataset: any) => {
    setSelectedDatasetId(dataset.id);
    if (Array.isArray(dataset.contacts)) {
      setContacts(
        dataset.contacts.map((c: any) => ({
          email: c.email,
          companyName: cleanCompanyName(c.company_name || c.companyName || "", c.email),
          contactName: c.contact_name || c.contactName || "Quý Khách",
        }))
      );
    }
  };

  // Cập nhật khi gõ tay danh sách email
  const handleManualBlur = () => {
    const lines = manualText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.includes("@"));

    const list: RecipientContact[] = lines.map((email) => ({
      email,
      companyName: "Quý Doanh nghiệp",
      contactName: "Quý Khách",
    }));
    setContacts(list);
  };

  return (
    <div className="space-y-6">
      {/* 1. Chọn Nguồn Nạp Đối Tượng */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Nạp Tệp Khách Hàng Mục Tiêu
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setRecipientMode("excel")}
            className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
              recipientMode === "excel"
                ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            <FileSpreadsheet size={18} />
            <span>Tải File Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => setRecipientMode("dataset")}
            className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
              recipientMode === "dataset"
                ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            <Database size={18} />
            <span>Dataset Có Sẵn</span>
          </button>
          <button
            type="button"
            onClick={() => setRecipientMode("manual")}
            className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all ${
              recipientMode === "manual"
                ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            <Upload size={18} />
            <span>Nhập Thủ Công</span>
          </button>
        </div>

        {/* Nội dung tương ứng từng Tab */}
        {recipientMode === "excel" && (
          <div className="pt-2 text-xs space-y-3">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
              <input
                type="file"
                id="agent-excel-input"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="agent-excel-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="font-bold text-slate-700 dark:text-slate-200">
                  {fileName ? `Đã chọn: ${fileName}` : "Bấm để chọn file Excel khách hàng"}
                </div>
                <div className="text-[11px] text-slate-400">
                  Tự động nhận diện cột: Email, Tên Công Ty, Người Liên Hệ
                </div>
              </label>
            </div>
          </div>
        )}

        {recipientMode === "dataset" && (
          <div className="pt-2 text-xs space-y-2">
            <label className="text-slate-500 font-medium">Chọn một Dataset từ hệ thống:</label>
            {isLoadingDatasets ? (
              <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="animate-spin" size={14} /> Đang tải danh sách dataset...
              </div>
            ) : datasets.length === 0 ? (
              <div className="p-4 text-center text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                Chưa có Dataset nào được lưu trong hệ thống. Bạn có thể tải file Excel.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {datasets.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectDataset(d)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedDatasetId === d.id
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{d.name}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                        {d.count || d.contacts?.length || 0} leads
                      </span>
                    </div>
                    {d.description && <div className="text-[11px] text-slate-400 mt-1 truncate">{d.description}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {recipientMode === "manual" && (
          <div className="pt-2 text-xs space-y-2">
            <label className="text-slate-500 font-medium">Dán danh sách email (mỗi dòng một email):</label>
            <textarea
              rows={6}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onBlur={handleManualBlur}
              placeholder="khach1@congty.com&#10;khach2@gmail.com&#10;khach3@doanhnghiep.vn"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-xs focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* 2. Bảng Xem Trước Danh Sách Đã Nhận */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>Danh Sách Đối Tượng Đã Nạp</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
              {contacts.length} người nhận
            </span>
          </div>

          {contacts.length > 0 && (
            <button
              type="button"
              onClick={() => setContacts([])}
              className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} /> Xóa danh sách
            </button>
          )}
        </div>

        {contacts.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            Chưa có người nhận nào. Hãy tải file Excel hoặc chọn Dataset ở trên!
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] sticky top-0">
                <tr>
                  <th className="p-2 pl-3">#</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Doanh Nghiệp</th>
                  <th className="p-2">Người Nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contacts.slice(0, 100).map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-2 pl-3 text-slate-400">{idx + 1}</td>
                    <td className="p-2 font-mono text-slate-700 dark:text-slate-300">{c.email}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{c.companyName}</td>
                    <td className="p-2 text-slate-500">{c.contactName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contacts.length > 100 && (
              <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                Và {contacts.length - 100} đối tượng khác...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
