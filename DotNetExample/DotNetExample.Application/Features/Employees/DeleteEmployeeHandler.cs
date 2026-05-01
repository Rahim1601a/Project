using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public class DeleteEmployeeHandler : IRequestHandler<DeleteEmployeeCommand, ResponseModel<bool>>
{
    private readonly IEmployeeRepository _repository;

    public DeleteEmployeeHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<bool>> Handle(DeleteEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _repository.GetEmployeeByIdAsync(request.Id);
        if (employee == null)
        {
            return ResponseModel<bool>.Failure("Employee not found", 404);
        }

        await _repository.DeleteEmployeeAsync(request.Id);

        return ResponseModel<bool>.Ok(true, "Employee deleted successfully");
    }
}
