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
import * as functions from "firebase-functions";
import {UserData} from "./types";
import {getActivationEmailTemplate} from "./email/templates";
import {sendEmail} from "./email/sender";
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

    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: "testpassword123",
      displayName: "Test User",
    });

    // Add user to Firestore with Pending role
    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        email: testEmail,
        name: "Test User",
        role: "Pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.status(200).json({
      message: "Test user created successfully",
      userId: userRecord.uid,
      email: testEmail,
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

// Remove the old onUserDeleted trigger since we're handling deletion differently now
// Function to handle user deletion
export const deleteUserFunction = functions.https.onRequest(
  async (req: Request, res: Response) => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Verify the request is authorized
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Get the admin user's role from Firestore
      const adminUserDoc = await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!adminUserDoc.exists) {
        res.status(403).json({ error: 'User not found' });
        return;
      }

      const adminUserData = adminUserDoc.data() as UserData;
      if (adminUserData.role !== 'Admin') {
        res.status(403).json({ error: 'Forbidden: Only administrators can delete users' });
        return;
      }

      // Get the user ID to delete from the request body
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: 'Missing userId in request body' });
        return;
      }

      // Delete the user from Authentication
      await admin.auth().deleteUser(userId);
      
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error in deleteUserFunction:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string };
        if (authError.code === 'auth/user-not-found') {
          res.status(404).json({ error: 'User not found in Authentication' });
          return;
        }
      }
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

// Temporary function to test role update
export const updateTestUserRole = onRequest(async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({error: "Missing userId query parameter"});
      return;
    }

    await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .update({
        role: "User - Price",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.status(200).json({message: "User role updated successfully"});
  } catch (error) {
    console.error("Error updating test user role:", error);
    res.status(500).json({error: "Failed to update user role"});
  }
});
