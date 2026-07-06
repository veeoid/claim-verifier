using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ClaimVerifier.Api.Services;
using ClaimVerifier.Api.Models.Dtos;

namespace ClaimVerifier.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClaimsController : ControllerBase
{
    private readonly IClaimService _claimService;

    public ClaimsController(IClaimService claimService)
    {
        _claimService = claimService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateClaim([FromForm] CreateClaimRequest request)
    {
        var userId = GetUserId();
        // ClaimsController.cs — CreateClaim action body changes to:
    var claimResponse = await _claimService.CreateClaim(userId, request.Description, request.ClaimObject, request.Photos);
        return Ok(claimResponse);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllClaims()
    {
        var userId = GetUserId();
        var claims = await _claimService.GetClaims(userId);
        return Ok(claims);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetClaim(int id)
    {
        var userId = GetUserId();
        var claim = await _claimService.GetClaim(userId, id);
        if (claim == null)
        {
            return NotFound();
        }
        return Ok(claim);
    }

    private int GetUserId()
    {
        var idValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(idValue ?? throw new InvalidOperationException("User ID claim is missing."));
    }
}