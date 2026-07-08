using ClaimVerifier.Api.Models.Dtos;
using ClaimVerifier.Api.Models.Entities;

namespace ClaimVerifier.Api.Services;

public interface IAuthService
{
    Task<bool> Register(RegisterRequest request);
    Task<string?> Login(LoginRequest request);
    Task<User?> GetUserById(int userId);
}