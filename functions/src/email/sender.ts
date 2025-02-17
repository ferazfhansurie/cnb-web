import * as nodemailer from "nodemailer";
import {EmailTemplate} from "./templates";

// Create a transporter using Gmail
const createTransporter = () => {
  console.log("Creating email transporter with configured Gmail account");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
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
    // Verify Gmail credentials exist
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error("Gmail credentials are not configured");
    }
    console.log("Gmail credentials verified");

    const transporter = createTransporter();
    console.log("Email transporter created successfully");

    // Verify transporter connection
    await transporter.verify();
    console.log("Email transporter connection verified");

    const result = await transporter.sendMail({
      from: GMAIL_USER,
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
