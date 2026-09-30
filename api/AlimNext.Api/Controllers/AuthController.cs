// Ye controller registration aur login ke endpoints provide karta hai.
using AlimNext.Api.Data;
using AlimNext.Api.Dtos;
using AlimNext.Api.Models;
using AlimNext.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlimNext.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AlimNextDbContext db, ILogger<AuthController> logger) : ControllerBase
{
    // Naya user create karke us ka session data frontend ko return karta hai.
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(RegisterRequest request)
    {
        try
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var role = request.Role.Trim().ToLowerInvariant();
            if (role is not ("customer" or "alim"))
            {
                return BadRequest(new { error = "Unsupported account role." });
            }
            var exists = await db.Users.AnyAsync(x => x.Email.ToLower() == email);
            if (exists)
            {
                return Conflict(new { error = "Email already exists." });
            }

            var user = new User
            {
                Role = role,
                FullName = request.FullName.Trim(),
                Email = email,
                PasswordHash = PasswordHasherService.HashPassword(new User(), request.Password),
                Phone = request.PhoneNumber ?? request.Phone,
                Age = request.Age,
                City = request.City,
                Fiqh = request.Fiqh,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            if (user.Role == "alim")
            {
                db.AlimProfiles.Add(new AlimProfile
                {
                    UserId = user.Id,
                    Bio = request.Bio,
                    ExperienceYears = request.ExperienceYears,
                    Area = request.Area,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    RatingAvg = 0,
                    RatingCount = 0,
                    CreatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
            }

            var response = new RegisterResponse
            {
                UserId = user.Id,
                User = MapUser(user)
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Register failed for email {Email}", request.Email);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "Registration failed. Please try again."
            });
        }
    }

    // Email aur password verify karke login user ka profile return karta hai.
    [HttpPost("login")]
    public async Task<ActionResult<SessionUserDto>> Login(LoginRequest request)
    {
        try
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var user = await db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == email);

            if (user is null || !user.IsActive)
            {
                return Unauthorized(new { error = "Invalid email or password." });
            }

            if (!PasswordHasherService.VerifyPassword(user, user.PasswordHash, request.Password))
            {
                return Unauthorized(new { error = "Invalid email or password." });
            }

            return Ok(MapUser(user));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Login failed for email {Email}", request.Email);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "Login failed. Please try again."
            });
        }
    }

    private static SessionUserDto MapUser(User user) => new()
    {
        Id = user.Id,
        UserId = user.Id,
        Role = user.Role,
        FullName = user.FullName,
        Email = user.Email,
        PhoneNumber = user.Phone,
        Age = user.Age,
        City = user.City,
        Fiqh = user.Fiqh
    };
}
