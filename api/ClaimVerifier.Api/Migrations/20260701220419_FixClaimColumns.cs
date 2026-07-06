using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClaimVerifier.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixClaimColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Claims",
                newName: "Status");

            migrationBuilder.AddColumn<string>(
                name: "PhotoPath",
                table: "Claims",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "Severity",
                table: "Claims",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhotoPath",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "Severity",
                table: "Claims");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Claims",
                newName: "Title");
        }
    }
}
