# Firebase Setup Guide

This document outlines the steps to configure the Firebase backend for this application from scratch.

## Step 1: Firebase Project Prerequisites

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Create a Web App:** Inside your project, create a new "Web" application. This will provide you with the configuration values needed for the environment variables.
3.  **Enable Firestore:**
    *   Go to the "Firestore Database" section in the console.
    *   Click "Create database".
    *   Choose your location and start in **production mode**.
    *   **Note:** If you skip this step, the Firebase CLI may automatically create the database for you during the first deployment, but it's good practice to do it manually first.

## Step 2: Environment Variables

1.  In the root of this project, create a file named `.env.local`.
2.  Add the following content to it, replacing the placeholder values with the actual credentials from your Firebase project's web app settings:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

## Step 3: Install and Configure the Firebase CLI

1.  **Install CLI:** If you don't have it, install the Firebase Command Line Interface globally.
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login:** Authenticate the CLI with your Google account. This will open a browser window.
    ```bash
    firebase login
    ```

## Step 4: Create Local Firebase Configuration

1.  **Create Directory:** Create a `firebase` directory in the project root to hold your configuration.
    ```bash
    mkdir firebase
    ```

2.  **Create Rules File:** Create a file at `firebase/firestore.rules` with the following security rules:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Users can read and write their own user document
        match /users/{userId} {
          allow read, write: if request.auth.uid == userId;
        }

        // Logged-in users can read groups they are members of
        match /groups/{groupId} {
          allow read: if request.auth.uid in resource.data.members;
          allow create: if request.auth.uid in request.resource.data.members;
          allow update, delete: if request.auth.uid in resource.data.members;
        }

        // Logged-in users can manage expenses for groups they are a member of.
        match /expenses/{expenseId} {
          allow read, create, update, delete: if get(/databases/$(database)/documents/groups/$(resource.data.groupId)).data.members.hasAny([request.auth.uid]);
        }
      }
    }
    ```

3.  **Create CLI Config:** Create a file at `firebase/firebase.json` to tell the CLI where to find the rules.
    ```json
    {
      "firestore": {
        "rules": "firestore.rules"
      }
    }
    ```

## Step 5: Deploy Security Rules

1.  Navigate into the `firebase` directory and run the deploy command, replacing `your-project-id` with your actual Firebase Project ID.
    ```bash
    cd firebase
    firebase deploy --only firestore:rules --project your-project-id
    ```

## Step 6: Firestore Indexes (Optional)

The application's query to find groups for a user (`where('members', 'array-contains', ...)`) is a query that sometimes requires a custom index.

However, Firestore now handles these simple single-field indexes automatically. The deploy command failed when we tried to create one because it was **not necessary**.

If you add more complex queries in the future (e.g., sorting by one field while filtering by another), you may need to create a composite index. You would do this by:

1.  Creating a `firebase/firestore.indexes.json` file.
2.  Defining your indexes in that file.
3.  Updating `firebase/firebase.json` to point to it:
    ```json
    {
      "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json" // Add this line
      }
    }
    ```
4.  Deploying the indexes:
    ```bash
    firebase deploy --only firestore:indexes --project your-project-id
    ```

After completing these steps, your application will be fully configured to communicate with your Firebase backend.
