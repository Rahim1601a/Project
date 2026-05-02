using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Countries;

public class GetCountriesHandler : IRequestHandler<GetCountriesQuery, ResponseModel<CursorPagedResponseModel<Country>>>
{
    private readonly IEmployeeRepository _repository;

    public GetCountriesHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<CursorPagedResponseModel<Country>>> Handle(GetCountriesQuery request, CancellationToken cancellationToken)
    {
        var items = await _repository.GetCountriesAsync(request.Cursor, request.PageSize, request.CompanyId);
        var itemList = items.ToList();
        
        var nextCursor = itemList.LastOrDefault()?.Id;
        var hasMore = nextCursor.HasValue && await _repository.HasMoreCountriesAsync(nextCursor.Value, request.CompanyId);

        var pagedData = CursorPagedResponseModel<Country>.Create(itemList, nextCursor, hasMore);
        return ResponseModel<CursorPagedResponseModel<Country>>.Ok(pagedData, "Country list retrieved successfully");
    }
}
