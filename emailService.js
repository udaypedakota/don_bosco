require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter using Brevo SMTP or Gmail SMTP.
 * Returns null if credentials are not configured in .env.
 */
function getTransporter() {
  const brevoKey = process.env.BREVO_KEY;
  const brevoUser = process.env.BREVO_USER || 'c10daf001@smtp-brevo.com';

  // 1. Brevo SMTP (Recommended - 300 free emails/day)
  if (brevoKey) {
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: brevoUser.trim(),
        pass: brevoKey.trim()
      }
    });
  }

  // 2. Gmail SMTP Fallback
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.replace(/\s+/g, '')
    }
  });
}

/**
 * Clean responsive HTML email template for Payment Approved / Receipt
 */
function createPaymentReceiptHtml({ playerName, amount, mode, utr, date, status, notes }) {
  const formattedDate = date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const appUrl = process.env.APP_URL || 'https://smash-club-app.vercel.app';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt - Don Bosco Smash Club</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 540px; background: #131d33; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <!-- Top Branding Header -->
            <tr>
              <td style="padding: 30px 24px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); text-align: center;">
                <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">🏸</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">DON BOSCO SMASH CLUB</h1>
                <p style="margin: 6px 0 0; color: #d1fae5; font-size: 13px; font-weight: 500;">Moti Nagar Badminton Arena, Hyderabad</p>
              </td>
            </tr>

            <!-- Success Badge & Amount Card -->
            <tr>
              <td style="padding: 32px 24px 20px; text-align: center;">
                <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; color: #10b981; font-size: 30px; font-weight: bold; margin-bottom: 12px;">✓</div>
                <h2 style="margin: 0 0 6px; color: #ffffff; font-size: 20px; font-weight: 700;">Payment Approved!</h2>
                <p style="margin: 0 0 20px; color: #94a3b8; font-size: 14px;">Your payment has been verified and added to your balance.</p>
                
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 14px; padding: 20px; margin: 0 auto;">
                  <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">AMOUNT PAID</span>
                  <div style="font-size: 36px; font-weight: 800; color: #10b981; margin-top: 4px;">₹${parseFloat(amount).toFixed(2)}</div>
                </div>
              </td>
            </tr>

            <!-- Receipt Breakdown Table -->
            <tr>
              <td style="padding: 10px 24px 24px;">
                <table width="100%" cellspacing="0" cellpadding="10" style="background: #0b1120; border-radius: 12px; border: 1px solid #1e293b; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8; font-weight: 500;">Player Name</td>
                    <td align="right" style="color: #ffffff; font-weight: 600;">${playerName || 'Club Member'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8; font-weight: 500;">Payment Mode</td>
                    <td align="right" style="color: #38bdf8; font-weight: 600;">${mode || 'UPI (PhonePe)'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8; font-weight: 500;">UTR / Ref No.</td>
                    <td align="right" style="color: #f1f5f9; font-family: monospace; font-size: 13px;">${utr || 'N/A'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8; font-weight: 500;">Date & Time</td>
                    <td align="right" style="color: #ffffff; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; font-weight: 500;">Status</td>
                    <td align="right">
                      <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; border: 1px solid #059669;">
                        ${(status || 'APPROVED').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  ${notes ? `
                  <tr style="border-top: 1px solid #1e293b;">
                    <td style="color: #94a3b8; font-weight: 500;">Notes</td>
                    <td align="right" style="color: #cbd5e1; font-style: italic;">${notes}</td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>

            <!-- Action Button -->
            <tr>
              <td align="center" style="padding: 10px 24px 30px;">
                <a href="${appUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
                  📲 Open Smash Club App
                </a>
                <p style="margin: 16px 0 0; font-size: 12px; color: #64748b;">
                  Track all your games, court expenses, and settlement balance online.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: #090e1a; padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">
                  Don Bosco Badminton Club &copy; 2026. All rights reserved.<br>
                  This is an automated payment confirmation receipt.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Clean responsive HTML email template for Payment Rejected
 */
function createPaymentRejectedHtml({ playerName, amount, mode, utr, date, reason }) {
  const formattedDate = date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const appUrl = process.env.APP_URL || 'https://smash-club-app.vercel.app';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Claim Update - Don Bosco Smash Club</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 540px; background: #131d33; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <!-- Header -->
            <tr>
              <td style="padding: 28px 24px; background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%); text-align: center;">
                <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">🏸</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800;">DON BOSCO SMASH CLUB</h1>
                <p style="margin: 6px 0 0; color: #fee2e2; font-size: 13px;">Moti Nagar Badminton Arena, Hyderabad</p>
              </td>
            </tr>

            <!-- Rejection Badge -->
            <tr>
              <td style="padding: 32px 24px 20px; text-align: center;">
                <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; color: #ef4444; font-size: 30px; font-weight: bold; margin-bottom: 12px;">✕</div>
                <h2 style="margin: 0 0 6px; color: #ffffff; font-size: 20px; font-weight: 700;">Payment Claim Not Approved</h2>
                <p style="margin: 0 0 20px; color: #94a3b8; font-size: 14px;">Your reported payment claim could not be verified by the Admin.</p>
                
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 14px; padding: 18px; margin: 0 auto;">
                  <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">CLAIMED AMOUNT</span>
                  <div style="font-size: 32px; font-weight: 800; color: #ef4444; margin-top: 4px;">₹${parseFloat(amount).toFixed(2)}</div>
                </div>
              </td>
            </tr>

            <!-- Details -->
            <tr>
              <td style="padding: 10px 24px 24px;">
                <table width="100%" cellspacing="0" cellpadding="10" style="background: #0b1120; border-radius: 12px; border: 1px solid #1e293b; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8;">Player Name</td>
                    <td align="right" style="color: #ffffff; font-weight: 600;">${playerName || 'Club Member'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8;">Reported UTR</td>
                    <td align="right" style="color: #f1f5f9; font-family: monospace;">${utr || 'N/A'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8;">Date</td>
                    <td align="right" style="color: #ffffff;">${formattedDate}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8;">Status</td>
                    <td align="right">
                      <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; border: 1px solid #ef4444;">
                        REJECTED / UNVERIFIED
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8;">Reason / Note</td>
                    <td align="right" style="color: #fca5a5; font-weight: 600;">${reason || 'UTR could not be matched with bank record'}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Action Button -->
            <tr>
              <td align="center" style="padding: 10px 24px 30px;">
                <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8;">
                  If this was a mistake, please check your UPI transaction history and re-submit with the exact 12-digit UTR number.
                </p>
                <a href="${appUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 26px; border-radius: 12px;">
                  Open App & Re-submit Claim
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: #090e1a; padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">
                  Don Bosco Badminton Club &copy; 2026. For questions, contact Admin (Phani).
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Clean responsive HTML email template for Player Claim Submission Confirmation
 */
function createPaymentClaimSubmittedHtml({ playerName, amount, mode, utr, date }) {
  const formattedDate = date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const appUrl = process.env.APP_URL || 'https://smash-club-app.vercel.app';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Request Submitted - Don Bosco Smash Club</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 540px; background: #131d33; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <tr>
              <td style="padding: 28px 24px; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); text-align: center;">
                <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">🏸</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800;">DON BOSCO SMASH CLUB</h1>
                <p style="margin: 6px 0 0; color: #dbeafe; font-size: 13px;">Moti Nagar Badminton Arena, Hyderabad</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 32px 24px 20px; text-align: center;">
                <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); border: 2px solid #3b82f6; color: #3b82f6; font-size: 26px; font-weight: bold; margin-bottom: 12px;">⏳</div>
                <h2 style="margin: 0 0 6px; color: #ffffff; font-size: 20px; font-weight: 700;">Payment Claim Received!</h2>
                <p style="margin: 0 0 20px; color: #94a3b8; font-size: 14px;">Your payment request has been submitted to Admin for verification.</p>
                
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 14px; padding: 18px; margin: 0 auto;">
                  <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">AMOUNT SUBMITTED</span>
                  <div style="font-size: 32px; font-weight: 800; color: #38bdf8; margin-top: 4px;">₹${parseFloat(amount).toFixed(2)}</div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 10px 24px 24px;">
                <table width="100%" cellspacing="0" cellpadding="10" style="background: #0b1120; border-radius: 12px; border: 1px solid #1e293b; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8;">Player Name</td>
                    <td align="right" style="color: #ffffff; font-weight: 600;">${playerName || 'Club Member'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8;">UTR / Ref</td>
                    <td align="right" style="color: #f1f5f9; font-family: monospace;">${utr || 'N/A'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8;">Payment Mode</td>
                    <td align="right" style="color: #38bdf8;">${mode || 'UPI'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="color: #94a3b8;">Date</td>
                    <td align="right" style="color: #ffffff;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8;">Status</td>
                    <td align="right">
                      <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; border: 1px solid #f59e0b;">
                        PENDING ADMIN VERIFICATION
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding: 10px 24px 30px;">
                <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8;">
                  You will receive an automated confirmation email once Admin verifies your payment.
                </p>
                <a href="${appUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 26px; border-radius: 12px;">
                  Open Smash Club App
                </a>
              </td>
            </tr>

            <tr>
              <td style="background: #090e1a; padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">
                  Don Bosco Badminton Club &copy; 2026.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * HTML email template for Admin Alert when a player claims payment
 */
function createAdminClaimAlertHtml({ playerName, amount, mode, utr, date, notes }) {
  const appUrl = process.env.APP_URL || 'https://smash-club-app.vercel.app';
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Payment Claim - Don Bosco Smash Club</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #0b1120; padding: 25px 15px; color: #f8fafc;">
    <div style="max-width: 520px; margin: 0 auto; background: #131d33; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 24px; color: #fff; text-align: center;">
        <div style="font-size: 28px; margin-bottom: 6px;">🔔</div>
        <h2 style="margin: 0; font-size: 20px;">New Payment Claim Received</h2>
        <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">Don Bosco Smash Club Admin Alert</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; margin: 0 0 16px; color: #cbd5e1;">
          <strong>${playerName}</strong> submitted a payment claim of <strong style="color: #10b981; font-size: 17px;">₹${parseFloat(amount).toFixed(2)}</strong>.
        </p>
        <table width="100%" cellpadding="10" style="background: #0b1120; border: 1px solid #1e293b; border-radius: 10px; margin: 15px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #1e293b;"><td style="color: #94a3b8;">Player:</td><td style="color: #fff; font-weight: bold;">${playerName}</td></tr>
          <tr style="border-bottom: 1px solid #1e293b;"><td style="color: #94a3b8;">Amount:</td><td style="color: #10b981; font-weight: bold; font-size: 16px;">₹${parseFloat(amount).toFixed(2)}</td></tr>
          <tr style="border-bottom: 1px solid #1e293b;"><td style="color: #94a3b8;">Mode:</td><td style="color: #38bdf8;">${mode || 'UPI'}</td></tr>
          <tr style="border-bottom: 1px solid #1e293b;"><td style="color: #94a3b8;">UTR / Ref:</td><td style="color: #fff; font-family: monospace;">${utr || 'N/A'}</td></tr>
          <tr><td style="color: #94a3b8;">Notes:</td><td style="color: #cbd5e1;">${notes || 'None'}</td></tr>
        </table>
        <div style="text-align: center; margin-top: 25px;">
          <a href="${appUrl}" style="background: #10b981; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;">
            Open Dashboard to Verify & Approve
          </a>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Sends payment receipt email to player.
 */
async function sendPaymentReceiptEmail({ toEmail, playerName, amount, mode, utr, date, status, notes }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email Service] Skipping email: Credentials not set in .env');
    return { success: false, reason: 'Credentials not configured' };
  }

  const recipient = toEmail || process.env.ADMIN_EMAIL;
  if (!recipient) {
    console.log('[Email Service] Skipping: No recipient email address available');
    return { success: false, reason: 'No recipient email' };
  }

  const subject = `🏸 Payment Receipt: ₹${parseFloat(amount).toFixed(2)} Approved - Don Bosco Smash Club`;
  const html = createPaymentReceiptHtml({ playerName, amount, mode, utr, date, status, notes });

  try {
    const senderEmail = process.env.EMAIL_FROM || 'splitbadminton@gmail.com';
    const info = await transporter.sendMail({
      from: `"Don Bosco Smash Club" <${senderEmail}>`,
      to: recipient,
      subject,
      html
    });
    console.log(`[Email Service] Receipt email sent successfully to ${recipient}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send receipt email to ${recipient}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends rejection notification to player when admin rejects a claim.
 */
async function sendPaymentRejectedEmail({ toEmail, playerName, amount, mode, utr, date, reason }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email Service] Skipping email: Credentials not set in .env');
    return { success: false, reason: 'Credentials not configured' };
  }

  if (!toEmail) {
    console.log('[Email Service] Skipping: No recipient email for rejection notification');
    return { success: false, reason: 'No recipient email' };
  }

  const subject = `❌ Payment Claim Update: ₹${parseFloat(amount).toFixed(2)} - Don Bosco Smash Club`;
  const html = createPaymentRejectedHtml({ playerName, amount, mode, utr, date, reason });

  try {
    const senderEmail = process.env.EMAIL_FROM || 'splitbadminton@gmail.com';
    const info = await transporter.sendMail({
      from: `"Don Bosco Smash Club" <${senderEmail}>`,
      to: toEmail,
      subject,
      html
    });
    console.log(`[Email Service] Rejection email sent successfully to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send rejection email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends notification to player when claim is submitted.
 */
async function sendPaymentClaimSubmittedEmail({ toEmail, playerName, amount, mode, utr, date }) {
  const transporter = getTransporter();
  if (!transporter || !toEmail) return { success: false };

  const subject = `⏳ Payment Request Submitted: ₹${parseFloat(amount).toFixed(2)} - Don Bosco Smash Club`;
  const html = createPaymentClaimSubmittedHtml({ playerName, amount, mode, utr, date });

  try {
    const senderEmail = process.env.EMAIL_FROM || 'splitbadminton@gmail.com';
    const info = await transporter.sendMail({
      from: `"Don Bosco Smash Club" <${senderEmail}>`,
      to: toEmail,
      subject,
      html
    });
    console.log(`[Email Service] Claim confirmation email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send claim confirmation to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends notification email to admin when a player claims payment.
 */
async function sendAdminPaymentClaimNotification({ playerName, amount, mode, utr, date, notes }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email Service] Skipping admin alert: Credentials not set in .env');
    return { success: false, reason: 'Credentials not configured' };
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'phanidher12@gmail.com';

  const subject = `🔔 New Payment Claim: ₹${parseFloat(amount).toFixed(2)} from ${playerName} | Smash Club`;
  const html = createAdminClaimAlertHtml({ playerName, amount, mode, utr, date, notes });

  try {
    const senderEmail = process.env.EMAIL_FROM || 'splitbadminton@gmail.com';
    const info = await transporter.sendMail({
      from: `"Smash Club Alerts" <${senderEmail}>`,
      to: adminEmail,
      subject,
      html
    });
    console.log(`[Email Service] Admin notification sent to ${adminEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send admin alert:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPaymentReceiptEmail,
  sendPaymentRejectedEmail,
  sendPaymentClaimSubmittedEmail,
  sendAdminPaymentClaimNotification,
  getTransporter
};
