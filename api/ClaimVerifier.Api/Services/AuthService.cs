using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

using ClaimVerifier.Api.Data;
using ClaimVerifier.Api.Models.Dtos;
using ClaimVerifier.Api.Models.Entities;

namespace ClaimVerifier.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public AuthService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Register(RegisterRequest request)
    {
        var emailTaken = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (emailTaken) return false;

        var user = new User {Email = request.Email};
        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) return false;

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        return result == PasswordVerificationResult.Success;
    }

    public Task<bool> RegisterAsync(RegisterRequest request)
    {
        throw new NotImplementedException();
    }

    public Task<bool> LoginAsync(LoginRequest request)
    {
        throw new NotImplementedException();
    }
}