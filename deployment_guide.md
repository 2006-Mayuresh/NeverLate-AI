# Google Cloud Deployment Guide - NeverLate AI

This guide contains step-by-step instructions to deploy the **NeverLate AI** application to Google Cloud. Since this is a hackathon project, we have outlined the fastest and most efficient pathways to get the app online with minimal configuration.

---

## 🚀 Prerequisite: Install the Google Cloud SDK

Before deploying, ensure you have the Google Cloud SDK installed and configured on your machine:

1. **Download and Install**: Follow the instructions for your OS: [Google Cloud SDK Installation](https://cloud.google.com/sdk/docs/install).
2. **Initialize SDK**: Run the following command in your terminal to log in and select your active project:
   ```bash
   gcloud init
   ```
3. **Configure Project**: If you already have a project created:
   ```bash
   gcloud config set project <YOUR_PROJECT_ID>
   ```

---

## ⚓ Option 1: Google Cloud Run (Recommended & Serverless)

Google Cloud Run is a fully managed serverless platform that automatically scales containerized applications.

### Step 1: Ensure `Dockerfile` is Present
We have already created a `Dockerfile` in the root of your workspace configured for Node.js 24 and Vite/Express.

### Step 2: Deploy Container Instantly
Cloud Run supports source-based deployments which build your container directly using Google Cloud Build and deploy it:

```bash
gcloud run deploy neverlate-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_gemini_api_key,NODE_ENV=production"
```
*Replace `your_gemini_api_key` with your actual Google AI Studio/Gemini API key.*

### ⚠️ Note on SQLite Persistence on Cloud Run
Cloud Run containers are **stateless and ephemeral**. When the container scales down to 0 or restarts, any writes to the local SQLite database (`neverlate.db`) will be reset.
* **For the Hackathon**: If you just need a quick demo, the local database works fine for individual user testing sessions.
* **For Persistent Production**:
  * **Option A**: Mount a **Cloud Storage bucket** as a network volume using Cloud Run volume mounts (Cloud Storage FUSE). This mounts a GCS bucket onto `/usr/src/app` so that the `neverlate.db` file is read/written directly to Cloud Storage.
  * **Option B**: Transition to **Firestore** or **Cloud SQL (PostgreSQL/MySQL)** for database persistence. The codebase is organized cleanly under `src/services/localDb.ts` so switching out the database drivers requires editing only a single file!

---

## ⚡ Option 2: Google Compute Engine (Virtual Machine)

Deploying to a Compute Engine VM is the simplest way to maintain a **persistent SQLite database** without paying for managed databases. The database file sits directly on the VM's persistent disk.

### Step 1: Create a VM Instance
Run this command to spin up a lightweight Debian VM with Docker pre-installed:

```bash
gcloud compute instances create neverlate-vm \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --machine-type=e2-micro \
  --tags=http-server \
  --metadata=startup-script="sudo apt-get update && sudo apt-get install -y docker.io"
```

### Step 2: Allow HTTP traffic
Ensure the network tags allow port 80/4000 traffic:
```bash
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80,tcp:3000 \
  --target-tags=http-server
```

### Step 3: Copy Files and Build
1. Copy the code directory to the VM or clone your GitHub repository on the VM.
2. SSH into your VM:
   ```bash
   gcloud compute ssh neverlate-vm
   ```
3. Run the application using Docker on the VM to persist data locally:
   ```bash
   docker build -t neverlate-app .
   docker run -d -p 80:3000 -v neverlate_data:/usr/src/app --name neverlate-running -e GEMINI_API_KEY="your_api_key" neverlate-app
   ```
   *Note: Using a Docker Volume `-v neverlate_data:/usr/src/app` ensures the SQLite database persists even if the container stops.*

---

## 🔗 Option 3: Firebase Hosting & Functions (Firebase Stack)

Since Firebase is part of the Google Cloud ecosystem, you can deploy the React frontend to Firebase Hosting and the Node/Express backend to Cloud Functions.

### Step 1: Initialize Firebase
Install CLI and log in:
```bash
npm install -g firebase-tools
firebase login
firebase init
```
*Choose **Hosting** and **Functions** during initialization.*

### Step 2: Configure Rewrite Rules
In `firebase.json`, direct traffic matching `/api/**` to your Cloud Functions and serve static assets from the `dist` folder:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 3: Deploy
```bash
firebase deploy
```
