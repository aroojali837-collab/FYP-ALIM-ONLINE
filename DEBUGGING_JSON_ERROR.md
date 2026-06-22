# JSON/HTML Error - Debugging Guide

## What Causes This Error?

**Error**: "Unexpected token '<', "<!DOCTYPE" is not valid JSON"

**Meaning**: An API endpoint returned HTML (error page) instead of JSON

---

## 🔍 How to Debug

### Step 1: Check Database Connection

Open this URL in your browser:
```
http://localhost:3000/api/health
```

**Expected Response (✅ Good):**
```json
{
  "status": "✅ Connected",
  "message": "Database connection successful",
  "database": "alim_online",
  "timestamp": "2026-06-18T..."
}
```

**Error Response (❌ Problem):**
```json
{
  "status": "❌ Failed",
  "message": "ENOEXEC: Failed to connect",
  "error": "...",
  "timestamp": "2026-06-18T..."
}
```

---

### Step 2: Check Browser Console

1. Open browser DevTools: **F12** or **Ctrl+Shift+I**
2. Go to **Console** tab
3. Look for error messages with full stack trace
4. Look at **Network** tab to see which API call failed

**Common Issues in Network Tab:**
- Status `500` = Server error (database/code issue)
- Status `404` = API route not found
- Response shows HTML = Unhandled error

---

### Step 3: Check Server Console

Look at your terminal where `npm run dev` is running.

**You should see detailed errors like:**
```
Database connection error: {
  message: "Failed to connect to DESKTOP-3MPA2LA\SQLEXPRESS01",
  server: "DESKTOP-3MPA2LA\SQLEXPRESS01",
  database: "alim_online",
  trustedConnection: true,
  errorCode: "ENOEXEC"
}
```

---

## ✅ Common Solutions

### 1. **SQL Server Not Running**

Check if SQL Server is running:
```powershell
Get-Service "MSSQLSERVER" | Start-Service  # For default instance
Get-Service "MSSQL$SQLEXPRESS01" | Start-Service  # For named instance
```

Or manually:
1. Press **Windows + R**
2. Type: `services.msc`
3. Find SQL Server service
4. Right-click → **Start**

---

### 2. **Wrong Server Name**

Verify your `.env.local`:
```
DB_SERVER=DESKTOP-3MPA2LA\SQLEXPRESS01
DB_DATABASE=alim_online
```

To find your SQL Server name:
```sql
SELECT @@SERVERNAME;
```

---

### 3. **Database Doesn't Exist**

Create the database:
```bash
sqlcmd -S DESKTOP-3MPA2LA\SQLEXPRESS01 -i database/sql-server-schema.sql
```

Verify it exists:
```sql
SELECT name FROM sys.databases WHERE name='alim_online';
```

---

### 4. **Authentication Issues**

If using SQL Authentication instead of Windows:
```
DB_TRUSTED_CONNECTION=false
DB_USER=sa
DB_PASSWORD=your_password
```

---

### 5. **Connection Timeout**

If database is slow, you might see timeout errors. Check:
1. Is SQL Server responsive? Test: `sqlcmd -S DESKTOP-3MPA2LA\SQLEXPRESS01`
2. Are there query locks? Check SQL Server Activity Monitor
3. Increase timeout in `.env.local`:
   ```
   DB_TIMEOUT=30000
   ```

---

## 🔧 What I Fixed

✅ Added `/api/health` endpoint to test database connection  
✅ Added detailed error logging with stack traces  
✅ Improved error messages in login/register endpoints  
✅ Enhanced database connection error reporting  

---

## 📋 Testing Checklist

- [ ] Run `npm run dev` - server starts without errors
- [ ] Visit `http://localhost:3000/api/health` - returns JSON
- [ ] Check browser console (F12) - no errors
- [ ] Check server console - no connection errors
- [ ] Try login page - form works
- [ ] Try registration page - form works
- [ ] Database service is running

---

## 🚀 Next Steps

1. **Test Health Endpoint:**
   ```
   http://localhost:3000/api/health
   ```

2. **Check Server Console** for detailed error messages

3. **Fix Based on Error** using solutions above

4. **Reload Page** and try again

---

**After fixing the issue, the error will disappear and you'll get proper JSON responses from the API!**
