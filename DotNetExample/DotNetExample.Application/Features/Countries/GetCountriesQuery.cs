using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Countries;

public record GetCountriesQuery(int? Cursor, int PageSize, int? CompanyId = null) : IRequest<ResponseModel<CursorPagedResponseModel<SelectOptionModel>>>;
