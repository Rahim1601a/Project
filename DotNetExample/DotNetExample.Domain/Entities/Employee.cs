namespace DotNetExample.Domain.Entities;

public class Employee
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public decimal Salary { get; set; }
    
    public int? CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public ICollection<Country> Countries { get; set; } = new List<Country>();
}

