using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Companies;

public record GetCompaniesQuery(int? Cursor, int PageSize = 10) : IRequest<ResponseModel<CursorPagedResponseModel<Company>>>;
