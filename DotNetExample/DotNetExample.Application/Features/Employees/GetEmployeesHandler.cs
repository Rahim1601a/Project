using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public class GetEmployeesHandler : IRequestHandler<GetEmployeesQuery, ResponseModel<CursorPagedResponseModel<Employee>>>
{
    private readonly IEmployeeRepository _repository;

    public GetEmployeesHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<CursorPagedResponseModel<Employee>>> Handle(GetEmployeesQuery request, CancellationToken cancellationToken)
    {
        var items = await _repository.GetEmployeesAsync(request.Cursor, request.PageSize, request.CountryId);
        var itemList = items.ToList();
        
        var nextCursor = itemList.LastOrDefault()?.Id;
        var hasMore = nextCursor.HasValue && await _repository.HasMoreEmployeesAsync(nextCursor.Value, request.CountryId);

        var pagedData = CursorPagedResponseModel<Employee>.Create(itemList, nextCursor, hasMore);
        return ResponseModel<CursorPagedResponseModel<Employee>>.Ok(pagedData, "Employee list retrieved successfully");
    }
}
