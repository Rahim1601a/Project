using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public record DeleteEmployeeCommand(int Id) : IRequest<ResponseModel<bool>>;
