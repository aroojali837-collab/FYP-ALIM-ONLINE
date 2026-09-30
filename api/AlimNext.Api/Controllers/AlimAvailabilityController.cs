// Ye controller Aalim ke available days aur time slots manage karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/alim-availability")]
public class AlimAvailabilityController(AlimNextDbContext db) : ControllerBase
{
    // Aalim ki availability list read karta hai.
    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] int? alimId)
    {
        var query = db.AlimAvailability.AsNoTracking().AsQueryable();
        if (alimId.HasValue)
        {
            query = query.Where(x => x.AlimUserId == alimId.Value);
        }

        return Ok(await query.OrderByDescending(x => x.CreatedAt).ToListAsync());
    }

    // Naya availability slot save karta hai.
    [HttpPost]
    public async Task<ActionResult> Create(AlimAvailabilityUpsertRequest request)
    {
        var alimUserId = request.AlimUserId != 0 ? request.AlimUserId : request.AlimId;
        if (!await db.Users.AnyAsync(x => x.Id == alimUserId && x.Role == "alim"))
        {
            return BadRequest(new { error = "Alim user not found." });
        }

        var startTime = ParseTime(request.StartTime);
        var endTime = ParseTime(request.EndTime);
        if (request.IsRecurring && (request.Weekday ?? request.DayOfWeek) is < 0 or > 6)
        {
            return BadRequest(new { error = "Weekday must be between 0 and 6." });
        }

        if (request.IsRecurring && (startTime is null || endTime is null || startTime >= endTime))
        {
            return BadRequest(new { error = "A valid start and end time are required." });
        }

        var weekday = request.Weekday ?? (byte)request.DayOfWeek;
        var duplicate = await db.AlimAvailability.AnyAsync(x =>
            x.AlimUserId == alimUserId && x.IsRecurring && x.Weekday == weekday &&
            x.StartTime == startTime && x.EndTime == endTime);
        if (duplicate)
        {
            return Conflict(new { error = "This availability slot is already saved." });
        }

        var entity = new AlimAvailability
        {
            AlimUserId = alimUserId,
            IsRecurring = request.IsRecurring || (request.StartDateTime is null && request.EndDateTime is null),
            Weekday = weekday,
            StartTime = startTime,
            EndTime = endTime,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            IsBooked = false,
            CreatedAt = DateTime.UtcNow
        };

        db.AlimAvailability.Add(entity);
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    // Aalim ke schedule se selected slot remove karta hai.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] int alimId)
    {
        var entity = await db.AlimAvailability.FirstOrDefaultAsync(x => x.Id == id && x.AlimUserId == alimId);
        if (entity is null)
        {
            return NotFound(new { error = "Availability slot not found." });
        }

        db.AlimAvailability.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static TimeOnly? ParseTime(string? value)
        => TimeOnly.TryParse(value, out var parsed) ? parsed : null;
}
