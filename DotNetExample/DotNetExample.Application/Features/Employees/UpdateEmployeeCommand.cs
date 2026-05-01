using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public record UpdateEmployeeCommand(
    int Id, 
    string FirstName, 
    string LastName, 
    string Position, 
    string Department, 
    decimal Salary,
    int? CompanyId,
    IEnumerable<int> CountryIds
) : IRequest<ResponseModel<bool>>;

