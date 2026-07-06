namespace ClaimVerifier.Api.Models.Dtos;
public class ClaimResponse
{
    public int Id { get; set; }
    public string Description { get; set; } = "";
    public string ClaimObject { get; set; } = "";
    public string Status { get; set; } = "";
    public string? Severity { get; set; }
    public DateTime CreatedAt { get; set; }

    public bool? EvidenceStandardMet { get; set; }
    public string? EvidenceStandardMetReason { get; set; }
    public string? RiskFlags { get; set; }
    public string? IssueType { get; set; }
    public string? ObjectPart { get; set; }
    public string? ClaimStatusJustification { get; set; }
    public bool? ValidImage { get; set; }

    public List<ClaimImageResponse> Images { get; set; } = new();
}