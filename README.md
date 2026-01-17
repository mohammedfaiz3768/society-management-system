# 🏢 Society Management System

A comprehensive multi-tenant society management platform with backend API, admin web portal, and mobile app.

[![GitHub](https://img.shields.io/badge/GitHub-society--backend-blue)](https://github.com/saniya-fathima001/society-backend)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue)](https://expo.dev/)

## 📁 Monorepo Structure

```
society-backend/
├── src/                    # Backend API (Node.js + Express)
├── frontend/
│   ├── admin-web/         # Admin Dashboard (Next.js)
│   └── mobile-app/        # Resident App (React Native/Expo)
├── migrations/            # Database migrations
├── .env.production.example
├── DATABASE_SETUP.md
└── ENVIRONMENT_SETUP.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL (or Neon cloud database)
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/saniya-fathima001/society-backend.git
cd society-backend
```

### 2. Install Dependencies
```bash
# Backend
npm install

# Admin Web
cd frontend/admin-web
npm install

# Mobile App
cd ../mobile-app
npm install
```

### 3. Setup Environment
```bash
# Copy environment templates
cp .env.production.example .env
cd frontend/admin-web
cp env.template .env.production
cd ../mobile-app
cp env.template .env
```

### 4. Configure Database
Update `.env` with your database credentials (see `DATABASE_SETUP.md`)

### 5. Setup Database
```bash
# From root directory
npm run db:setup
```

### 6. Start Development Servers

**Backend:**
```bash
npm run dev
# Server: http://localhost:5000
```

**Admin Web:**
```bash
cd frontend/admin-web
npm run dev
# Dashboard: http://localhost:3000
```

**Mobile App:**
```bash
cd frontend/mobile-app
npm start
# Scan QR code with Expo Go app
```

```

## 🎯 Features

### 👤 User Management
- Multi-role support (Admin, Resident, Guard, Staff)
- Email verification
- Invitation system
- Profile management

### 🏠 Society Operations
- Flat/unit management
- Visitor tracking
- Gate pass system
- Parking slot allocation
- Staff management

### 📢 Communication
- Announcements
- Notices
- Emergency alerts
- SOS alerts
- Polls & voting

### 💰 Financial
- Maintenance bill generation
- Payment tracking
- Razorpay integration
- Invoice management

### 📊 Management Tools
- Complaint tracking
- Document storage
- Event management
- Activity feed
- CCTV integration

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon)
- **Authentication:** JWT + bcrypt
- **Real-time:** Socket.IO
- **Payments:** Razorpay
- **Email:** Nodemailer
- **File Upload:** Multer

### Admin Web
- **Framework:** Next.js 16
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** Radix UI
- **HTTP Client:** Axios

### Mobile App
- **Framework:** Expo
- **Language:** TypeScript  
- **Styling:** NativeWind
- **State Management:** React Query
- **Validation:** Zod
- **HTTP Client:** Axios

## 📚 Documentation

- [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) - Database configuration and setup
- [`ENVIRONMENT_SETUP.md`](./ENVIRONMENT_SETUP.md) - Environment variables guide
- [`ENVIRONMENT_COMPLETE.md`](./ENVIRONMENT_COMPLETE.md) - Setup completion checklist

## 🗄️ Database Schema

**23 Core Tables:**
- societies, users, otp_codes, invitations
- announcements, complaints, polls, poll_votes
- visitors, gate_passes, parking_slots, vehicles
- delivery_logs, documents, maintenance_bills, payments
- sos_alerts, emergency_alerts, staff, flats
- events, activity_feed, notices

## 🔧 NPM Scripts

### Backend
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run db:setup     # Initialize database with schema
```

### Admin Web
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run linter
```

### Mobile App
```bash
npm start            # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run in browser
```

## 🌐 Deployment

### Backend (Railway/Render/Heroku)
1. Set environment variables
2. Run `npm run db:setup`
3. Deploy with `npm start`

### Admin Web (Vercel/Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variables

### Mobile App (Expo/EAS)
1. Configure `app.json`
2. Run `eas build`
3. Submit to app stores

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ SSL database connections
- ✅ Environment-based configuration
- ✅ CORS protection
- ✅ Input validation

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
node -e "const {Pool} = require('pg'); require('dotenv').config(); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(r => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e.message));"
```

### API Not Responding
- Check if backend is running: `npm run dev`
- Verify `.env` file exists and has correct values
- Check PORT is not already in use

### Frontend Can't Connect to API
- Verify `NEXT_PUBLIC_API_BASE_URL` in admin-web `.env.production`
- Verify `EXPO_PUBLIC_API_BASE_URL` in mobile-app `.env`
- Ensure backend is accessible from frontend

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 👥 Team

- **Saniya Fathima** - Repository Owner

## 🔗 Links

- **Repository:** https://github.com/saniya-fathima001/society-backend
- **Issues:** https://github.com/saniya-fathima001/society-backend/issues
- **Documentation:** See `/docs` folder

---

**Last Updated:** January 8, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
