using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Companies;

public record GetCompaniesQuery(int? Cursor, int PageSize) : IRequest<ResponseModel<CursorPagedResponseModel<SelectOptionModel>>>;
