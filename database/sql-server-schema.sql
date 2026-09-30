USE [alimNext];
GO

SET NOCOUNT ON;
GO 

IF OBJECT_ID(N'dbo.reviews', N'U') IS NOT NULL
    DROP TABLE dbo.reviews;
GO

IF OBJECT_ID(N'dbo.appointments', N'U') IS NOT NULL
    DROP TABLE dbo.appointments;
GO

IF OBJECT_ID(N'dbo.service_requests', N'U') IS NOT NULL
    DROP TABLE dbo.service_requests;
GO

IF OBJECT_ID(N'dbo.alim_availability', N'U') IS NOT NULL
    DROP TABLE dbo.alim_availability;
GO

IF OBJECT_ID(N'dbo.alim_languages', N'U') IS NOT NULL
    DROP TABLE dbo.alim_languages;
GO

IF OBJECT_ID(N'dbo.alim_services', N'U') IS NOT NULL
    DROP TABLE dbo.alim_services;
GO

IF OBJECT_ID(N'dbo.services', N'U') IS NOT NULL
    DROP TABLE dbo.services;
GO

IF OBJECT_ID(N'dbo.alim_profiles', N'U') IS NOT NULL
    DROP TABLE dbo.alim_profiles;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
    DROP TABLE dbo.users;
GO


/* =========================================================
   2. USERS
   ========================================================= */

CREATE TABLE dbo.users
(
    id INT IDENTITY(1,1) NOT NULL,

    role NVARCHAR(20) NOT NULL,

    full_name NVARCHAR(200) NOT NULL,

    email NVARCHAR(255) NOT NULL,

    password_hash VARBINARY(MAX) NOT NULL,

    phone NVARCHAR(30) NULL,

    avatar_url NVARCHAR(MAX) NULL,

    city NVARCHAR(100) NULL,

    fiqh NVARCHAR(50) NULL,

    is_active BIT NOT NULL
        CONSTRAINT DF_users_is_active DEFAULT (1),

    created_at DATETIME2 NOT NULL
        CONSTRAINT DF_users_created_at DEFAULT (SYSUTCDATETIME()),

    updated_at DATETIME2 NULL,

    search_radius_km DECIMAL(6,2) NOT NULL
        CONSTRAINT DF_alim_profiles_search_radius_km DEFAULT (25),

    CONSTRAINT PK_users
        PRIMARY KEY (id),

    CONSTRAINT UX_users_email
        UNIQUE (email),

    CONSTRAINT CK_users_role
        CHECK (role IN ('customer', 'alim', 'admin')),

    CONSTRAINT CK_users_fiqh
        CHECK (
            fiqh IN ('Hanafi', 'Shafi', 'Maliki', 'Hanbali', 'Other')
            OR fiqh IS NULL
        )
);
GO


/* =========================================================
   3. ALIM PROFILES
   One Alim profile belongs to one user
   ========================================================= */

CREATE TABLE dbo.alim_profiles
(
    user_id INT NOT NULL,

    bio NVARCHAR(MAX) NULL,

    experience_years INT NULL,

    qualification NVARCHAR(255) NULL,

    rating_avg DECIMAL(3,2) NOT NULL
        CONSTRAINT DF_alim_profiles_rating_avg DEFAULT (0),

    rating_count INT NOT NULL
        CONSTRAINT DF_alim_profiles_rating_count DEFAULT (0),

    created_at DATETIME2 NOT NULL
        CONSTRAINT DF_alim_profiles_created_at DEFAULT (SYSUTCDATETIME()),

    updated_at DATETIME2 NULL,

    CONSTRAINT PK_alim_profiles
        PRIMARY KEY (user_id),

    CONSTRAINT FK_alim_profiles_users
        FOREIGN KEY (user_id)
        REFERENCES dbo.users(id)
        ON DELETE CASCADE,

    CONSTRAINT CK_alim_profiles_experience
        CHECK (experience_years IS NULL OR experience_years >= 0),

    CONSTRAINT CK_alim_profiles_rating_avg
        CHECK (rating_avg >= 0 AND rating_avg <= 5),

    CONSTRAINT CK_alim_profiles_rating_count
        CHECK (rating_count >= 0),

    CONSTRAINT CK_alim_profiles_search_radius
        CHECK (search_radius_km > 0 AND search_radius_km <= 500)
);
GO


/* =========================================================
   4. SERVICES
   ========================================================= */

CREATE TABLE dbo.services
(
    id INT IDENTITY(1,1) NOT NULL,

    name NVARCHAR(200) NOT NULL,

    description NVARCHAR(MAX) NULL,

    duration_minutes INT NULL,

    price DECIMAL(10,2) NULL,

    is_active BIT NOT NULL
        CONSTRAINT DF_services_is_active DEFAULT (1),

    created_at DATETIME2 NOT NULL
        CONSTRAINT DF_services_created_at DEFAULT (SYSUTCDATETIME()),

    updated_at DATETIME2 NULL,

    CONSTRAINT PK_services
        PRIMARY KEY (id),

    CONSTRAINT CK_services_duration
        CHECK (
            duration_minutes IS NULL
            OR duration_minutes > 0
        ),

    CONSTRAINT CK_services_price
        CHECK (
            price IS NULL
            OR price >= 0
        )
);
GO


CREATE INDEX IX_services_name
ON dbo.services(name);
GO


/* =========================================================
   5. ALIM SERVICES
   Many-to-many relationship:
   Alim <-> Services
   ========================================================= */

CREATE TABLE dbo.alim_services
(
    alim_user_id INT NOT NULL,

    service_id INT NOT NULL,

    price_override DECIMAL(10,2) NULL,

    CONSTRAINT PK_alim_services
        PRIMARY KEY (alim_user_id, service_id),

    CONSTRAINT FK_alim_services_alim
        FOREIGN KEY (alim_user_id)
        REFERENCES dbo.users(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_alim_services_service
        FOREIGN KEY (service_id)
        REFERENCES dbo.services(id)
        ON DELETE CASCADE,

    CONSTRAINT CK_alim_services_price
        CHECK (
            price_override IS NULL
            OR price_override >= 0
        )
);
GO


/* =========================================================
   6. ALIM LANGUAGES
   One Alim can have multiple languages
   ========================================================= */

CREATE TABLE dbo.alim_languages
(
    alim_user_id INT NOT NULL,

    language NVARCHAR(100) NOT NULL,

    CONSTRAINT PK_alim_languages
        PRIMARY KEY (alim_user_id, language),

    CONSTRAINT FK_alim_languages_alim
        FOREIGN KEY (alim_user_id)
        REFERENCES dbo.users(id)
        ON DELETE CASCADE
);
GO


/* =========================================================
   7. ALIM AVAILABILITY
   Supports recurring and specific availability
   ========================================================= */

CREATE TABLE dbo.alim_availability
(
    id INT IDENTITY(1,1) NOT NULL,

    alim_user_id INT NOT NULL,

    is_recurring BIT NOT NULL
        CONSTRAINT DF_alim_availability_is_recurring DEFAULT (0),

    weekday TINYINT NULL,

    start_time TIME NULL,

    end_time TIME NULL,

    start_datetime DATETIME2 NULL,

    end_datetime DATETIME2 NULL,

    is_booked BIT NOT NULL
        CONSTRAINT DF_alim_availability_is_booked DEFAULT (0),

    created_at DATETIME2 NOT NULL
        CONSTRAINT DF_alim_availability_created_at DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_alim_availability
        PRIMARY KEY (id),

    CONSTRAINT FK_alim_availability_alim
        FOREIGN KEY (alim_user_id)
        REFERENCES dbo.users(id)
        ON DELETE CASCADE,

    CONSTRAINT CK_alim_availability_weekday
        CHECK (
            weekday IS NULL
            OR weekday BETWEEN 0 AND 6
        ),

    CONSTRAINT CK_alim_availability_time
        CHECK (
            start_time IS NULL
            OR end_time IS NULL
            OR start_time < end_time
        ),

    CONSTRAINT CK_alim_availability_datetime
        CHECK (
            start_datetime IS NULL
            OR end_datetime IS NULL
            OR start_datetime < end_datetime
        )
);
GO


CREATE INDEX IX_alim_availability_user
ON dbo.alim_availability(alim_user_id);
GO


/* =========================================================
   8. SERVICE REQUESTS
   ========================================================= */

CREATE TABLE dbo.service_requests
(
    id INT IDENTITY(1,1) NOT NULL,

    customer_id INT NOT NULL,

    alim_id INT NULL,

    service_id INT NULL,

    fiqh NVARCHAR(50) NULL,

    location NVARCHAR(255) NULL,

    latitude DECIMAL(10,7) NULL,

    longitude DECIMAL(10,7) NULL,

    request_date DATE NULL,

    request_time TIME NULL,

    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_service_requests_status DEFAULT ('pending'),

    notes NVARCHAR(MAX) NULL,

    created_at DATETIME2 NOT NULL
        CONSTRAINT DF_service_requests_created_at DEFAULT (SYSUTCDATETIME()),

    updated_at DATETIME2 NULL,

    CONSTRAINT PK_service_requests
        PRIMARY KEY (id),

    CONSTRAINT FK_service_requests_customer
        FOREIGN KEY (customer_id)
        REFERENCES dbo.users(id)
        ON DELETE NO ACTION,

    CONSTRAINT FK_service_requests_alim
        FOREIGN KEY (alim_id)
        REFERENCES dbo.users(id)
        ON DELETE SET NULL,

    CONSTRAINT FK_service_requests_service
        FOREIGN KEY (service_id)
        REFERENCES dbo.services(id)
        ON DELETE SET NULL,

    CONSTRAINT CK_service_requests_status
        CHECK (
            status IN (
                'pending',
                'accepted',
                'confirmed',
                'completed',
                'cancelled',
                'rejected',
                'failed'
            )
        ),

    CONSTRAINT CK_service_requests_fiqh
        CHECK (
            fiqh IN (
                'Hanafi',
                'Shafi',
                'Maliki',
                'Hanbali',
                'Other'
            )
            OR fiqh IS NULL
        ),

    CONSTRAINT CK_service_requests_latitude
        CHECK (
            latitude IS NULL
            OR latitude BETWEEN -90 AND 90
        ),

    CONSTRAINT CK_service_requests_longitude
        CHECK (
            longitude IS NULL
            OR longitude BETWEEN -180 AND 180
        )
);
GO


CREATE INDEX IX_service_requests_customer
ON dbo.service_requests(customer_id);
GO

CREATE INDEX IX_service_requests_alim
ON dbo.service_requests(alim_id);
GO

CREATE INDEX IX_service_requests_service
ON dbo.service_requests(service_id);
GO

CREATE INDEX IX_service_requests_status
ON dbo.service_requests(status);
GO


/* =========================================================
   9. APPOINTMENTS
   ========================================================= */

CREATE TABLE dbo.appointments
(
    id INT IDENTITY(1,1) NOT NULL,

    service_request_id INT NOT NULL,

    scheduled_at DATETIME2 NOT NULL,

    duration_minutes INT NULL,

    status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_appointments_status DEFAULT ('scheduled'),

    alim_feedback_skipped BIT NOT NULL
        CONSTRAINT DF_appointments_alim_feedback_skipped DEFAULT (0),

    created_at DATETIME2 NOT NULL
        CONSTRAINT DF_appointments_created_at DEFAULT (SYSUTCDATETIME()),

    updated_at DATETIME2 NULL,

    CONSTRAINT PK_appointments
        PRIMARY KEY (id),

    CONSTRAINT FK_appointments_service_request
        FOREIGN KEY (service_request_id)
        REFERENCES dbo.service_requests(id)
        ON DELETE CASCADE,

    CONSTRAINT CK_appointments_duration
        CHECK (
            duration_minutes IS NULL
            OR duration_minutes > 0
        ),

    CONSTRAINT CK_appointments_status
        CHECK (
            status IN (
                'scheduled',
                'completed',
                'cancelled',
                'no_show',
                'rescheduled'
            )
        )
);
GO


CREATE INDEX IX_appointments_service_request
ON dbo.appointments(service_request_id);
GO

CREATE INDEX IX_appointments_scheduled_at
ON dbo.appointments(scheduled_at);
GO


/* =========================================================
   10. REVIEWS
   ========================================================= */

CREATE TABLE dbo.reviews
(
    id INT IDENTITY(1,1) NOT NULL,

    appointment_id INT NULL,

    reviewer_id INT NULL,

    reviewee_id INT NOT NULL,

    rating TINYINT NOT NULL,

    comment NVARCHAR(MAX) NULL,

    created_at DATETIME2 NOT NULL
        CONSTRAINT DF_reviews_created_at DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_reviews
        PRIMARY KEY (id),

    CONSTRAINT FK_reviews_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES dbo.users(id)
        ON DELETE NO ACTION,

    CONSTRAINT FK_reviews_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES dbo.appointments(id)
        ON DELETE NO ACTION,

    CONSTRAINT FK_reviews_reviewee
        FOREIGN KEY (reviewee_id)
        REFERENCES dbo.users(id)
        ON DELETE NO ACTION,

    CONSTRAINT CK_reviews_rating
        CHECK (rating BETWEEN 1 AND 5)
);
GO


CREATE INDEX IX_reviews_reviewee
ON dbo.reviews(reviewee_id);
GO

CREATE INDEX IX_reviews_reviewer
ON dbo.reviews(reviewer_id);
GO

CREATE INDEX IX_reviews_appointment
ON dbo.reviews(appointment_id);
GO


/* =========================================================
   FINAL VERIFICATION
   ========================================================= */

SELECT
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

select * from dbo.users;
