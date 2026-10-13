import nodemailer from "nodemailer";
import { cleanCompanyName, formatCompanyGreeting } from "@/lib/company-formatter";
import { normalizeEmail, isValidEmail } from "@/lib/email-normalizer";
import { SmtpConfig } from "../types";
import { enqueueJob } from "@/lib/email-queue-manager";

const transporterCache = new Map<string, nodemailer.Transporter>();

export function getMailTransporter(smtp: SmtpConfig): nodemailer.Transporter {
  const cacheKey = `${smtp.host}_${smtp.port}_${smtp.user}`;
  if (transporterCache.has(cacheKey)) {
    return transporterCache.get(cacheKey)!;
  }

  const portNum = Number(smtp.port) || 465;
  const isSecure = smtp.secure === true || (smtp.secure as any) === "true" || portNum === 465;

  const transporter = nodemailer.createTransport({
    host: smtp.host || "smtp.gmail.com",
    port: portNum,
    secure: isSecure,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  transporterCache.set(cacheKey, transporter);
  return transporter;
}

export interface SendSingleEmailParams {
  smtp: SmtpConfig;
  recipient: {
    email: string;
    companyName?: string;
    contactName?: string;
  };
  subject: string;
  htmlContent: string;
  campaignName: string;
  trackingConfig?: {
    openTracking?: boolean;
    clickTracking?: boolean;
  };
}

export async function sendEmailDirectly(params: SendSingleEmailParams): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  const cleanTo = normalizeEmail(params.recipient.email);
  if (!isValidEmail(cleanTo)) {
    return { success: false, error: `Email không hợp lệ: ${params.recipient.email}` };
  }

  const { smtp, subject, htmlContent, campaignName } = params;
  if (!smtp || !smtp.user || !smtp.pass) {
    return { success: false, error: "Thiếu thông tin cấu hình tài khoản gửi" };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tavitax.com").replace(/\/$/, "");

  // 1. Chuẩn hóa tên và lời chào
  const usernamePart = cleanTo.split("@")[0];
  const displayName = usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1);
  const rawCompany = params.recipient.companyName || "Quý Doanh nghiệp";
  const companyName = cleanCompanyName(rawCompany, cleanTo);
  const greeting = formatCompanyGreeting(companyName, cleanTo);
  const contactName = params.recipient.contactName || displayName;

  let finalSubject = subject
    .replace(/\{\{email\}\}/gi, cleanTo)
    .replace(/\{\{name\}\}/gi, displayName)
    .replace(/\{\{company_greeting\}\}/gi, greeting)
    .replace(/\{\{company_name\}\}/gi, companyName)
    .replace(/\{\{contact_name\}\}/gi, contactName);

  let finalHtml = htmlContent
    .replace(/\{\{email\}\}/gi, cleanTo)
    .replace(/\{\{name\}\}/gi, displayName)
    .replace(/\{\{company_greeting\}\}/gi, greeting)
    .replace(/Kính gửi:\s*Quý\s*(?:Doanh nghiệp|Công [tT]y)\s*\{\{company_name\}\}/gi, `Kính gửi: ${greeting}`)
    .replace(/\{\{company_name\}\}/gi, companyName)
    .replace(/\{\{contact_name\}\}/gi, contactName);

  // 2. Chuẩn hóa link ảnh tương đối sang tuyệt đối
  finalHtml = finalHtml.replace(/src=(["'])\/(?!\/)([^"'\s>]+)\1/gi, (match: string, quote: string, relativePath: string) => {
    return `src=${quote}${siteUrl}/${relativePath}${quote}`;
  });

  // 3. Tracking links & Pixel
  const tracking = params.trackingConfig || { openTracking: true, clickTracking: true };
  if (tracking.clickTracking !== false) {
    finalHtml = finalHtml.replace(/href=(["'])(https?:\/\/[^"'\s>]+)\1/gi, (match: string, quote: string, originalUrl: string) => {
      if (originalUrl.includes("/api/track/click")) return match;
      const trackingClickUrl = `${siteUrl}/api/track/click?email=${encodeURIComponent(cleanTo)}&campaign=${encodeURIComponent(campaignName)}&subject=${encodeURIComponent(finalSubject)}&url=${encodeURIComponent(originalUrl)}`;
      return `href=${quote}${trackingClickUrl}${quote}`;
    });
  }

  if (tracking.openTracking !== false) {
    const trackingOpenUrl = `${siteUrl}/api/track/open?email=${encodeURIComponent(cleanTo)}&campaign=${encodeURIComponent(campaignName)}&subject=${encodeURIComponent(finalSubject)}`;
    const trackingPixelTag = `\n<img src="${trackingOpenUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />\n`;
    if (finalHtml.includes("</body>")) {
      finalHtml = finalHtml.replace("</body>", `${trackingPixelTag}</body>`);
    } else {
      finalHtml += trackingPixelTag;
    }
  }

  // 4. Gửi qua Transporter
  const fromAddress = smtp.fromEmail?.trim() || smtp.user.trim();
  const fromName = smtp.fromName?.trim() || "Tavitax Group";
  const formattedFrom = `"${fromName.replace(/"/g, "")}" <${fromAddress}>`;

  const transporter = getMailTransporter(smtp);
  try {
    const info = await transporter.sendMail({
      from: formattedFrom,
      to: cleanTo,
      subject: finalSubject,
      html: finalHtml,
      replyTo: smtp.replyTo || fromAddress,
    });
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Đẩy một bước chiến dịch tự động vào hàng chờ 24/7 an toàn (Queue Worker)
 */
export async function enqueueAutonomousStepJob(params: {
  campaignName: string;
  stepTitle: string;
  subject: string;
  htmlContent: string;
  smtpConfig: SmtpConfig;
  recipients: Array<{ email: string; companyName?: string; contactName?: string }>;
  trackingConfig?: { openTracking: boolean; clickTracking: boolean };
}) {
  return await enqueueJob(
    {
      title: `${params.campaignName} - ${params.stepTitle}`,
      campaignName: params.campaignName,
      templateName: params.stepTitle,
      subject: params.subject,
      htmlContent: params.htmlContent,
      senderConfig: params.smtpConfig,
      trackingConfig: params.trackingConfig || { openTracking: true, clickTracking: true },
      delaySeconds: 5,
      targetCount: params.recipients.length,
      recipients: params.recipients.map((r) => ({
        email: r.email,
        company_name: r.companyName || "Quý Doanh nghiệp",
        contact_name: r.contactName || "Quý Khách",
      })),
    },
    true
  );
}
