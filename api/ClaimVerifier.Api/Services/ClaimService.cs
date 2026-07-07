using Microsoft.EntityFrameworkCore;
using ClaimVerifier.Api.Data;
using ClaimVerifier.Api.Models.Dtos;
using ClaimVerifier.Api.Models.Entities;

namespace ClaimVerifier.Api.Services;

public class ClaimService : IClaimService
{
    private readonly AppDbContext _db;
    private readonly IClaimAnalysisService _analysis;

    public ClaimService(AppDbContext db, IClaimAnalysisService analysis)
    {
        _db = db;
        _analysis = analysis;
    }

    public async Task<ClaimResponse> CreateClaim(int userId, string description, string claimObject, List<IFormFile> photos)
    {
        var uploadsDir = Path.Combine("wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var claim = new Claim
        {
            UserId = userId,
            Description = description,
            ClaimObject = claimObject,
        };

        for (int i = 0; i < photos.Count; i++)
        {
            var photo = photos[i];
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(photo.FileName)}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            claim.Images.Add(new ClaimImage
            {
                ImageId = $"img_{i + 1}",
                Path = Path.Combine("uploads", fileName),
            });
        }

        _db.Claims.Add(claim);
        await _db.SaveChangesAsync(); // save first so claim has an Id even if analysis fails

        try
        {
            var result = await _analysis.Analyze(claim.ClaimObject, claim.Description, claim.Images.ToList());

            claim.EvidenceStandardMet = result.EvidenceStandardMet;
            claim.EvidenceStandardMetReason = result.EvidenceStandardMetReason;
            claim.RiskFlags = result.RiskFlags;
            claim.IssueType = result.IssueType;
            claim.ObjectPart = result.ObjectPart;
            claim.Status = result.ClaimStatus;
            claim.ClaimStatusJustification = result.ClaimStatusJustification;
            claim.ValidImage = result.ValidImage;
            claim.Severity = result.Severity;

            foreach (var img in claim.Images)
            {
                img.IsSupporting = result.SupportingImageIds.Contains(img.ImageId);
            }

            await _db.SaveChangesAsync();
        }
        catch (Exception)
        {
            // Analysis failed or timed out — claim stays "pending" with images saved.
            // TODO: retry mechanism or a background job to re-attempt analysis.
            claim.Status = "failed";
            await _db.SaveChangesAsync();
        }

        return ToResponse(claim);
    }

    public async Task<List<ClaimResponse>> GetClaims(int userId)
    {
        var claims = await _db.Claims.Include(c => c.Images)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
        return claims.Select(ToResponse).ToList();
    }

    public async Task<ClaimResponse?> GetClaim(int userId, int claimId)
    {
        var claim = await _db.Claims.Include(c => c.Images)
            .Where(c => c.UserId == userId && c.Id == claimId)
            .FirstOrDefaultAsync();
        return claim == null ? null : ToResponse(claim);
    }

    private static ClaimResponse ToResponse(Claim claim)
    {
        return new ClaimResponse
        {
            Id = claim.Id,
            Description = claim.Description,
            ClaimObject = claim.ClaimObject,
            Status = claim.Status,
            CreatedAt = claim.CreatedAt,
            EvidenceStandardMet = claim.EvidenceStandardMet,
            EvidenceStandardMetReason = claim.EvidenceStandardMetReason,
            RiskFlags = claim.RiskFlags,
            IssueType = claim.IssueType,
            ObjectPart = claim.ObjectPart,
            ClaimStatusJustification = claim.ClaimStatusJustification,
            ValidImage = claim.ValidImage,
            Severity = claim.Severity,
            Images = claim.Images.Select(i => new ClaimImageResponse
            {
                ImageId = i.ImageId,
                Path = i.Path,
                IsSupporting = i.IsSupporting
            }).ToList()
        };
    }
}