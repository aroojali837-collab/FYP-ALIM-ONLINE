// Ye controller user profile ko read aur update karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(AlimNextDbContext db) : ControllerBase
{
    // User ID se basic profile return karta hai.
    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (user is null || !user.IsActive)
        {
            return NotFound(new { error = "User not found." });
        }

        return Ok(new
        {
            id = user.Id,
            userId = user.Id,
            fullName = user.FullName,
            email = user.Email,
            role = user.Role,
            phoneNumber = user.Phone,
            avatarUrl = user.AvatarUrl,
            age = user.Age,
            city = user.City,
            fiqh = user.Fiqh
        });
    }

    // User ka naam, phone, age aur city update karta hai.
    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, ProfileUpdateRequest request)
    {
        if (request.AvatarUrl?.Length > 3_000_000)
        {
            return BadRequest(new { error = "Profile photo must be 2 MB or smaller." });
        }

        var user = await db.Users.FindAsync(id);
        if (user is null || !user.IsActive)
        {
            return NotFound(new { error = "User not found." });
        }

        user.FullName = request.FullName ?? user.FullName;
        user.Email = request.Email?.Trim().ToLowerInvariant() ?? user.Email;
        user.Phone = request.PhoneNumber ?? request.Phone ?? user.Phone;
        if (request.AvatarUrl is not null)
        {
            user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl;
        }
        user.Age = request.Age ?? user.Age;
        user.City = request.City ?? user.City;
        user.Fiqh = request.Fiqh ?? user.Fiqh;
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
