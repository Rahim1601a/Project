using DotNetExample.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DotNetExample.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Employee> Employees { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<Country> Countries { get; set; }
}

