namespace ClaimVerifier.Api.Models.Dtos;

public class ClaimImageResponse
{
    public string ImageId { get; set; } = "";
    public string Path { get; set; } = "";
    public bool IsSupporting { get; set; }
}
