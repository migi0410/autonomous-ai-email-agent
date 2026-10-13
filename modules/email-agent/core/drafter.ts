import { GoogleGenAI } from "@google/genai";
import dns from "node:dns";
import { DesignStyle, Language, SequenceStep, Tone } from "../types";

// Force IPv4 first to avoid IPv6 timeouts with Cloudflare Tunnel & OrcaRouter
if (typeof (dns as any).setDefaultResultOrder === "function") {
  (dns as any).setDefaultResultOrder("ipv4first");
}

export interface DrafterOptions {
  prompt: string;
  brandName?: string;
  brandColor?: string;
  senderInfo?: string;
  logoUrl?: string;
  websiteUrl?: string;
  tone?: Tone;
  language?: Language;
  designStyle?: DesignStyle;
  customSystemPrompt?: string;
  forceProvider?: "orcarouter" | "gemini" | "local";
  trackingHistory?: {
    campaignName?: string;
    openRate?: number;
    clickRate?: number;
    notes?: string;
  };
}

const toneDescriptions: Record<Tone, string> = {
  professional: "Trang trọng, lịch sự, chuẩn mực giao tiếp kinh doanh B2B.",
  friendly: "Thân thiện, ấm áp, gần gũi và tạo thiện cảm.",
  persuasive: "Thuyết phục mạnh mẽ, nhấn mạnh lợi ích và giá trị chuyển đổi cao.",
  urgent: "Tạo tính cấp bách, nhấn mạnh thời hạn hoặc số lượng có hạn.",
  concise: "Cực kỳ súc tích, ngắn gọn, đi thẳng vào trọng tâm trong 30 giây đọc.",
};

const languageInstructions: Record<Language, string> = {
  vi: "Toàn bộ nội dung email phải được viết bằng Tiếng Việt chuẩn mực, tự nhiên, cuốn hút.",
  en: "The entire email content must be written in fluent, professional English.",
  zh: "整封邮件内容必须使用规范、地道的中文编写。",
  ko: "이메일의 모든 내용은 자연스럽고 정중한 한국어(비즈니스 격식체)로 작성되어야 합니다.",
};

const designStyleGuides: Record<DesignStyle, string> = {
  modern_saas: "Phong cách Modern SaaS & High-Tech: Dải màu nhấn 4px ở đỉnh, Pill Badge nổi bật, các điểm cốt lõi trình bày bằng thẻ Card riêng biệt, nút bấm dạng viên thuốc đổ bóng mềm.",
  minimal_apple: "Phong cách Tối giản Tinh tế (Apple style): Khoảng trắng thoáng đãng, phân cấp chữ (typography) sâu sắc, đường kẻ phân cách cực mảnh, phong cách thanh lịch đỉnh cao.",
  luxury_premium: "Phong cách Doanh nghiệp Cao cấp (Luxury & Corporate): Viền mỏng trang trọng, thẻ card viền kép, bố cục vững chãi, uy tín và đáng tin cậy tuyệt đối.",
  warm_friendly: "Phong cách Thân thiện & Gần gũi: Bo góc mềm mại 16px, thẻ card nền ấm dễ chịu, icon biểu cảm sinh động, tạo thiện cảm ngay từ 3 giây đầu tiên.",
};

function getDesignRules(params: {
  brandName: string;
  brandColor: string;
  senderInfo: string;
  logoUrl?: string;
  websiteUrl?: string;
}): string {
  const { brandName, brandColor, senderInfo, logoUrl, websiteUrl = "https://www.tavitax.com" } = params;

  return `TIÊU CHUẨN THIẾT KẾ ĐỈNH CAO (BẮT BUỘC 100% INLINE CSS TRONG MÃ HTML):
1. Cấu trúc Canvas & Card Container chuẩn quốc tế:
   - Nền ngoài: background-color: #f8fafc, padding: 32px 10px, font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
   - Card nội dung trung tâm: max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
   - Đỉnh Card: BẮT BUỘC có 1 dải màu nhấn (accent line) cao 4px với màu chủ đạo ${brandColor}.
2. Header Thương hiệu & Huy hiệu (Pill Badge) TÁCH BIỆT RÕ RÀNG BẰNG 2 KHỐI BLOCK RIÊNG:
   - Khối 1: ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" style="max-height: 40px; width: auto;" />` : `<span style="font-size: 16px; font-weight: 800; color: #0f172a;">${brandName}</span>`}
   - Khối 2: <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; background-color: ${brandColor}18; color: ${brandColor}; font-size: 12px; font-weight: 700;">✦ GIẢI PHÁP DOANH NGHIỆP</span>
3. Tiêu đề Hero & Lời chào cá nhân hóa:
   - Hero: font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;
   - Lời chào: "Kính gửi Quý Doanh nghiệp {{company_name}}," hoặc "Xin chào {{contact_name}},"
4. Thẻ Card Nội dung (Benefit / Info Cards):
   - Số lượng thẻ Card PHẢI TRÙNG KHỚP 100% với số điểm/lỗi đã nêu ở tiêu đề/mở bài (ví dụ 5 lỗi -> đủ đúng 5 thẻ card).
   - Mỗi thẻ: background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 12px.
5. Nút bấm CTA:
   - Pill Button: border-radius: 50px; background-color: ${brandColor}; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 36px; text-decoration: none; display: inline-block;
   - Thuộc tính href="${websiteUrl}" (hệ thống sẽ tự động bọc tracking link).
6. Chân trang (Footer):
   - Ghi rõ thông tin ${senderInfo}, email người nhận {{email}} và liên kết "Hủy đăng ký".
7. TUYỆT ĐỐI KHÔNG dùng thẻ <style> ngoài, 100% inline CSS.`;
}

function parseEmailOutput(rawText: string): { subject: string; preheader: string; html: string } {
  let subject = "Thông báo từ Doanh nghiệp";
  let preheader = "";
  let html = "";

  const subjectMatch = rawText.match(/===SUBJECT===([\s\S]*?)===PREHEADER===/i);
  const preheaderMatch = rawText.match(/===PREHEADER===([\s\S]*?)===HTML===/i);
  const htmlMatch = rawText.match(/===HTML===([\s\S]*?)(?:===END===|$)/i);

  if (subjectMatch && subjectMatch[1]) subject = subjectMatch[1].trim();
  if (preheaderMatch && preheaderMatch[1]) preheader = preheaderMatch[1].trim();
  if (htmlMatch && htmlMatch[1]) {
    html = htmlMatch[1].trim();
  } else {
    const htmlTagMatch = rawText.match(/<!DOCTYPE html[\s\S]*<\/html>/i);
    if (htmlTagMatch) {
      html = htmlTagMatch[0].trim();
    } else {
      html = rawText.trim();
    }
  }

  return { subject, preheader, html };
}

function parseSequenceOutput(rawText: string): SequenceStep[] {
  const steps: SequenceStep[] = [];
  const stepBlocks = rawText.split(/===STEP_START===/i);

  for (let i = 1; i < stepBlocks.length; i++) {
    const block = stepBlocks[i].split(/===STEP_END===/i)[0];
    if (!block) continue;

    const stepNumMatch = block.match(/STEP:\s*(\d+)/i);
    const titleMatch = block.match(/TITLE:\s*([^\n]+)/i);
    const delayMatch = block.match(/DELAY_DAYS:\s*(\d+)/i);
    const conditionMatch = block.match(/CONDITION:\s*([^\n]+)/i);
    const strategyMatch = block.match(/STRATEGY:\s*([^\n]+)/i);
    const subjectMatch = block.match(/SUBJECT:\s*([^\n]+)/i);
    const preheaderMatch = block.match(/PREHEADER:\s*([^\n]+)/i);
    const htmlMatch = block.match(/HTML:\s*([\s\S]*)$/i);

    const stepNum = stepNumMatch ? parseInt(stepNumMatch[1], 10) : steps.length + 1;
    const weekTitle = titleMatch ? titleMatch[1].trim() : `Tuần ${stepNum}`;
    const delayDays = delayMatch ? parseInt(delayMatch[1], 10) : (stepNum - 1) * 7;
    const condRaw = conditionMatch ? conditionMatch[1].trim().toLowerCase() : "all";
    const condition = ["opened_prev", "not_opened_prev", "clicked_prev"].includes(condRaw) ? (condRaw as any) : "all";
    const strategyNote = strategyMatch ? strategyMatch[1].trim() : "";
    const subject = subjectMatch ? subjectMatch[1].trim() : `Thông báo Tuần ${stepNum}`;
    const preheader = preheaderMatch ? preheaderMatch[1].trim() : "";
    let html = htmlMatch ? htmlMatch[1].trim() : "";

    html = html.replace(/```html/gi, "").replace(/```/g, "").trim();

    steps.push({
      step: stepNum,
      weekTitle,
      delayDays,
      condition,
      strategyNote,
      subject,
      preheader,
      html,
    });
  }

  return steps;
}

export async function callAI(systemPrompt: string, userPrompt: string, provider: "orcarouter" | "gemini" | "local" = "orcarouter"): Promise<{ text: string; provider: string; model: string }> {
  // 1. Thử OrcaRouter (DeepSeek V3 / R1)
  if (provider === "orcarouter" || provider === "local") {
    const orcaKey = process.env.ORCAROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const orcaUrl = process.env.ORCAROUTER_BASE_URL || "https://api.orcarouter.com/v1";

    if (orcaKey) {
      try {
        const response = await fetch(`${orcaUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${orcaKey}`,
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.6,
            max_tokens: 8192,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            return { text: content, provider: "orcarouter", model: "deepseek-chat" };
          }
        }
      } catch (e) {
        console.warn("[Drafter] OrcaRouter failed, trying Gemini fallback:", e);
      }
    }
  }

  // 2. Dự phòng: Google Gemini (3.8 Flash / 2.5 Flash)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("Không tìm thấy API Key cho AI (Cần ORCAROUTER_API_KEY hoặc GEMINI_API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${systemPrompt}\n\n[YÊU CẦU NGƯỜI DÙNG]:\n${userPrompt}`,
    config: {
      temperature: 0.5,
    },
  });

  const text = response.text || "";
  if (!text) throw new Error("Gemini không trả về nội dung.");
  return { text, provider: "gemini", model: "gemini-2.5-flash" };
}

export async function draftSingleEmail(options: DrafterOptions): Promise<{
  subject: string;
  preheader: string;
  html: string;
  provider: string;
  model: string;
}> {
  const brandName = options.brandName || "Tavitax Group";
  const brandColor = options.brandColor || "#800020";
  const senderInfo = options.senderInfo || "Tavitax Group | Hotline: 0948 450 128 | Email: contact@tavitax.com";
  const tone = options.tone || "professional";
  const language = options.language || "vi";
  const designStyle = options.designStyle || "modern_saas";

  const systemPrompt = `Bạn là Elite Email Marketing Architect & Senior UI/UX Designer hàng đầu thế giới.
Nhiệm vụ: Tạo ra một mẫu email marketing chuẩn thiết kế hiện đại, tỉ lệ chuyển đổi vượt trội.

THÔNG TIN THƯƠNG HIỆU:
- Tên: ${brandName}
- Màu chủ đạo: ${brandColor}
- Người gửi: ${senderInfo}
- Phong cách ngôn từ: ${toneDescriptions[tone]}
- Thiết kế: ${designStyleGuides[designStyle]}
- Ngôn ngữ: ${languageInstructions[language]}

${getDesignRules({ brandName, brandColor, senderInfo, logoUrl: options.logoUrl, websiteUrl: options.websiteUrl })}
${options.customSystemPrompt ? `\n--- QUY TẮC BỔ SUNG: ---\n${options.customSystemPrompt}\n` : ""}

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (KHÔNG DÙNG JSON, KHÔNG BỌC CODEBLOCK):
===SUBJECT===
[Tiêu đề thư]
===PREHEADER===
[Mô tả ngắn 60-80 ký tự]
===HTML===
<!DOCTYPE html>
<html>...mã HTML chuẩn inline CSS...</html>
===END===`;

  const aiRes = await callAI(systemPrompt, options.prompt, options.forceProvider);
  const parsed = parseEmailOutput(aiRes.text);

  return {
    ...parsed,
    provider: aiRes.provider,
    model: aiRes.model,
  };
}

export async function draftSequence(options: DrafterOptions): Promise<{
  steps: SequenceStep[];
  provider: string;
  model: string;
}> {
  const brandName = options.brandName || "Tavitax Group";
  const brandColor = options.brandColor || "#800020";
  const senderInfo = options.senderInfo || "Tavitax Group | Hotline: 0948 450 128 | Email: contact@tavitax.com";
  const tone = options.tone || "professional";
  const language = options.language || "vi";
  const designStyle = options.designStyle || "modern_saas";

  const systemPrompt = `Bạn là Giám đốc Chiến lược Email Automation (CMO & Senior UI/UX Architect) hàng đầu thế giới.
NHIỆM VỤ: Thiết kế TRỌN VẸN VÀ ĐẦY ĐỦ TẤT CẢ CÁC BƯỚC / CÁC TUẦN trong chuỗi email tự động dài ngày dựa theo yêu cầu của người dùng.
- MẶC ĐỊNH TẠO ĐỦ 3 BƯỚC (Tuần 1, Tuần 2, Tuần 3) nếu người dùng không ghi rõ số tuần.
- BẮT BUỘC TẠO ĐỦ TẤT CẢ CÁC BƯỚC, KHÔNG DỪNG LẠI Ở BƯỚC 1.

CẤU TRÚC CHIẾN LƯỢC:
- Bước 1 (Delay 0 ngày, Điều kiện: all): Mở màn, nhận diện nỗi đau, cẩm nang miễn phí.
- Bước 2 (Delay 7 ngày, Điều kiện: opened_prev): Case study thực tế, giải pháp tương tự.
- Bước 3 (Delay 14 ngày, Điều kiện: clicked_prev): Lời kêu gọi hành động quyết định (Closing Offer), suất tư vấn 1-1 giới hạn.

${getDesignRules({ brandName, brandColor, senderInfo, logoUrl: options.logoUrl, websiteUrl: options.websiteUrl })}

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC CHO TỪNG BƯỚC:
===STEP_START===
STEP: 1
TITLE: Tuần 1: Nhận diện & Mở màn
DELAY_DAYS: 0
CONDITION: all
STRATEGY: Khởi động chiến dịch
SUBJECT: [Tiêu đề bước 1]
PREHEADER: [Mô tả ngắn]
HTML:
<!DOCTYPE html><html>...</html>
===STEP_END===

(Lặp lại đúng cấu trúc trên cho Bước 2, Bước 3... Cực kỳ đầy đủ)`;

  const aiRes = await callAI(systemPrompt, options.prompt, options.forceProvider);
  let steps = parseSequenceOutput(aiRes.text);

  if (steps.length === 0) {
    const single = parseEmailOutput(aiRes.text);
    steps = [
      {
        step: 1,
        weekTitle: "Tuần 1: Khởi Động Chiến Dịch",
        delayDays: 0,
        condition: "all",
        subject: single.subject,
        preheader: single.preheader,
        html: single.html,
      },
    ];
  }

  return {
    steps,
    provider: aiRes.provider,
    model: aiRes.model,
  };
}
