using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public class CreateEmployeeHandler : IRequestHandler<CreateEmployeeCommand, ResponseModel<Employee>>
{
    private readonly IEmployeeRepository _repository;

    public CreateEmployeeHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<Employee>> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = new Employee
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Position = request.Position,
            Department = request.Department,
            Salary = request.Salary,
            CompanyId = request.CompanyId
        };

        await _repository.AddEmployeeAsync(employee, request.CountryIds);

        return ResponseModel<Employee>.Ok(employee, "Employee created successfully");
    }
}

