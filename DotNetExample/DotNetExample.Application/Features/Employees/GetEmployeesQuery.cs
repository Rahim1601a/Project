using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public record GetEmployeesQuery(int? Cursor, int PageSize = 10) : IRequest<ResponseModel<CursorPagedResponseModel<Employee>>>;
