// FILE: app/api/review-feedback/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    // 1. Parse the JSON body (App Router specific)
    const body = await req.json();
    const { rating, comment, email, appName, toEmail } = body;

    // 2. Validate Environment Variables
    const smtpUser = process.env.FEEDBACK_SMTP_USER;
    const smtpPass = process.env.FEEDBACK_SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.error("Missing SMTP environment variables");
      return NextResponse.json(
        { error: "Server configuration error: SMTP missing" },
        { status: 500 }
      );
    }

    // 3. Determine Target Email
    // Use the prop passed from the widget, or fall back to your email
    const target = toEmail || "leffleryd@gmail.com";

    // 4. Configure Gmail Transporter
    // We use 'service: gmail' as it worked for your other app
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // 5. Send the Email
    await transporter.sendMail({
      from: `"CalmTinnitus Bot" <${smtpUser}>`,
      to: target,
      subject: `New feedback for ${appName || "CalmTinnitus"} – ${rating}★`,
      text: `
Rating: ${rating} / 5
User Email: ${email || "not provided"}
--------------------------------
Comment:
${comment || "(no comment)"}
      `.trim(),
    });

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: "Failed to send email: " + err.message },
      { status: 500 }
    );
  }
}
