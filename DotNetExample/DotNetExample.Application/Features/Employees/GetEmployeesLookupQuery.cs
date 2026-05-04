using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public record GetEmployeesLookupQuery(int? Cursor, int PageSize = 100) : IRequest<ResponseModel<CursorPagedResponseModel<SelectOptionModel>>>;
