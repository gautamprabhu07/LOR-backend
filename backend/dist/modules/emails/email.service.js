import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { BadRequestError } from "../../core/errors/BadRequestError.js";
export const emailService = {
    /**
     * Fire-and-forget email sending
     * Never blocks API response
     */
    send: async (type, to, context) => {
        try {
            // Validate required fields per email type
            validateEmailContext(type, context);
            // Get transporter (lazy init)
            const transporter = await getTransporter();
            // Render email content
            const { subject, html } = renderTemplate(type, context);
            // Send async (fire-and-forget)
            transporter.sendMail({
                from: env.EMAIL_FROM,
                to,
                subject,
                html
            }).catch((err) => {
                // Log but don't crash
                console.error("Email delivery failed:", {
                    type,
                    to,
                    submissionId: context.submissionId,
                    error: err.message
                });
            });
        }
        catch (err) {
            // Log but never throw (non-blocking)
            console.error("Email service error:", {
                type,
                to,
                submissionId: context.submissionId,
                error: err instanceof Error ? err.message : "Unknown error"
            });
        }
    }
};
/**
 * Gmail SMTP transporter (free, reliable for lab servers)
 */
let transporter = null;
const getTransporter = async () => {
    if (transporter)
        return transporter;
    // Validate SMTP config
    if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
        throw new BadRequestError("SMTP configuration missing");
    }
    transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT),
        secure: false, // use STARTTLS
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS
        },
        pool: true, // connection pooling for scale
        maxConnections: 5,
        maxMessages: 100
    });
    // Test connection on first use
    await transporter.verify();
    console.log("✅ SMTP transporter ready");
    return transporter;
};
/**
 * Validate context per email type
 */
const validateEmailContext = (type, context) => {
    switch (type) {
        case "resubmission_requested":
        case "submission_rejected":
        case "draft_approved":
        case "lor_completed":
            if (!context.remarks) {
                throw new Error("Remarks required for status notifications");
            }
            break;
        case "faculty_pending_summary":
            if (!context.deadline) {
                throw new Error("Deadline required for pending summary");
            }
            break;
    }
};
/**
 * Render email templates (MIT-branded, professional)
 */
const renderTemplate = (type, context) => {
    const baseUrl = env.FRONTEND_URL || "http://localhost:5173";
    switch (type) {
        case "resubmission_requested":
            return {
                subject: "Resubmission Requested - LoR Request",
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #F16F20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #FEFEFE; padding: 30px; border-left: 4px solid #F16F20; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .button { background: #F16F20; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MIT Manipal - LoR Portal</h1>
  </div>
  <div class="content">
    <p>Dear <strong>${context.studentName}</strong>,</p>
    
    <p>Prof. <strong>${context.facultyName}</strong> has requested resubmission for your LoR request.</p>
    
    <p><strong>Remarks:</strong><br>${context.remarks}</p>
    
    <p><a href="${baseUrl}/student/requests/${context.submissionId}" class="button">View Request & Resubmit</a></p>
    
    <hr>
    <p>This is an automated message from MIT Manipal LoR Portal.</p>
  </div>
  <div class="footer">
    Manipal Institute of Technology | LoR Management System
  </div>
</body>
</html>`
            };
        case "submission_rejected":
            return {
                subject: "LoR Request Rejected",
                html: `
<!DOCTYPE html>
<html>
<head>...</head> <!-- Similar styling -->
<body>
  <div class="header">
    <h1>MIT Manipal - LoR Portal</h1>
  </div>
  <div class="content">
    <p>Dear <strong>${context.studentName}</strong>,</p>
    <p>Your LoR request has been <strong>rejected</strong> by Prof. <strong>${context.facultyName}</strong>.</p>
    <p><strong>Reason:</strong><br>${context.remarks}</p>
  </div>
</body>
</html>`
            };
        case "draft_approved":
            return {
                subject: "LoR Draft Approved ✅",
                html: `
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <div class="header">
    <h1>MIT Manipal - LoR Portal</h1>
  </div>
  <div class="content">
    <p>Dear <strong>${context.studentName}</strong>,</p>
    <p>Your LoR draft has been <strong>approved</strong> by Prof. <strong>${context.facultyName}</strong>.</p>
    <p>Final LoR will be uploaded soon.</p>
  </div>
</body>
</html>`
            };
        case "lor_completed":
            return {
                subject: "LoR Completed 🎓",
                html: `
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <div class="header">
    <h1>MIT Manipal - LoR Portal</h1>
  </div>
  <div class="content">
    <p>Dear <strong>${context.studentName}</strong>,</p>
    <p>Your LoR request is now <strong>completed</strong>! 🎉</p>
    <p>Prof. <strong>${context.facultyName}</strong> has finalized and submitted your recommendation.</p>
    <p><a href="${baseUrl}/student/requests/${context.submissionId}" class="button">Download Final LoR</a></p>
  </div>
</body>
</html>`
            };
        case "faculty_pending_summary":
            return {
                subject: `LoR Requests Pending - ${context.deadline?.toDateString()}`,
                html: `
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <div class="header">
    <h1>MIT Manipal - LoR Portal</h1>
  </div>
  <div class="content">
    <p>Dear Professor,</p>
    <p>You have <strong>pending LoR requests</strong> awaiting your review.</p>
    <p><a href="${baseUrl}/faculty/dashboard" class="button">Review Pending Requests</a></p>
  </div>
</body>
</html>`
            };
        default:
            throw new Error(`Unknown email type: ${type}`);
    }
};
