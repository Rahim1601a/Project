using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public record GetEmployeeByIdQuery(int Id) : IRequest<ResponseModel<Employee>>;
