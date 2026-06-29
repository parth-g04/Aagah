# 🌱 Kisan Alert Dashboard - Engineering & Implementation Summary

This document provides a comprehensive summary of the work completed so far on the **Kisan Alert Dashboard** project. It is structured to allow any team member or stakeholder to quickly understand the architecture, database schema, API routes, frontend layout, and design system without needing to read all source code files individually.

---

## 1. Project Overview & Scope

**Kisan Alert** is an agricultural monitoring and distress tracking dashboard built specifically for government stakeholders (MPs, District Officers, and Field Admins) in the Anantapur district, Andhra Pradesh.

### Core Design Principle
* **No Individual Surveillance:** The system tracks **aggregate block and mandal-level distress signals** (rainfall deficit, soil moisture, and market price drop). It never stores or displays names, contact information, or personal risk profiles of individual farmers. It acts as an infrastructure tool to answer: *"Where do we send help fastest?"*

---

## 2. Technology Stack

| Layer | Technology Used | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React (Vite, plain JSX) | Fast development, modular UI state components, single-page application experience. |
| **Routing** | React Router DOM v6 | Handles declarative client-side route guards for different roles (`mp` and `officer`). |
| **State** | React Context + `useReducer` | Provides lightweight, centralized authentication and user session state management without Redux. |
| **Styling** | Vanilla CSS + JS Tokens | Custom inline styling built around a precise theme token system matching the design specification. |
| **Backend** | Node.js + Express.js | Lightweight and asynchronous server for REST API implementation. |
| **Database** | SQLite (`node:sqlite`'s `DatabaseSync`) | Zero-config, single-file relational database embedded directly in Node.js for simplicity and reliability. |
| **Security** | JSON Web Tokens (JWT) + bcryptjs | Stateless session authentication and secure hashing of OTP verification logs. |

---

## 3. Database Architecture (SQLite Schema)

The database (`server/db.js`) is implemented using Node's native synchronous SQLite module (`DatabaseSync`). It defines six core tables:

1. **`users`**: Manages registered users, their roles, and OTP lockout states.
   * `role`: Enum (`'mp'`, `'officer'`, `'admin'`).
   * `otp_attempts`, `otp_lock_until`: Tracks consecutive failed logins (lockout after 3 strikes).
2. **`otp_logs`**: Stores bcrypt hashes of generated OTP codes, their expirations, and active use status.
3. **`districts`**: High-level regional aggregates (e.g., Anantapur).
   * `alert_level`: Overall alert status (`'green'`, `'yellow'`, `'red'`) aggregated from child blocks.
4. **`blocks`**: Sub-district agricultural zones (e.g., Kalyandurg, Rayadurg, Uravakonda).
   * Metrics tracked: `rainfall_deficit_pct`, `mandi_price_drop_pct`, `soil_moisture_pct`, `rainfall_mm`.
   * Stress levels: `stress_index` (0-100) and `stress_history` (JSON array of last 7 stress levels for trend line rendering).
5. **`alerts`**: Active issues logged by officers.
   * `type`: Enum (`'pest'`, `'drought'`, `'flood'`, `'disease'`, `'weather'`).
   * `severity`: Enum (`'low'`, `'medium'`, `'high'`).
   * `status`: Enum (`'open'`, `'monitoring'`, `'resolved'`).
6. **`interventions`**: Relief resources deployed to specific blocks.
   * `status`: Enum (`'scheduled'`, `'active'`, `'completed'`).
   * `resources_deployed`, `notes`, `created_by`, `created_at`.

---

## 4. Backend REST API Endpoints

All endpoints (except login routes) are protected and require a `Authorization: Bearer <JWT_token>` header. Role guards restrict access to designated operations.

### A. Authentication Router (`server/routes/auth.js`)
* **`POST /api/auth/send-otp`**: Look up active user phone number $\rightarrow$ rate limit requests (1 per 20 seconds) $\rightarrow$ generate 6-digit OTP $\rightarrow$ log to console (in development) and write hash to `otp_logs`.
* **`POST /api/auth/verify-otp`**: Compare OTP input with active code hashes. Resets login lock on success and issues a 12-hour signed JWT. Handles a 15-minute lockout on 3 consecutive failures. Supports bypass code (`246800`) in `DEMO_MODE`.
* **`POST /api/auth/google`**: Secure Google OAuth validation. Fetches token details from Google's `tokeninfo` endpoint, validates client ID audience, maps authenticated Google users to mock developer/officer profiles, and issues a standard JWT.
* **`POST /api/auth/logout`**: Clears sessions (stateless).

### B. MP Router (`server/routes/mp.js`)
* **`GET /api/mp/summary`**: Computes macro statistics for the district: weekly interventions count, newly stressed blocks (crossing threshold of $\ge 75$ stress), and generates an automated headline summary based on current data.
* **`GET /api/mp/blocks`**: Retrieves all blocks ordered by stress level descending for MP review.

### C. Officer Router (`server/routes/officer.js`)
* **`GET /api/officer/blocks`**: Fetches all blocks inside the officer's designated district, along with active intervention counts, sorted by stress level descending.

### D. Blocks Router (`server/routes/blocks.js`)
* **`GET /api/blocks/:id`**: Returns block metrics, JSON-parsed historical stress trends, and list feeds for both its alerts and interventions.

### E. Alerts Router (`server/routes/alerts.js`)
* **`GET /api/alerts`**: Lists alerts (filterable by block or status).
* **`POST /api/alerts`**: Logs a new block alert. Recalculates block alert level (sets block status to `red` if any alert is `high` severity, else `yellow`).
* **`PATCH /api/alerts/:id`**: Modifies alert status (e.g. `'resolved'`). Triggers block alert level update.

### F. Interventions Router (`server/routes/interventions.js`)
* **`GET /api/interventions`**: Lists interventions (searchable by text, filterable by status/block).
* **`POST /api/interventions`**: Logs a new intervention. In an SQLite transaction, automatically improves the block's current stress level (decreased by 8 index points), logs history, and updates the district's overall alert state.
* **`PATCH /api/interventions/:id`**: Updates status. When marked `'completed'`, applies an additional stress recovery bonus (decreases stress index by 5 points) and updates the district alert level.

---

## 5. Frontend Pages & Components (`client/src`)

The client application utilizes modular views and strict role separation:

### Views & Pages (`client/src/pages/`)
1. **`SplashPage`**: Entry screen displaying branding and leading into the dashboard login.
2. **`LoginPage`**: Implements custom inputs for 10-digit phone verification. Includes Google One-Tap SDK integration to verify and sign in with Google accounts directly.
3. **`OTPPage`**: 6-cell verification code screen. Handles paste behavior, auto-focus forward/back, shaking error animations, and resend count-down.
4. **`MPOverviewPage`**: Features the automated weekly headline card, high-level metrics cards, and a listing of blocks in the district.
5. **`OfficerOverviewPage`**: Distributes block lists containing soil moisture and rainfall metrics, Sparkline trend charts, active alerts, and buttons for new actions.
6. **`BlockDetailPage`**: Metric charts (soil, rainfall, market drops), alert feed, and forms to instantly post new alerts or interventions.
7. **`InterventionsPage`**: Unified control center displaying all interventions with text search and status update controls.

### Shared UI Components (`client/src/components/shared/`)
* **`AlertBadge`**: Color-coded indicator corresponding to low/moderate/high distress levels.
* **`Sparkline`**: Lightweight SVG line chart that draws block stress history over the last 7 inspections.
* **`StatCard`**: Clean container representing numerical variables with trend indicators.
* **`Table`**: Data table wrapper with custom columns, sorting, and inline event triggers.
* **`ErrorBanner`**: Toast-like banner displaying network or authorization errors with retry options.

---

## 6. Custom Design System & Tokens (`client/src/styles/tokens.js`)

In alignment with the government corporate specifications, the app features a flat, high-contrast, shadow-free UI resembling paper layouts:

* **Colors**:
  * **Soil Brown (`#5C4033`)**: Primary brand identity, sidebar headers, main text.
  * **Turmeric (`#D98E2F`)**: Interactive actions, focus rings, hover indicators.
  * **Rice-Paddy Green (`#3D7A4D`)**: Low distress / resolved metrics / successful outcomes.
  * **Clay Red (`#A8472E`)**: Muted crimson for high stress alerts and critical issues.
  * **Parchment (`#F3EDE0`)**: Global dashboard background (Level 0).
  * **Cream (`#FBF8F1`)**: Inner card surfaces (Level 1) with 1px border.
  * **Charcoal Ink (`#2B2620`)**: High-readability body copy.
* **Typography**:
  * Geometric headlines: **Space Grotesk**
  * Clean interface text: **Inter**
  * Quantitative figures, dates, and codes: **JetBrains Mono**
* **Border Radii**: 12px for layout blocks/cards, 8px for active buttons, 6px for text inputs.

---

## 7. Simulation & Edge Cases Handled

The application has been verified for stable, realistic user behaviors:
* **Interactive Recovery Simulation**: Adding a new active intervention immediately reduces the target block's stress index. Completing it reduces it further. This demonstrates interactive recovery metrics on the MP dashboard graphs.
* **Database Concurrency**: Multiple block updates and recalculations run in single transactions on the SQLite DB.
* **Security & Lockouts**: Brute-force guessing of OTP codes causes a temporary 15-minute phone block, protecting the system from endpoint exploits.
* **Network & Session Resiliency**: API 401 response interceptors automatically clear localized storage cookies and redirect expired users back to login with notification banners.

---

## 8. Quick Setup & Execution

### Prerequisites
* Node.js v18+ and npm installed.

### Installation
1. Navigate to the project server folder:
   ```bash
   cd server
   npm install
   ```
2. Navigate to the project client folder:
   ```bash
   cd ../client
   npm install
   ```

### Seeding the DB (Initial Run Only)
Create the database and seed it with test accounts (`Ravi Kumar` as MP, `Priya Sharma` as Officer) and block parameters:
```bash
cd server
npm run seed
```

### Running Locally
1. **Start the Backend Server** (from `server/` directory):
   ```bash
   npm run dev
   ```
   * *Note:* Server runs on `http://localhost:5000`. Watch the terminal to see OTP logs when logging in with phone numbers.
2. **Start the Frontend Web App** (from `client/` directory):
   ```bash
   npm run dev
   ```
   * *Note:* Web app will run on `http://localhost:5173`.
