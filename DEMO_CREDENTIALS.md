# 🎉 Demo Credentials - Society Management System

## 📱 Mobile App Test Credentials

### 🔐 Admin User
- **Email**: `admin@greenwood.com`
- **Password**: `admin123`
- **Role**: Administrator
- **Flat**: A-101
- **Access**: Full system access, all admin features

### 👤 Resident Users

#### Resident 1 (Primary Test Account)
- **Email**: `rajesh@example.com`
- **Password**: `password123`
- **Name**: Rajesh Kumar
- **Role**: Resident
- **Flat**: A-102
- **Access**: Resident portal, gate pass, maintenance, complaints, etc.

#### Resident 2
- **Email**: `priya@example.com`
- **Password**: `password123`
- **Name**: Priya Sharma
- **Role**: Resident
- **Flat**: A-103
- **Access**: Resident portal features

#### Resident 3
- **Email**: `amit@example.com`
- **Password**: `password123`
- **Name**: Amit Patel
- **Role**: Resident
- **Flat**: B-201
- **Access**: Resident portal features

### 🛡️ Security Guard
- **Email**: `guard@greenwood.com`
- **Password**: `guard123`
- **Name**: Security Guard
- **Role**: Guard
- **Access**: Visitor management, gate pass scanning, delivery logs

---

## 🏢 Demo Society Information

### Society Details
- **Name**: Greenwood Residency
- **Address**: 123 Park Avenue, Sector 42
- **City**: Mumbai
- **State**: Maharashtra
- **Pincode**: 400001
- **Total Units**: 100
- **Status**: Active
- **Plan**: Trial

---

## 📊 Database Seeded Data

### Users in Database
| Name | Email | Password | Role | Flat | Block |
|------|-------|----------|------|------|-------|
| Admin User | admin@greenwood.com | admin123 | admin | 101 | A |
| Rajesh Kumar | rajesh@example.com | password123 | resident | 102 | A |
| Priya Sharma | priya@example.com | password123 | resident | 103 | A |
| Amit Patel | amit@example.com | password123 | resident | 201 | B |
| Security Guard | guard@greenwood.com | guard123 | guard | - | - |

### Sample Data Created
- ✅ 1 Society (Greenwood Residency)
- ✅ 5 Users (1 admin, 3 residents, 1 guard)
- ✅ 1 Announcement ("Welcome to Greenwood Residency!")
- ✅ All 23 database tables initialized

---

## 🚀 How to Test

### For Mobile App (Expo)
1. **Start the backend**:
   ```bash
   cd c:\Users\khanf\society-backend
   npm run dev
   ```

2. **Open Expo app** on your phone

3. **Scan the QR code** from the terminal

4. **Login with**:
   - Email: `rajesh@example.com`
   - Password: `password123`

### For Admin Web
1. **Start the admin web**:
   ```bash
   cd c:\Users\khanf\society-backend\frontend\admin-web
   npm run dev
   ```

2. **Open**: http://localhost:3000

3. **Login with**:
   - Email: `admin@greenwood.com`
   - Password: `admin123`

---

## 🔑 Quick Reference

### Resident Login (Most Used)
```
Email: rajesh@example.com
Password: password123
```

### Admin Login
```
Email: admin@greenwood.com
Password: admin123
```

### Guard Login
```
Email: guard@greenwood.com
Password: guard123
```

---

## 🎯 Features to Test

### As Resident (rajesh@example.com)
- ✅ View dashboard
- ✅ Create gate passes
- ✅ View announcements
- ✅ Submit complaints
- ✅ Check maintenance bills
- ✅ View parking details
- ✅ Access directory
- ✅ Participate in polls
- ✅ Send SOS alerts

### As Admin (admin@greenwood.com)
- ✅ Manage residents
- ✅ Create announcements
- ✅ Handle complaints
- ✅ Manage flats
- ✅ View all visitors
- ✅ Generate bills
- ✅ View SOS alerts
- ✅ Manage staff

### As Guard (guard@greenwood.com)
- ✅ Scan gate passes
- ✅ Log visitors
- ✅ View visitor queue
- ✅ Emergency alerts
- ✅ Delivery management

---

## ⚠️ Important Notes

### Password Security
- All demo passwords are hashed with bcrypt
- **DO NOT** use these passwords in production
- Change all default passwords before going live

### Database Info
- Database: Neon PostgreSQL (Cloud)
- Connection: Secure SSL
- All data is demo/test data
- Can be reset by running `npm run db:setup` again

### API Endpoints
- Backend: `http://localhost:5000/api`
- Admin Web: `http://localhost:3000`
- Mobile App: Connects to backend API

---

## 🔄 Reset Demo Data

If you want to reset all data to original state:

```bash
cd c:\Users\khanf\society-backend
npm run db:setup
```

This will:
1. Drop and recreate all tables
2. Restore demo society
3. Recreate all 5 demo users
4. Add sample announcement

---

## 📞 Support

If you encounter any issues:
1. Check backend is running: `npm run dev`
2. Verify database connection in `.env`
3. Check mobile app API URL in `frontend/mobile-app/.env`
4. Clear Expo cache: `npx expo start --clear`

---

**Last Updated**: January 10, 2026  
**Database Status**: ✅ Active & Seeded  
**Total Demo Users**: 5  
**Society**: Greenwood Residency
