# ScannBizz: Futuristic Point of Sale (POS)

ScannBizz is a modern, intelligent Point of Sale (POS) web application designed for small businesses. It provides a comprehensive solution for managing stock, tracking sales, and gaining intelligent insights into business operations through a stunning, futuristic user interface.

## Features

- **Futuristic UI/UX:** A beautiful dark-theme interface with glassmorphic effects and fluid animations.
- **Stock Management:** Full CRUD (Create, Read, Update, Delete) functionality for products.
- **POS Interface:** A streamlined "Sell" page with barcode scanning and a live receipt.
- **AI-Powered Analytics:** Generate sales summaries and insights using the Google Gemini API.
- **PDF Export:** Create and download professional PDF reports of your analytics.
- **Customer Management:** A mini-CRM to track customer information and purchase history.
- **Secure Authentication:** Robust user login and PIN-based quick access.
- **Serverless Backend:** Powered by Netlify Functions for secure and scalable database operations.

## Tech Stack

- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Netlify Functions
- **Database:** Google Firebase (Firestore)
- **AI Integration:** Google Gemini API
- **Routing:** `react-router-dom`
- **Animations:** `framer-motion`
- **Barcode Scanning:** `html5-qrcode`

---

## Setup and Deployment Guide

This guide will walk you through setting up the project locally, putting it on GitHub, and deploying it to Netlify.

### Part A: Firebase Setup

This project uses Google Firebase for its database. You'll need to create a project first.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the on-screen instructions to create a new project.

2.  **Enable Services:**
    *   In your new project's dashboard, go to the "Build" section in the left sidebar.
    *   Enable **Firestore Database** (start in production mode).
    *   Enable **Authentication** (enable the Email/Password sign-in method).

3.  **Get Admin SDK Credentials (for Netlify Function):**
    *   In Project Settings, go to the "Service accounts" tab.
    *   Click "Generate new private key". A JSON file will be downloaded.
    *   **Treat this file like a password! Do not commit it to GitHub.** You will need the `projectId`, `clientEmail`, and `privateKey` from this file for your Netlify environment variables later.

### Part B: Beginner's Guide to Git & GitHub

To deploy to Netlify, your code must live in a GitHub repository.

1.  **Initialize Git:** In your project's root folder, initialize a Git repository.
    ```bash
    git init -b main
    git add .
    git commit -m "Initial commit: ScannBizz project setup"
    ```

2.  **Create a GitHub Repository:**
    *   Go to [GitHub](https://github.com) and create a new, empty repository. Do **not** initialize it with a README file.
    *   Name it `scannbizz` or a name of your choice.

3.  **Link and Push Your Code:**
    *   On your new GitHub repository's page, copy the commands to "push an existing repository from the command line". It will look like this:
    ```bash
    # Replace the URL with your repository's unique URL
    git remote add origin https://github.com/YOUR_USERNAME/scannbizz.git
    git push -u origin main
    ```
    Your code is now on GitHub, ready for the next steps.

### Part C: Running Locally

This project runs directly in the browser without a build step.

1.  **Install a Local Server:**
    You need a simple local server to run the `index.html` file. A great lightweight option is `serve`.
    ```bash
    # Install the server globally (you only need to do this once)
    npm install -g serve
    ```

2.  **Run the Project:**
    From your project's root directory, run:
    ```bash
    serve
    ```
    This will start a local server. You can open the provided URL (e.g., `http://localhost:3000`) in your browser. The app will run, but the Netlify function for processing sales will only work once deployed.

### Part D: Deployment to Netlify

This is the recommended way to run the application, as it enables the serverless backend function.

1.  **Create a New Site on Netlify:**
    *   Log in to your Netlify account.
    *   Click **"Add new site"** > **"Import an existing project"**.
    *   Connect to GitHub and select your `scannbizz` repository.

2.  **Configure Build Settings:**
    Since this project runs without a build step, the settings are simple:
    *   **Build command:** Leave this blank.
    *   **Publish directory:** Leave this as the base directory (Netlify will show the project name, which is correct).
    *   Netlify will automatically detect the `netlify/functions` directory.

3.  **Add Environment Variables (Crucial!):**
    *   Go to your new site's settings: **Site settings > Build & deploy > Environment**.
    *   Click **"Edit variables"** and add the following, using the credentials from your Firebase service account JSON file.
    *   `FIREBASE_PROJECT_ID`: Your project ID.
    *   `FIREBASE_CLIENT_EMAIL`: The `client_email`.
    *   `FIREBASE_PRIVATE_KEY`: Copy the entire `private_key` string, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts.

4.  **Deploy:**
    *   Click the **"Deploy site"** button. Netlify will deploy your static files and your serverless function. Congratulations, you're live!

---

## Project Structure

```
/
├── README.md
├── index.html         # Main HTML entry point with import maps
├── metadata.json      # App metadata
├── netlify/
│   └── functions/
│       └── processSale.ts # Serverless function for sales
├── index.tsx          # Main React render entry
├── App.tsx            # Root component with routing
├── types.ts           # Shared TypeScript types
├── context/
│   └── AppContext.tsx   # Global state management
├── components/        # Reusable React components
├── pages/             # Page-level components
└── services/
    └── geminiService.ts # Service for Gemini API
```