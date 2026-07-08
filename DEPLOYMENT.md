# 🌱 Kisan Alert Dashboard - Deployment Guide

This guide describes how to deploy the Kisan Alert Dashboard to production environments.

---

## 🏗️ Unified Production Deployment (Recommended)

You can run both the frontend and backend together as a single unified service. The Express backend is configured to serve the React + Vite static bundle from the `client/dist` directory when running in production.

This works on platforms like **Render**, **Railway**, **Heroku**, or any VPS.

### 📋 Prerequisites

Ensure you have the following environment variables ready for your deployment dashboard:

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Must be set to `production` to activate static serving | `production` |
| `PORT` | The port the server runs on (provided automatically by hosts) | `5000` |
| `JWT_SECRET` | Cryptographically secure random secret for JWT signing | `your-secret-here` |
| `GROQ_API_KEY` | API Key for Llama-3 summary generation (Required) | `gsk_...` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID (Backend; falls back to default) | `1037...apps.googleusercontent.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (Frontend; falls back to default) | `1037...apps.googleusercontent.com` |
| `WEATHER_API_KEY` | OpenWeather API key (Optional; falls back to Open-Meteo) | `f482...` |
| `NEWS_API_KEY` | NewsAPI key for localized crop news (Optional) | `43c9...` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS OTP (Optional) | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token (Optional) | `cc...` |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID (Optional) | `VA...` |

### 🚀 Deploying to Render (Web Service)

1. Connect your repository to **Render** and create a new **Web Service**.
2. Configure the following settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm start`
3. In **Advanced Settings**, add the environment variables listed above (make sure `NODE_ENV=production` is set).
4. Click **Deploy Web Service**.

The server will automatically:
- Run `npm install` on both backend and frontend.
- Build the client production assets.
- Detect if the SQLite database is empty on start and run the database seeder automatically.
- Serve the built client at your service's URL.

---

## ⚡ Split Deployment (Frontend on Vercel/Netlify + Backend on Render)

If you prefer to deploy the frontend to a serverless CDN (like Vercel/Netlify) and the backend separately:

### 1. Backend Service (e.g., Render)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Configure your backend environment variables (including CORS if your frontend is on a different domain, and `GOOGLE_CLIENT_ID`).

### 2. Frontend Service (e.g., Vercel / Netlify)
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - Add `VITE_API_URL` pointing to your deployed backend service (e.g., `https://kisan-alert-api.onrender.com`).
  - Add `VITE_GOOGLE_CLIENT_ID` with your Google OAuth Client ID (Optional; falls back to default).
