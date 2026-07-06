using ClaimVerifier.Api.Models.Dtos;

namespace ClaimVerifier.Api.Services;

public interface IAuthService
{
    Task<bool> Register(RegisterRequest request);
    Task<string?> Login(LoginRequest request);
}