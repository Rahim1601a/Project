using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public record SearchEmployeesQuery(string SearchTerm, int Limit = 10) : IRequest<ResponseModel<CursorPagedResponseModel<SelectOptionModel>>>;
