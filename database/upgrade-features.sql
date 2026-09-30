USE [alimNext];
GO

IF COL_LENGTH(N'dbo.users', N'avatar_url') IS NULL
    ALTER TABLE dbo.users ADD avatar_url NVARCHAR(MAX) NULL;
GO

-- Verified Quran content tables. No Quran text is seeded here.
IF OBJECT_ID(N'dbo.quran_dataset_sources', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.quran_dataset_sources
    (
        id INT IDENTITY(1,1) NOT NULL,
        source_name NVARCHAR(255) NOT NULL,
        license_name NVARCHAR(255) NOT NULL,
        license_url NVARCHAR(1000) NOT NULL,
        version NVARCHAR(100) NOT NULL,
        sha256 CHAR(64) NOT NULL,
        copyright_notice NVARCHAR(MAX) NULL,
        imported_at DATETIME2 NOT NULL CONSTRAINT DF_quran_dataset_sources_imported_at DEFAULT (SYSUTCDATETIME()),
        is_verified BIT NOT NULL,
        CONSTRAINT PK_quran_dataset_sources PRIMARY KEY (id),
        CONSTRAINT UX_quran_dataset_sources_version UNIQUE (source_name, version, sha256),
        CONSTRAINT CK_quran_dataset_sources_verified CHECK (is_verified = 1)
    );
END;
GO

IF COL_LENGTH(N'dbo.quran_dataset_sources', N'copyright_notice') IS NULL
    ALTER TABLE dbo.quran_dataset_sources ADD copyright_notice NVARCHAR(MAX) NULL;
GO

IF OBJECT_ID(N'dbo.quran_surahs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.quran_surahs
    (
        surah_number TINYINT NOT NULL,
        source_id INT NOT NULL,
        arabic_name NVARCHAR(255) NOT NULL,
        transliteration NVARCHAR(255) NOT NULL,
        english_name NVARCHAR(255) NOT NULL,
        ayah_count SMALLINT NOT NULL,
        CONSTRAINT PK_quran_surahs PRIMARY KEY (surah_number),
        CONSTRAINT FK_quran_surahs_source FOREIGN KEY (source_id) REFERENCES dbo.quran_dataset_sources(id) ON DELETE NO ACTION,
        CONSTRAINT CK_quran_surahs_number CHECK (surah_number BETWEEN 1 AND 114),
        CONSTRAINT CK_quran_surahs_ayah_count CHECK (ayah_count > 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.quran_ayahs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.quran_ayahs
    (
        surah_number TINYINT NOT NULL,
        ayah_number SMALLINT NOT NULL,
        arabic_text NVARCHAR(MAX) NOT NULL,
        urdu_translation NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_quran_ayahs PRIMARY KEY (surah_number, ayah_number),
        CONSTRAINT FK_quran_ayahs_surah FOREIGN KEY (surah_number) REFERENCES dbo.quran_surahs(surah_number) ON DELETE CASCADE,
        CONSTRAINT CK_quran_ayahs_number CHECK (ayah_number > 0),
        CONSTRAINT CK_quran_ayahs_text CHECK (DATALENGTH(arabic_text) > 0 AND DATALENGTH(urdu_translation) > 0)
    );
END;
GO

SET NOCOUNT ON;
GO

IF COL_LENGTH('dbo.alim_profiles', 'area') IS NULL
    ALTER TABLE dbo.alim_profiles ADD area NVARCHAR(255) NULL;
GO
IF COL_LENGTH('dbo.alim_profiles', 'latitude') IS NULL
    ALTER TABLE dbo.alim_profiles ADD latitude DECIMAL(10,7) NULL;
GO
IF COL_LENGTH('dbo.alim_profiles', 'longitude') IS NULL
    ALTER TABLE dbo.alim_profiles ADD longitude DECIMAL(10,7) NULL;
GO
IF COL_LENGTH('dbo.alim_profiles', 'search_radius_km') IS NULL
BEGIN
    ALTER TABLE dbo.alim_profiles ADD search_radius_km DECIMAL(6,2) NOT NULL CONSTRAINT DF_alim_profiles_search_radius_km DEFAULT (25);
END
GO
IF COL_LENGTH('dbo.alim_profiles', 'qualification') IS NULL
    ALTER TABLE dbo.alim_profiles ADD qualification NVARCHAR(255) NULL;
GO
IF COL_LENGTH('dbo.users', 'age') IS NULL
    ALTER TABLE dbo.users ADD age INT NULL;
GO

IF COL_LENGTH('dbo.service_requests', 'is_recurring') IS NULL
    ALTER TABLE dbo.service_requests ADD is_recurring BIT NOT NULL CONSTRAINT DF_service_requests_is_recurring DEFAULT (0);
GO
IF COL_LENGTH('dbo.service_requests', 'recurrence_type') IS NULL
    ALTER TABLE dbo.service_requests ADD recurrence_type NVARCHAR(20) NULL;
GO
IF COL_LENGTH('dbo.service_requests', 'recurrence_day') IS NULL
    ALTER TABLE dbo.service_requests ADD recurrence_day TINYINT NULL;
GO
IF COL_LENGTH('dbo.service_requests', 'recurrence_date') IS NULL
    ALTER TABLE dbo.service_requests ADD recurrence_date TINYINT NULL;
GO
IF COL_LENGTH('dbo.service_requests', 'start_date') IS NULL
    ALTER TABLE dbo.service_requests ADD start_date DATE NULL;
GO
IF COL_LENGTH('dbo.service_requests', 'end_date') IS NULL
    ALTER TABLE dbo.service_requests ADD end_date DATE NULL;
GO
IF COL_LENGTH('dbo.service_requests', 'parent_request_id') IS NULL
    ALTER TABLE dbo.service_requests ADD parent_request_id INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_service_requests_parent')
    ALTER TABLE dbo.service_requests ADD CONSTRAINT FK_service_requests_parent
        FOREIGN KEY (parent_request_id) REFERENCES dbo.service_requests(id) ON DELETE NO ACTION;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_service_requests_parent')
    CREATE INDEX IX_service_requests_parent ON dbo.service_requests(parent_request_id);
GO

IF OBJECT_ID(N'dbo.favorite_alims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.favorite_alims
    (
        customer_id INT NOT NULL,
        alim_id INT NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_favorite_alims_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_favorite_alims PRIMARY KEY (customer_id, alim_id),
        CONSTRAINT FK_favorite_alims_customer FOREIGN KEY (customer_id) REFERENCES dbo.users(id) ON DELETE NO ACTION,
        CONSTRAINT FK_favorite_alims_alim FOREIGN KEY (alim_id) REFERENCES dbo.users(id) ON DELETE NO ACTION
    );
END;
GO

IF OBJECT_ID(N'dbo.quran_enrollments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.quran_enrollments
    (
        id INT IDENTITY(1,1) NOT NULL,
        student_id INT NOT NULL,
        teacher_id INT NOT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_quran_enrollments_is_active DEFAULT (1),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_quran_enrollments_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2 NULL,
        CONSTRAINT PK_quran_enrollments PRIMARY KEY (id),
        CONSTRAINT UX_quran_enrollments_student_teacher UNIQUE (student_id, teacher_id),
        CONSTRAINT FK_quran_enrollments_student FOREIGN KEY (student_id) REFERENCES dbo.users(id) ON DELETE NO ACTION,
        CONSTRAINT FK_quran_enrollments_teacher FOREIGN KEY (teacher_id) REFERENCES dbo.users(id) ON DELETE NO ACTION
    );
END;
GO

IF COL_LENGTH('dbo.quran_enrollments', 'status') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD status NVARCHAR(20) NOT NULL CONSTRAINT DF_quran_enrollments_status DEFAULT ('accepted');
GO
IF COL_LENGTH('dbo.quran_enrollments', 'student_age') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD student_age INT NULL;
GO
IF COL_LENGTH('dbo.quran_enrollments', 'location') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD location NVARCHAR(255) NULL;
GO
IF COL_LENGTH('dbo.quran_enrollments', 'latitude') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD latitude DECIMAL(10,7) NULL;
GO
IF COL_LENGTH('dbo.quran_enrollments', 'longitude') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD longitude DECIMAL(10,7) NULL;
GO
IF COL_LENGTH('dbo.quran_enrollments', 'notes') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD notes NVARCHAR(MAX) NULL;
GO
IF COL_LENGTH('dbo.quran_enrollments', 'requested_at') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD requested_at DATETIME2 NOT NULL CONSTRAINT DF_quran_enrollments_requested_at DEFAULT (SYSUTCDATETIME());
GO
IF COL_LENGTH('dbo.quran_enrollments', 'schedule_day') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD schedule_day TINYINT NULL;
GO
IF COL_LENGTH('dbo.quran_enrollments', 'schedule_time') IS NULL
    ALTER TABLE dbo.quran_enrollments ADD schedule_time TIME NULL;
GO

IF OBJECT_ID(N'dbo.quran_lessons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.quran_lessons
    (
        id INT IDENTITY(1,1) NOT NULL,
        enrollment_id INT NOT NULL,
        student_id INT NOT NULL,
        teacher_id INT NOT NULL,
        lesson_title NVARCHAR(255) NOT NULL,
        lesson_type NVARCHAR(20) NOT NULL CONSTRAINT DF_quran_lessons_type DEFAULT ('Quran'),
        lesson_reference NVARCHAR(255) NULL,
        lesson_date DATE NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_quran_lessons_status DEFAULT ('In Progress'),
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_quran_lessons_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2 NULL,
        CONSTRAINT PK_quran_lessons PRIMARY KEY (id),
        CONSTRAINT FK_quran_lessons_enrollment FOREIGN KEY (enrollment_id) REFERENCES dbo.quran_enrollments(id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID(N'dbo.quran_attendance', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.quran_attendance
    (
        id INT IDENTITY(1,1) NOT NULL,
        enrollment_id INT NOT NULL,
        student_id INT NOT NULL,
        teacher_id INT NOT NULL,
        lesson_id INT NULL,
        attendance_date DATE NOT NULL,
        status NVARCHAR(20) NOT NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_quran_attendance_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_quran_attendance PRIMARY KEY (id),
        CONSTRAINT UX_quran_attendance_enrollment_date UNIQUE (enrollment_id, attendance_date),
        CONSTRAINT FK_quran_attendance_enrollment FOREIGN KEY (enrollment_id) REFERENCES dbo.quran_enrollments(id) ON DELETE CASCADE,
        CONSTRAINT FK_quran_attendance_lesson FOREIGN KEY (lesson_id) REFERENCES dbo.quran_lessons(id) ON DELETE NO ACTION
    );
END;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_users_role')
    ALTER TABLE dbo.users DROP CONSTRAINT CK_users_role;

-- Purane Quran Teacher accounts ko Alim account mein migrate karte hain.
-- Quran enrollment/lesson/attendance rows same user id ke saath preserve rehti hain.
DECLARE @MigratedQuranTeachers TABLE (user_id INT PRIMARY KEY);
INSERT INTO @MigratedQuranTeachers (user_id)
SELECT id FROM dbo.users WHERE role = 'quran_teacher';

UPDATE dbo.users SET role = 'alim' WHERE role = 'quran_teacher';

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = 'Quran Tutor')
    INSERT INTO dbo.services (name, description, is_active) VALUES ('Quran Tutor', 'In-person Quran and Qaida tutoring', 1);

INSERT INTO dbo.alim_profiles (user_id, bio, experience_years, rating_avg, rating_count, created_at)
SELECT u.id, NULL, NULL, 0, 0, SYSUTCDATETIME()
FROM dbo.users u
WHERE u.role = 'alim'
  AND NOT EXISTS (SELECT 1 FROM dbo.alim_profiles p WHERE p.user_id = u.id);

INSERT INTO dbo.alim_services (alim_user_id, service_id)
SELECT u.id, s.id
FROM dbo.users u
CROSS JOIN dbo.services s
INNER JOIN @MigratedQuranTeachers migrated ON migrated.user_id = u.id
WHERE u.role = 'alim' AND s.name = 'Quran Tutor' AND s.is_active = 1
  AND NOT EXISTS (SELECT 1 FROM dbo.alim_services a WHERE a.alim_user_id = u.id AND a.service_id = s.id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_users_role')
    ALTER TABLE dbo.users ADD CONSTRAINT CK_users_role
        CHECK (role IN ('customer', 'alim', 'admin'));
GO
