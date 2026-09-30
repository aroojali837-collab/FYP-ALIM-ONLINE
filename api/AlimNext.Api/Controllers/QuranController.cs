// Ye controller Quran teachers, enrollment, lessons, attendance aur progress handle karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/quran")]
public class QuranController(AlimNextDbContext db) : ControllerBase
{
    // Sirf verified local dataset ke Surah names aur ayah counts return karta hai.
    [HttpGet("catalog")]
    public async Task<IActionResult> GetVerifiedCatalog()
    {
        var catalog = await db.QuranSurahs.AsNoTracking()
            .Where(x => x.Source!.IsVerified)
            .OrderBy(x => x.Number)
            .Select(x => new { number = x.Number, arabicName = x.ArabicName, transliteration = x.Transliteration, englishName = x.EnglishName, ayahCount = x.AyahCount })
            .ToListAsync();
        return Ok(catalog);
    }

    // Selected range ka exact Arabic aur Urdu text local SQL Server se read karta hai.
    [HttpGet("content")]
    public async Task<IActionResult> GetVerifiedContent([FromQuery] byte surahNumber, [FromQuery] short ayahStart, [FromQuery] short ayahEnd)
    {
        if (surahNumber is < 1 or > 114 || ayahStart < 1 || ayahEnd < ayahStart) return BadRequest(new { error = "Invalid Surah or ayah range." });
        var surah = await db.QuranSurahs.AsNoTracking().Where(x => x.Number == surahNumber && x.Source!.IsVerified).Select(x => new { x.Number, x.ArabicName, x.Transliteration, x.EnglishName, x.AyahCount, source = new { x.Source!.SourceName, x.Source.Version, x.Source.LicenseName, x.Source.LicenseUrl, x.Source.CopyrightNotice } }).FirstOrDefaultAsync();
        if (surah is null) return NotFound(new { error = "Verified Quran dataset is not imported yet." });
        if (ayahEnd > surah.AyahCount) return BadRequest(new { error = "Ayah range exceeds this Surah." });
        var ayahs = await db.QuranAyahs.AsNoTracking().Where(x => x.SurahNumber == surahNumber && x.AyahNumber >= ayahStart && x.AyahNumber <= ayahEnd).OrderBy(x => x.AyahNumber).Select(x => new { number = x.AyahNumber, arabicText = x.ArabicText, urduTranslation = x.UrduTranslation }).ToListAsync();
        if (ayahs.Count != ayahEnd - ayahStart + 1) return NotFound(new { error = "Verified ayah content is incomplete for this range." });
        return Ok(new { surah, ayahs });
    }

    // Coordinates ke basis par Quran teachers ko distance ke saath search karta hai.
    [HttpGet("teachers")]
    public async Task<IActionResult> GetTeachers([FromQuery] double? latitude, [FromQuery] double? longitude, [FromQuery] double? radiusKm, [FromQuery] List<byte>? days, [FromQuery] string? time)
    {
        var teachers = await db.Users.AsNoTracking()
            .Where(x => x.Role == "alim" && x.IsActive && db.AlimServices.Any(a => a.AlimUserId == x.Id && db.Services.Any(s => s.Id == a.ServiceId && s.IsActive && s.Name == "Quran Tutor")))
            .Select(x => new
            {
                id = x.Id,
                fullName = x.FullName,
                email = x.Email,
                phone = x.Phone,
                avatarUrl = x.AvatarUrl,
                city = x.City,
                area = x.AlimProfile!.Area,
                bio = x.AlimProfile.Bio,
                education = x.AlimProfile.Qualification,
                experienceYears = x.AlimProfile.ExperienceYears,
                latitude = x.AlimProfile.Latitude,
                longitude = x.AlimProfile.Longitude
                ,availability = db.AlimAvailability.Where(a => a.AlimUserId == x.Id && !a.IsBooked).Select(a => new { a.Weekday, a.StartTime, a.EndTime }).ToList()
            })
            .ToListAsync();
        TimeOnly? requestedTime = TimeOnly.TryParse(time, out var parsedTime) ? parsedTime : null;
        var result = teachers.Select(teacher => new
        {
            teacher.id, teacher.fullName, teacher.email, teacher.phone, teacher.avatarUrl, teacher.city, teacher.area, teacher.bio, teacher.education, teacher.experienceYears,
            teacher.latitude, teacher.longitude,
            availability = teacher.availability,
            distanceKm = latitude.HasValue && longitude.HasValue && teacher.latitude.HasValue && teacher.longitude.HasValue
                ? CalculateDistanceKm(latitude.Value, longitude.Value, (double)teacher.latitude.Value, (double)teacher.longitude.Value)
                : (double?)null
        }).Where(x => days is null || days.Count == 0 || x.availability.Any(a => a.Weekday.HasValue && days.Contains(a.Weekday.Value) && (!requestedTime.HasValue || (a.StartTime.HasValue && a.EndTime.HasValue && a.StartTime.Value <= requestedTime.Value && a.EndTime.Value >= requestedTime.Value))))
        .OrderBy(x => x.distanceKm ?? double.MaxValue).ToList();
        return Ok(result);
    }

    // Selected Quran teacher ka public profile return karta hai.
    [HttpGet("teachers/{id:int}")]
    public async Task<IActionResult> GetTeacher(int id)
    {
        var teacher = await db.Users.AsNoTracking()
            .Where(x => x.Id == id && x.Role == "alim" && x.IsActive && db.AlimServices.Any(a => a.AlimUserId == x.Id && db.Services.Any(s => s.Id == a.ServiceId && s.IsActive && s.Name == "Quran Tutor")))
            .Select(x => new { id = x.Id, fullName = x.FullName, email = x.Email, phone = x.Phone, avatarUrl = x.AvatarUrl, city = x.City, area = x.AlimProfile!.Area, bio = x.AlimProfile.Bio, education = x.AlimProfile.Qualification, experienceYears = x.AlimProfile.ExperienceYears, latitude = x.AlimProfile.Latitude, longitude = x.AlimProfile.Longitude })
            .FirstOrDefaultAsync();
        return teacher is null ? NotFound(new { error = "Quran teacher not found." }) : Ok(teacher);
    }

    // Student ke Quran enrollments read karta hai.
    [HttpGet("enrollments")]
    public async Task<IActionResult> GetEnrollments([FromQuery] int studentId)
    {
        if (!await db.Users.AnyAsync(x => x.Id == studentId && x.Role == "customer" && x.IsActive))
            return StatusCode(403, new { error = "Only students can view their enrollments." });
        var enrollments = await db.QuranEnrollments.AsNoTracking().Where(x => x.StudentId == studentId && x.IsActive).Select(x => new { x.Id, x.TeacherId, teacherName = x.Teacher!.FullName, x.CreatedAt }).ToListAsync();
        return Ok(enrollments);
    }

    // Quran teacher apna profile/location update karta hai.
    [HttpPut("teachers/{id:int}")]
    public async Task<IActionResult> UpdateTeacher(int id, QuranTeacherProfileRequest request)
    {
        var teacher = await db.Users.FirstOrDefaultAsync(x => x.Id == id && x.Role == "alim" && x.IsActive);
        if (teacher is null) return NotFound(new { error = "Quran teacher not found." });
        teacher.FullName = request.FullName?.Trim() ?? teacher.FullName;
        teacher.City = request.City ?? teacher.City;
        teacher.UpdatedAt = DateTime.UtcNow;
        var profile = await db.AlimProfiles.FindAsync(id);
        if (profile is null)
        {
            profile = new AlimProfile { UserId = id, CreatedAt = DateTime.UtcNow };
            db.AlimProfiles.Add(profile);
        }
        profile.Bio = request.Bio;
        profile.ExperienceYears = request.ExperienceYears;
        profile.Area = request.Area;
        profile.Latitude = request.Latitude;
        profile.Longitude = request.Longitude;
        profile.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // Accepted enrollments mein teacher ke assigned students return karta hai.
    [HttpGet("students")]
    public async Task<IActionResult> GetStudents([FromQuery] int teacherId)
    {
        if (!await IsTeacher(teacherId)) return StatusCode(403, new { error = "Only Quran teachers can access teacher records." });
        var students = await db.QuranEnrollments.AsNoTracking()
            .Where(x => x.TeacherId == teacherId && x.IsActive && x.Status == "accepted")
            .Select(x => new { enrollmentId = x.Id, studentId = x.StudentId, studentName = x.Student!.FullName, email = x.Student.Email })
            .ToListAsync();
        return Ok(students);
    }

    // Alim dashboard tutoring cards ke liye live database counts return karta hai.
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] int teacherId)
    {
        if (!await IsTeacher(teacherId)) return StatusCode(403, new { error = "Quran Tutor service is not enabled for this Alim." });
        var today = DateOnly.FromDateTime(DateTime.Now);
        var accepted = db.QuranEnrollments.Where(x => x.TeacherId == teacherId && x.IsActive && x.Status == "accepted");
        var lessons = db.QuranLessons.Where(x => x.TeacherId == teacherId);
        var attendance = db.QuranAttendance.Where(x => x.TeacherId == teacherId);
        return Ok(new
        {
            totalStudents = await accepted.CountAsync(),
            classesToday = await accepted.CountAsync(x => x.ScheduleDay == (byte)today.DayOfWeek),
            presentToday = await attendance.CountAsync(x => x.AttendanceDate == today && x.Status == "Present"),
            lessonsCompleted = await lessons.CountAsync(x => x.Status == "Completed")
        });
    }

    // Customer ka Quran class enrollment request create karta hai.
    [HttpPost("enrollments")]
    public async Task<IActionResult> Enroll(QuranEnrollmentRequest request)
    {
        if (!await IsTeacher(request.TeacherId)) return StatusCode(403, new { error = "Selected Quran teacher was not found." });
        if (!await db.Users.AnyAsync(x => x.Id == request.StudentId && x.Role == "customer" && x.IsActive))
            return BadRequest(new { error = "Student not found." });

        if (request.ScheduleDay is < 0 or > 6) return BadRequest(new { error = "Schedule day is invalid." });
        TimeOnly? scheduleTime = TimeOnly.TryParse(request.ScheduleTime, out var parsedScheduleTime) ? parsedScheduleTime : null;
        if (request.ScheduleTime is not null && scheduleTime is null) return BadRequest(new { error = "Schedule time is invalid." });
        var enrollment = await db.QuranEnrollments.FirstOrDefaultAsync(x => x.StudentId == request.StudentId && x.TeacherId == request.TeacherId);
        if (enrollment is null)
        {
            enrollment = new QuranEnrollment { StudentId = request.StudentId, TeacherId = request.TeacherId, IsActive = false, Status = "pending", StudentAge = request.StudentAge, Location = request.Location, Latitude = request.Latitude, Longitude = request.Longitude, ScheduleDay = request.ScheduleDay, ScheduleTime = scheduleTime, Notes = request.Notes, RequestedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
            db.QuranEnrollments.Add(enrollment);
        }
        else
        {
            enrollment.IsActive = false;
            enrollment.Status = "pending";
            enrollment.StudentAge = request.StudentAge;
            enrollment.Location = request.Location;
            enrollment.Latitude = request.Latitude;
            enrollment.Longitude = request.Longitude;
            enrollment.ScheduleDay = request.ScheduleDay;
            enrollment.ScheduleTime = scheduleTime;
            enrollment.Notes = request.Notes;
            enrollment.RequestedAt = DateTime.UtcNow;
            enrollment.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
        return Ok(new { enrollmentId = enrollment.Id, studentId = enrollment.StudentId, teacherId = enrollment.TeacherId, status = enrollment.Status });
    }

    // Teacher ke pending enrollment requests return karta hai.
    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests([FromQuery] int teacherId)
    {
        if (!await IsTeacher(teacherId)) return StatusCode(403, new { error = "Only Quran teachers can view requests." });
        var requests = await db.QuranEnrollments.AsNoTracking().Where(x => x.TeacherId == teacherId && x.Status == "pending").OrderByDescending(x => x.RequestedAt).Select(x => new { enrollmentId = x.Id, studentId = x.StudentId, studentName = x.Student!.FullName, email = x.Student.Email, phone = x.Student.Phone, age = x.StudentAge ?? x.Student.Age, location = x.Location, latitude = x.Latitude, longitude = x.Longitude, notes = x.Notes, requestedAt = x.RequestedAt }).ToListAsync();
        return Ok(requests);
    }

    // Teacher enrollment request accept ya reject karta hai.
    [HttpPatch("requests/{id:int}")]
    public async Task<IActionResult> RespondToRequest(int id, [FromQuery] int teacherId, [FromBody] QuranRequestDecision request)
    {
        if (!await IsTeacher(teacherId)) return StatusCode(403, new { error = "Only Quran teachers can respond to requests." });
        if (request.Status is not ("accepted" or "rejected")) return BadRequest(new { error = "Request status must be accepted or rejected." });
        var enrollment = await db.QuranEnrollments.FirstOrDefaultAsync(x => x.Id == id && x.TeacherId == teacherId && x.Status == "pending");
        if (enrollment is null) return NotFound(new { error = "Request not found." });
        enrollment.Status = request.Status;
        enrollment.IsActive = request.Status == "accepted";
        enrollment.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { enrollmentId = enrollment.Id, status = enrollment.Status });
    }

    // Student aur teacher ki date-wise lesson/attendance history return karta hai.
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int studentId, [FromQuery] int teacherId)
    {
        if (!await IsTeacher(teacherId)) return StatusCode(403, new { error = "Only Quran teachers can view this history." });
        var enrollment = await FindEnrollment(studentId, teacherId);
        if (enrollment is null) return NotFound(new { error = "Quran enrollment not found." });
        var lessons = await db.QuranLessons.AsNoTracking().Where(x => x.EnrollmentId == enrollment.Id).ToListAsync();
        var attendance = await db.QuranAttendance.AsNoTracking().Where(x => x.EnrollmentId == enrollment.Id).ToListAsync();
        var dates = lessons.Select(x => x.LessonDate).Concat(attendance.Select(x => x.AttendanceDate)).Distinct().OrderByDescending(x => x);
        return Ok(new
        {
            enrollmentId = enrollment.Id, enrolledAt = enrollment.CreatedAt,
            student = await db.Users.Where(x => x.Id == studentId).Select(x => new { x.Id, x.FullName, x.Email }).FirstAsync(),
            history = dates.Select(date => new
            {
                date,
                attendance = attendance.Where(x => x.AttendanceDate == date).Select(x => new { x.Status, x.Notes }).FirstOrDefault(),
                lessons = lessons.Where(x => x.LessonDate == date).Select(x => new { x.LessonTitle, x.LessonType, x.Status, x.Notes }).ToList()
            })
        });
    }

    // Student ke lessons read karta hai.
    [HttpGet("lessons")]
    public async Task<IActionResult> GetLessons([FromQuery] int studentId, [FromQuery] int? teacherId)
    {
        var enrollment = await FindEnrollment(studentId, teacherId);
        if (enrollment is null) return NotFound(new { error = "Quran enrollment not found." });
        var lessons = await db.QuranLessons.AsNoTracking().Where(x => x.EnrollmentId == enrollment.Id).OrderByDescending(x => x.LessonDate).ThenByDescending(x => x.Id).ToListAsync();
        return Ok(lessons);
    }

    // Authorized teacher student ka lesson add karta hai.
    [HttpPost("lessons")]
    public async Task<IActionResult> AddLesson(QuranLessonRequest request, [FromQuery] int teacherId)
    {
        if (!await IsTeacher(teacherId)) return StatusCode(403, new { error = "Only Quran teachers can add lessons." });
        var enrollment = await FindEnrollment(request.StudentId, teacherId);
        if (enrollment is null) return BadRequest(new { error = "Student is not assigned to this teacher." });
        if (string.IsNullOrWhiteSpace(request.LessonTitle)) return BadRequest(new { error = "Lesson title is required." });
        if (!DateOnly.TryParse(request.LessonDate, out var lessonDate)) lessonDate = DateOnly.FromDateTime(DateTime.UtcNow);

        var lesson = new QuranLesson
        {
            EnrollmentId = enrollment.Id, StudentId = request.StudentId, TeacherId = teacherId,
            LessonTitle = request.LessonTitle.Trim(), LessonType = request.LessonType.Trim(), LessonReference = request.LessonReference,
            LessonDate = lessonDate, Status = request.Status.Trim(), Notes = request.Notes, CreatedAt = DateTime.UtcNow
        };
        db.QuranLessons.Add(lesson);
        await db.SaveChangesAsync();
        return Ok(lesson);
    }

    // Authorized teacher existing lesson update karta hai.
    [HttpPut("lessons/{id:int}")]
    public async Task<IActionResult> UpdateLesson(int id, QuranLessonRequest request, [FromQuery] int teacherId)
    {
        if (!await IsTeacher(teacherId)) return StatusCode(403, new { error = "Only Quran teachers can update lessons." });
        var lesson = await db.QuranLessons.FirstOrDefaultAsync(x => x.Id == id && x.TeacherId == teacherId);
        if (lesson is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(request.LessonTitle)) lesson.LessonTitle = request.LessonTitle.Trim();
        lesson.LessonType = request.LessonType.Trim(); lesson.LessonReference = request.LessonReference; lesson.Status = request.Status.Trim(); lesson.Notes = request.Notes; lesson.UpdatedAt = DateTime.UtcNow;
        if (DateOnly.TryParse(request.LessonDate, out var date)) lesson.LessonDate = date;
        await db.SaveChangesAsync();
        return Ok(lesson);
    }

    // Student ki attendance history read karta hai.
    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendance([FromQuery] int studentId, [FromQuery] int? teacherId)
    {
        var enrollment = await FindEnrollment(studentId, teacherId);
        if (enrollment is null) return NotFound(new { error = "Quran enrollment not found." });
        var attendance = await db.QuranAttendance.AsNoTracking().Include(x => x.Lesson).Where(x => x.EnrollmentId == enrollment.Id).OrderByDescending(x => x.AttendanceDate).ToListAsync();
        return Ok(attendance);
    }

    // Authorized teacher attendance mark karta hai.
    [HttpPost("attendance")]
    public async Task<IActionResult> MarkAttendance(QuranAttendanceRequest request, [FromQuery] int teacherId)
    {
        if (!await IsTeacher(teacherId)) return StatusCode(403, new { error = "Only Quran teachers can mark attendance." });
        var enrollment = await FindEnrollment(request.StudentId, teacherId);
        if (enrollment is null) return BadRequest(new { error = "Student is not assigned to this teacher." });
        var date = DateOnly.TryParse(request.AttendanceDate, out var parsedDate) ? parsedDate : DateOnly.FromDateTime(DateTime.UtcNow);
        var validStatuses = new[] { "Present", "Absent", "Late" };
        if (!validStatuses.Contains(request.Status, StringComparer.OrdinalIgnoreCase)) return BadRequest(new { error = "Attendance status must be Present, Absent, or Late." });
        var attendance = await db.QuranAttendance.FirstOrDefaultAsync(x => x.EnrollmentId == enrollment.Id && x.AttendanceDate == date);
        if (attendance is null)
        {
            attendance = new QuranAttendance { EnrollmentId = enrollment.Id, StudentId = request.StudentId, TeacherId = teacherId, AttendanceDate = date, CreatedAt = DateTime.UtcNow };
            db.QuranAttendance.Add(attendance);
        }
        attendance.LessonId = request.LessonId; attendance.Status = validStatuses.First(x => x.Equals(request.Status, StringComparison.OrdinalIgnoreCase)); attendance.Notes = request.Notes;
        await db.SaveChangesAsync();
        return Ok(attendance);
    }

    // Student ka summary progress calculate karta hai.
    [HttpGet("progress/{studentId:int}")]
    public async Task<IActionResult> GetProgress(int studentId, [FromQuery] int? teacherId)
    {
        var enrollment = await FindEnrollment(studentId, teacherId);
        if (enrollment is null) return NotFound(new { error = "Quran enrollment not found." });
        var lessons = await db.QuranLessons.AsNoTracking().Where(x => x.EnrollmentId == enrollment.Id).OrderByDescending(x => x.LessonDate).ToListAsync();
        var attendance = await db.QuranAttendance.AsNoTracking().Where(x => x.EnrollmentId == enrollment.Id).ToListAsync();
        return Ok(new
        {
            studentId, teacherId = enrollment.TeacherId, totalLessons = lessons.Count,
            completedLessons = lessons.Count(x => x.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)),
            currentLesson = lessons.FirstOrDefault(x => !x.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)) ?? lessons.FirstOrDefault(),
            previousLessons = lessons.Where(x => x.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)).ToList(),
            attendancePresent = attendance.Count(x => x.Status.Equals("Present", StringComparison.OrdinalIgnoreCase) || x.Status.Equals("Late", StringComparison.OrdinalIgnoreCase)),
            attendanceTotal = attendance.Count,
            attendancePresentOnly = attendance.Count(x => x.Status.Equals("Present", StringComparison.OrdinalIgnoreCase)),
            attendanceAbsent = attendance.Count(x => x.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase)),
            attendanceLate = attendance.Count(x => x.Status.Equals("Late", StringComparison.OrdinalIgnoreCase)),
            scheduleDay = enrollment.ScheduleDay, scheduleTime = enrollment.ScheduleTime?.ToString("HH:mm"), teacherName = await db.Users.Where(x => x.Id == enrollment.TeacherId).Select(x => x.FullName).FirstOrDefaultAsync(), recentLessons = lessons.Take(10)
        });
    }

    // Student aur teacher ka valid active enrollment find karta hai.
    private async Task<QuranEnrollment?> FindEnrollment(int studentId, int? teacherId)
    {
        var query = db.QuranEnrollments.Where(x => x.StudentId == studentId && x.IsActive && x.Status == "accepted");
        if (teacherId.HasValue) query = query.Where(x => x.TeacherId == teacherId.Value);
        return await query.FirstOrDefaultAsync();
    }

    // Confirm karta hai ke user active Quran teacher hai.
    private Task<bool> IsTeacher(int id) => db.Users.AnyAsync(x => x.Id == id && x.Role == "alim" && x.IsActive && db.AlimServices.Any(a => a.AlimUserId == id && db.Services.Any(s => s.Id == a.ServiceId && s.IsActive && s.Name == "Quran Tutor")));

    // Haversine formula se do coordinates ke darmiyan kilometers calculate karta hai.
    private static double CalculateDistanceKm(double latitude1, double longitude1, double latitude2, double longitude2)
    {
        const double earthRadiusKm = 6371;
        var latitudeDelta = (latitude2 - latitude1) * Math.PI / 180;
        var longitudeDelta = (longitude2 - longitude1) * Math.PI / 180;
        var a = Math.Sin(latitudeDelta / 2) * Math.Sin(latitudeDelta / 2) + Math.Cos(latitude1 * Math.PI / 180) * Math.Cos(latitude2 * Math.PI / 180) * Math.Sin(longitudeDelta / 2) * Math.Sin(longitudeDelta / 2);
        return earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
