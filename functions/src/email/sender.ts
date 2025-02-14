import * as nodemailer from "nodemailer";
import {EmailTemplate} from "./templates";

// Create a transporter using Gmail
const createTransporter = () => {
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
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
