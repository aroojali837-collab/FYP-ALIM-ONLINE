// Ye controller completed appointment ke baad reviews save aur read karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(AlimNextDbContext db) : ControllerBase
{
    // Kisi Aalim ke reviews aur rating details return karta hai.
    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] int? revieweeId)
    {
        var query = db.Reviews.AsNoTracking().AsQueryable();
        if (revieweeId.HasValue)
        {
            query = query.Where(x => x.RevieweeId == revieweeId.Value);
        }

        return Ok(await query.OrderByDescending(x => x.CreatedAt).ToListAsync());
    }

    // Customer ka rating/comment validate karke save karta hai.
    [HttpPost]
    public async Task<ActionResult<Review>> Create(ReviewCreateRequest request)
    {
        var revieweeId = request.RevieweeId != 0 ? request.RevieweeId : request.AlimId ?? 0;
        var reviewerId = request.ReviewerId ?? request.CustomerId;
        var comment = request.Comment ?? request.ReviewText;

        if (reviewerId is null || revieweeId == 0)
        {
            return BadRequest(new { error = "Reviewer and reviewee are required." });
        }

        if (request.Rating is < 1 or > 5)
        {
            return BadRequest(new { error = "Rating must be between 1 and 5." });
        }

        if (request.AppointmentId.HasValue)
        {
            var appointment = await db.Appointments
                .Include(x => x.ServiceRequest)
                .FirstOrDefaultAsync(x => x.Id == request.AppointmentId.Value);

            if (appointment?.ServiceRequest is null)
            {
                return BadRequest(new { error = "Appointment was not found." });
            }

            var serviceRequest = appointment.ServiceRequest;
            var validPair =
                (reviewerId == serviceRequest.CustomerId && revieweeId == serviceRequest.AlimId) ||
                (reviewerId == serviceRequest.AlimId && revieweeId == serviceRequest.CustomerId);

            if (!validPair)
            {
                return BadRequest(new { error = "This appointment does not belong to the selected feedback participants." });
            }

            if (appointment.Status != "completed")
            {
                return BadRequest(new { error = "Feedback is available after the appointment is completed." });
            }
        }

        if (await db.Reviews.AnyAsync(x =>
            x.AppointmentId == request.AppointmentId &&
            x.ReviewerId == reviewerId &&
            x.RevieweeId == revieweeId))
        {
            return Conflict(new { error = "Feedback has already been submitted for this appointment." });
        }

        var entity = new Review
        {
            AppointmentId = request.AppointmentId,
            ReviewerId = reviewerId,
            RevieweeId = revieweeId,
            Rating = request.Rating,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };

        db.Reviews.Add(entity);
        await db.SaveChangesAsync();

        var profile = await db.AlimProfiles.FindAsync(revieweeId);
        if (profile is not null)
        {
            var allRatings = await db.Reviews.AsNoTracking()
                .Where(x => x.RevieweeId == revieweeId)
                .Select(x => (decimal)x.Rating)
                .ToListAsync();

            profile.RatingCount = allRatings.Count;
            profile.RatingAvg = allRatings.Count == 0 ? 0 : Math.Round(allRatings.Average(), 2);
            profile.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        return Ok(entity);
    }
}
