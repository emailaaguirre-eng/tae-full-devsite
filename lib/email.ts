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
