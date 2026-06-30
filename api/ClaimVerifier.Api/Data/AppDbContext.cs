using Microsoft.EntityFrameworkCore;
using ClaimVerifier.Api.Models.Entities;

namespace ClaimVerifier.Api.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
}