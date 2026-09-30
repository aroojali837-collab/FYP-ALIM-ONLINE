// Ye file API application ko start karti hai aur tamam services configure karti hai.
using AlimNext.Api.Data;
using AlimNext.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Controllers ko application ke HTTP endpoints ke taur par register karte hain.
builder.Services.AddControllers();

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowAnyOrigin());
});

builder.Services.AddDbContext<AlimNextDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});

var app = builder.Build();

await EnsureCoreServicesAsync(app);

app.UseCors("Frontend");
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

static async Task EnsureCoreServicesAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AlimNextDbContext>();

    var coreServices = new[]
    {
        new Service { Name = "Nikah", Description = "Marriage ceremony", IsActive = true, CreatedAt = DateTime.UtcNow },
        new Service { Name = "Janazah", Description = "Funeral prayer", IsActive = true, CreatedAt = DateTime.UtcNow },
        new Service { Name = "Dua", Description = "Prayer service", IsActive = true, CreatedAt = DateTime.UtcNow },
        new Service { Name = "Quran Khawani", Description = "Quran recitation", IsActive = true, CreatedAt = DateTime.UtcNow },
        new Service { Name = "Quran Tutor", Description = "In-person Quran and Qaida tutoring", IsActive = true, CreatedAt = DateTime.UtcNow },
    };

    foreach (var service in coreServices)
    {
        var exists = await db.Services.AnyAsync(x => x.Name == service.Name);
        if (!exists)
        {
            db.Services.Add(service);
        }
    }

    if (db.ChangeTracker.HasChanges())
    {
        await db.SaveChangesAsync();
    }
}
