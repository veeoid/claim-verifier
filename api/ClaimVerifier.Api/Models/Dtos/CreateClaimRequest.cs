using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace ClaimVerifier.Api.Models.Dtos;

public class CreateClaimRequest
{
    public string Description { get; set; } = "";
    public string ClaimObject { get; set; } = "";
    public List<IFormFile> Photos { get; set; } = new();
}