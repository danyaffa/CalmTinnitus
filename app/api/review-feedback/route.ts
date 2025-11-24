// FILE: app/api/review-feedback/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rating, comment, email, appName, toEmail } = body;

    const target = toEmail || process.env.FEEDBACK_TO_EMAIL;
    if (!target) {
      return NextResponse.json(
        { error: "No target email configured" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.FEEDBACK_SMTP_HOST,
      port: Number(process.env.FEEDBACK_SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.FEEDBACK_SMTP_USER,
        pass: process.env.FEEDBACK_SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"CalmTinnitus Feedback" <${process.env.FEEDBACK_SMTP_USER}>`,
      to: target,
      subject: `New feedback for ${appName || "CalmTinnitus"} – ${rating}★`,
      text: `
Rating: ${rating} / 5
From: ${email || "no email provided"}

Comment:
${comment || "(no comment)"}
      `.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email send error", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
