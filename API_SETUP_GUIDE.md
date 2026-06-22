# Alim Online - Full Database & API Integration Guide

## ✅ Completed Setup

### 1. **Database Schema Updated**
Added new tables to support the complete application:
- ✅ `appointments` - Track customer-alim appointments
- ✅ `alim_availability` - Store alim availability slots
- ✅ `reviews` - Customer reviews for alims

### 2. **API Endpoints Created**

#### **Authentication**
- `POST /api/auth/register` - Register new user (customer or alim)
- `POST /api/auth/login` - Login user

#### **Users**
- `GET /api/users/[id]` - Get user profile
- `PUT /api/users/[id]` - Update user profile

#### **Services**
- `GET /api/services` - Get all services
- `POST /api/services` - Create new service

#### **Alims**
- `GET /api/alims` - Get all alims (with filters: city, fiqh, sort)
- `GET /api/alims/[id]` - Get alim profile details
- `PUT /api/alims/[id]` - Update alim profile

#### **Appointments**
- `GET /api/appointments` - Get appointments (filters: customerId, alimId, status)
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/[id]` - Update appointment (status, rating, review)
- `DELETE /api/appointments/[id]` - Delete appointment

#### **Reviews**
- `GET /api/reviews` - Get reviews (filters: alimId)
- `POST /api/reviews` - Create review

#### **Alim Availability**
- `GET /api/alim-availability` - Get availability slots
- `POST /api/alim-availability` - Create availability slot

### 3. **Frontend Pages Connected**
- ✅ Login page (`/`) - Uses `/api/auth/login`
- ✅ Create account page (`/create-account`) - Uses `/api/auth/register`

---

## 📋 Next Steps Required

### 1. **Update Remaining Frontend Pages**

Create service request and appointment booking functionality in:
- `/customer-dashboard` - Main customer dashboard
- `/customer-dashboard/ask` - Service request form
- `/customer-dashboard/appointments` - View/manage appointments
- `/customer-dashboard/profile` - User profile management

Example: Customer Request Service
```tsx
const handleRequestService = async () => {
  const response = await fetch("/api/service-requests", {
    method: "POST",
    body: JSON.stringify({
      customerId: user.id,
      alimId: selectedAlim.id,
      serviceId: selectedService.id,
      locationAddress: address,
      latitude: lat,
      longitude: lng,
      requestDate: date,
      requestTime: time
    })
  });
};
```

### 2. **Alim Dashboard Pages**

Connect alim-specific pages:
- `/alim-dashboard` - Main alim dashboard
- `/alim-dashboard/profile` - Edit alim profile
- `/alim-dashboard/availability` - Set availability slots
- `/alim-dashboard/appointments` - View booked appointments
- `/alim-dashboard/new-requests` - View service requests

Example: Set Availability
```tsx
const handleSetAvailability = async () => {
  const response = await fetch("/api/alim-availability", {
    method: "POST",
    body: JSON.stringify({
      alimId: user.id,
      dayOfWeek: 0, // Monday
      startTime: "09:00",
      endTime: "17:00"
    })
  });
};
```

### 3. **Add Session Management**

Store user session data:
```tsx
// After login
localStorage.setItem("user", JSON.stringify(user));

// Retrieve user data
const user = JSON.parse(localStorage.getItem("user") || "{}");
```

### 4. **Create Middleware for Protected Routes**

Protect routes that require authentication:
```tsx
// app/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const user = request.cookies.get("user");
  
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```

---

## 🔧 Database Tables Structure

### Users Table
```sql
- id (PK)
- full_name
- email (UNIQUE)
- password (hashed with bcryptjs)
- phone_number
- city
- role (customer/alim)
- fiqh (Hanafi/Shafi/Maliki/Hanbali)
- created_at
```

### Alims Table
```sql
- id (PK)
- user_id (FK to users)
- name, initials, fiqh
- experience, languages, bio
- rating, reviews count
- distance_km, available_time, area, city
- latitude, longitude
```

### Appointments Table
```sql
- id (PK)
- customer_id (FK)
- alim_id (FK)
- service_id (FK)
- appointment_date, appointment_time
- status (scheduled/completed/cancelled/no-show)
- notes, rating, review
- created_at, updated_at
```

### Alim Availability Table
```sql
- id (PK)
- alim_id (FK)
- day_of_week (0-6, Sunday-Saturday)
- start_time, end_time
- created_at
```

### Reviews Table
```sql
- id (PK)
- alim_id (FK)
- customer_id (FK)
- appointment_id (FK)
- rating (1-5)
- review_text
- created_at
```

---

## 🚀 Running the Application

1. **Ensure SQL Server is running** and the database is created:
```bash
# Run schema script
sqlcmd -S DESKTOP-3MPA2LA\SQLEXPRESS01 -i database/sql-server-schema.sql
```

2. **Start development server**:
```bash
npm run dev
```

3. **Visit** http://localhost:3000

---

## 🔐 Security Notes

- Passwords are hashed using bcryptjs
- Store sensitive operations server-side only
- Use HTTPS in production
- Validate all inputs on server
- Add rate limiting to auth endpoints

---

## 📦 Dependencies Installed

- `bcryptjs` - Password hashing
- `mssql` - SQL Server driver
- `msnodesqlv8` - Native SQL Server connector
- `next` - React framework
- `react` & `react-dom` - UI components
- `tailwindcss` - Styling
- `lucide-react` - Icons

---

## 🆘 Common Issues

### "one or more attachments was not accessible"
This error was from VS Code. It's now resolved.

### Database Connection Fails
Check:
- SQL Server is running: `services.msc`
- Database name is correct: `alim_online`
- Connection string in `.env.local`

### API Returns 400 Error
Check request payload matches expected fields and types

---

**All core API endpoints are ready to use!** Connect your frontend pages to these endpoints to complete the integration.
