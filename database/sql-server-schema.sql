IF DB_ID(N'alim_online') IS NULL
BEGIN
  CREATE DATABASE alim_online;
END;
GO

USE alim_online;
GO

IF OBJECT_ID(N'dbo.service_requests', N'U') IS NOT NULL DROP TABLE dbo.service_requests;
IF OBJECT_ID(N'dbo.alims', N'U') IS NOT NULL DROP TABLE dbo.alims;
IF OBJECT_ID(N'dbo.services', N'U') IS NOT NULL DROP TABLE dbo.services;
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL DROP TABLE dbo.users;
GO

CREATE TABLE dbo.users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  full_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(120) NOT NULL UNIQUE,
  password NVARCHAR(255) NOT NULL,
  phone_number NVARCHAR(30) NULL,
  city NVARCHAR(80) NULL,
  role NVARCHAR(20) NOT NULL CHECK (role IN ('customer', 'alim')),
  fiqh NVARCHAR(20) NULL CHECK (fiqh IN ('Hanafi', 'Shafi', 'Maliki', 'Hanbali')),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.services (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(80) NOT NULL,
  description NVARCHAR(255) NULL
);

CREATE TABLE dbo.alims (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NULL,
  name NVARCHAR(100) NOT NULL,
  initials NVARCHAR(10) NULL,
  fiqh NVARCHAR(20) NOT NULL CHECK (fiqh IN ('Hanafi', 'Shafi', 'Maliki', 'Hanbali')),
  experience NVARCHAR(50) NULL,
  languages NVARCHAR(150) NULL,
  bio NVARCHAR(MAX) NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 0,
  reviews INT NOT NULL DEFAULT 0,
  distance_km DECIMAL(4,1) NULL,
  available_time NVARCHAR(80) NULL,
  area NVARCHAR(120) NULL,
  city NVARCHAR(80) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  CONSTRAINT FK_alims_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE SET NULL
);

CREATE TABLE dbo.service_requests (
  id INT IDENTITY(1,1) PRIMARY KEY,
  customer_id INT NULL,
  alim_id INT NULL,
  service_id INT NULL,
  fiqh NVARCHAR(20) NULL CHECK (fiqh IN ('Hanafi', 'Shafi', 'Maliki', 'Hanbali')),
  location_address NVARCHAR(255) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  request_date DATE NULL,
  request_time TIME NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_service_requests_users FOREIGN KEY (customer_id) REFERENCES dbo.users(id),
  CONSTRAINT FK_service_requests_alims FOREIGN KEY (alim_id) REFERENCES dbo.alims(id) ON DELETE SET NULL,
  CONSTRAINT FK_service_requests_services FOREIGN KEY (service_id) REFERENCES dbo.services(id) ON DELETE SET NULL
);

CREATE TABLE dbo.appointments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  customer_id INT NOT NULL,
  alim_id INT NOT NULL,
  service_id INT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes NVARCHAR(MAX) NULL,
  rating DECIMAL(2,1) NULL,
  review NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_appointments_customers FOREIGN KEY (customer_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
  CONSTRAINT FK_appointments_alims FOREIGN KEY (alim_id) REFERENCES dbo.alims(id) ON DELETE CASCADE,
  CONSTRAINT FK_appointments_services FOREIGN KEY (service_id) REFERENCES dbo.services(id) ON DELETE SET NULL
);

CREATE TABLE dbo.alim_availability (
  id INT IDENTITY(1,1) PRIMARY KEY,
  alim_id INT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_alim_availability_alims FOREIGN KEY (alim_id) REFERENCES dbo.alims(id) ON DELETE CASCADE
);

CREATE TABLE dbo.reviews (
  id INT IDENTITY(1,1) PRIMARY KEY,
  alim_id INT NOT NULL,
  customer_id INT NOT NULL,
  appointment_id INT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_reviews_alims FOREIGN KEY (alim_id) REFERENCES dbo.alims(id) ON DELETE CASCADE,
  CONSTRAINT FK_reviews_customers FOREIGN KEY (customer_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
  CONSTRAINT FK_reviews_appointments FOREIGN KEY (appointment_id) REFERENCES dbo.appointments(id) ON DELETE SET NULL
);
GO

INSERT INTO dbo.services (name, description) VALUES
(N'Nikah', N'Marriage ceremony'),
(N'Dua', N'Prayer service'),
(N'Janaza', N'Funeral prayer'),
(N'Quran Khawani', N'Quran recitation');

INSERT INTO dbo.alims
(name, initials, fiqh, experience, languages, bio, rating, reviews, distance_km, available_time, area, city, latitude, longitude)
VALUES
(N'Mufti Ahmed Khan', N'MA', N'Hanafi', N'12 years', N'Urdu, English', N'Specializes in Nikah, family guidance, and Quranic consultation.', 4.9, 342, 1.2, N'10:00 AM - 2:00 PM', N'Block 5, Clifton', N'Karachi', 24.8138000, 67.0304000),
(N'Mufti Yusuf Ali', N'MY', N'Hanafi', N'15 years', N'Urdu, Arabic', N'Known for service ceremonies, Islamic counselling, and local community support.', 4.9, 523, 2.1, N'9:00 AM - 3:00 PM', N'North Nazimabad', N'Karachi', 24.9395000, 67.0436000),
(N'Molana Abdul Rahman', N'MA', N'Shafi', N'9 years', N'Urdu, Sindhi', N'Provides Dua, Janaza, and Quran Khawani services with flexible scheduling.', 4.8, 289, 2.5, N'9:00 AM - 5:00 PM', N'Gulshan-e-Iqbal', N'Karachi', 24.9180000, 67.0971000),
(N'Sheikh Muhammad Ali', N'SM', N'Hanbali', N'10 years', N'Urdu, English, Arabic', N'Experienced in formal ceremonies and Islamic guidance for families.', 4.7, 215, 3.1, N'11:00 AM - 4:00 PM', N'Defence Phase 6', N'Karachi', 24.7986000, 67.0643000),
(N'Qari Bilal Siddiqui', N'QB', N'Hanafi', N'8 years', N'Urdu, Punjabi', N'Offers Quran recitation, Dua gatherings, and appointment-based visits.', 4.6, 178, 4.4, N'8:00 AM - 1:00 PM', N'Saddar', N'Karachi', 24.8607000, 67.0104000),
(N'Molana Hamza Farooq', N'MH', N'Maliki', N'7 years', N'Urdu, English', N'Available for household services and short-notice Islamic guidance.', 4.6, 164, 4.8, N'2:00 PM - 7:00 PM', N'PECHS', N'Karachi', 24.8724000, 67.0587000),
(N'Mufti Saad Qureshi', N'MS', N'Hanafi', N'6 years', N'Urdu', N'Focuses on service requests, counselling, and Quranic recitation events.', 4.5, 141, 4.9, N'12:00 PM - 6:00 PM', N'Bahadurabad', N'Karachi', 24.8849000, 67.0677000),
(N'Allama Noman Raza', N'AN', N'Shafi', N'11 years', N'Urdu, Arabic', N'Serves community events, Nikah ceremonies, and religious Q&A sessions.', 4.5, 126, 5.0, N'3:00 PM - 8:00 PM', N'Tariq Road', N'Karachi', 24.8737000, 67.0607000);
GO
SELECT * FROM dbo.services;
SELECT * FROM dbo.alims;