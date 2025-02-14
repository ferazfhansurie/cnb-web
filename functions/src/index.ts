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
import {UserData} from "./types";
import {getActivationEmailTemplate} from "./email/templates";
import {sendEmail} from "./email/sender";

// Initialize Firebase Admin
admin.initializeApp();

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
      // Check if Gmail credentials are configured
      const GMAIL_USER = process.env.GMAIL_USER;
      const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
      if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        throw new Error("Gmail credentials are not configured");
      }

      const beforeData = event.data?.before?.data() as UserData | undefined;
      const afterData = event.data?.after?.data() as UserData | undefined;

      if (!beforeData || !afterData) {
        console.log("No data change detected");
        return;
      }

      // Check if role was changed from Pending to something else
      if (beforeData.role === "Pending" && afterData.role !== "Pending") {
        const userEmail = afterData.email;
        if (!userEmail) {
          console.error("User email not found in data");
          return;
        }

        // Get email template
        const template = getActivationEmailTemplate(afterData);

        // Send email
        await sendEmail(userEmail, template);
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
