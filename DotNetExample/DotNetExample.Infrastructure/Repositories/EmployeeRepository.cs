using DotNetExample.Application.Interfaces;
using DotNetExample.Domain.Entities;
using DotNetExample.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DotNetExample.Infrastructure.Repositories;

public class EmployeeRepository : IEmployeeRepository
{
    private readonly AppDbContext _context;

    public EmployeeRepository(AppDbContext context)
    {
        _context = context;
        SeedData();
    }

    private void SeedData()
    {
        if (!_context.Companies.Any())
        {
            _context.Companies.AddRange(
                new Company { Name = "Google" },
                new Company { Name = "Microsoft" },
                new Company { Name = "Apple" },
                new Company { Name = "Meta" },
                new Company { Name = "Amazon" },
                new Company { Name = "Netflix" }
            );
            _context.SaveChanges();
        }

        if (!_context.Countries.Any())
        {
            var google = _context.Companies.First(c => c.Name == "Google");
            var microsoft = _context.Companies.First(c => c.Name == "Microsoft");
            var apple = _context.Companies.First(c => c.Name == "Apple");
            var meta = _context.Companies.First(c => c.Name == "Meta");
            var amazon = _context.Companies.First(c => c.Name == "Amazon");
            var netflix = _context.Companies.First(c => c.Name == "Netflix");

            _context.Countries.AddRange(
                new Country { Name = "United States", Code = "US", CompanyId = google.Id },
                new Country { Name = "United Kingdom", Code = "GB", CompanyId = google.Id },
                new Country { Name = "Canada", Code = "CA", CompanyId = microsoft.Id },
                new Country { Name = "Germany", Code = "DE", CompanyId = microsoft.Id },
                new Country { Name = "France", Code = "FR", CompanyId = apple.Id },
                new Country { Name = "Japan", Code = "JP", CompanyId = apple.Id },
                new Country { Name = "Australia", Code = "AU", CompanyId = meta.Id },
                new Country { Name = "India", Code = "IN", CompanyId = amazon.Id }
            );
            _context.SaveChanges();
        }

        if (!_context.Employees.Any())
        {
            var google = _context.Companies.First(c => c.Name == "Google");
            var us = _context.Countries.First(c => c.Code == "US");
            var uk = _context.Countries.First(c => c.Code == "GB");

            _context.Employees.AddRange(
                new Employee 
                { 
                    FirstName = "John", LastName = "Doe", Position = "Software Engineer", 
                    Department = "Engineering", Salary = 85000, 
                    CompanyId = google.Id, 
                    Countries = new List<Country> { us, uk } 
                },
                new Employee { FirstName = "Jane", LastName = "Smith", Position = "Product Manager", Department = "Product", Salary = 95000 },
                new Employee { FirstName = "Bob", LastName = "Johnson", Position = "UI/UX Designer", Department = "Design", Salary = 75000 },
                new Employee { FirstName = "Alice", LastName = "Brown", Position = "QA Engineer", Department = "Engineering", Salary = 70000 },
                new Employee { FirstName = "Charlie", LastName = "Green", Position = "HR Specialist", Department = "Human Resources", Salary = 60000 },
                new Employee { FirstName = "David", LastName = "White", Position = "Data Scientist", Department = "Engineering", Salary = 90000 },
                new Employee { FirstName = "Eva", LastName = "Black", Position = "Marketing Manager", Department = "Marketing", Salary = 80000 },
                new Employee { FirstName = "Frank", LastName = "Gray", Position = "Sales Rep", Department = "Sales", Salary = 65000 }
            );
            _context.SaveChanges();
        }
    }

    // ── Employees ──────────────────────────────────────────────────────

    public async Task<IEnumerable<Employee>> GetEmployeesAsync(int? cursor, int pageSize, int? countryId = null)
    {
        var query = _context.Employees
            .Include(e => e.Company)
            .Include(e => e.Countries)
            .AsQueryable();

        if (countryId.HasValue)
        {
            query = query.Where(e => e.Countries.Any(c => c.Id == countryId.Value));
        }
        
        if (cursor.HasValue)
        {
            query = query.Where(e => e.Id > cursor.Value);
        }

        return await query.OrderBy(e => e.Id).Take(pageSize).ToListAsync();
    }

    public async Task<Employee?> GetEmployeeByIdAsync(int id)
    {
        return await _context.Employees
            .Include(e => e.Company)
            .Include(e => e.Countries)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Employee> AddEmployeeAsync(Employee employee, IEnumerable<int> countryIds)
    {
        if (countryIds != null && countryIds.Any())
        {
            employee.Countries = await _context.Countries
                .Where(c => countryIds.Contains(c.Id))
                .ToListAsync();
        }
        
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();
        return employee;
    }

    public async Task UpdateEmployeeAsync(Employee employee, IEnumerable<int> countryIds)
    {
        var existingEmployee = await _context.Employees
            .Include(e => e.Countries)
            .FirstOrDefaultAsync(e => e.Id == employee.Id);

        if (existingEmployee == null) return;

        _context.Entry(existingEmployee).CurrentValues.SetValues(employee);
        
        existingEmployee.Countries.Clear();
        if (countryIds != null && countryIds.Any())
        {
            var countries = await _context.Countries
                .Where(c => countryIds.Contains(c.Id))
                .ToListAsync();
            foreach (var country in countries)
            {
                existingEmployee.Countries.Add(country);
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task DeleteEmployeeAsync(int id)
    {
        var employee = await _context.Employees
            .Include(e => e.Countries)
            .FirstOrDefaultAsync(e => e.Id == id);
        if (employee != null)
        {
            employee.Countries.Clear();
            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> HasMoreEmployeesAsync(int cursor, int? countryId = null)
    {
        var query = _context.Employees.AsQueryable();
        if (countryId.HasValue)
        {
            query = query.Where(e => e.Countries.Any(c => c.Id == countryId.Value));
        }
        return await query.AnyAsync(e => e.Id > cursor);
    }

    // ── Companies ─────────────────────────────────────────────────────

    public async Task<IEnumerable<Company>> GetCompaniesAsync(int? cursor, int pageSize)
    {
        var query = _context.Companies.AsQueryable();
        if (cursor.HasValue) query = query.Where(c => c.Id > cursor.Value);
        return await query.OrderBy(c => c.Id).Take(pageSize).ToListAsync();
    }

    public async Task<bool> HasMoreCompaniesAsync(int cursor)
    {
        return await _context.Companies.AnyAsync(c => c.Id > cursor);
    }

    // ── Countries ─────────────────────────────────────────────────────

    public async Task<IEnumerable<Country>> GetCountriesAsync(int? cursor, int pageSize, int? companyId = null)
    {
        var query = _context.Countries.AsQueryable();
        if (companyId.HasValue)
        {
            query = query.Where(c => c.CompanyId == companyId.Value);
        }
        if (cursor.HasValue) query = query.Where(c => c.Id > cursor.Value);
        return await query.OrderBy(c => c.Id).Take(pageSize).ToListAsync();
    }

    public async Task<bool> HasMoreCountriesAsync(int cursor, int? companyId = null)
    {
        var query = _context.Countries.AsQueryable();
        if (companyId.HasValue)
        {
            query = query.Where(c => c.CompanyId == companyId.Value);
        }
        return await query.AnyAsync(c => c.Id > cursor);
    }
}
