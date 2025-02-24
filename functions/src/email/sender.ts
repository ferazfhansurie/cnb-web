import * as nodemailer from "nodemailer";
import {EmailTemplate} from "./templates";
import {defineString} from "firebase-functions/params";

// Define environment variables
const mailServerHost = defineString("MAIL_SERVER_HOST", {default: "mail.cnbcarpets.com"});
const mailServerUser = defineString("MAIL_SERVER_USER");
const mailServerPassword = defineString("MAIL_SERVER_PASSWORD");

// Create a transporter using SMTP
const createTransporter = () => {
  console.log("Creating email transporter with SMTP configuration");
  const transporter = nodemailer.createTransport({
    host: mailServerHost.value(),
    port: 587, // Common SMTP port for TLS
    secure: false, // true for 465, false for other ports
    auth: {
      user: mailServerUser.value(),
      pass: mailServerPassword.value(),
    },
  });
  return transporter;
};

export const sendEmail = async (
  to: string,
  template: EmailTemplate
): Promise<void> => {
  console.log("Starting email send process...");
  console.log("Recipient:", to);
  console.log("Email subject:", template.subject);

  try {
    // Verify SMTP credentials exist
    const SMTP_USER = mailServerUser.value();
    const SMTP_PASSWORD = mailServerPassword.value();

    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error("SMTP credentials missing:", {
        user: Boolean(SMTP_USER),
        password: Boolean(SMTP_PASSWORD),
      });
      throw new Error("SMTP credentials are not configured");
    }
    console.log("SMTP credentials verified");

    const transporter = createTransporter();
    console.log("Email transporter created successfully");

    // Verify transporter connection
    await transporter.verify();
    console.log("Email transporter connection verified");

    const result = await transporter.sendMail({
      from: SMTP_USER,
      to,
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully");
    console.log("Message ID:", result.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(result));
    console.log("Full send result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error details in email sending process:");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }
    throw error;
  }
};
