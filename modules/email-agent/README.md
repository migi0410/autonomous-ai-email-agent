# AI Email Marketing Agent (Autonomous Module v2.0)

Một module hoàn chỉnh, độc lập (Self-Contained Module) đảm nhận 2 vai trò cốt lõi:
1. **AI Soạn thảo Email**: Tạo email marketing chuẩn chuyển đổi (Master Design System, table-based, 100% inline CSS) hoặc tạo chuỗi chiến dịch đa tuần (Sequence Blueprint) bằng **DeepSeek (OrcaRouter)** hoặc **Google Gemini 2.5 Flash**.
2. **AI Vận hành Tự động 24/7 (Set-and-Forget)**: Đánh giá dữ liệu tracking (Mở thư, Click link) sau mỗi tuần, tự động chia nhánh hành vi (🔥 Đã Click, 👀 Đã Mở, 💤 Chưa Mở) và gửi nội dung tương ứng theo lịch hẹn ngầm trên Server.

---

## 📁 Cấu Trúc Thư Mục Module

```
modules/email-agent/
├── index.ts                           # Điểm xuất (Export) chính của toàn module
├── types.ts                           # Định nghĩa kiểu dữ liệu TypeScript
├── constants.ts                       # Cấu hình mẫu (Presets, Swatches, SMTP)
│
├── core/                              # Lõi nghiệp vụ & AI
│   ├── drafter.ts                     # AI Soạn thư & Chuỗi đa tuần
│   ├── sequence-planner.ts            # Lập kế hoạch & Điều phối chuỗi theo thời gian
│   ├── evaluator.ts                   # Đánh giá tracking & Tinh chỉnh nội dung theo nhánh
│   └── dispatcher.ts                  # Bộ gửi thư (Nodemailer, Token replacement, Tracking injection)
│
├── storage/                           # Cơ sở dữ liệu độc lập
│   ├── schema.sql                     # Schema PostgreSQL chuẩn
│   └── agent-store.ts                 # Database access layer (Supabase PG + Local JSON Fallback)
│
├── api/                               # Bộ điều phối Request Handler cho Next.js / Express
│   ├── generate-handler.ts            # Handler sinh mẫu email
│   ├── campaign-handler.ts            # Handler tạo & lấy thông tin chiến dịch
│   ├── action-handler.ts              # Handler tạm dừng, tiếp tục, xóa
│   └── cron-handler.ts                # Handler chạy chu kỳ tự động (Tick)
│
└── ui/                                # Giao diện cắm-là-chạy (Plug-and-play UI)
    ├── EmailAgentApp.tsx              # Component ứng dụng chính
    ├── index.ts                       # Xuất UI
    └── components/
        ├── ConfigStep.tsx             # Bước cấu hình tài khoản & nhãn hiệu
        ├── StudioStep.tsx             # Bước AI Soạn thư & Live Preview
        ├── AudienceStep.tsx           # Bước nạp Excel / Dataset / Thủ công
        ├── ApprovalStep.tsx           # Bước duyệt Plan 1-Click
        └── LiveMonitor.tsx            # Bảng giám sát tự động thời gian thực
```

---

## 🚀 Cách Sử Dụng Trong Next.js

### 1. Nhúng Giao Diện (UI)
Chỉ cần import `<EmailAgentApp />` vào bất kỳ Page nào:
```tsx
import { EmailAgentApp } from "@/modules/email-agent";

export default function MyAgentPage() {
  return (
    <main className="p-6">
      <EmailAgentApp />
    </main>
  );
}
```

### 2. Thiết lập API Route
Tạo các file Route cực kỳ ngắn gọn trỏ vào Handler của Module:
- `/api/email-agent/generate/route.ts` -> `handleGenerateRequest`
- `/api/email-agent/campaign/route.ts` -> `handleGetCampaign`, `handleCreateCampaign`
- `/api/email-agent/campaign/action/route.ts` -> `handleActionRequest`
- `/api/email-agent/cron/route.ts` -> `handleCronTick`
