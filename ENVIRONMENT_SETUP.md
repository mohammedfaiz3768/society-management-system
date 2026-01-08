# Environment Configuration Guide

This guide explains how to set up environment variables for all three parts of the society management system.

## Quick Start

### 1. Backend Setup

```bash
cd society-backend
cp .env.production.example .env
```

Edit `.env` and update:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Generate a secure random string
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` - Your Razorpay credentials
- `EMAIL_USER` and `EMAIL_PASS` - SMTP credentials for email notifications
- `DEMO_MODE=false` for production (or `true` for demo)

### 2. Admin Web Setup

```bash
cd frontend/admin-web
cp env.template .env.production
```

Edit `.env.production`:
- `NEXT_PUBLIC_API_BASE_URL` - Your backend API URL (e.g., `https://api.yourdomain.com/api`)

### 3. Mobile App Setup

```bash
cd frontend/mobile-app
cp env.template .env
```

Edit `.env`:
- `EXPO_PUBLIC_API_BASE_URL` - Your backend API URL

For local development:
```
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:5000/api
```

Replace `YOUR_LOCAL_IP` with your computer's local IP address (e.g., `192.168.1.51`)

---

## Detailed Configuration

### Backend Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` or `development` |
| `APP_ENV` | Application environment | `demo`, `staging`, `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens | Generate with `openssl rand -base64 32` |

#### Payment Configuration

| Variable | Description |
|----------|-------------|
| `PAYMENT_MODE` | `test` or `live` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key |

#### Email Configuration

| Variable | Description |
|----------|-------------|
| `EMAIL_USER` | SMTP username (e.g., Gmail address) |
| `EMAIL_PASS` | SMTP password or app-specific password |

#### Demo Mode (Important!)

| Variable | Description | Values |
|----------|-------------|--------|
| `DEMO_MODE` | Enable/disable demo safety features | `true` / `false` |
| `OTP_MODE` | OTP delivery mode | `demo` or `production` |

**When `DEMO_MODE=true`:**
- ✅ OTPs are logged to console (not sent via SMS/Email)
- ✅ Destructive actions (DELETE, multi-society creation) are blocked
- ✅ All notifications are simulated
- ✅ Safe for public demos

**When `DEMO_MODE=false`:**
- ⚠️ Real SMS and emails will be sent
- ⚠️ Users can delete data
- ⚠️ Razorpay payments will be processed
- ✅ Use for production

---

### Admin Web Environment Variables

**Important:** All browser-accessible variables **MUST** start with `NEXT_PUBLIC_`

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `https://api.yourdomain.com/api` |
| `NEXT_PUBLIC_APP_ENV` | Environment name | `demo`, `staging`, `production` |

**For local development:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

**For production:**
```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

---

### Mobile App Environment Variables

**Important:** All variables **MUST** start with `EXPO_PUBLIC_`

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL | `https://api.yourdomain.com/api` |
| `EXPO_PUBLIC_APP_ENV` | Environment name | `demo`, `staging`, `production` |

**Finding your local IP address:**

**Windows:**
```cmd
ipconfig
```
Look for `IPv4 Address` under your network adapter (e.g., `192.168.1.51`)

**Mac/Linux:**
```bash
ifconfig | grep inet
```

**Mobile app .env example:**
```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.51:5000/api
EXPO_PUBLIC_APP_ENV=development
```

---

## Security Best Practices

### 1. Never Commit .env Files
- ✅ `.env` files are gitignored by default
- ✅ Use `.env.example` or `env.template` for documentation
- ❌ Never commit secrets to version control

### 2. Use Strong Secrets
Generate secure JWT secrets:
```bash
openssl rand -base64 64
```

### 3. Environment-Specific Files
- **Development**: `.env` (local only, gitignored)
- **Production**: `.env.production` (server only, gitignored)
- **Templates**: `.env.example` or `env.template` (committed to git)

### 4. Demo Mode for Public Demos
Always set `DEMO_MODE=true` for public-facing demos to prevent:
- Spam registrations
- Data deletion
- Real payment processing
- SMS/Email quota exhaustion

---

## Troubleshooting

### "Cannot find module" errors in Admin Web
**Problem:** Environment variables not loaded

**Solution:**
1. Create `.env.production` file in `frontend/admin-web/`
2. Ensure variables start with `NEXT_PUBLIC_`
3. Restart the Next.js dev server

### Mobile app can't connect to backend
**Problem:** Wrong API URL

**Solution:**
1. Check your local IP address (not `localhost`)
2. Ensure backend is running on port 5000
3. Phone/computer must be on same WiFi network
4. Update `.env` file:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:5000/api
   ```
5. Restart Expo: `npm start`

### OTPs not being sent
**Check:**
1. Is `DEMO_MODE=true`? → OTPs logged to console
2. Is `OTP_MODE=demo`? → OTPs logged to console
3. Email credentials correct? Check `EMAIL_USER` and `EMAIL_PASS`

### 403 "Demo Mode" errors
**Cause:** `DEMO_MODE=true` blocks destructive actions

**Solution:**
- For testing: Set `DEMO_MODE=false` in your `.env`
- For production: Keep `DEMO_MODE=false`
- For public demos: Keep `DEMO_MODE=true`

---

## Deployment Checklist

### Before Deploying to Production:

- [ ] Set `NODE_ENV=production` in backend
- [ ] Set `DEMO_MODE=false` (unless it's a demo site)
- [ ] Use `PAYMENT_MODE=live` for real payments
- [ ] Update `JWT_SECRET` to a strong random value
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` to your production API domain
- [ ] Test payment flow end-to-end
- [ ] Verify email/SMS delivery
- [ ] Set up database backups
- [ ] Configure CORS to allow only your frontend domains

---

## Environment Files Summary

```
society-backend/
├── .env                          # Backend dev/production config (gitignored)
├── .env.production.example       # Backend template (committed)
└── frontend/
    ├── admin-web/
    │   ├── env.template          # Admin web template (committed)
    │   └── .env.production       # Admin web production (gitignored)
    └── mobile-app/
        ├── env.template          # Mobile template (committed)
        └── .env                  # Mobile dev config (gitignored)
```

---

## Need Help?

- **Documentation issues:** Open an issue on GitHub
- **Production setup:** Contact support@societymanagement.com
- **Deployment guides:** See `/docs/deployment/`

**Last Updated:** January 7, 2026
