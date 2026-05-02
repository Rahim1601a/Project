namespace DotNetExample.Domain.Entities;

public class Country
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    
    public int? CompanyId { get; set; }
    
    [System.Text.Json.Serialization.JsonIgnore]
    public Company? Company { get; set; }
    
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
