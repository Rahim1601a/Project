using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Countries;

public record GetCountriesQuery(int? Cursor, int PageSize = 10) : IRequest<ResponseModel<CursorPagedResponseModel<Country>>>;
