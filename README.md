# 🌱 Kisan Alert Dashboard

A government-facing agricultural monitoring and intervention platform for district-level crop distress tracking in India. Built for MPs, District Officers, and Field Admins operating in Anantapur district, Andhra Pradesh.

> **Design principle:** This tool tracks aggregate block/mandal-level distress signals — never named individuals. It is infrastructure for "where do we send help fastest," not a watchlist.

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Seeding the Database](#seeding-the-database)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Screen Inventory](#screen-inventory)
- [Design System](#design-system)
- [Edge Cases Handled](#edge-cases-handled)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Kisan Alert is a full-stack React + Node/Express + MongoDB dashboard that gives:

- **MPs** a macro district-level overview with a choropleth stress map and auto-generated headline summaries
- **District Officers** a worklist-first sortable block table with intervention deployment
- **Field Admins** an OTP-authenticated mobile login and block drill-down view

All data is aggregate (block/mandal level). No individual farmer profiles or personal risk scores are stored or displayed.

---

## Screenshots

> Add screenshots here after your first build. Suggested captures:
> - `/login` — role selector cards + phone input
> - `/otp` — 6-box digit entry with state variants
> - `/mp/overview` — headline sentence card + district stress map
> - `/officer/anantapur` — sortable block worklist
> - `/block/kalyandurg` — block detail with soil/rainfall metrics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (plain JSX, no TypeScript) |
| State | React Context + `useReducer` (no Redux) |
| Styling | Inline styles only (no CSS modules, no Tailwind) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (24h expiry) + OTP via phone (Twilio-ready stub) |
| Password hashing | bcryptjs |

---

## Project Structure

```
kisan-alert/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── District.js
│   │   ├── Block.js
│   │   ├── Alert.js
│   │   ├── Intervention.js
│   │   └── OTPLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── districts.js
│   │   ├── blocks.js
│   │   ├── alerts.js
│   │   ├── interventions.js
│   │   ├── mp.js
│   │   └── officer.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleGuard.js
│   │   └── errorHandler.js
│   ├── utils/
│   │   ├── otpGenerator.js
│   │   ├── jwtUtils.js
│   │   └── smsStub.js
│   ├── seeds/
│   │   └── seed.js
│   ├── server.js
│   └── .env
└── client/
    └── src/
        ├── api/
        │   ├── authApi.js
        │   ├── mpApi.js
        │   ├── officerApi.js
        │   ├── alertsApi.js
        │   └── interventionsApi.js
        ├── context/
        │   └── AuthContext.js
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx
        │   │   ├── MobileHeader.jsx
        │   │   └── ProtectedRoute.jsx
        │   └── shared/
        │       ├── AlertBadge.jsx
        │       ├── StatCard.jsx
        │       ├── Table.jsx
        │       ├── Spinner.jsx
        │       └── ErrorBanner.jsx
        ├── pages/
        │   ├── SplashPage.jsx
        │   ├── LoginPage.jsx
        │   ├── OTPPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── MPOverviewPage.jsx
        │   ├── MPDistrictPage.jsx
        │   ├── OfficerOverviewPage.jsx
        │   ├── BlockDetailPage.jsx
        │   └── InterventionsPage.jsx
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

---

## Prerequisites

- **Node.js** v18+ and npm v9+
- **MongoDB** running locally on port 27017 (or a MongoDB Atlas URI)
- Git

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/kisan-alert.git
cd kisan-alert
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

---

## Environment Variables

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kisan_alert
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h
OTP_EXPIRY_MINUTES=5
NODE_ENV=development
```

> **Production note:** Replace `JWT_SECRET` with a cryptographically secure random string. Replace the SMS stub in `utils/smsStub.js` with your Twilio credentials.

The frontend uses a proxy to the backend. This is already configured in `client/package.json`:

```json
"proxy": "http://localhost:5000"
```

---

## Seeding the Database

Run the seed script once after your first install to populate Anantapur district data:

```bash
cd server
npm run seed
```

This creates:

| Type | Data |
|---|---|
| Users | Ravi Kumar (MP, `+919900000001`), Priya Sharma (Officer, `+919900000002`) |
| Districts | Anantapur, Andhra Pradesh — 12 blocks, alert level: yellow |
| Blocks | Kalyandurg, Rayadurg, Uravakonda |
| Alerts | 5 alerts (mix of pest/drought, active/monitoring) |
| Interventions | 4 interventions linked to the above alerts |

---

## Running the App

Open two terminals from the project root:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm start
```

The app will be available at `http://localhost:3000`.

To test OTP login in development, watch the server terminal — OTPs are logged to the console:
```
OTP for +919900000001: 482910
```

---

## API Reference

All protected routes require `Authorization: Bearer <token>` in the request header.

### Auth — `/api/auth`

| Method | Endpoint | Body | Auth | Description |
|---|---|---|---|---|
| POST | `/send-otp` | `{ phone }` | No | Generate and send OTP (console stub) |
| POST | `/verify-otp` | `{ phone, otp }` | No | Verify OTP, return JWT + user |
| POST | `/logout` | — | Yes | Stateless — client clears token |

### MP — `/api/mp` _(role: mp)_

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/overview` | Yes | District summary, alert breakdown, farmer counts |
| GET | `/district/:districtName` | Yes | Full district with blocks, alerts, interventions |

### Officer — `/api/officer` _(role: officer)_

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/overview/:districtName` | Yes | Block list with alert levels and last inspection |
| GET | `/block/:blockName` | Yes | Full block detail with mandals, soil, rainfall data |

### Alerts — `/api/alerts` _(role: officer, admin)_

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/?block=&district=&status=&severity=` | Yes | Filtered alert list |
| POST | `/` | Yes | Create new alert |
| PUT | `/:id` | Yes | Update alert status / resolve |

### Interventions — `/api/interventions` _(role: officer)_

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/?block=&district=&outcome=` | Yes | Filtered intervention list |
| POST | `/` | Yes | Log new intervention |
| PUT | `/:id` | Yes | Update intervention outcome |

---

## User Roles

| Role | Access |
|---|---|
| `mp` | `/mp/overview`, `/mp/district/:name`, `/dashboard` |
| `officer` | `/officer/:district`, `/block/:name`, `/interventions`, `/dashboard` |
| `admin` | All routes |

Accessing a page without the required role redirects to `/dashboard` with an "Access denied" message.

---

## Screen Inventory

| # | Screen | Route | Auth |
|---|---|---|---|
| 1 | Splash (Logo) | `/` | No |
| 2 | Login | `/login` | No |
| 3 | Login v2 | `/login` (toggle) | No |
| 4 | OTP Verification | `/otp` | No |
| 5 | OTP Debug Annotations | `/otp?debug=1` | No |
| 6 | Overview Dashboard | `/dashboard` | Yes |
| 7 | MP Overview (Mobile) | `/mp/overview` | Yes |
| 8 | MP District — Anantapur | `/mp/district/anantapur` | Yes |
| 9 | Officer Overview — Anantapur | `/officer/anantapur` | Yes |
| 10 | Block Detail — Kalyandurg | `/block/kalyandurg` | Yes |
| 11 | Block Detail v2 | `/block/kalyandurg?v=2` | Yes |
| 12 | Interventions Log | `/interventions` | Yes |

---

## Design System

| Token | Value | Usage |
|---|---|---|
| Soil brown | `#5C4033` | Nav, primary text accents |
| Turmeric | `#D98E2F` | Primary actions, hero highlights |
| Rice-paddy green | `#3D7A4D` | Low stress / resolved / success |
| Clay red | `#A8472E` | High stress (muted, never neon) |
| Parchment | `#F3EDE0` | Page background |
| Cream | `#FBF8F1` | Card surfaces |
| Charcoal ink | `#2B2620` | Body text |

**Typography:**
- Headlines & data labels: Space Grotesk
- Body / UI: Inter
- All numbers (scores, %, dates, OTP): JetBrains Mono

**Radii:** 10–12px on cards, 8px on buttons. No gradients, no drop shadows, no dark mode.

---

## Edge Cases Handled

**Auth**
- OTP expired → prompt to resend
- OTP already used → clear error message
- Phone not registered → "Phone number not registered"
- 3 consecutive wrong OTPs → 15-minute lockout
- JWT expired mid-session → auto-logout + toast notification

**Network**
- API unreachable → ErrorBanner with retry
- Slow connection → Spinner in content area
- Double-submit → button disabled on first click
- Unexpected API response shape → graceful fallback, no crash

**Data**
- District/Block not found → per-page "Not Found" state (not a global 404)
- Empty interventions → empty state UI with CTA
- All alerts resolved → "All Clear" positive UI
- Null dates → display `—`
- Undefined severity → default to `low` with console warning

**UI**
- Sidebar open on device rotate → close + switch layout
- OTP: letters silently rejected (digits only)
- OTP paste wrong length → ignore and clear boxes
- Long names → `text-overflow: ellipsis` + `title` attribute
- Intervention form → inline field-level validation, not just toast

**Responsive**
- 1024px breakpoint → no sidebar flicker (`useEffect` + `window.matchMedia`)
- 360px screens → StatCards stack, tables scroll horizontally
- iOS Safari 100vh bug → `min-height: -webkit-fill-available`

---

## SMS Integration (Production)

In development, OTPs are logged to the server console. To enable real SMS via Twilio, update `server/utils/smsStub.js`:

```js
// Replace the console.log stub with:
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendSMS = (phone, otp) =>
  client.messages.create({
    body: `Your Kisan Alert OTP is ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_FROM,
    to: phone,
  });
```

Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM` to your `.env`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Follow the implementation order in the spec (models → auth → routes → frontend shell → pages)
4. Test all API endpoints before touching the frontend
5. Run through the edge cases checklist in Section 7 of the spec before opening a PR
6. Open a pull request with a clear description of changes

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

> Built for the agricultural officers and elected representatives of Anantapur district. Data is always block-level. Help goes where it's needed fastest.
