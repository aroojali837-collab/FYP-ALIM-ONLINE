// Ye domain models application ke users aur business records ko represent karte hain.
namespace AlimNext.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public int? Age { get; set; }
    public string? City { get; set; }
    public string? Fiqh { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public AlimProfile? AlimProfile { get; set; }
}

public class AlimProfile
{
    public int UserId { get; set; }
    public string? Bio { get; set; }
    public int? ExperienceYears { get; set; }
    public string? Qualification { get; set; }
    public decimal RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public string? Area { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal SearchRadiusKm { get; set; } = 25;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public User? User { get; set; }
}

public class Service
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? Price { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class AlimService
{
    public int AlimUserId { get; set; }
    public int ServiceId { get; set; }
    public decimal? PriceOverride { get; set; }

    public User? Alim { get; set; }
    public Service? Service { get; set; }
}

public class AlimLanguage
{
    public int AlimUserId { get; set; }
    public string Language { get; set; } = string.Empty;

    public User? Alim { get; set; }
}

public class AlimAvailability
{
    public int Id { get; set; }
    public int AlimUserId { get; set; }
    public bool IsRecurring { get; set; }
    public byte? Weekday { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public DateTime? StartDateTime { get; set; }
    public DateTime? EndDateTime { get; set; }
    public bool IsBooked { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? Alim { get; set; }
}

public class ServiceRequest
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int? AlimId { get; set; }
    public int? ServiceId { get; set; }
    public string? Fiqh { get; set; }
    public string? Location { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateOnly? RequestDate { get; set; }
    public TimeOnly? RequestTime { get; set; }
    public string Status { get; set; } = "pending";
    public string? Notes { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurrenceType { get; set; }
    public byte? RecurrenceDay { get; set; }
    public byte? RecurrenceDate { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? ParentRequestId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public User? Customer { get; set; }
    public User? Alim { get; set; }
    public Service? Service { get; set; }
    public ServiceRequest? ParentRequest { get; set; }
    public ICollection<ServiceRequest> Occurrences { get; set; } = [];
}

public class Appointment
{
    public int Id { get; set; }
    public int ServiceRequestId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string Status { get; set; } = "scheduled";
    public bool AlimFeedbackSkipped { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ServiceRequest? ServiceRequest { get; set; }
}

public class Review
{
    public int Id { get; set; }
    public int? AppointmentId { get; set; }
    public int? ReviewerId { get; set; }
    public int RevieweeId { get; set; }
    public byte Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? Reviewer { get; set; }
    public User? Reviewee { get; set; }
}

public class FavoriteAlim
{
    public int CustomerId { get; set; }
    public int AlimId { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? Customer { get; set; }
    public User? Alim { get; set; }
}

public class QuranEnrollment
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int TeacherId { get; set; }
    public bool IsActive { get; set; }
    public string Status { get; set; } = "pending";
    public int? StudentAge { get; set; }
    public string? Location { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public byte? ScheduleDay { get; set; }
    public TimeOnly? ScheduleTime { get; set; }
    public string? Notes { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public User? Student { get; set; }
    public User? Teacher { get; set; }
}

public class QuranLesson
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int StudentId { get; set; }
    public int TeacherId { get; set; }
    public string LessonTitle { get; set; } = string.Empty;
    public string LessonType { get; set; } = "Quran";
    public string? LessonReference { get; set; }
    public DateOnly LessonDate { get; set; }
    public string Status { get; set; } = "In Progress";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public QuranEnrollment? Enrollment { get; set; }
}

public class QuranAttendance
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int StudentId { get; set; }
    public int TeacherId { get; set; }
    public int? LessonId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public string Status { get; set; } = "Present";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    public QuranEnrollment? Enrollment { get; set; }
    public QuranLesson? Lesson { get; set; }
}

public class QuranDatasetSource
{
    public int Id { get; set; }
    public string SourceName { get; set; } = string.Empty;
    public string LicenseName { get; set; } = string.Empty;
    public string LicenseUrl { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Sha256 { get; set; } = string.Empty;
    public string? CopyrightNotice { get; set; }
    public DateTime ImportedAt { get; set; }
    public bool IsVerified { get; set; }
    public ICollection<QuranSurah> Surahs { get; set; } = [];
}

public class QuranSurah
{
    public byte Number { get; set; }
    public int SourceId { get; set; }
    public string ArabicName { get; set; } = string.Empty;
    public string Transliteration { get; set; } = string.Empty;
    public string EnglishName { get; set; } = string.Empty;
    public short AyahCount { get; set; }
    public QuranDatasetSource? Source { get; set; }
    public ICollection<QuranAyah> Ayahs { get; set; } = [];
}

public class QuranAyah
{
    public byte SurahNumber { get; set; }
    public short AyahNumber { get; set; }
    public string ArabicText { get; set; } = string.Empty;
    public string UrduTranslation { get; set; } = string.Empty;
    public QuranSurah? Surah { get; set; }
}
