/**
 * Email Service
 *
 * Uses Nodemailer to send transactional emails.
 * Configure with environment variables:
 *
 *   SMTP_HOST     - e.g. smtp.gmail.com
 *   SMTP_PORT     - e.g. 587
 *   SMTP_USER     - e.g. noreply@theartfulexperience.com
 *   SMTP_PASS     - app password
 *   EMAIL_FROM    - "The Artful Experience <noreply@theartfulexperience.com>"
 */
import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM =
  process.env.EMAIL_FROM ||
  "The Artful Experience <noreply@theartfulexperience.com>";

// ─── Order Confirmation ──────────────────────────────────────────────────

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    portalUrl?: string;
    editUrl?: string;
  }[];
  siteUrl?: string;
}

export async function sendOrderConfirmation(
  data: OrderEmailData
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(
      "[Email] SMTP not configured — skipping order confirmation email"
    );
    return false;
  }

  const siteUrl =
    data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://dev.theartfulexperience.com";

  const portalSection = data.items
    .filter((i) => i.portalUrl)
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">
            <strong>${i.name}</strong><br/>
            <a href="${i.portalUrl}" style="color:#3b82f6;font-size:13px">View Portal</a>
            ${i.editUrl ? ` &nbsp;|&nbsp; <a href="${siteUrl}${i.editUrl}" style="color:#3b82f6;font-size:13px">Edit Portal</a>` : ""}
          </td>
        </tr>`
    )
    .join("");

  const itemRows = data.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">
            ${i.name} &times; ${i.quantity}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">
            $${(i.price * i.quantity).toFixed(2)}
          </td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;font-family:'Inter',Helvetica,Arial,sans-serif;background:#f9fafb">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff">
    <!-- Header -->
    <tr>
      <td style="background:#1a1a2e;padding:32px 24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">The Artful Experience</h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px 24px">
        <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a2e">Order Confirmed!</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
          Hi ${data.customerName || "there"}, thank you for your order.
        </p>

        <table width="100%" style="font-size:14px;color:#374151;margin-bottom:24px">
          <tr>
            <td style="padding:4px 0;color:#9ca3af;font-size:12px">Order Number</td>
            <td style="padding:4px 0;text-align:right;font-family:monospace;font-weight:600">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#9ca3af;font-size:12px">Total</td>
            <td style="padding:4px 0;text-align:right;font-weight:600">$${data.total.toFixed(2)}</td>
          </tr>
        </table>

        <!-- Items -->
        <h3 style="font-size:14px;color:#1a1a2e;margin:0 0 8px;border-bottom:2px solid #f0f0f0;padding-bottom:8px">Items</h3>
        <table width="100%" style="font-size:14px;color:#374151;margin-bottom:24px">
          ${itemRows}
        </table>

        ${
          portalSection
            ? `
        <!-- ArtKey Portals -->
        <div style="background:#f0f7ff;border-radius:12px;padding:20px;margin-bottom:24px">
          <h3 style="font-size:14px;color:#1a1a2e;margin:0 0 12px">Your ArtKey Portals</h3>
          <p style="font-size:13px;color:#6b7280;margin:0 0 12px">
            Your portals are live! Guests who scan your QR code will see your digital experience.
          </p>
          <table width="100%" style="font-size:14px;color:#374151">
            ${portalSection}
          </table>
        </div>`
            : ""
        }

        <!-- CTA -->
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/order/${data.orderNumber}?email=${encodeURIComponent(data.customerEmail)}"
             style="background:#1a1a2e;color:#ffffff;padding:12px 32px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">
            View Order Details
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f0f0f0">
        <p style="color:#9ca3af;font-size:12px;margin:0">
          &copy; ${new Date().getFullYear()} The Artful Experience. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: `Order Confirmed — ${data.orderNumber} | The Artful Experience`,
      html,
    });
    console.log(
      `[Email] Order confirmation sent to ${data.customerEmail} for ${data.orderNumber}`
    );
    return true;
  } catch (err: any) {
    console.error("[Email] Failed to send order confirmation:", err?.message);
    return false;
  }
}

// ─── Shipping Notification ───────────────────────────────────────────────

interface ShippingEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  siteUrl?: string;
}

export async function sendShippingNotification(
  data: ShippingEmailData
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(
      "[Email] SMTP not configured — skipping shipping notification"
    );
    return false;
  }

  const siteUrl =
    data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://dev.theartfulexperience.com";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;font-family:'Inter',Helvetica,Arial,sans-serif;background:#f9fafb">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff">
    <tr>
      <td style="background:#1a1a2e;padding:32px 24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">The Artful Experience</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px">
        <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a2e">Your Order Has Shipped!</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
          Hi ${data.customerName || "there"}, great news — your order <strong>${data.orderNumber}</strong> is on its way!
        </p>

        ${
          data.trackingNumber
            ? `
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="font-size:13px;color:#166534;margin:0 0 8px"><strong>Tracking Info</strong></p>
          ${data.carrier ? `<p style="font-size:13px;color:#374151;margin:0 0 4px">Carrier: ${data.carrier}</p>` : ""}
          <p style="font-size:13px;color:#374151;margin:0 0 8px;font-family:monospace">${data.trackingNumber}</p>
          ${
            data.trackingUrl
              ? `<a href="${data.trackingUrl}" style="background:#16a34a;color:#ffffff;padding:10px 24px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:600;display:inline-block">Track Package</a>`
              : ""
          }
        </div>`
            : ""
        }

        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/order/${data.orderNumber}?email=${encodeURIComponent(data.customerEmail)}"
             style="background:#1a1a2e;color:#ffffff;padding:12px 32px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">
            View Order
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f0f0f0">
        <p style="color:#9ca3af;font-size:12px;margin:0">
          &copy; ${new Date().getFullYear()} The Artful Experience. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: data.customerEmail,
      subject: `Your Order Has Shipped — ${data.orderNumber} | The Artful Experience`,
      html,
    });
    console.log(
      `[Email] Shipping notification sent to ${data.customerEmail} for ${data.orderNumber}`
    );
    return true;
  } catch (err: any) {
    console.error(
      "[Email] Failed to send shipping notification:",
      err?.message
    );
    return false;
  }
}

// ─── Guestbook Notifications ──────────────────────────────────────────────

interface GuestbookEntryEmailData {
  ownerEmail: string;
  portalTitle: string;
  portalUrl: string;
  guestName: string;
  guestMessage: string;
  guestEmail?: string | null;
  requiresApproval: boolean;
}

export async function sendGuestbookEntryNotification(
  data: GuestbookEntryEmailData
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[Email] SMTP not configured — skipping guestbook notification");
    return false;
  }

  const statusText = data.requiresApproval
    ? "pending approval"
    : "published";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;font-family:'Inter',Helvetica,Arial,sans-serif;background:#f9fafb">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff">
    <tr>
      <td style="background:#1a1a2e;padding:28px 24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700">New Guestbook Entry</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px">
        <p style="font-size:14px;color:#4b5563;margin:0 0 10px">
          A new entry was submitted to <strong>${data.portalTitle}</strong> and is currently <strong>${statusText}</strong>.
        </p>
        <div style="background:#f3f4f6;border-radius:10px;padding:14px 16px;margin:14px 0">
          <p style="margin:0 0 6px;font-size:13px;color:#111827"><strong>From:</strong> ${data.guestName}${data.guestEmail ? ` (${data.guestEmail})` : ""}</p>
          <p style="margin:0;font-size:14px;color:#111827;white-space:pre-wrap">${data.guestMessage}</p>
        </div>
        <a href="${data.portalUrl}"
           style="background:#1a1a2e;color:#ffffff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:600;display:inline-block">
          Open Portal
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: data.ownerEmail,
      subject: `New guestbook entry — ${data.portalTitle}`,
      html,
    });
    return true;
  } catch (err: any) {
    console.error("[Email] Failed to send guestbook notification:", err?.message);
    return false;
  }
}

// ─── Portal Archive Digest (HTML + PDF) ─────────────────────────────────

interface PortalArchiveDigestData {
  ownerEmail: string;
  portalTitle: string;
  portalUrl: string;
  expiresAtIso: string;
  guestbookEntries: Array<{
    name: string;
    message: string;
    createdAt?: string | null;
  }>;
  mediaUrls: string[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "artkey";
}

async function buildPortalArchivePdf(data: PortalArchiveDigestData): Promise<Buffer> {
  const PDFKitModule = await import("pdfkit");
  const PDFDocument = PDFKitModule.default;
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  const chunks: Buffer[] = [];

  const out = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(20).fillColor("#111827").text("ArtKey Portal Archive", { underline: false });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#374151").text(`Portal: ${data.portalTitle}`);
  doc.text(`Expires: ${new Date(data.expiresAtIso).toLocaleString()}`);
  doc.fillColor("#2563eb").text("Open Portal", { link: data.portalUrl, underline: true });
  doc.moveDown(1);

  doc.fontSize(14).fillColor("#111827").text("Guestbook Entries");
  doc.moveDown(0.4);
  if (data.guestbookEntries.length === 0) {
    doc.fontSize(11).fillColor("#6b7280").text("No guestbook entries were captured.");
  } else {
    for (const entry of data.guestbookEntries) {
      doc.fontSize(11).fillColor("#111827").text(`${entry.name}${entry.createdAt ? ` — ${new Date(entry.createdAt).toLocaleString()}` : ""}`);
      doc.fontSize(10).fillColor("#374151").text(entry.message || "", { indent: 12 });
      doc.moveDown(0.5);
    }
  }

  doc.moveDown(0.8);
  doc.fontSize(14).fillColor("#111827").text("Shared Media Links");
  doc.moveDown(0.4);
  if (data.mediaUrls.length === 0) {
    doc.fontSize(11).fillColor("#6b7280").text("No shared media links were captured.");
  } else {
    for (const url of data.mediaUrls) {
      doc.fontSize(10).fillColor("#2563eb").text(url, { link: url, underline: true });
      doc.moveDown(0.25);
    }
  }

  doc.end();
  return out;
}

export async function sendPortalArchiveDigest(
  data: PortalArchiveDigestData
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[Email] SMTP not configured — skipping portal archive digest");
    return false;
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await buildPortalArchivePdf(data);
  } catch (err: any) {
    console.error("[Email] Failed to build archive PDF:", err?.message);
    return false;
  }

  const guestbookHtml = data.guestbookEntries.length
    ? data.guestbookEntries
        .map(
          (entry) => `<tr>
  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb">
    <div style="font-size:13px;color:#111827;font-weight:600">${entry.name}</div>
    <div style="font-size:12px;color:#6b7280;margin-top:2px">${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}</div>
    <div style="font-size:13px;color:#374151;margin-top:6px;white-space:pre-wrap">${entry.message}</div>
  </td>
</tr>`
        )
        .join("")
    : `<tr><td style="padding:10px 0;color:#6b7280;font-size:13px">No guestbook entries captured.</td></tr>`;

  const mediaHtml = data.mediaUrls.length
    ? data.mediaUrls
        .map(
          (url) =>
            `<li style="margin-bottom:6px"><a href="${url}" style="color:#2563eb;font-size:13px;word-break:break-all">${url}</a></li>`
        )
        .join("")
    : `<li style="color:#6b7280;font-size:13px">No shared media links captured.</li>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;font-family:'Inter',Helvetica,Arial,sans-serif;background:#f9fafb">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff">
    <tr>
      <td style="background:#1a1a2e;padding:30px 24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700">Your ArtKey Archive Package</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px">
        <p style="font-size:14px;color:#374151;margin:0 0 10px">
          Here is your portal summary before expiration for <strong>${data.portalTitle}</strong>.
        </p>
        <p style="font-size:13px;color:#6b7280;margin:0 0 18px">
          Expires: ${new Date(data.expiresAtIso).toLocaleString()}
        </p>
        <p style="margin:0 0 14px">
          <a href="${data.portalUrl}" style="color:#2563eb;font-size:13px">Open Portal</a>
        </p>

        <h3 style="font-size:14px;color:#111827;margin:0 0 8px">Guestbook Entries</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
          ${guestbookHtml}
        </table>

        <h3 style="font-size:14px;color:#111827;margin:0 0 8px">Shared Media</h3>
        <ul style="padding-left:18px;margin:0 0 12px">
          ${mediaHtml}
        </ul>

        <p style="font-size:12px;color:#6b7280;margin:14px 0 0">
          A PDF copy is attached for easy download and sharing.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: data.ownerEmail,
      subject: `ArtKey archive package — ${data.portalTitle}`,
      html,
      attachments: [
        {
          filename: `${slugify(data.portalTitle)}-artkey-archive.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    return true;
  } catch (err: any) {
    console.error("[Email] Failed to send portal archive digest:", err?.message);
    return false;
  }
}
