// Ye service passwords ko secure hash mein convert aur verify karti hai.
using Microsoft.AspNetCore.Identity;
using AlimNext.Api.Models;
using System.Text;

namespace AlimNext.Api.Services;

public static class PasswordHasherService
{
    // Identity ka standard password hasher reuse karte hain.
    private static readonly PasswordHasher<User> Hasher = new();

    public static byte[] HashPassword(User user, string password)
        => Encoding.UTF8.GetBytes(Hasher.HashPassword(user, password));

    public static bool VerifyPassword(User user, byte[] hash, string password)
    {
        var stored = Encoding.UTF8.GetString(hash);
        return Hasher.VerifyHashedPassword(user, stored, password) != PasswordVerificationResult.Failed;
    }
}
