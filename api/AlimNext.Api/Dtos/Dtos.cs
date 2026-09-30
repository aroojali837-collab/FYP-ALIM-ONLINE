// Ye DTO classes frontend request aur API response ka data shape define karti hain.
namespace AlimNext.Api.Dtos;

public class RegisterRequest
{
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public int? Age { get; set; }
    public string? City { get; set; }
    public string? Fiqh { get; set; }
    public string? Bio { get; set; }
    public int? ExperienceYears { get; set; }
    public string? Area { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class SessionUserDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public int? Age { get; set; }
    public string? City { get; set; }
    public string? Fiqh { get; set; }
}

public class RegisterResponse
{
    public int UserId { get; set; }
    public SessionUserDto User { get; set; } = new();
}

public class ServiceUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? Price { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ServiceRequestCreateRequest
{
    public int CustomerId { get; set; }
    public int? AlimId { get; set; }
    public int? ServiceId { get; set; }
    public string? Fiqh { get; set; }
    public string? LocationAddress { get; set; }
    public string? Location { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? RequestDate { get; set; }
    public string? RequestTime { get; set; }
    public string? Notes { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurrenceType { get; set; }
    public byte? RecurrenceDay { get; set; }
    public byte? RecurrenceDate { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
}

public class ServiceRequestStatusUpdateRequest
{
    public string Status { get; set; } = string.Empty;
}

public class ServiceRequestAcceptRequest
{
    public int? AlimId { get; set; }
    public int? DurationMinutes { get; set; }
}

public class AppointmentCreateRequest
{
    public int CustomerId { get; set; }
    public int? AlimId { get; set; }
    public int? ServiceId { get; set; }
    public int? ServiceRequestId { get; set; }
    public string? AppointmentDate { get; set; }
    public string? AppointmentTime { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Notes { get; set; }
}

public class AppointmentStatusUpdateRequest
{
    public string Status { get; set; } = string.Empty;
    public bool SkipFeedback { get; set; }
}

public class ReviewCreateRequest
{
    public int? ReviewerId { get; set; }
    public int? CustomerId { get; set; }
    public int RevieweeId { get; set; }
    public int? AlimId { get; set; }
    public int? AppointmentId { get; set; }
    public byte Rating { get; set; }
    public string? Comment { get; set; }
    public string? ReviewText { get; set; }
}

public class AlimProfileUpsertRequest
{
    public int UserId { get; set; }
    public string? Bio { get; set; }
    public int? ExperienceYears { get; set; }
    public string? Languages { get; set; }
    public string? Area { get; set; }
    public string? City { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? SearchRadiusKm { get; set; }
    public string? AvailableTime { get; set; }
    public string? Qualification { get; set; }
    public string? Fiqh { get; set; }
    public List<string>? Services { get; set; }
}

public class AlimServiceUpsertRequest
{
    public int AlimUserId { get; set; }
    public int ServiceId { get; set; }
    public decimal? PriceOverride { get; set; }
}

public class AlimLanguageUpsertRequest
{
    public int AlimUserId { get; set; }
    public string Language { get; set; } = string.Empty;
}

public class AlimAvailabilityUpsertRequest
{
    public int AlimId { get; set; }
    public int AlimUserId { get; set; }
    public int DayOfWeek { get; set; }
    public byte? Weekday { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public DateTime? StartDateTime { get; set; }
    public DateTime? EndDateTime { get; set; }
    public bool IsRecurring { get; set; }
}

public class ProfileUpdateRequest
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public int? Age { get; set; }
    public string? City { get; set; }
    public string? Fiqh { get; set; }
}

public class AlimCardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Distance { get; set; } = string.Empty;
    public string? DistanceLabel { get; set; }
    public decimal Rating { get; set; }
    public int Reviews { get; set; }
    public string Time { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string Fiqh { get; set; } = string.Empty;
    public string Experience { get; set; } = string.Empty;
    public int? ExperienceYears { get; set; }
    public string Languages { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string? Qualification { get; set; }
    public List<AlimAvailabilityDto> Availability { get; set; } = [];
    public string? AreaLocation { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public double? DistanceKm { get; set; }
    public decimal SearchRadiusKm { get; set; }
    public bool IsWithinSearchRadius { get; set; }
    public List<string> Services { get; set; } = [];
    public List<AlimReviewDto> ReviewsList { get; set; } = [];
}

public class AlimAvailabilityDto
{
    public int Id { get; set; }
    public int DayOfWeek { get; set; }
    public string Day { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsRecurring { get; set; }
    public DateTime? StartDateTime { get; set; }
    public DateTime? EndDateTime { get; set; }
}

public class FavoriteRequest
{
    public int CustomerId { get; set; }
}

public class QuranEnrollmentRequest
{
    public int StudentId { get; set; }
    public int TeacherId { get; set; }
    public int? StudentAge { get; set; }
    public string? Location { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public byte? ScheduleDay { get; set; }
    public string? ScheduleTime { get; set; }
    public string? Notes { get; set; }
}

public class QuranLessonRequest
{
    public int StudentId { get; set; }
    public string LessonTitle { get; set; } = string.Empty;
    public string LessonType { get; set; } = "Quran";
    public string? LessonReference { get; set; }
    public string? LessonDate { get; set; }
    public string Status { get; set; } = "In Progress";
    public string? Notes { get; set; }
}

public class QuranAttendanceRequest
{
    public int StudentId { get; set; }
    public int? LessonId { get; set; }
    public string? AttendanceDate { get; set; }
    public string Status { get; set; } = "Present";
    public string? Notes { get; set; }
}

public class QuranTeacherProfileRequest
{
    public string? FullName { get; set; }
    public string? Bio { get; set; }
    public int? ExperienceYears { get; set; }
    public string? Area { get; set; }
    public string? City { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

public class QuranRequestDecision
{
    public string Status { get; set; } = string.Empty;
}

public class AlimReviewDto
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
