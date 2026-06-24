# Chitkara Full Stack Engineering Challenge - Hierarchy Analyzer

A production-ready Full Stack application built to solve the Chitkara Engineering Challenge. The project features a Node.js/Express backend that parses node relationships, resolves multi-parents (first-wins), detects cycles, and calculates tree depths, paired with a premium, responsive glassmorphic React/Vite single-page frontend.

---

## 📂 Project Structure

```text
├── backend/            # Express API Server
│   ├── routes/
│   │   └── bfhl.js     # Graph processing logic
│   ├── .env            # Environment config (UserID, Email, RollNo)
│   ├── server.js       # App entry point
│   ├── validate_api.js # Automated API logic test script
│   └── package.json
│
└── frontend/           # React Single Page App
    ├── src/
    │   ├── App.jsx     # Dashboard component & recursive visualizer
    │   ├── index.css   # HSL custom color styling & typography
    │   └── main.jsx    # React bootstrap
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Deployment Guide

### 1. Deploy the Backend to [Render](https://render.com)

1. Sign up/log in to **Render** and click **New +** > **Web Service**.
2. Connect your GitHub repository containing this project.
3. Configure the Web Service with the following details:
   - **Name**: `hierarchy-analyzer-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under the **Environment Variables** section, add your credentials:
   - `USER_ID` = `your_fullname_ddmmyyyy` (e.g. `johndoe_17091999`)
   - `EMAIL_ID` = `your_college_email@college.edu`
   - `COLLEGE_ROLL_NUMBER` = `your_roll_number`
5. Click **Deploy Web Service**. Once deployed, copy your backend URL (e.g. `https://hierarchy-analyzer-backend.onrender.com`).

---

### 2. Deploy the Frontend to [Vercel](https://vercel.com)

1. Sign up/log in to **Vercel** and click **Add New** > **Project**.
2. Select your GitHub repository.
3. In the project settings configuration:
   - **Root Directory**: Select `frontend` (Vercel will auto-detect Vite as the framework and configure building to the `dist` folder).
4. Expand the **Environment Variables** section and add:
   - Name: `VITE_API_URL`
   - Value: `https://hierarchy-analyzer-backend.onrender.com` (use the backend URL copied from Render in step 1).
5. Click **Deploy**. Vercel will build and host your frontend web app.

---

## 💻 Local Development

### Prerequisites
- Node.js installed locally.

### Step 1: Run the Backend
```bash
cd backend
npm install
npm start
```
*The server will run on `http://localhost:5000`.*

### Step 2: Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*The React app will launch on `http://localhost:3000`.*
