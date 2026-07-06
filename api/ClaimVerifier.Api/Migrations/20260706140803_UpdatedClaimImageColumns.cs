using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ClaimVerifier.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedClaimImageColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PhotoPath",
                table: "Claims",
                newName: "ClaimObject");

            migrationBuilder.AlterColumn<string>(
                name: "Severity",
                table: "Claims",
                type: "text",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AddColumn<string>(
                name: "ClaimStatusJustification",
                table: "Claims",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EvidenceStandardMet",
                table: "Claims",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvidenceStandardMetReason",
                table: "Claims",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IssueType",
                table: "Claims",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObjectPart",
                table: "Claims",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RiskFlags",
                table: "Claims",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ValidImage",
                table: "Claims",
                type: "boolean",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClaimImage",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ImageId = table.Column<string>(type: "text", nullable: false),
                    Path = table.Column<string>(type: "text", nullable: false),
                    IsSupporting = table.Column<bool>(type: "boolean", nullable: false),
                    ClaimId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClaimImage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClaimImage_Claims_ClaimId",
                        column: x => x.ClaimId,
                        principalTable: "Claims",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClaimImage_ClaimId",
                table: "ClaimImage",
                column: "ClaimId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClaimImage");

            migrationBuilder.DropColumn(
                name: "ClaimStatusJustification",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "EvidenceStandardMet",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "EvidenceStandardMetReason",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "IssueType",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "ObjectPart",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "RiskFlags",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "ValidImage",
                table: "Claims");

            migrationBuilder.RenameColumn(
                name: "ClaimObject",
                table: "Claims",
                newName: "PhotoPath");

            migrationBuilder.AlterColumn<double>(
                name: "Severity",
                table: "Claims",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
