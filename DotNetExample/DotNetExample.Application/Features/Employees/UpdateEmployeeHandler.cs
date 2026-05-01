using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public class UpdateEmployeeHandler : IRequestHandler<UpdateEmployeeCommand, ResponseModel<bool>>
{
    private readonly IEmployeeRepository _repository;

    public UpdateEmployeeHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<bool>> Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _repository.GetEmployeeByIdAsync(request.Id);
        if (employee == null)
        {
            return ResponseModel<bool>.Failure("Employee not found", 404);
        }

        employee.FirstName = request.FirstName;
        employee.LastName = request.LastName;
        employee.Position = request.Position;
        employee.Department = request.Department;
        employee.Salary = request.Salary;
        employee.CompanyId = request.CompanyId;

        await _repository.UpdateEmployeeAsync(employee, request.CountryIds);

        return ResponseModel<bool>.Ok(true, "Employee updated successfully");
    }
}

