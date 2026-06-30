using ClaimVerifier.Api.Models.Entities;
namespace ClaimVerifier.Api.Services;

public interface ITokenService
{
    string CreateToken(User user);
}