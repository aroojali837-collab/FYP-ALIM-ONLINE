// Ye controller application ki religious services ka CRUD manage karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController(AlimNextDbContext db) : ControllerBase
{
    // Active services ki list return karta hai.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Service>>> GetAll()
        => Ok(await db.Services.AsNoTracking().OrderBy(x => x.Name).ToListAsync());

    // ID se ek service read karta hai.
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Service>> GetById(int id)
    {
        var service = await db.Services.FindAsync(id);
        return service is null ? NotFound() : Ok(service);
    }

    // Nayi service create karta hai.
    [HttpPost]
    public async Task<ActionResult<Service>> Create(ServiceUpsertRequest request)
    {
        var service = new Service
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        db.Services.Add(service);
        await db.SaveChangesAsync();
        return Ok(service);
    }

    // Existing service ki information update karta hai.
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Service>> Update(int id, ServiceUpsertRequest request)
    {
        var service = await db.Services.FindAsync(id);
        if (service is null)
        {
            return NotFound();
        }

        service.Name = request.Name.Trim();
        service.Description = request.Description;
        service.DurationMinutes = request.DurationMinutes;
        service.Price = request.Price;
        service.IsActive = request.IsActive;
        service.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(service);
    }

    // Service ko delete ya inactive karta hai.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var service = await db.Services.FindAsync(id);
        if (service is null)
        {
            return NotFound();
        }

        service.IsActive = false;
        service.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
