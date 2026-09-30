// Ye controller Aalim listing, profile, services aur distance search handle karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/alims")]
public class AlimsController(AlimNextDbContext db) : ControllerBase
{
    // Query filters ke mutabiq available Aalims ki list banata hai.
    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] string? city,
        [FromQuery] string? location,
        [FromQuery] string? fiqh,
        [FromQuery] int? serviceId,
        [FromQuery] string? requestDate,
        [FromQuery] string? requestTime,
        [FromQuery] string? sort,
        [FromQuery] bool includeOutOfRange = false,
        [FromQuery] bool outOfRange = false,
        [FromQuery] string? name = null,
        [FromQuery] double? latitude = null,
        [FromQuery] double? longitude = null)
    {
        DateOnly parsedDate = default;
        TimeOnly parsedTime = default;
        var hasRequestedSchedule =
            DateOnly.TryParse(requestDate, out parsedDate) &&
            TimeOnly.TryParse(requestTime, out parsedTime);

        var all = await BuildAlimCardsAsync(
            serviceId,
            fiqh,
            location,
            hasRequestedSchedule ? parsedDate : null,
            hasRequestedSchedule ? parsedTime : null,
            latitude,
            longitude);

        if (!string.IsNullOrWhiteSpace(fiqh))
        {
            all = all.Where(x => string.Equals(x.Fiqh, fiqh, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            all = all.Where(x => x.Name.Contains(name, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        // Customer ke location ke mutabiq Alim ki saved range ke andar ya bahar filter karta hai.
        if (latitude.HasValue && longitude.HasValue)
        {
            // Out of Range Search mein customer ko selected fiqh/service ke tamam Aalims milte hain.
            if (!outOfRange && !includeOutOfRange)
            {
                all = all.Where(x => x.IsWithinSearchRadius).ToList();
            }
        }

        all = string.Equals(sort, "rating", StringComparison.OrdinalIgnoreCase)
            ? all.OrderByDescending(x => x.Rating).ThenBy(x => x.Name).ToList()
            : all.OrderBy(x => x.DistanceKm ?? double.MaxValue).ThenBy(x => x.Name).ToList();

        return Ok(new { alims = all });
    }

    // Ek Aalim ka complete profile aur related data return karta hai.
    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id)
    {
        var alim = (await BuildAlimCardsAsync()).FirstOrDefault(x => x.Id == id);
        return alim is null ? NotFound(new { error = "Alim not found." }) : Ok(alim);
    }

    // Aalim ka profile/location data create ya update karta hai.
    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, AlimProfileUpsertRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null || user.Role != "alim" || !user.IsActive)
        {
            return NotFound(new { error = "Alim not found." });
        }

        user.City = request.City ?? user.City;
        user.Fiqh = request.Fiqh is { Length: > 0 } ? request.Fiqh : user.Fiqh;
        user.UpdatedAt = DateTime.UtcNow;

        var profile = await db.AlimProfiles.FindAsync(id);
        if (profile is null)
        {
            profile = new AlimProfile
            {
                UserId = id,
                Bio = request.Bio,
                ExperienceYears = request.ExperienceYears,
                Qualification = request.Qualification,
                Area = request.Area,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                SearchRadiusKm = request.SearchRadiusKm is > 0 ? request.SearchRadiusKm.Value : 25,
                CreatedAt = DateTime.UtcNow
            };
            db.AlimProfiles.Add(profile);
        }
        else
        {
            profile.Bio = request.Bio;
            profile.ExperienceYears = request.ExperienceYears;
            profile.Qualification = request.Qualification;
            profile.Area = request.Area;
            profile.Latitude = request.Latitude;
            profile.Longitude = request.Longitude;
            if (request.SearchRadiusKm is > 0)
            {
                profile.SearchRadiusKm = request.SearchRadiusKm.Value;
            }
            profile.UpdatedAt = DateTime.UtcNow;
        }

        if (request.Services is not null)
        {
            var selectedNames = request.Services
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var activeServices = await db.Services.Where(service => service.IsActive).ToListAsync();
            var selectedServiceIds = activeServices
                .Where(service => selectedNames.Any(name =>
                    string.Equals(name, service.Name, StringComparison.OrdinalIgnoreCase) ||
                    (string.Equals(name, "Janaza", StringComparison.OrdinalIgnoreCase) &&
                     string.Equals(service.Name, "Janazah", StringComparison.OrdinalIgnoreCase))))
                .Select(service => service.Id)
                .ToList();
            var currentAssignments = await db.AlimServices
                .Where(assignment => assignment.AlimUserId == id)
                .ToListAsync();

            db.AlimServices.RemoveRange(currentAssignments
                .Where(assignment => !selectedServiceIds.Contains(assignment.ServiceId)));
            var currentServiceIds = currentAssignments.Select(assignment => assignment.ServiceId).ToHashSet();
            db.AlimServices.AddRange(selectedServiceIds
                .Where(serviceId => !currentServiceIds.Contains(serviceId))
                .Select(serviceId => new AlimService { AlimUserId = id, ServiceId = serviceId }));
        }

        await db.SaveChangesAsync();
        var savedServices = await db.AlimServices.AsNoTracking()
            .Where(x => x.AlimUserId == id)
            .Join(db.Services, assignment => assignment.ServiceId, service => service.Id, (_, service) => service.Name)
            .ToListAsync();
        return Ok(new { success = true, services = savedServices });
    }

    // Aalim ke profile ke saath service attach karta hai.
    [HttpPost("services")]
    public async Task<IActionResult> AddService(AlimServiceUpsertRequest request)
    {
        if (!await db.Users.AnyAsync(u => u.Id == request.AlimUserId && u.Role == "alim"))
        {
            return BadRequest(new { error = "Alim user not found." });
        }

        var service = await db.Services.FindAsync(request.ServiceId);
        if (service is null || !service.IsActive)
        {
            return BadRequest(new { error = "Service not found or inactive." });
        }

        var exists = await db.AlimServices.FindAsync(request.AlimUserId, request.ServiceId);
        if (exists is not null)
        {
            return Conflict(new { error = "Service already added for this alim." });
        }

        db.AlimServices.Add(new AlimService
        {
            AlimUserId = request.AlimUserId,
            ServiceId = request.ServiceId,
            PriceOverride = request.PriceOverride
        });

        await db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // Aalim ke profile se service remove karta hai.
    [HttpDelete("services/{alimUserId:int}/{serviceId:int}")]
    public async Task<IActionResult> RemoveService(int alimUserId, int serviceId)
    {
        var entity = await db.AlimServices.FindAsync(alimUserId, serviceId);
        if (entity is null)
        {
            return NotFound(new { error = "Alim service not found." });
        }

        db.AlimServices.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Database records ko cards mein map karke distance calculate karta hai.
    private async Task<List<AlimCardDto>> BuildAlimCardsAsync(
        int? serviceId = null,
        string? requestedFiqh = null,
        string? requestedLocation = null,
        DateOnly? requestedDate = null,
        TimeOnly? requestedTime = null,
        double? requestedLatitude = null,
        double? requestedLongitude = null)
    {
        var users = await db.Users.AsNoTracking()
            .Where(x => x.Role == "alim" && x.IsActive)
            .OrderBy(x => x.FullName)
            .Select(x => new User
            {
                Id = x.Id,
                Role = x.Role,
                FullName = x.FullName,
                AvatarUrl = x.AvatarUrl,
                City = x.City,
                Fiqh = x.Fiqh,
                IsActive = x.IsActive
            })
            .ToListAsync();

        var alimServices = await db.AlimServices.AsNoTracking().ToListAsync();
        var services = await db.Services.AsNoTracking().ToListAsync();
        var profiles = await db.AlimProfiles.AsNoTracking().ToListAsync();
        var languages = await db.AlimLanguages.AsNoTracking().ToListAsync();
        var reviews = await db.Reviews.AsNoTracking().ToListAsync();
        var availability = await db.AlimAvailability.AsNoTracking().ToListAsync();

        var eligibleUsers = users.Where(u =>
        {
            if (serviceId.HasValue && !alimServices.Any(x => x.AlimUserId == u.Id && x.ServiceId == serviceId.Value))
            {
                return false;
            }

            if (requestedDate.HasValue && requestedTime.HasValue)
            {
                var requestDateTime = requestedDate.Value.ToDateTime(requestedTime.Value);
                var hasMatchingAvailability = availability.Any(a =>
                    a.AlimUserId == u.Id && !a.IsBooked &&
                    (a.IsRecurring
                        ? a.Weekday == (byte)requestedDate.Value.DayOfWeek &&
                          a.StartTime.HasValue && a.EndTime.HasValue &&
                          a.StartTime.Value <= requestedTime.Value && a.EndTime.Value > requestedTime.Value
                        : a.StartDateTime.HasValue && a.EndDateTime.HasValue &&
                          a.StartDateTime.Value <= requestDateTime && a.EndDateTime.Value > requestDateTime));

                if (!hasMatchingAvailability)
                {
                    return false;
                }
            }

            if (!string.IsNullOrWhiteSpace(requestedFiqh) && !string.Equals(NormalizeFiqh(u.Fiqh), requestedFiqh, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return true;
        }).ToList();

        return eligibleUsers.Select(u =>
        {
            var profile = profiles.FirstOrDefault(p => p.UserId == u.Id);
            var reviewSet = reviews.Where(r => r.RevieweeId == u.Id).ToList();
            var avgRating = reviewSet.Count == 0
                ? profile?.RatingAvg ?? 0m
                : (decimal)Math.Round(reviewSet.Average(r => r.Rating), 2);
            var ratingCount = reviewSet.Count == 0 ? profile?.RatingCount ?? 0 : reviewSet.Count;
            var alimLanguages = languages.Where(l => l.AlimUserId == u.Id).Select(l => l.Language).ToList();
            var nextAvailability = availability
                .Where(a => a.AlimUserId == u.Id)
                .Where(a => !a.IsBooked)
                .OrderByDescending(a => a.IsRecurring)
                .ThenBy(a => a.StartDateTime ?? DateTime.MaxValue)
                .FirstOrDefault();

            var allAvailability = availability
                .Where(a => a.AlimUserId == u.Id && !a.IsBooked)
                .OrderBy(a => a.Weekday)
                .ThenBy(a => a.StartTime)
                .Select(a =>
                {
                    var day = a.Weekday.HasValue
                        ? (DayOfWeek)a.Weekday.Value
                        : a.StartDateTime?.DayOfWeek ?? DayOfWeek.Sunday;
                    return new AlimAvailabilityDto
                    {
                        Id = a.Id,
                        DayOfWeek = (int)day,
                        Day = day.ToString(),
                        StartTime = a.IsRecurring && a.StartTime.HasValue
                            ? a.StartTime.Value.ToString("HH:mm")
                            : a.StartDateTime?.ToString("yyyy-MM-dd HH:mm") ?? "",
                        EndTime = a.IsRecurring && a.EndTime.HasValue
                            ? a.EndTime.Value.ToString("HH:mm")
                            : a.EndDateTime?.ToString("yyyy-MM-dd HH:mm") ?? "",
                        IsRecurring = a.IsRecurring,
                        StartDateTime = a.StartDateTime,
                        EndDateTime = a.EndDateTime
                    };
                })
                .ToList();

            var time = nextAvailability is null
                ? "Available on request"
                : nextAvailability.IsRecurring && nextAvailability.StartTime.HasValue && nextAvailability.EndTime.HasValue
                    ? $"{nextAvailability.StartTime:hh\\:mm} - {nextAvailability.EndTime:hh\\:mm}"
                    : nextAvailability.StartDateTime.HasValue && nextAvailability.EndDateTime.HasValue
                        ? $"{nextAvailability.StartDateTime:hh\\:mm tt} - {nextAvailability.EndDateTime:hh\\:mm tt}"
                        : "Available on request";

            var distanceKm = requestedLatitude.HasValue && requestedLongitude.HasValue &&
                profile?.Latitude.HasValue == true && profile.Longitude.HasValue
                ? CalculateDistanceKm(requestedLatitude.Value, requestedLongitude.Value, (double)profile.Latitude.Value, (double)profile.Longitude.Value)
                : (double?)null;

            return new AlimCardDto
            {
                Id = u.Id,
                Name = u.FullName,
                Initials = MakeInitials(u.FullName),
                AvatarUrl = u.AvatarUrl,
                Distance = distanceKm.HasValue ? $"{distanceKm.Value:0.0} KM" : "Distance unavailable",
                DistanceLabel = distanceKm.HasValue ? $"{distanceKm.Value:0.0} KM" : null,
                DistanceKm = distanceKm,
                Rating = avgRating,
                Reviews = ratingCount,
                Time = time,
                Area = profile?.Area ?? u.City ?? "Location not provided",
                AreaLocation = profile?.Area ?? u.City,
                Latitude = profile?.Latitude,
                Longitude = profile?.Longitude,
                Fiqh = NormalizeFiqh(u.Fiqh),
                Experience = profile?.ExperienceYears is null ? "0 years" : $"{profile.ExperienceYears} years",
                ExperienceYears = profile?.ExperienceYears,
                Languages = alimLanguages.Count == 0 ? "Urdu" : string.Join(", ", alimLanguages),
                Bio = profile?.Bio ?? "Profile not completed yet.",
                Qualification = profile?.Qualification,
                Availability = allAvailability,
                SearchRadiusKm = profile?.SearchRadiusKm > 0 ? profile.SearchRadiusKm : 25,
                IsWithinSearchRadius = distanceKm.HasValue && distanceKm.Value <= (double)(profile?.SearchRadiusKm > 0 ? profile.SearchRadiusKm : 25),
                Services = alimServices
                    .Where(assignment => assignment.AlimUserId == u.Id)
                    .Join(services, assignment => assignment.ServiceId, service => service.Id, (_, service) => service.Name)
                    .ToList(),
                ReviewsList = reviewSet
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new AlimReviewDto
                    {
                        Rating = r.Rating,
                        Comment = r.Comment,
                        CreatedAt = r.CreatedAt
                    })
                    .ToList()
            };
        }).ToList();
    }

    private static double ParseDistance(string value)
    {
        var number = value.Replace(" KM", "", StringComparison.OrdinalIgnoreCase);
        return double.TryParse(number, out var d) ? d : double.MaxValue;
    }

    private static double CalculateDistanceKm(double latitude1, double longitude1, double latitude2, double longitude2)
    {
        const double earthRadiusKm = 6371;
        var latitudeDelta = DegreesToRadians(latitude2 - latitude1);
        var longitudeDelta = DegreesToRadians(longitude2 - longitude1);
        var a = Math.Sin(latitudeDelta / 2) * Math.Sin(latitudeDelta / 2) +
                Math.Cos(DegreesToRadians(latitude1)) * Math.Cos(DegreesToRadians(latitude2)) *
                Math.Sin(longitudeDelta / 2) * Math.Sin(longitudeDelta / 2);
        return earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double DegreesToRadians(double value) => value * Math.PI / 180;

    private static string MakeInitials(string fullName)
    {
        var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length == 0) return "A";
        if (parts.Length == 1) return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpperInvariant();
        return string.Concat(parts.Take(2).Select(p => char.ToUpperInvariant(p[0])));
    }

    private static string NormalizeFiqh(string? fiqh)
    {
        var knownFiqh = new[] { "Hanafi", "Shafi", "Maliki", "Hanbali" };
        return knownFiqh.FirstOrDefault(value => string.Equals(value, fiqh?.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? "Hanafi";
    }
}
