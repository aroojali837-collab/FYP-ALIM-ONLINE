# Real Data Workflow - Removing Dummy Data

## ❌ Why Dummy Data Existed

The dummy alim data was added for **development/demonstration purposes** to show:
- What the app looks like with data
- How alim listings work
- API response structure

## ✅ Now Using Real Data

### Step 1: Clear Dummy Data from Database

If you already have dummy alims in your database, run this:

```bash
# Using SQL Server Management Studio or sqlcmd
sqlcmd -S DESKTOP-3MPA2LA\SQLEXPRESS01 -i database/clear-dummy-data.sql
```

Or manually in SQL Server:
```sql
-- Delete dummy data
DELETE FROM dbo.alims;
DELETE FROM dbo.users;
DELETE FROM dbo.appointments;
DELETE FROM dbo.reviews;

-- Reset identity seeds
DBCC CHECKIDENT ('dbo.alims', RESEED, 0);
DBCC CHECKIDENT ('dbo.users', RESEED, 0);
```

### Step 2: Real Data Workflow

Now users will register themselves:

**Customers:**
1. Visit `/create-account`
2. Select "Customer" role
3. Register → API creates user record
4. Login → Browse alims
5. Book appointments

**Alims:**
1. Visit `/create-account`
2. Select "Alim" role
3. Select fiqh
4. Register → API creates user + alim profile
5. Login → Complete profile (experience, languages, bio, location)
6. Set availability slots
7. Receive appointment requests

### Step 3: Database Structure for Real Data

**Services** (pre-seeded - won't change):
```sql
-- These are real service types
- Nikah
- Dua
- Janaza
- Quran Khawani
- Family Counseling
- Quranic Study
```

**Users** (created by registration):
```sql
INSERT INTO users (full_name, email, password, phone_number, city, role, fiqh)
-- Data comes from user registration form
```

**Alims** (created automatically with user):
```sql
-- When user registers as "alim", this row is auto-created
-- User edits alim profile via `/alim-dashboard/profile`
```

---

## 📋 Best Practices for Real App

### 1. **Use API for All Data**
✅ **Good:**
```tsx
// Register via form
const response = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify(formData)
});
```

❌ **Bad:**
```
Don't manually insert into database
Don't use dummy data
```

### 2. **Let Users Create Their Own Data**

**Alim Registration Flow:**
```
Form Input → API Register → Database Insert
```

```tsx
// User fills form
const formData = {
  fullName: "Mufti Ahmed Khan",  // Real user input
  email: "ahmed@example.com",
  password: "secure_password",
  role: "alim",
  fiqh: "Hanafi",
  city: "Karachi"
};

// API handles everything
await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify(formData)
});

// Database automatically gets:
// - users table entry
// - alims table entry with initials auto-generated
```

### 3. **Alim Profile Completion**

After registration, alim completes their profile:

```tsx
// PUT /api/alims/[alimId]
const profileData = {
  experience: "12 years",
  languages: "Urdu, English, Arabic",
  bio: "Specializes in Nikah and family guidance",
  area: "Block 5, Clifton",
  city: "Karachi",
  latitude: 24.8138,
  longitude: 67.0304,
  availableTime: "10:00 AM - 2:00 PM"
};

await fetch(`/api/alims/${alimId}`, {
  method: 'PUT',
  body: JSON.stringify(profileData)
});
```

### 4. **Availability Management**

Alims set their own availability:

```tsx
// POST /api/alim-availability
const availability = {
  alimId: 1,
  dayOfWeek: 0,  // Monday (0-6)
  startTime: "09:00",
  endTime: "17:00"
};

await fetch('/api/alim-availability', {
  method: 'POST',
  body: JSON.stringify(availability)
});
```

### 5. **Service Requests from Customers**

Customers browse and book:

```tsx
// GET /api/alims?city=Karachi&fiqh=Hanafi
const alims = await fetch('/api/alims?city=Karachi&fiqh=Hanafi');

// POST /api/appointments
const booking = {
  customerId: user.id,
  alimId: selectedAlim.id,
  serviceId: selectedService.id,
  appointmentDate: "2024-06-25",
  appointmentTime: "10:30"
};

await fetch('/api/appointments', {
  method: 'POST',
  body: JSON.stringify(booking)
});
```

---

## 🔄 Complete Real User Journey

```
┌─────────────────────────────────────────────┐
│         CUSTOMER REGISTRATION                │
├─────────────────────────────────────────────┤
│ 1. Visit /create-account                    │
│ 2. Select "Customer"                        │
│ 3. Fill form (name, email, password, etc)   │
│ 4. POST /api/auth/register                  │
│ 5. Database: users table ← new row          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           CUSTOMER EXPERIENCE                │
├─────────────────────────────────────────────┤
│ 1. Login at /                               │
│ 2. Dashboard: GET /api/alims                │
│ 3. Browse alims by city/fiqh                │
│ 4. Click "Book Appointment"                 │
│ 5. POST /api/appointments                   │
│ 6. View appointments in dashboard           │
│ 7. Post review → POST /api/reviews          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         ALIM REGISTRATION                    │
├─────────────────────────────────────────────┤
│ 1. Visit /create-account                    │
│ 2. Select "Alim"                            │
│ 3. Select Fiqh (Hanafi, Shafi, etc)         │
│ 4. Fill form                                │
│ 5. POST /api/auth/register                  │
│ 6. Database:                                │
│    - users table ← new row                  │
│    - alims table ← new row (auto-linked)    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│       ALIM PROFILE SETUP                     │
├─────────────────────────────────────────────┤
│ 1. Login at /                               │
│ 2. Go to /alim-dashboard/profile            │
│ 3. Fill experience, languages, bio          │
│ 4. Add location (area, city, lat/long)      │
│ 5. PUT /api/alims/[id]                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   ALIM AVAILABILITY & APPOINTMENTS           │
├─────────────────────────────────────────────┤
│ 1. Set availability slots                   │
│    POST /api/alim-availability              │
│ 2. View incoming requests                   │
│    GET /api/service-requests                │
│ 3. Accept appointment                       │
│    PUT /api/service-requests                │
│ 4. View confirmed appointments              │
│    GET /api/appointments?alimId=X           │
│ 5. Complete appointment                     │
│    PUT /api/appointments/[id]               │
└─────────────────────────────────────────────┘
```

---

## 🗑️ Files to Know

- **`database/sql-server-schema.sql`** - Table structures (no dummy data)
- **`database/sql-server-seed.sql`** - Only services (no dummy alims)
- **`database/clear-dummy-data.sql`** - Clean database if needed
- **All API endpoints** - Handle real data from users

---

## ✅ Verification - Clean Database

Check that your database is ready:

```sql
-- Should return only 6 services
SELECT COUNT(*) as service_count FROM dbo.services;

-- Should return 0 (no dummy alims)
SELECT COUNT(*) as alim_count FROM dbo.alims;

-- Should return 0 (clean)
SELECT COUNT(*) as user_count FROM dbo.users;
```

---

## 🚀 Now Your App Is Ready for Real Users!

- ✅ No dummy data
- ✅ Users register themselves
- ✅ All data comes from real users
- ✅ Alims manage their own profiles
- ✅ Customers book real appointments

**Start the app and begin registering real users!**

