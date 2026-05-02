using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public record GetEmployeesQuery(int? Cursor, int PageSize = 10, int? CountryId = null) : IRequest<ResponseModel<CursorPagedResponseModel<Employee>>>;
