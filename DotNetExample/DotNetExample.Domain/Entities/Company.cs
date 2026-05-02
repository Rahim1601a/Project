namespace DotNetExample.Domain.Entities;

public class Company
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<Country> Countries { get; set; } = new List<Country>();
    
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
