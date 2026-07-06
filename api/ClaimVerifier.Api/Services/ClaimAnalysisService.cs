// Services/ClaimAnalysisService.cs
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using ClaimVerifier.Api.Models.Entities;

namespace ClaimVerifier.Api.Services;

public class ClaimAnalysisService : IClaimAnalysisService
{
    private readonly HttpClient _http;

    public ClaimAnalysisService(HttpClient http)
    {
        _http = http; // base address configured in Program.cs
    }

    public async Task<ClaimAnalysisResult> Analyze(string claimObject, string userClaim, List<ClaimImage> images)
    {
        var payload = new AnalyzeRequest
        {
            ClaimObject = claimObject,
            UserClaim = userClaim,
            Images = images.Select(i => new AnalyzeImage
            {
                ImageId = i.ImageId,
                ImageBase64 = Convert.ToBase64String(File.ReadAllBytes(Path.Combine("wwwroot", i.Path)))
            }).ToList()
        };

        var response = await _http.PostAsJsonAsync("/analyze", payload);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<AnalyzeResponse>()
            ?? throw new InvalidOperationException("Empty response from analysis service.");

        return new ClaimAnalysisResult
        {
            EvidenceStandardMet = result.EvidenceStandardMet,
            EvidenceStandardMetReason = result.EvidenceStandardMetReason,
            RiskFlags = result.RiskFlags,
            IssueType = result.IssueType,
            ObjectPart = result.ObjectPart,
            ClaimStatus = result.ClaimStatus,
            ClaimStatusJustification = result.ClaimStatusJustification,
            SupportingImageIds = result.SupportingImageIds == "none"
                ? new List<string>()
                : result.SupportingImageIds.Split(';').ToList(),
            ValidImage = result.ValidImage,
            Severity = result.Severity
        };
    }

    private class AnalyzeRequest
    {
        [JsonPropertyName("claim_object")] public string ClaimObject { get; set; } = "";
        [JsonPropertyName("user_claim")] public string UserClaim { get; set; } = "";
        [JsonPropertyName("images")] public List<AnalyzeImage> Images { get; set; } = new();
    }

    private class AnalyzeImage
    {
        [JsonPropertyName("image_id")] public string ImageId { get; set; } = "";
        [JsonPropertyName("image_base64")] public string ImageBase64 { get; set; } = "";
    }

    private class AnalyzeResponse
    {
        [JsonPropertyName("evidence_standard_met")] public bool EvidenceStandardMet { get; set; }
        [JsonPropertyName("evidence_standard_met_reason")] public string EvidenceStandardMetReason { get; set; } = "";
        [JsonPropertyName("risk_flags")] public string RiskFlags { get; set; } = "none";
        [JsonPropertyName("issue_type")] public string IssueType { get; set; } = "unknown";
        [JsonPropertyName("object_part")] public string ObjectPart { get; set; } = "unknown";
        [JsonPropertyName("claim_status")] public string ClaimStatus { get; set; } = "not_enough_information";
        [JsonPropertyName("claim_status_justification")] public string ClaimStatusJustification { get; set; } = "";
        [JsonPropertyName("supporting_image_ids")] public string SupportingImageIds { get; set; } = "none";
        [JsonPropertyName("valid_image")] public bool ValidImage { get; set; }
        [JsonPropertyName("severity")] public string Severity { get; set; } = "unknown";
    }
}