// test-smtp.ts (run once)
import nodemailer from "nodemailer";
import { env } from "./src/config/env";

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: false,
    auth: {
      user: env.SMTP_USER!,
      pass: env.SMTP_PASS!
    }
  });

  try {
    await transporter.verify();
    // Add after verify()
await transporter.sendMail({
  from: env.EMAIL_FROM!,
  to: "test@example.com",  // Your test email
  subject: "✅ LoR Backend SMTP Test",
  html: "<h1>Backend email working perfectly!</h1>"
});
console.log("✅ Test email sent!");

    console.log("✅ SMTP Connected Successfully!");
  } catch (err) {
    console.error("❌ SMTP Failed:", err);
  }
}

testSMTP();
