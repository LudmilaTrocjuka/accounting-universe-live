// /api/contact.js – Vercel Serverless Function (Node runtime)
// Sends form data to your email via SMTP using Nodemailer.
// Set these ENV VARS in Vercel Project Settings → Environment Variables:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TO_EMAIL, FROM_EMAIL
// Optional: MIN_SUBMIT_SECONDS (default 2), require the form to be open this long.

const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const { name, email, company, message, website, ts } = req.body || {};

    // Basic spam checks
    if (website) {
      return res.status(200).json({ ok: true, received: true }); // honeypot
    }
    const minSeconds = parseInt(process.env.MIN_SUBMIT_SECONDS || "2", 10);
    const now = Date.now();
    if (!ts || isNaN(Number(ts)) || now - Number(ts) < minSeconds * 1000) {
      return res.status(429).json({ ok: false, error: "Too fast. Please try again." });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465, // true for 465, false otherwise
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const toEmail = process.env.TO_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

    await transport.sendMail({
      from: `"Website Contact" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `New enquiry from ${name}${company ? " (" + company + ")" : ""}`,
      text: `Name: ${name}
Email: ${email}
Company: ${company || "-"}

Message:
${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Company:</strong> ${company || "-"}</p>
<p><strong>Message:</strong><br>${(message||"").replace(/\n/g,"<br>")}</p>`,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Failed to send email." });
  }
};
