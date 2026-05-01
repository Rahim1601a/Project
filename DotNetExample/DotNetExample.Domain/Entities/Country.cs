namespace DotNetExample.Domain.Entities;

public class Country
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();

}
