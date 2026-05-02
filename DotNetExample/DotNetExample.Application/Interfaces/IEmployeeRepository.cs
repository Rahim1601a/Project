using DotNetExample.Domain.Entities;

namespace DotNetExample.Application.Interfaces;

public interface IEmployeeRepository
{
    // Employees
    Task<IEnumerable<Employee>> GetEmployeesAsync(int? cursor, int pageSize, int? countryId = null);
    Task<Employee?> GetEmployeeByIdAsync(int id);
    Task<Employee> AddEmployeeAsync(Employee employee, IEnumerable<int> countryIds);
    Task UpdateEmployeeAsync(Employee employee, IEnumerable<int> countryIds);
    Task DeleteEmployeeAsync(int id);
    Task<bool> HasMoreEmployeesAsync(int cursor, int? countryId = null);
    
    // Companies
    Task<IEnumerable<Company>> GetCompaniesAsync(int? cursor, int pageSize);
    Task<bool> HasMoreCompaniesAsync(int cursor);
    
    // Countries
    Task<IEnumerable<Country>> GetCountriesAsync(int? cursor, int pageSize, int? companyId = null);
    Task<bool> HasMoreCountriesAsync(int cursor, int? companyId = null);
}
