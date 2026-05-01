using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Companies;

public class GetCompaniesHandler : IRequestHandler<GetCompaniesQuery, ResponseModel<CursorPagedResponseModel<Company>>>
{
    private readonly IEmployeeRepository _repository;

    public GetCompaniesHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<CursorPagedResponseModel<Company>>> Handle(GetCompaniesQuery request, CancellationToken cancellationToken)
    {
        var items = await _repository.GetCompaniesAsync(request.Cursor, request.PageSize);
        var itemList = items.ToList();
        
        var nextCursor = itemList.LastOrDefault()?.Id;
        var hasMore = nextCursor.HasValue && await _repository.HasMoreCompaniesAsync(nextCursor.Value);

        var pagedData = CursorPagedResponseModel<Company>.Create(itemList, nextCursor, hasMore);
        return ResponseModel<CursorPagedResponseModel<Company>>.Ok(pagedData, "Company list retrieved successfully");
    }
}
