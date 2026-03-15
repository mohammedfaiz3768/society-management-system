# Society Management System — UNIFY

A full-stack multi-tenant platform for managing residential housing societies. Built for admins, residents, guards, and staff — it handles everything from gate passes and visitor logs to maintenance billing, SOS alerts, and live CCTV streaming.

The project is structured as a monorepo with three parts:

- **Backend API** — Node.js + Express, PostgreSQL (hosted on Neon)
- **Admin Dashboard** — Next.js web app for society admins
- **Resident Mobile App** — React Native (Expo) app for residents and guards

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Authentication & Authorization](#authentication--authorization)
- [API Modules](#api-modules)
- [Middleware Pipeline](#middleware-pipeline)
- [Real-Time Features](#real-time-features)
- [Payments (Razorpay)](#payments-razorpay)
- [Push Notifications (Firebase)](#push-notifications-firebase)
- [Email Service](#email-service)
- [Cron Jobs](#cron-jobs)
- [Hidden / Upcoming Features](#hidden--upcoming-features)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Project Structure

```
society-backend/
├── src/
│   ├── server.js              # HTTP server, Socket.IO, WebRTC init, cron loader
│   ├── app.js                 # Express app — route mounting, middleware wiring
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection pool (Neon-compatible)
│   │   ├── firebase.js        # Firebase Admin SDK init for push notifications
│   │   ├── razorpay.js        # Razorpay client init
│   │   ├── authConfig.js      # Auth mode config (open, invite-only, domain-restricted)
│   │   └── emergencyServices.js  # SOS type → emergency service mapping
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   ├── roleMiddleware.js   # Role-based access control
│   │   ├── societyMiddleware.js # Multi-tenant data isolation
│   │   ├── checkCctvKey.js     # CCTV stream token validation
│   │   └── uploadDocument.js   # Multer file upload config
│   ├── modules/               # Feature modules (23 total — routes + controllers)
│   │   ├── auth/              # Login, register, OTP, password reset
│   │   ├── users/             # Profile management, user listing
│   │   ├── societies/         # Society CRUD, registration tokens
│   │   ├── flat/              # Flat/unit management
│   │   ├── visitors/          # Visitor entry/exit tracking
│   │   ├── gatepass/          # QR-based gate pass generation
│   │   ├── delivery/          # Delivery log management
│   │   ├── parking/           # Parking slot allocation
│   │   ├── staff/             # Staff management (guards, cleaners, etc.)
│   │   ├── complaints/        # Complaint filing and resolution
│   │   ├── maintenance/       # Monthly maintenance bill generation
│   │   ├── payments/          # Payment creation and verification
│   │   ├── announcements/     # Society-wide announcements
│   │   ├── notices/           # Targeted notices (by block, flat, role)
│   │   ├── polls/             # Polls with JSONB options + voting
│   │   ├── documents/         # Document upload and storage
│   │   ├── sos/               # SOS alerts with GPS + emergency service auto-call
│   │   ├── emergency-alerts/  # Emergency broadcasts (fire, flood, etc.)
│   │   ├── directory/         # Resident directory
│   │   ├── dashboard/         # Admin dashboard stats
│   │   ├── timeline/          # Activity feed/timeline
│   │   ├── invitations/       # Invite-based onboarding
│   │   └── registration/      # New society registration flow
│   ├── routes/                # Standalone routes
│   │   ├── invoiceRoutes.js   # Invoice endpoints
│   │   ├── notificationRoutes.js
│   │   ├── serviceRoutes.js   # General service requests
│   │   ├── razorpayWebhook.js # Razorpay payment webhook
│   │   └── subscriptionWebhook.js
│   ├── services/
│   │   ├── razorpayService.js # Order creation, verification, refunds, subscriptions
│   │   ├── smsService.js      # SMS sending
│   │   └── clipExtractorService.js # Video clip extraction (ffmpeg)
│   ├── utils/
│   │   ├── sendEmail.js       # Nodemailer email with HTML templates
│   │   ├── fcm.js             # Firebase Cloud Messaging (push to user / all residents)
│   │   ├── sendNotification.js # In-app notification helper
│   │   ├── activityLogger.js  # Activity feed logger
│   │   ├── emailService.js    # Secondary email util
│   │   ├── generatePassCode.js
│   │   ├── generateQrCode.js
│   │   └── timeline.js
│   ├── cron/
│   │   ├── invoiceCron.js     # Monthly maintenance invoice auto-generation
│   │   └── gatePassCron.js    # Daily expired gate pass cleanup
│   ├── webrtc/
│   │   └── signaling.js       # WebRTC signaling server for live CCTV
│   └── hidden/                # Feature-flagged / upcoming modules
│       ├── cctv/              # CCTV camera management
│       ├── chat/              # In-app chat
│       ├── ai/                # AI-powered dashboard insights
│       ├── patrol/            # Guard patrol tracking
│       ├── inventory/         # Society inventory management
│       ├── subscription/      # SaaS subscription management
│       ├── qr/                # QR code scanning
│       └── ...
├── frontend/
│   ├── admin-web/             # Next.js admin dashboard
│   └── mobile-app/            # Expo (React Native) resident app
├── migrations/                # SQL migration files (schema + incremental)
├── firebase/
│   └── firebaseInit.js        # Firebase initialization helper
├── uploads/                   # Uploaded files (documents, images)
├── package.json
├── nodemon.json
├── migrate.js                 # Migration runner script
├── setup-database.js          # Database setup script
├── check-routes.js            # Route debugging utility
└── check_tables.js            # Table existence checker
```

---

## Tech Stack

### Backend

| Layer           | Technology                                           |
|-----------------|------------------------------------------------------|
| Runtime         | Node.js                                              |
| Framework       | Express.js                                           |
| Database        | PostgreSQL (Neon serverless)                          |
| Auth            | JWT (jsonwebtoken) + bcryptjs                        |
| Real-time       | Socket.IO                                            |
| Video streaming | WebRTC (custom signaling server)                     |
| Payments        | Razorpay (orders, subscriptions, webhooks, refunds)  |
| Push notifications | Firebase Cloud Messaging (FCM)                    |
| Email           | Nodemailer (Gmail SMTP)                              |
| File uploads    | Multer                                               |
| Scheduling      | node-cron                                            |
| Video processing| fluent-ffmpeg                                        |

### Admin Dashboard (frontend/admin-web)

| Layer       | Technology        |
|-------------|-------------------|
| Framework   | Next.js           |
| UI          | React + Radix UI  |
| Language    | TypeScript        |
| Styling     | Tailwind CSS      |
| HTTP client | Axios             |

### Mobile App (frontend/mobile-app)

| Layer            | Technology     |
|------------------|----------------|
| Framework        | Expo           |
| Language         | TypeScript     |
| Styling          | NativeWind     |
| State management | React Query    |
| Validation       | Zod            |
| HTTP client      | Axios          |

---

## Getting Started

### Prerequisites

- Node.js (v18 or above)
- PostgreSQL database (or a [Neon](https://neon.tech/) account for cloud-hosted)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/mohammedfaiz3768/society-management-system.git
cd society-backend
```

### 2. Install dependencies 

```bash
# Backend
npm install

# Admin dashboard
cd frontend/admin-web
npm install

# Mobile app
cd ../mobile-app
npm install
```

### 3. Configure environment

Copy the `.env` example and fill in your credentials (see [Environment Variables](#environment-variables) below):

```bash
cp .env.example .env
```

### 4. Set up the database

```bash
npm run db:setup
```

This runs the base schema (`migrations/00_base_schema.sql`) which creates all 23 core tables, indexes, and constraints. Incremental migrations in the `migrations/` folder handle schema changes like adding multi-tenant support, SOS enhancements, etc.

### 5. Start development servers

**Backend:**
```bash
npm run dev
# runs on http://localhost:10000
```

**Admin Dashboard:**
```bash
cd frontend/admin-web
npm run dev
# runs on http://localhost:3000
```

**Mobile App:**
```bash
cd frontend/mobile-app
npm start
# scan QR with Expo Go
```

---

## Environment Variables

The backend expects these in a `.env` file at the project root:

| Variable                  | Description                                         |
|---------------------------|-----------------------------------------------------|
| `PORT`                    | Server port (default: 10000)                        |
| `DATABASE_URL`            | Full PostgreSQL connection string                   |
| `DB_HOST`                 | Database host (fallback if no DATABASE_URL)          |
| `DB_PORT`                 | Database port                                       |
| `DB_USER`                 | Database user                                       |
| `DB_PASSWORD`             | Database password                                   |
| `DB_NAME`                 | Database name                                       |
| `JWT_SECRET`              | Secret key for signing JWT tokens                   |
| `JWT_EXPIRES_IN`          | Token expiry (e.g., `7d`)                           |
| `RAZORPAY_KEY_ID`         | Razorpay API key ID                                 |
| `RAZORPAY_KEY_SECRET`     | Razorpay API secret                                 |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for verifying Razorpay webhook signatures    |
| `EMAIL_USER`              | Gmail address for sending OTP and notification emails|
| `EMAIL_PASS`              | Gmail app password                                  |
| `AUTH_MODE`               | Registration mode: `open`, `admin_only`, `domain_restricted`, `invitation_only` |
| `ALLOWED_EMAIL_DOMAINS`   | Comma-separated domains for domain_restricted mode  |
| `CCTV_PUBLIC_STREAM_BASE` | Base URL for HLS CCTV streams                       |
| `FIREBASE_SERVICE_ACCOUNT`| Firebase service account JSON (string) for FCM      |

Firebase can also be configured by placing a `firebase-service-account.json` file in the project root instead of setting the environment variable.

---

## Database

PostgreSQL is the primary datastore. The project is set up to work with [Neon](https://neon.tech/) (serverless Postgres) out of the box, with automatic SSL handling for Neon hostnames.

### Connection

The `src/config/db.js` file creates a connection pool. It accepts either a `DATABASE_URL` connection string or individual `DB_HOST`, `DB_PORT`, etc. parameters.

### Schema (23 Core Tables)

| Table                | Purpose                                              |
|----------------------|------------------------------------------------------|
| `societies`          | Society profiles (name, address, subscription plan, trial period) |
| `users`              | All users across roles (admin, resident, guard, staff), linked to a society |
| `otp_codes`          | OTP codes for phone/email-based login                |
| `otps`               | OTP codes for admin login and password changes       |
| `invitations`        | Invite codes with role assignment and expiry          |
| `announcements`      | Society-wide announcements (general, urgent, etc.)   |
| `complaints`         | Resident complaints with status tracking and admin comments |
| `polls`              | Community polls with JSONB options                   |
| `poll_votes`         | Individual votes on polls                            |
| `visitors`           | Visitor log with entry/exit timestamps               |
| `gate_passes`        | QR-coded gate passes with validity periods           |
| `parking_slots`      | Parking slot allocation (resident / visitor)         |
| `vehicles`           | Registered vehicles per user                         |
| `delivery_logs`      | Package/delivery tracking with guard verification    |
| `documents`          | Uploaded society documents (rules, minutes, etc.)    |
| `maintenance_bills`  | Monthly maintenance bills per flat                   |
| `payments`           | Payment records linked to Razorpay orders            |
| `sos_alerts`         | SOS panic alerts with GPS, emergency type, buzzer option |
| `emergency_alerts`   | Admin-triggered emergency broadcasts (scoped to block/flat/role) |
| `staff`              | Society staff records (name, phone, role, shift)     |
| `flats`              | Flat/unit registry (number, block, floor, owner info)|
| `events`             | Society events with date and location                |
| `activity_feed`      | Audit log of all user actions                        |
| `notices`            | Targeted notices with category and audience filtering|

Every society-linked table has an index on `society_id` for query performance.

### Migrations

Migration files live in the `migrations/` folder. They're applied in order:

1. `00_base_schema.sql` — Creates all core tables and indexes
2. `01_add_notifications_table.sql` — Notifications table
3. `02_add_number_of_people_to_gate_passes.sql` — Gate pass group size
4. `03_fix_polls_schema.sql` — Poll schema corrections
5. `add_multi_tenant_schema.sql` — Multi-tenant enhancements
6. `add_society_registration.sql` — Society self-registration flow
7. `add_sos_enhancements.sql` — SOS GPS and auto-call features
8. `add_email_to_otp_codes.sql` — Email-based OTP support
9. `create_gate_passes_table.sql` — Gate pass table (initial version)
10. `create_invitations_table.sql` — Invitation system

---

## Authentication & Authorization

### How Auth Works

1. **Login** — Users authenticate via email/phone. The server sends an OTP (via email through Nodemailer). Once verified, a JWT is returned.

2. **JWT Tokens** — Signed with `JWT_SECRET`, tokens contain `id`, `role`, and `phone`. Default expiry is 7 days. Tokens are sent as `Bearer <token>` in the Authorization header.

3. **Password Auth** — Admin users can also authenticate with bcrypt-hashed passwords.

### Auth Modes

The `AUTH_MODE` environment variable controls who can register:

| Mode                 | Behavior                                              |
|----------------------|-------------------------------------------------------|
| `open`               | Anyone can register                                   |
| `admin_only`         | Only admins can create accounts                       |
| `domain_restricted`  | Only emails from specified domains can register       |
| `invitation_only`    | Users must have a valid invitation code to sign up    |

### Role-Based Access

Four user roles are supported:

| Role       | Access Level                                           |
|------------|--------------------------------------------------------|
| `admin`    | Full access — manage society, users, billing, settings |
| `resident` | Access own flat data, complaints, gate passes, polls   |
| `guard`    | Visitor management, gate pass verification, delivery logs |
| `staff`    | Limited access based on assigned duties                |

The `roleMiddleware.js` accepts a list of allowed roles and blocks anyone else with a 403.

---

## API Modules

All API routes are mounted under `/api/`. Here's the full list:

| Endpoint               | Module             | Auth Required | Description                                 |
|-------------------------|--------------------|---------------|---------------------------------------------|
| `/api/auth`             | auth               | No            | Login, register, OTP send/verify, password reset |
| `/api/users`            | users              | Yes           | User profiles, listing, role management     |
| `/api/societies`        | societies          | Varies        | Society CRUD, registration tokens           |
| `/api/flats`            | flat               | Yes           | Flat/unit management                        |
| `/api/visitors`         | visitors           | Yes           | Visitor entry/exit logging                  |
| `/api/gate-pass`        | gatepass           | Yes           | Create, verify, list gate passes (QR-based) |
| `/api/delivery`         | delivery           | Yes           | Delivery log CRUD, guard verification       |
| `/api/staff`            | staff              | Yes           | Staff records management                    |
| `/api/complaints`       | complaints         | Yes           | File and track complaints                   |
| `/api/maintenance`      | maintenance        | Yes           | Generate and manage maintenance bills       |
| `/api/payments`         | payments           | Yes           | Create Razorpay orders, verify payments     |
| `/api/announcements`    | announcements      | Yes           | CRUD for society announcements              |
| `/api/notices`          | notices            | Yes           | Targeted notice board (by block/flat/role)  |
| `/api/polls`            | polls              | Yes           | Create polls, cast votes                    |
| `/api/documents`        | documents          | Yes           | Upload and manage society documents         |
| `/api/sos`              | sos                | Yes           | Trigger SOS alerts with GPS location        |
| `/api/emergency-alerts` | emergency-alerts   | Yes           | Broadcast emergency alerts                  |
| `/api/directory`        | directory          | Yes           | Resident directory lookup                   |
| `/api/dashboard`        | dashboard          | Yes           | Admin dashboard aggregated stats            |
| `/api/timeline`         | timeline           | Yes           | Activity feed/audit log                     |
| `/api/invitations`      | invitations        | No            | Invitation-based registration               |
| `/api/registration`     | registration       | No            | New society registration                    |
| `/api/notifications`    | notificationRoutes | Yes           | In-app notification management              |
| `/api/invoices`         | invoiceRoutes      | No            | Invoice endpoints                           |
| `/api/services`         | serviceRoutes      | No            | Service request endpoints                   |
| `/api/razorpay/webhook` | razorpayWebhook    | No            | Razorpay payment callback handler           |

All protected routes go through `authMiddleware` → `societyMiddleware` pipeline before reaching the handler.

---

## Middleware Pipeline

Every protected request passes through these layers in order:

```
Request → CORS → JSON Parser → authMiddleware → societyMiddleware → Route Handler
```

### authMiddleware

Extracts the JWT from `Authorization: Bearer <token>` header (or fallback `token` header). Verifies the token against `JWT_SECRET` and attaches `req.user` with `{ id, role, phone }`.

### societyMiddleware

Looks up the authenticated user's `society_id` from the database and attaches it as `req.societyId`. This is the core of multi-tenancy — every downstream query filters by this ID, ensuring residents of one society can never see data from another.

### roleMiddleware

Used on individual routes to restrict access by role. For example, only admins can generate maintenance bills, only guards can verify gate passes, etc.

### checkCctvKey

Validates authentication tokens for CCTV stream access. Separate from JWT auth because CCTV streams use short-lived, camera-specific tokens.

### uploadDocument (Multer)

Handles multipart file uploads. Used by document upload, profile picture, and other file-based endpoints.

---

## Real-Time Features

### Socket.IO

The server creates a Socket.IO instance alongside the HTTP server. It's used for:

- **Online presence tracking** — Users emit a `register` event with their user ID when they connect. The server maintains an `onlineUsers` map.
- **Live notifications** — SOS alerts, emergency broadcasts, and announcements are pushed to connected clients instantly.
- **Disconnect cleanup** — When a socket disconnects, its user ID is removed from the online map.

The `io` instance is attached to the Express app via `app.set("socketio", io)` so any module can emit events.

### WebRTC (CCTV Streaming)

A separate Socket.IO namespace (`/webrtc`) handles WebRTC signaling for live CCTV camera feeds:

- **Publishers** (cameras) register themselves for a given `cameraId`
- **Viewers** (admins/residents) join a camera room and initiate a WebRTC peer connection
- The signaling server relays SDP offers/answers and ICE candidates between publisher and viewer
- Camera-specific view tokens are validated against a `cctv_view_tokens` table

This allows residents and admins to view live camera feeds directly from the app without any third-party streaming service.

---

## Payments (Razorpay)

The platform integrates Indian payment gateway Razorpay for maintenance bill payments:

- **Order creation** — When a resident initiates a payment, a Razorpay order is created with the amount in INR
- **Payment verification** — After the user completes payment on the frontend, the backend verifies the signature using HMAC-SHA256
- **Refunds** — Admin can trigger refunds for individual payments
- **Subscriptions** — Supports recurring monthly plans for maintenance with auto-renewal
- **Webhooks** — Razorpay sends payment status updates to `/api/razorpay/webhook`, which the backend verifies and processes

If Razorpay credentials aren't configured, the payment features are gracefully disabled with a warning at startup.

---

## Push Notifications (Firebase)

Firebase Cloud Messaging (FCM) is used for push notifications on the mobile app:

- **Per-user notifications** — Sends to a specific user's registered FCM token (e.g., "Your complaint has been resolved")
- **Broadcast to all residents** — Sends multicast messages for society-wide events (e.g., emergency alerts, announcements)
- FCM tokens are stored in the `users` table (`fcm_token` column)

Firebase can be initialized via:
1. A `firebase-service-account.json` file in the project root, or
2. The `FIREBASE_SERVICE_ACCOUNT` environment variable (JSON string)

If neither is configured, push notifications are silently disabled.

---

## Email Service

Emails are sent via **Nodemailer** through Gmail SMTP. Currently used for:

- **OTP delivery** — Styled HTML email with a 6-digit OTP that expires in 5 minutes
- **Invitation emails** — When an admin invites a new user
- **Payment receipts** and other transactional emails

The sender name shows as "UNIFY App" in the recipient's inbox.

---

## Cron Jobs

Two scheduled tasks run automatically:

### Invoice Generation (`invoiceCron.js`)

- **Schedule:** 1st of every month at midnight
- **What it does:** Auto-generates maintenance invoices for all residents by joining the `users` and `flats` tables. Each flat's maintenance charge is used as the invoice amount.

### Gate Pass Cleanup (`gatePassCron.js`)

- **Schedule:** Every day at midnight
- **What it does:**
  1. Marks all pending gate passes that are past their `valid_until` as `EXPIRED`
  2. Deletes gate passes that expired more than 24 hours ago

---

## Hidden / Upcoming Features

The `src/hidden/` directory contains modules that are built but not yet enabled in production. They're commented out in `app.js` behind feature flags:

| Module         | Description                                     |
|----------------|-------------------------------------------------|
| `cctv`         | Full CCTV camera management and stream URLs     |
| `chat`         | In-app messaging between residents              |
| `ai`           | AI-powered dashboard insights and analytics     |
| `patrol`       | Guard patrol route tracking and check-ins       |
| `inventory`    | Society inventory and asset management          |
| `subscription` | SaaS subscription plans for societies           |
| `qr`           | Advanced QR code scanning features              |
| `camera`       | Camera hardware integration                     |
| `outage`       | Utility outage reporting and tracking           |
| `language`     | Multi-language support                          |

These can be enabled by uncommenting the corresponding routes in `app.js`.

---

## Deployment

### Backend

The backend can be deployed to any Node.js hosting platform:

**Railway / Render / Heroku:**
1. Push to GitHub
2. Connect your repo to the platform
3. Set all environment variables from the table above
4. Build command: `npm install`
5. Start command: `npm start`
6. Run `npm run db:setup` once for initial database setup

### Admin Dashboard

**Vercel / Netlify:**
1. Connect the `frontend/admin-web` directory
2. Build command: `npm run build`
3. Framework preset: Next.js
4. Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL

### Mobile App

**Expo / EAS Build:**
1. Update `app.json` with your app details
2. Set `EXPO_PUBLIC_API_BASE_URL` to your deployed backend URL
3. Run `eas build` for Android/iOS builds
4. Submit to Play Store / App Store via `eas submit`

---

## Troubleshooting

### Database won't connect

Make sure your `DATABASE_URL` is correct. Test the connection manually:

```bash
node -e "const {Pool}=require('pg');require('dotenv').config();const p=new Pool({connectionString:process.env.DATABASE_URL});p.query('SELECT NOW()').then(r=>console.log('Connected:',r.rows[0].now)).catch(e=>console.error('Failed:',e.message))"
```

If using Neon, the SSL config is handled automatically for any `DB_HOST` containing `neon.tech`.

### Server starts but APIs return 401

- Check that you're sending the JWT in the `Authorization: Bearer <token>` header
- Verify `JWT_SECRET` matches what was used to sign the token
- Tokens expire after the duration set in `JWT_EXPIRES_IN` (default 7 days)

### Payments not working

- Razorpay logs a warning at startup if credentials are missing — check your console
- Make sure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
- For testing, use Razorpay test mode keys

### Push notifications not sending

- Firebase logs a warning if not configured — check your console for the message
- Either place `firebase-service-account.json` in the root or set `FIREBASE_SERVICE_ACCOUNT` env var
- Make sure the mobile app is registering FCM tokens and they're being saved to the `users` table

### Frontend can't reach the backend

- Verify the API base URL is set correctly in the frontend env file
- Check CORS — the backend allows all origins by default (`origin: "*"`)
- Make sure the backend port isn't blocked by a firewall

---

## NPM Scripts

### Backend (root)

| Command          | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Start with nodemon (auto-reload)     |
| `npm start`      | Start production server              |
| `npm run db:setup` | Run initial database schema setup  |

### Admin Dashboard (frontend/admin-web)

| Command          | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Start Next.js dev server             |
| `npm run build`  | Production build                     |
| `npm start`      | Serve production build               |
| `npm run lint`   | Run ESLint                           |

### Mobile App (frontend/mobile-app)

| Command            | Description                        |
|--------------------|------------------------------------|
| `npm start`        | Start Expo dev server              |
| `npm run android`  | Launch on Android emulator/device  |
| `npm run ios`      | Launch on iOS simulator/device     |
| `npm run web`      | Launch in browser                  |

---

## Screenshots

> Screenshots will be added here.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is private and proprietary.

---

**Maintained by** [Mohammed Faiz](https://github.com/mohammedfaiz3768)
