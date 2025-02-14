import {UserData} from "../types";

export interface EmailTemplate {
  subject: string;
  html: string;
}

export const getActivationEmailTemplate = (
  userData: UserData
): EmailTemplate => {
  // Get role-specific access information
  let accessInfo = "";
  switch (userData.role) {
  case "User - Price":
    accessInfo =
      "You have been granted access to view our full catalog " +
      "including pricing information.";
    break;
  case "User - No Price":
    accessInfo =
      "You have been granted access to view our catalog. " +
      "To see pricing information, please contact our sales team.";
    break;
  case "Manager":
    accessInfo =
      "You have been granted manager access with additional " +
      "privileges to manage orders and view analytics.";
    break;
  case "Admin":
    accessInfo = "You have been granted full administrative access.";
    break;
  default:
    accessInfo = "You have been granted access to our platform.";
  }

  const userName = userData.name || "Valued Customer";

  return {
    subject: "Welcome to CNB Carpets - Your Account is Activated!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; 
        margin: 0 auto; padding: 20px;">
        <img 
          src="https://cnb-web.vercel.app/cnb-web.png" 
          alt="CNB Carpets Logo" 
          style="max-width: 150px; margin-bottom: 20px;"
        >
        
        <h1 style="color: #FB8A13; margin-bottom: 20px;">
          Welcome to CNB Carpets, ${userName}!
        </h1>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Great news! Your account has been approved and activated. 🎉
        </p>

        <div style="background-color: #f8f9fa; border-left: 4px solid #FB8A13; 
          padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #333;">
            <strong>Your Access Level:</strong> ${userData.role}<br>
            ${accessInfo}
          </p>
        </div>

        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          You can now log in to the CNB Carpets platform using your email and 
          password at:
          <a 
            href="https://cnb-web.vercel.app/login" 
            style="color: #FB8A13; text-decoration: none;"
          >
            https://cnb-web.vercel.app/login
          </a>
        </p>

        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          If you have any questions or need assistance, please don't hesitate 
          to contact our support team.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; 
          border-top: 1px solid #eee;">
          <p style="color: #666;">
            Best regards,<br>
            The CNB Carpets Team
          </p>
        </div>
      </div>
    `,
  };
};
