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
import * as functions from "firebase-functions";
import type {Request, Response} from "express";

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
    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({
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

export const onUserRoleUpdate = onDocumentUpdated("users/{userId}", async (event) => {
  console.log("User role update function triggered");
  console.log("Document path:", event.data?.after?.ref?.path);

  try {
    // Check if Gmail credentials are configured
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error("Gmail credentials are not configured");
    }
    console.log("Gmail credentials verified");

    const beforeData = event.data?.before?.data() as UserData | undefined;
    const afterData = event.data?.after?.data() as UserData | undefined;

    console.log("Previous user data:", JSON.stringify(beforeData, null, 2));
    console.log("Updated user data:", JSON.stringify(afterData, null, 2));

    if (!beforeData || !afterData) {
      console.log("No data change detected");
      return;
    }

    // Check if role was changed from Pending to something else
    if (beforeData.role === "Pending" && afterData.role !== "Pending") {
      const roleChange = `Role changed from ${beforeData.role} to ${afterData.role}`;
      console.log(roleChange);

      const userEmail = afterData.email;
      if (!userEmail) {
        console.error("User email not found in data");
        return;
      }
      console.log("Preparing to send activation email to:", userEmail);

      // Get email template and send it
      const template = getActivationEmailTemplate(afterData);
      await sendEmail(userEmail, template);
      console.log("Activation email sending process completed");
    } else {
      const roleStatus = [
        "No relevant role change.",
        `Before: ${beforeData.role}`,
        `After: ${afterData.role}`,
      ].join(" ");
      console.log(roleStatus);
    }
  } catch (error) {
    console.error("Error in onUserRoleUpdate function:");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }
    throw error;
  }
});

// Function to handle user deletion
export const onUserDeleted = onDocumentUpdated("users/{userId}", async (event) => {
  try {
    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    // If document was deleted (exists before but not after)
    if (beforeSnapshot && !afterSnapshot) {
      const userId = event.params.userId;
      try {
        // Try to delete the user from Authentication
        await admin.auth().deleteUser(userId);
        console.log("User deleted from Auth:", userId);
      } catch (error) {
        // If error is user-not-found, that's okay - it means they were already deleted
        if (error && typeof error === "object" && "code" in error && error.code !== "auth/user-not-found") {
          console.error("Error deleting user from Auth:", error);
          // Don't throw here as the Firestore document is already deleted
          // Just log the error for monitoring
        }
      }
    }
  } catch (error) {
    console.error("Error in onUserDeleted function:", error);
    // Don't throw here as it would trigger a retry, and we don't want to retry
    // if the Firestore document is already deleted
  }
});

export const deleteUser = functions.https.onRequest(
  async (req: Request, res: Response) => {
    try {
      // Verify the request is authorized
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({error: "Unauthorized"});
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Get the admin user's role from Firestore
      const adminUserDoc = await admin.firestore()
        .collection("users")
        .doc(decodedToken.uid)
        .get();

      if (!adminUserDoc.exists) {
        res.status(403).json({error: "User not found"});
        return;
      }

      const adminUserData = adminUserDoc.data() as UserData;
      if (adminUserData.role !== "Admin") {
        res.status(403).json({error: "Forbidden: Only administrators can delete users"});
        return;
      }

      // Get the user ID to delete from the request body
      const {userId} = req.body;
      if (!userId) {
        res.status(400).json({error: "Missing userId in request body"});
        return;
      }

      try {
        // Delete the user from Authentication
        await admin.auth().deleteUser(userId);
        console.log("Successfully deleted user from Authentication:", userId);
        res.status(200).json({message: "User deleted successfully from Authentication"});
      } catch (error) {
        // If user doesn't exist in Authentication, that's okay
        if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
          console.warn("User not found in Authentication:", userId);
          res.status(200).json({message: "User was already deleted from Authentication"});
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error in deleteUser function:", error);
      const msg = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({error: msg});
    }
  }
);
