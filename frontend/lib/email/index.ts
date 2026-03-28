import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendLoginEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("Email credentials not configured, skipping login email");
    return;
  }

  const now = new Date();
  const formattedDate = now.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  try {
    await transporter.sendMail({
      from: `"ReddiChat" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: "New login to your ReddiChat account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF4500;">Hi ${userName}!</h2>
          <p>We noticed a new login to your ReddiChat account.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Time:</strong> ${formattedDate}</p>
          </div>
          <p>If this was you, no action is needed.</p>
          <p>If you didn't log in, please secure your account immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from <a href="https://reddichat.manishsingh.tech">ReddiChat</a>
          </p>
        </div>
      `,
    });
    console.log(`Login email sent to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send login email:", error);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactEmail(
  fromUserEmail: string,
  subject: string,
  message: string
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("Email credentials not configured");
  }

  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const safeEmail = escapeHtml(fromUserEmail);

  await transporter.sendMail({
    from: `"ReddiChat" <${process.env.SMTP_USER}>`,
    to: "manishsparihar2020@gmail.com",
    replyTo: fromUserEmail,
    subject: `[ReddiChat Contact] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF4500;">New Contact Message</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${safeEmail}</p>
          <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${safeSubject}</p>
        </div>
        <div style="background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; line-height: 1.6;">${safeMessage}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Sent via <a href="https://reddichat.manishsingh.tech">ReddiChat</a> contact form
        </p>
      </div>
    `,
  });
}
