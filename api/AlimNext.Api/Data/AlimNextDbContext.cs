// Ye EF Core context C# models ko SQL Server tables ke saath connect karta hai.
using AlimNext.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Data;

public class AlimNextDbContext(DbContextOptions<AlimNextDbContext> options) : DbContext(options)
{
    // Har DbSet database ki related table ka query entry point hai.
    public DbSet<User> Users => Set<User>();
    public DbSet<AlimProfile> AlimProfiles => Set<AlimProfile>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<AlimService> AlimServices => Set<AlimService>();
    public DbSet<AlimLanguage> AlimLanguages => Set<AlimLanguage>();
    public DbSet<AlimAvailability> AlimAvailability => Set<AlimAvailability>();
    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<FavoriteAlim> FavoriteAlims => Set<FavoriteAlim>();
    public DbSet<QuranEnrollment> QuranEnrollments => Set<QuranEnrollment>();
    public DbSet<QuranLesson> QuranLessons => Set<QuranLesson>();
    public DbSet<QuranAttendance> QuranAttendance => Set<QuranAttendance>();
    public DbSet<QuranDatasetSource> QuranDatasetSources => Set<QuranDatasetSource>();
    public DbSet<QuranSurah> QuranSurahs => Set<QuranSurah>();
    public DbSet<QuranAyah> QuranAyahs => Set<QuranAyah>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Yahan table names, keys, relationships aur column rules define hote hain.
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PasswordHash).HasColumnName("password_hash");
            entity.Property(x => x.Role).HasColumnName("role").HasMaxLength(20);
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200);
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(255);
            entity.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(30);
            entity.Property(x => x.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(x => x.Age).HasColumnName("age");
            entity.Property(x => x.City).HasColumnName("city").HasMaxLength(100);
            entity.Property(x => x.Fiqh).HasColumnName("fiqh").HasMaxLength(50);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<AlimProfile>(entity =>
        {
            entity.ToTable("alim_profiles", "dbo");
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.Bio).HasColumnName("bio");
            entity.Property(x => x.ExperienceYears).HasColumnName("experience_years");
            entity.Property(x => x.Qualification).HasColumnName("qualification").HasMaxLength(255);
            entity.Property(x => x.RatingAvg).HasColumnName("rating_avg").HasPrecision(3, 2);
            entity.Property(x => x.RatingCount).HasColumnName("rating_count");
            entity.Property(x => x.Area).HasColumnName("area").HasMaxLength(255);
            entity.Property(x => x.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            entity.Property(x => x.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            entity.Property(x => x.SearchRadiusKm).HasColumnName("search_radius_km").HasPrecision(6, 2);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(x => x.User)
                .WithOne(x => x.AlimProfile)
                .HasForeignKey<AlimProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.ToTable("services", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.DurationMinutes).HasColumnName("duration_minutes");
            entity.Property(x => x.Price).HasColumnName("price").HasPrecision(10, 2);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<AlimService>(entity =>
        {
            entity.ToTable("alim_services", "dbo");
            entity.HasKey(x => new { x.AlimUserId, x.ServiceId });
            entity.Property(x => x.AlimUserId).HasColumnName("alim_user_id");
            entity.Property(x => x.ServiceId).HasColumnName("service_id");
            entity.Property(x => x.PriceOverride).HasColumnName("price_override").HasPrecision(10, 2);
            entity.HasOne(x => x.Alim).WithMany().HasForeignKey(x => x.AlimUserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Service).WithMany().HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AlimLanguage>(entity =>
        {
            entity.ToTable("alim_languages", "dbo");
            entity.HasKey(x => new { x.AlimUserId, x.Language });
            entity.Property(x => x.AlimUserId).HasColumnName("alim_user_id");
            entity.Property(x => x.Language).HasColumnName("language").HasMaxLength(100);
            entity.HasOne(x => x.Alim).WithMany().HasForeignKey(x => x.AlimUserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AlimAvailability>(entity =>
        {
            entity.ToTable("alim_availability", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.AlimUserId).HasColumnName("alim_user_id");
            entity.Property(x => x.IsRecurring).HasColumnName("is_recurring");
            entity.Property(x => x.Weekday).HasColumnName("weekday");
            entity.Property(x => x.StartTime).HasColumnName("start_time");
            entity.Property(x => x.EndTime).HasColumnName("end_time");
            entity.Property(x => x.StartDateTime).HasColumnName("start_datetime");
            entity.Property(x => x.EndDateTime).HasColumnName("end_datetime");
            entity.Property(x => x.IsBooked).HasColumnName("is_booked");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Alim).WithMany().HasForeignKey(x => x.AlimUserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServiceRequest>(entity =>
        {
            entity.ToTable("service_requests", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CustomerId).HasColumnName("customer_id");
            entity.Property(x => x.AlimId).HasColumnName("alim_id");
            entity.Property(x => x.ServiceId).HasColumnName("service_id");
            entity.Property(x => x.Fiqh).HasColumnName("fiqh").HasMaxLength(50);
            entity.Property(x => x.Location).HasColumnName("location").HasMaxLength(255);
            entity.Property(x => x.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            entity.Property(x => x.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            entity.Property(x => x.RequestDate).HasColumnName("request_date");
            entity.Property(x => x.RequestTime).HasColumnName("request_time");
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(x => x.Customer).WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(x => x.Alim).WithMany().HasForeignKey(x => x.AlimId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(x => x.Service).WithMany().HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.SetNull);
            entity.Property(x => x.IsRecurring).HasColumnName("is_recurring");
            entity.Property(x => x.RecurrenceType).HasColumnName("recurrence_type").HasMaxLength(20);
            entity.Property(x => x.RecurrenceDay).HasColumnName("recurrence_day");
            entity.Property(x => x.RecurrenceDate).HasColumnName("recurrence_date");
            entity.Property(x => x.StartDate).HasColumnName("start_date");
            entity.Property(x => x.EndDate).HasColumnName("end_date");
            entity.Property(x => x.ParentRequestId).HasColumnName("parent_request_id");
            entity.HasOne(x => x.ParentRequest).WithMany(x => x.Occurrences).HasForeignKey(x => x.ParentRequestId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("appointments", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ServiceRequestId).HasColumnName("service_request_id");
            entity.Property(x => x.ScheduledAt).HasColumnName("scheduled_at");
            entity.Property(x => x.DurationMinutes).HasColumnName("duration_minutes");
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(x => x.AlimFeedbackSkipped).HasColumnName("alim_feedback_skipped");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(x => x.ServiceRequest).WithMany().HasForeignKey(x => x.ServiceRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("reviews", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.AppointmentId).HasColumnName("appointment_id");
            entity.Property(x => x.ReviewerId).HasColumnName("reviewer_id");
            entity.Property(x => x.RevieweeId).HasColumnName("reviewee_id");
            entity.Property(x => x.Rating).HasColumnName("rating");
            entity.Property(x => x.Comment).HasColumnName("comment");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Reviewer).WithMany().HasForeignKey(x => x.ReviewerId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(x => x.Reviewee).WithMany().HasForeignKey(x => x.RevieweeId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<FavoriteAlim>(entity =>
        {
            entity.ToTable("favorite_alims", "dbo");
            entity.HasKey(x => new { x.CustomerId, x.AlimId });
            entity.Property(x => x.CustomerId).HasColumnName("customer_id");
            entity.Property(x => x.AlimId).HasColumnName("alim_id");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Customer).WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(x => x.Alim).WithMany().HasForeignKey(x => x.AlimId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<QuranEnrollment>(entity =>
        {
            entity.ToTable("quran_enrollments", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.StudentId).HasColumnName("student_id");
            entity.Property(x => x.TeacherId).HasColumnName("teacher_id");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(x => x.StudentAge).HasColumnName("student_age");
            entity.Property(x => x.Location).HasColumnName("location").HasMaxLength(255);
            entity.Property(x => x.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            entity.Property(x => x.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            entity.Property(x => x.ScheduleDay).HasColumnName("schedule_day");
            entity.Property(x => x.ScheduleTime).HasColumnName("schedule_time");
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.Property(x => x.RequestedAt).HasColumnName("requested_at");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(x => x.Teacher).WithMany().HasForeignKey(x => x.TeacherId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(x => new { x.StudentId, x.TeacherId }).IsUnique();
        });

        modelBuilder.Entity<QuranLesson>(entity =>
        {
            entity.ToTable("quran_lessons", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EnrollmentId).HasColumnName("enrollment_id");
            entity.Property(x => x.StudentId).HasColumnName("student_id");
            entity.Property(x => x.TeacherId).HasColumnName("teacher_id");
            entity.Property(x => x.LessonTitle).HasColumnName("lesson_title").HasMaxLength(255);
            entity.Property(x => x.LessonType).HasColumnName("lesson_type").HasMaxLength(20);
            entity.Property(x => x.LessonReference).HasColumnName("lesson_reference").HasMaxLength(255);
            entity.Property(x => x.LessonDate).HasColumnName("lesson_date");
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(x => x.Enrollment).WithMany().HasForeignKey(x => x.EnrollmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuranAttendance>(entity =>
        {
            entity.ToTable("quran_attendance", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EnrollmentId).HasColumnName("enrollment_id");
            entity.Property(x => x.StudentId).HasColumnName("student_id");
            entity.Property(x => x.TeacherId).HasColumnName("teacher_id");
            entity.Property(x => x.LessonId).HasColumnName("lesson_id");
            entity.Property(x => x.AttendanceDate).HasColumnName("attendance_date");
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Enrollment).WithMany().HasForeignKey(x => x.EnrollmentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(x => new { x.EnrollmentId, x.AttendanceDate }).IsUnique();
        });

        modelBuilder.Entity<QuranDatasetSource>(entity =>
        {
            entity.ToTable("quran_dataset_sources", "dbo");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SourceName).HasColumnName("source_name").HasMaxLength(255);
            entity.Property(x => x.LicenseName).HasColumnName("license_name").HasMaxLength(255);
            entity.Property(x => x.LicenseUrl).HasColumnName("license_url").HasMaxLength(1000);
            entity.Property(x => x.Version).HasColumnName("version").HasMaxLength(100);
            entity.Property(x => x.Sha256).HasColumnName("sha256").HasMaxLength(64);
            entity.Property(x => x.CopyrightNotice).HasColumnName("copyright_notice");
            entity.Property(x => x.ImportedAt).HasColumnName("imported_at");
            entity.Property(x => x.IsVerified).HasColumnName("is_verified");
        });

        modelBuilder.Entity<QuranSurah>(entity =>
        {
            entity.ToTable("quran_surahs", "dbo");
            entity.HasKey(x => x.Number);
            entity.Property(x => x.Number).HasColumnName("surah_number");
            entity.Property(x => x.SourceId).HasColumnName("source_id");
            entity.Property(x => x.ArabicName).HasColumnName("arabic_name").HasMaxLength(255);
            entity.Property(x => x.Transliteration).HasColumnName("transliteration").HasMaxLength(255);
            entity.Property(x => x.EnglishName).HasColumnName("english_name").HasMaxLength(255);
            entity.Property(x => x.AyahCount).HasColumnName("ayah_count");
            entity.HasOne(x => x.Source).WithMany(x => x.Surahs).HasForeignKey(x => x.SourceId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<QuranAyah>(entity =>
        {
            entity.ToTable("quran_ayahs", "dbo");
            entity.HasKey(x => new { x.SurahNumber, x.AyahNumber });
            entity.Property(x => x.SurahNumber).HasColumnName("surah_number");
            entity.Property(x => x.AyahNumber).HasColumnName("ayah_number");
            entity.Property(x => x.ArabicText).HasColumnName("arabic_text");
            entity.Property(x => x.UrduTranslation).HasColumnName("urdu_translation");
            entity.HasOne(x => x.Surah).WithMany(x => x.Ayahs).HasForeignKey(x => x.SurahNumber).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
