/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {MailService} from "@sendgrid/mail";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid
const sgMail = new MailService();

interface UserData {
  email: string;
  role: string;
  name?: string;
}

// Function to create a test user
export const createTestUser = onRequest(async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: "test@example.com",
      password: "testpassword123",
      displayName: "Test User",
    });

    // Add user to Firestore with Pending role
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email: "test@example.com",
      name: "Test User",
      role: "Pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      message: "Test user created successfully",
      userId: userRecord.uid,
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    res.status(500).json({error: "Failed to create test user"});
  }
});

export const onUserRoleUpdate = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    try {
      // Get SendGrid API key from Firebase config
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
      if (!SENDGRID_API_KEY) {
        throw new Error("SendGrid API key is not configured");
      }
      sgMail.setApiKey(SENDGRID_API_KEY);

      const beforeData = event.data?.before?.data() as UserData | undefined;
      const afterData = event.data?.after?.data() as UserData | undefined;

      if (!beforeData || !afterData) {
        console.log("No data change detected");
        return;
      }

      // Check if role was changed from Pending to something else
      if (beforeData.role === "Pending" && afterData.role !== "Pending") {
        const userEmail = afterData.email;
        const userName = afterData.name || "Valued Customer";
        if (!userEmail) {
          console.error("User email not found in data");
          return;
        }

        // Get role-specific access information
        let accessInfo = "";
        switch (afterData.role) {
        case "User - Price":
          accessInfo =
              "You have been granted access to view our full catalog " +
              "including pricing information.";
          break;
        case "User - No Price":
          accessInfo =
              "You have been granted access to view our catalog. To see " +
              "pricing information, please contact our sales team.";
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

        const msg = {
          to: userEmail,
          from: "ifaieq12@gmail.com",
          subject: "Welcome to CNB Carpets - Your Account is Activated!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;
              margin: 0 auto; padding: 20px;">
              <img src="https://cnb-web.vercel.app/cnb-web.png"
                alt="CNB Carpets Logo"
                style="max-width: 150px; margin-bottom: 20px;">
              
              <h1 style="color: #FB8A13; margin-bottom: 20px;">
                Welcome to CNB Carpets, ${userName}!
              </h1>
              
              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                Great news! Your account has been approved and activated. 🎉
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid
                #FB8A13; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #333;">
                  <strong>Your Access Level:</strong> ${afterData.role}<br>
                  ${accessInfo}
                </p>
              </div>

              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                You can now log in to the CNB Carpets platform using your email
                and password at:
                <a href="https://cnb-web.vercel.app/login"
                  style="color: #FB8A13; text-decoration: none;">
                  https://cnb-web.vercel.app/login
                </a>
              </p>

              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                If you have any questions or need assistance, please don't
                hesitate to contact our support team.
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

        await sgMail.send(msg);
        console.log("Activation email sent to:", userEmail);
      } else {
        console.log("No relevant role change detected");
      }
    } catch (error) {
      console.error("Error in onUserRoleUpdate function:", error);
      throw error; // Re-throw to ensure Firebase knows the function failed
    }
  }
);

// Function to handle user deletion
export const onUserDeleted = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    try {
      const beforeSnapshot = event.data?.before;
      const afterSnapshot = event.data?.after;

      // If document was deleted (exists before but not after)
      if (beforeSnapshot && !afterSnapshot) {
        const userId = event.params.userId;
        try {
          // Delete the user from Firebase Auth
          await admin.auth().deleteUser(userId);
          console.log("User deleted from Auth:", userId);
        } catch (error) {
          console.error("Error deleting user from Auth:", error);
          // Don't throw here as the Firestore document is already deleted
        }
      }
    } catch (error) {
      console.error("Error in onUserDeleted function:", error);
      throw error;
    }
  }
);
