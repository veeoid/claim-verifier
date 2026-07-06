// Services/IClaimAnalysisService.cs
using ClaimVerifier.Api.Models.Entities;

namespace ClaimVerifier.Api.Services;

public interface IClaimAnalysisService
{
    Task<ClaimAnalysisResult> Analyze(string claimObject, string userClaim, List<ClaimImage> images);
}

public class ClaimAnalysisResult
{
    public bool EvidenceStandardMet { get; set; }
    public string EvidenceStandardMetReason { get; set; } = "";
    public string RiskFlags { get; set; } = "none";
    public string IssueType { get; set; } = "unknown";
    public string ObjectPart { get; set; } = "unknown";
    public string ClaimStatus { get; set; } = "not_enough_information";
    public string ClaimStatusJustification { get; set; } = "";
    public List<string> SupportingImageIds { get; set; } = new();
    public bool ValidImage { get; set; }
    public string Severity { get; set; } = "unknown";
}