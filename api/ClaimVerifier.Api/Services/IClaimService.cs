using ClaimVerifier.Api.Models.Dtos;
using Microsoft.AspNetCore.Http;

namespace ClaimVerifier.Api.Services;

public interface IClaimService
{
    // IClaimService.cs
    Task<ClaimResponse> CreateClaim(int userId, string description, string claimObject, List<IFormFile> photos);
    Task<List<ClaimResponse>> GetClaims(int userId);

    Task<ClaimResponse?> GetClaim(int userId, int claimId);
}