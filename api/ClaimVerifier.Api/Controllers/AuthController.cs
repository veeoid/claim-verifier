using Microsoft.AspNetCore.Mvc;
using ClaimVerifier.Api.Models.Dtos;
using ClaimVerifier.Api.Services;

namespace ClaimVerifier.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{

    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }


    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var success = await _authService.Register(request);
        if (!success)
        {
            return BadRequest(new { message = "Email is already taken." }); 
        }
        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var success = await _authService.Login(request);
        if (!success)
        {
            return Unauthorized();
        }
        return Ok();
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Implementation for logout
        return Ok(new {});
    }
}