using MediatR;
using DotNetExampleApi.Models;

namespace DotNetExampleApi.Features.Employees;

public record GetEmployeesQuery(int? Cursor, int PageSize = 10) : IRequest<ResponseModel<CursorPagedResponseModel<Employee>>>;
