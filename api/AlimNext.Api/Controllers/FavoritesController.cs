// Ye controller customer ke favorite Aalims ko database mein manage karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/favorites")]
public class FavoritesController(AlimNextDbContext db) : ControllerBase
{
    // Logged-in customer ke favorite Aalims return karta hai.
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int customerId)
    {
        if (!await IsCustomer(customerId)) return StatusCode(403, new { error = "Only customers can manage favorites." });

        var favorites = await db.FavoriteAlims.AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                alimId = x.AlimId,
                createdAt = x.CreatedAt,
                name = x.Alim!.FullName,
                area = x.Alim.AlimProfile!.Area ?? x.Alim.City,
                city = x.Alim.City
            })
            .ToListAsync();

        return Ok(favorites);
    }

    // Check karta hai ke customer ne selected Aalim ko favorite kiya ya nahi.
    [HttpGet("{alimId:int}")]
    public async Task<IActionResult> GetStatus(int alimId, [FromQuery] int customerId)
    {
        if (!await IsCustomer(customerId)) return StatusCode(403, new { error = "Only customers can manage favorites." });
        return Ok(new { isFavorite = await db.FavoriteAlims.AnyAsync(x => x.CustomerId == customerId && x.AlimId == alimId) });
    }

    // Customer ke favorites mein Aalim add karta hai.
    [HttpPost("{alimId:int}")]
    public async Task<IActionResult> Add(int alimId, FavoriteRequest request)
    {
        if (request.CustomerId <= 0 || !await IsCustomer(request.CustomerId)) return StatusCode(403, new { error = "Only customers can manage favorites." });
        if (!await db.Users.AnyAsync(x => x.Id == alimId && x.Role == "alim" && x.IsActive))
            return NotFound(new { error = "Alim not found." });

        if (!await db.FavoriteAlims.AnyAsync(x => x.CustomerId == request.CustomerId && x.AlimId == alimId))
        {
            db.FavoriteAlims.Add(new FavoriteAlim { CustomerId = request.CustomerId, AlimId = alimId, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }

        return Ok(new { isFavorite = true });
    }

    // Customer ke favorites se Aalim remove karta hai.
    [HttpDelete("{alimId:int}")]
    public async Task<IActionResult> Remove(int alimId, [FromQuery] int customerId)
    {
        if (!await IsCustomer(customerId)) return StatusCode(403, new { error = "Only customers can manage favorites." });
        var favorite = await db.FavoriteAlims.FindAsync(customerId, alimId);
        if (favorite is not null)
        {
            db.FavoriteAlims.Remove(favorite);
            await db.SaveChangesAsync();
        }

        return Ok(new { isFavorite = false });
    }

    private Task<bool> IsCustomer(int id) => db.Users.AnyAsync(x => x.Id == id && x.Role == "customer" && x.IsActive);
}
