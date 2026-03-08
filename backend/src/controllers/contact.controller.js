// backend/src/controllers/contact.controller.js
// Handles contact form submissions - delivers to Telegram + Email simultaneously

import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;  // From BotFather
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;      // Your personal chat ID
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;             // pearlvb08@gmail.com
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;   // Gmail App Password

// ── Send to Telegram ──────────────────────────────────────────────────────────
async function sendTelegram(name, email, message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️  Telegram not configured - skipping');
    return { success: false, reason: 'not_configured' };
  }

  const text = `🔔 *New IVey Support Message*\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n\n💬 *Message:*\n${message}\n\n_Reply to them at: ${email}_`;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log('✅ Telegram message sent');
      return { success: true };
    } else {
      console.error('❌ Telegram send failed:', data.description);
      return { success: false, reason: data.description };
    }
  } catch (err) {
    console.error('❌ Telegram error:', err.message);
    return { success: false, reason: err.message };
  }
}

// ── Send Email via Gmail + Nodemailer ─────────────────────────────────────────
async function sendEmail(name, email, message) {
  if (!SUPPORT_EMAIL || !GMAIL_APP_PASSWORD) {
    console.warn('⚠️  Email not configured - skipping');
    return { success: false, reason: 'not_configured' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SUPPORT_EMAIL,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"IVey Support" <${SUPPORT_EMAIL}>`,
    to: SUPPORT_EMAIL,
    replyTo: email,
    subject: `💬 New Support Message from ${name} — IVey`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">⚡ New IVey Support Message</h2>
        </div>
        <div style="background: white; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; width: 30%;">
                <strong style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Name</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px;">
                ${name}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                <strong style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Email</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                <a href="mailto:${email}" style="color: #f97316; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 0; vertical-align: top;">
                <strong style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Message</strong>
              </td>
              <td style="padding: 16px 0; color: #334155; font-size: 15px; line-height: 1.6;">
                ${message.replace(/\n/g, '<br/>')}
              </td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #fff7ed; border-radius: 8px; border-left: 4px solid #f97316;">
            <p style="margin: 0; color: #9a3412; font-size: 13px;">
              💡 <strong>To reply:</strong> Simply hit Reply in your email client — it goes directly to ${email}
            </p>
          </div>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">IVey Platform • Sent ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to', SUPPORT_EMAIL);
    return { success: true };
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return { success: false, reason: err.message };
  }
}

// ── Main controller ───────────────────────────────────────────────────────────
export const sendContactMessage = async (req, res) => {
  const { name, email, message } = req.body;

  // Validate
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (message.trim().length < 10) {
    return res.status(400).json({ error: 'Message is too short.' });
  }

  console.log(`📩 Contact form: ${name} <${email}>`);

  // Send both simultaneously
  const [telegramResult, emailResult] = await Promise.allSettled([
    sendTelegram(name.trim(), email.trim(), message.trim()),
    sendEmail(name.trim(), email.trim(), message.trim()),
  ]);

  const telegramSent = telegramResult.status === 'fulfilled' && telegramResult.value?.success;
  const emailSent = emailResult.status === 'fulfilled' && emailResult.value?.success;

  if (!telegramSent && !emailSent) {
    console.error('❌ Both delivery methods failed');
    return res.status(500).json({
      error: 'Failed to send your message. Please try again or contact us directly.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Your message has been sent! We\'ll get back to you soon.',
    delivered: {
      telegram: telegramSent,
      email: emailSent,
    },
  });
};