namespace ClaimVerifier.Api.Models.Entities;

public class Claim
{
    public int Id { get; set; }
    public string Description { get; set; } = "";   // the user's typed claim text (pipeline's user_claim)
    public string ClaimObject { get; set; } = "car"; // car | laptop | package
    public string Status { get; set; } = "pending";  // pending -> supported | contradicted | not_enough_information
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Filled in once the pipeline responds — null until then
    public bool? EvidenceStandardMet { get; set; }
    public string? EvidenceStandardMetReason { get; set; }
    public string? RiskFlags { get; set; }              // semicolon-joined, e.g. "wrong_object;claim_mismatch"
    public string? IssueType { get; set; }
    public string? ObjectPart { get; set; }
    public string? ClaimStatusJustification { get; set; }
    public bool? ValidImage { get; set; }
    public string? Severity { get; set; }                // none | low | medium | high | unknown — categorical, not numeric

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public ICollection<ClaimImage> Images { get; set; } = new List<ClaimImage>();
}