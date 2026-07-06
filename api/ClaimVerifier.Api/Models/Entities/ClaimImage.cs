namespace ClaimVerifier.Api.Models.Entities;

public class ClaimImage
{
    public int Id { get; set; }
    public string ImageId { get; set; } = "";   // e.g. "img_1", matches pipeline's image_id
    public string Path { get; set; } = "";
    public bool IsSupporting { get; set; }       // set after pipeline responds

    public int ClaimId { get; set; }
    public Claim Claim { get; set; } = null!;
}