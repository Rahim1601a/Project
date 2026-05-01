using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public class GetEmployeeByIdHandler : IRequestHandler<GetEmployeeByIdQuery, ResponseModel<Employee>>
{
    private readonly IEmployeeRepository _repository;

    public GetEmployeeByIdHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<Employee>> Handle(GetEmployeeByIdQuery request, CancellationToken cancellationToken)
    {
        var employee = await _repository.GetEmployeeByIdAsync(request.Id);
        if (employee == null)
        {
            return ResponseModel<Employee>.Failure("Employee not found", 404);
        }

        return ResponseModel<Employee>.Ok(employee, "Employee retrieved successfully");
    }
}
