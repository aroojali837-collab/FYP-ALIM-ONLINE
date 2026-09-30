// Ye controller customer service requests ko create, read aur status update karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/service-requests")]
public class ServiceRequestsController(AlimNextDbContext db) : ControllerBase
{
    // Customer ya Aalim ke filters ke mutabiq requests return karta hai.
    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] int? customerId, [FromQuery] int? alimId, [FromQuery] string? status)
    {
        var query = db.ServiceRequests.AsNoTracking().AsQueryable();

        if (customerId.HasValue) query = query.Where(x => x.CustomerId == customerId.Value);
        if (alimId.HasValue) query = query.Where(x => x.AlimId == alimId.Value);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);

        var result = await query
            .OrderByDescending(x => x.CreatedAt)
            .Select(sr => new
            {
                id = sr.Id,
                customerId = sr.CustomerId,
                alimId = sr.AlimId,
                serviceId = sr.ServiceId,
                fiqh = sr.Fiqh,
                location = sr.Location,
                requestDate = sr.RequestDate.HasValue ? sr.RequestDate.Value.ToString("yyyy-MM-dd") : null,
                requestTime = sr.RequestTime.HasValue ? sr.RequestTime.Value.ToString("HH:mm") : null,
                status = sr.Status,
                notes = sr.Notes,
                isRecurring = sr.IsRecurring,
                recurrenceType = sr.RecurrenceType,
                recurrenceDay = sr.RecurrenceDay,
                recurrenceDate = sr.RecurrenceDate,
                startDate = sr.StartDate,
                endDate = sr.EndDate,
                parentRequestId = sr.ParentRequestId,
                acceptedAt = db.Appointments
                    .Where(a => a.ServiceRequestId == sr.Id)
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => (DateTime?)a.CreatedAt)
                    .FirstOrDefault(),
                createdAt = sr.CreatedAt,
                updatedAt = sr.UpdatedAt,
                customer = sr.Customer == null ? null : new
                {
                    id = sr.Customer.Id,
                    fullName = sr.Customer.FullName,
                    email = sr.Customer.Email,
                    phone = sr.Customer.Phone,
                    city = sr.Customer.City,
                    fiqh = sr.Customer.Fiqh
                },
                alim = sr.Alim == null ? null : new
                {
                    id = sr.Alim.Id,
                    fullName = sr.Alim.FullName,
                    email = sr.Alim.Email,
                    phone = sr.Alim.Phone,
                    city = sr.Alim.City,
                    fiqh = sr.Alim.Fiqh
                },
                service = sr.Service == null ? null : new
                {
                    id = sr.Service.Id,
                    name = sr.Service.Name,
                    durationMinutes = sr.Service.DurationMinutes,
                    price = sr.Service.Price
                },
                appointment = db.Appointments
                    .Where(a => a.ServiceRequestId == sr.Id)
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => new
                    {
                        id = a.Id,
                        serviceRequestId = a.ServiceRequestId,
                        scheduledAt = a.ScheduledAt,
                        startedAt = a.ScheduledAt,
                        endsAt = a.DurationMinutes.HasValue ? (DateTime?)a.ScheduledAt.AddMinutes(a.DurationMinutes.Value) : null,
                        completedAt = a.Status == "completed" ? a.UpdatedAt : null,
                        durationMinutes = a.DurationMinutes,
                        status = a.Status,
                        alimFeedbackSkipped = a.AlimFeedbackSkipped,
                        isFinished = a.Status == "completed",
                        customerCanReview = a.Status == "completed" ? !db.Reviews.Any(r => r.AppointmentId == a.Id && r.ReviewerId == sr.CustomerId && r.RevieweeId == sr.AlimId) : false,
                        alimCanReview = a.Status == "completed" ? !db.Reviews.Any(r => r.AppointmentId == a.Id && r.ReviewerId == sr.AlimId && r.RevieweeId == sr.CustomerId) : false,
                        customerReviewed = db.Reviews.Any(r => r.AppointmentId == a.Id && r.ReviewerId == sr.CustomerId && r.RevieweeId == sr.AlimId),
                        alimReviewed = db.Reviews.Any(r => r.AppointmentId == a.Id && r.ReviewerId == sr.AlimId && r.RevieweeId == sr.CustomerId)
                        ,alimFeedback = db.Reviews
                            .Where(r => r.AppointmentId == a.Id && r.ReviewerId == sr.AlimId && r.RevieweeId == sr.CustomerId)
                            .OrderByDescending(r => r.CreatedAt)
                            .Select(r => new { rating = r.Rating, comment = r.Comment, createdAt = r.CreatedAt })
                            .FirstOrDefault()
                        ,customerFeedback = db.Reviews
                            .Where(r => r.AppointmentId == a.Id && r.ReviewerId == sr.CustomerId && r.RevieweeId == sr.AlimId)
                            .OrderByDescending(r => r.CreatedAt)
                            .Select(r => new { rating = r.Rating, comment = r.Comment, createdAt = r.CreatedAt })
                            .FirstOrDefault()
                    })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(result);
    }

    // Aalim ke accepted request ko appointment mein convert karta hai.
    [HttpPost("{id:int}/accept")]
    public async Task<IActionResult> Accept(int id, ServiceRequestAcceptRequest request)
    {
        var entity = await db.ServiceRequests
            .Include(x => x.Service)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity is null)
        {
            return NotFound();
        }

        if (entity.Status is "rejected" or "cancelled" or "completed")
        {
            return BadRequest(new { error = "This request can no longer be accepted." });
        }

        var alimId = request.AlimId ?? entity.AlimId;
        if (!alimId.HasValue)
        {
            return BadRequest(new { error = "Alim id is required." });
        }

        entity.AlimId = alimId.Value;
        entity.Status = "accepted";
        entity.UpdatedAt = DateTime.UtcNow;

        var scheduledAt = BuildScheduledAt(entity.RequestDate, entity.RequestTime);
        var durationMinutes = request.DurationMinutes
            ?? entity.Service?.DurationMinutes
            ?? 60;

        var appointment = await db.Appointments.FirstOrDefaultAsync(x => x.ServiceRequestId == entity.Id);
        if (appointment is null)
        {
            appointment = new Appointment
            {
                ServiceRequestId = entity.Id,
                ScheduledAt = scheduledAt,
                DurationMinutes = durationMinutes,
                Status = "scheduled",
                CreatedAt = DateTime.UtcNow
            };
            db.Appointments.Add(appointment);
        }
        else
        {
            appointment.ScheduledAt = scheduledAt;
            appointment.DurationMinutes = durationMinutes;
            if (appointment.Status == "cancelled")
            {
                appointment.Status = "scheduled";
            }
            appointment.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            requestId = entity.Id,
            serviceRequestId = entity.Id,
            appointmentId = appointment.Id,
            scheduledAt = appointment.ScheduledAt,
            durationMinutes = appointment.DurationMinutes,
            status = entity.Status
        });
    }

    // ID ke zariye ek request ka detail record return karta hai.
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ServiceRequest>> GetById(int id)
    {
        var request = await db.ServiceRequests.FindAsync(id);
        return request is null ? NotFound() : Ok(request);
    }

    // One-time ya recurring service request database mein save karta hai.
    [HttpPost]
    public async Task<ActionResult<ServiceRequest>> Create(ServiceRequestCreateRequest request)
    {
        var location = request.LocationAddress ?? request.Location;
        var requestDate = ParseDate(request.RequestDate);
        var requestTime = ParseTime(request.RequestTime);
        var startDate = ParseDate(request.StartDate) ?? requestDate;
        var endDate = ParseDate(request.EndDate);

        if (request.IsRecurring && request.RecurrenceType is not ("weekly" or "monthly"))
        {
            return BadRequest(new { error = "Recurrence type must be weekly or monthly." });
        }
        if (request.IsRecurring && !startDate.HasValue)
        {
            return BadRequest(new { error = "A start date is required for recurring requests." });
        }

        if (!await db.Users.AnyAsync(x => x.Id == request.CustomerId && x.Role == "customer"))
        {
            return BadRequest(new { error = "Invalid customer. Please sign in again." });
        }

        if (request.AlimId.HasValue && !await db.Users.AnyAsync(x => x.Id == request.AlimId.Value && x.Role == "alim"))
        {
            return BadRequest(new { error = "Selected Alim was not found." });
        }

        if (request.ServiceId.HasValue && !await db.Services.AnyAsync(x => x.Id == request.ServiceId.Value && x.IsActive))
        {
            return BadRequest(new { error = "Selected service was not found. Please go back and choose a service again." });
        }

        var entity = new ServiceRequest
        {
            CustomerId = request.CustomerId,
            AlimId = request.AlimId,
            ServiceId = request.ServiceId,
            Fiqh = request.Fiqh,
            Location = location,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            RequestDate = requestDate,
            RequestTime = requestTime,
            Notes = request.Notes,
            IsRecurring = request.IsRecurring,
            RecurrenceType = request.IsRecurring ? request.RecurrenceType!.Trim().ToLowerInvariant() : null,
            RecurrenceDay = request.RecurrenceDay,
            RecurrenceDate = request.RecurrenceDate,
            StartDate = startDate,
            EndDate = endDate,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        db.ServiceRequests.Add(entity);
        await db.SaveChangesAsync();

        if (entity.IsRecurring && entity.StartDate.HasValue)
        {
            var occurrenceEnd = entity.EndDate ?? entity.StartDate.Value.AddMonths(3);
            var occurrenceDate = entity.StartDate.Value;
            var occurrences = new List<ServiceRequest>();
            while (occurrenceDate <= occurrenceEnd && occurrences.Count < 100)
            {
                if ((!entity.RecurrenceDay.HasValue || (int)occurrenceDate.DayOfWeek == entity.RecurrenceDay.Value) &&
                    (!entity.RecurrenceDate.HasValue || occurrenceDate.Day == entity.RecurrenceDate.Value))
                {
                    occurrences.Add(new ServiceRequest
                    {
                        CustomerId = entity.CustomerId, AlimId = entity.AlimId, ServiceId = entity.ServiceId, Fiqh = entity.Fiqh,
                        Location = entity.Location, Latitude = entity.Latitude, Longitude = entity.Longitude, RequestDate = occurrenceDate,
                        RequestTime = entity.RequestTime, Notes = entity.Notes, ParentRequestId = entity.Id, Status = "pending", CreatedAt = DateTime.UtcNow
                    });
                }

                occurrenceDate = entity.RecurrenceType == "monthly"
                    ? occurrenceDate.AddMonths(1)
                    : occurrenceDate.AddDays(7);
            }

            if (occurrences.Count > 0)
            {
                db.ServiceRequests.AddRange(occurrences);
                await db.SaveChangesAsync();
            }
        }
        return Ok(entity);
    }

    // Request ka pending, accepted, rejected ya cancelled status update karta hai.
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, ServiceRequestStatusUpdateRequest request)
    {
        var entity = await db.ServiceRequests.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        entity.Status = request.Status.Trim().ToLowerInvariant();
        entity.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    // User ki date string ko safe DateOnly value mein parse karta hai.
    private static DateOnly? ParseDate(string? value)
        => DateOnly.TryParse(value, out var parsed) ? parsed : null;

    // User ke time text ko safe TimeOnly value mein parse karta hai.
    private static TimeOnly? ParseTime(string? value)
    {
        if (TimeOnly.TryParse(value, out var parsed))
        {
            return parsed;
        }

        return null;
    }

    // Date aur time ko appointment scheduling ke DateTime mein combine karta hai.
    private static DateTime BuildScheduledAt(DateOnly? requestDate, TimeOnly? requestTime)
    {
        if (requestDate.HasValue && requestTime.HasValue)
        {
            return requestDate.Value.ToDateTime(requestTime.Value);
        }

        if (requestDate.HasValue)
        {
            return requestDate.Value.ToDateTime(TimeOnly.MinValue);
        }

        return DateTime.UtcNow;
    }
}
