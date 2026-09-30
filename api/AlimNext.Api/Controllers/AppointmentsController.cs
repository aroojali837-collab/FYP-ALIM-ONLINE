// Ye controller accepted requests ke appointments create aur update karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController(AlimNextDbContext db) : ControllerBase
{
    // Appointment records ko optional request filter ke saath read karta hai.
    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] int? serviceRequestId)
    {
        var query = db.Appointments.AsNoTracking().AsQueryable();
        if (serviceRequestId.HasValue)
        {
            query = query.Where(x => x.ServiceRequestId == serviceRequestId.Value);
        }

        return Ok(await query.OrderByDescending(x => x.ScheduledAt).ToListAsync());
    }

    // Customer aur Aalim ke liye naya appointment create karta hai.
    [HttpPost]
    public async Task<ActionResult<Appointment>> Create(AppointmentCreateRequest request)
    {
        if (request.ServiceRequestId is null)
        {
            var scheduledAt = BuildScheduledAt(request.AppointmentDate, request.AppointmentTime, request.ScheduledAt);
            var serviceRequest = new ServiceRequest
            {
                CustomerId = request.CustomerId,
                AlimId = request.AlimId,
                ServiceId = request.ServiceId,
                Status = "pending",
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            db.ServiceRequests.Add(serviceRequest);
            await db.SaveChangesAsync();

            var entityFromRequest = new Appointment
            {
                ServiceRequestId = serviceRequest.Id,
                ScheduledAt = scheduledAt,
                DurationMinutes = request.DurationMinutes,
                Status = "scheduled",
                CreatedAt = DateTime.UtcNow
            };

            db.Appointments.Add(entityFromRequest);
            await db.SaveChangesAsync();
            return Ok(entityFromRequest);
        }

        var entity = new Appointment
        {
            ServiceRequestId = request.ServiceRequestId.Value,
            ScheduledAt = BuildScheduledAt(request.AppointmentDate, request.AppointmentTime, request.ScheduledAt),
            DurationMinutes = request.DurationMinutes,
            Status = "scheduled",
            CreatedAt = DateTime.UtcNow
        };

        db.Appointments.Add(entity);
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    // Appointment ka status update karta hai, jaise completed ya cancelled.
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, AppointmentStatusUpdateRequest request)
    {
        var entity = await db.Appointments.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        entity.Status = request.Status.Trim().ToLowerInvariant();
        if (request.SkipFeedback)
        {
            entity.AlimFeedbackSkipped = true;
        }
        entity.UpdatedAt = DateTime.UtcNow;
        if (entity.Status == "completed")
        {
            var serviceRequest = await db.ServiceRequests.FindAsync(entity.ServiceRequestId);
            if (serviceRequest is not null)
            {
                serviceRequest.Status = "completed";
                serviceRequest.UpdatedAt = entity.UpdatedAt;
            }
        }
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    private static DateTime BuildScheduledAt(string? appointmentDate, string? appointmentTime, DateTime? scheduledAt)
    {
        if (scheduledAt.HasValue)
        {
            return scheduledAt.Value;
        }

        if (DateOnly.TryParse(appointmentDate, out var date) && TimeOnly.TryParse(appointmentTime, out var time))
        {
            return date.ToDateTime(time);
        }

        return DateTime.UtcNow;
    }
}
