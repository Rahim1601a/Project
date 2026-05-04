using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public class SearchEmployeesHandler : IRequestHandler<SearchEmployeesQuery, ResponseModel<CursorPagedResponseModel<SelectOptionModel>>>
{
    private readonly IEmployeeRepository _repository;

    public SearchEmployeesHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<CursorPagedResponseModel<SelectOptionModel>>> Handle(SearchEmployeesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var employees = await _repository.SearchEmployeesAsync(request.SearchTerm, request.Limit);
            var options = employees.Select(e => new SelectOptionModel 
            { 
                Value = e.Id, 
                Label = $"{e.FirstName} {e.LastName}" 
            }).ToList();

            var result = new CursorPagedResponseModel<SelectOptionModel>
            {
                Items = options,
                NextCursor = null,
                HasMore = false
            };

            return ResponseModel<CursorPagedResponseModel<SelectOptionModel>>.Ok(result);
        }
        catch (Exception ex)
        {
            return ResponseModel<CursorPagedResponseModel<SelectOptionModel>>.Failure($"Error searching employees: {ex.Message}");
        }
    }
}
