using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public record CreateEmployeeCommand(
    string FirstName, 
    string LastName, 
    string Position, 
    string Department, 
    decimal Salary,
    int? CompanyId,
    IEnumerable<int> CountryIds
) : IRequest<ResponseModel<Employee>>;

