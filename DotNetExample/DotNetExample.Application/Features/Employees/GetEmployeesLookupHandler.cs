using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using MediatR;

namespace DotNetExample.Application.Features.Employees;

public class GetEmployeesLookupHandler : IRequestHandler<GetEmployeesLookupQuery, ResponseModel<CursorPagedResponseModel<SelectOptionModel>>>
{
    private readonly IEmployeeRepository _repository;

    public GetEmployeesLookupHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<CursorPagedResponseModel<SelectOptionModel>>> Handle(GetEmployeesLookupQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var employees = await _repository.GetEmployeesAsync(request.Cursor, request.PageSize);
            var employeeList = employees.ToList();
            
            var options = employeeList.Select(e => new SelectOptionModel 
            { 
                Value = e.Id, 
                Label = $"{e.FirstName} {e.LastName}" 
            }).ToList();

            int? nextCursor = employeeList.LastOrDefault()?.Id;
            bool hasMore = nextCursor.HasValue && await _repository.HasMoreEmployeesAsync(nextCursor.Value);

            var result = new CursorPagedResponseModel<SelectOptionModel>
            {
                Items = options,
                NextCursor = nextCursor,
                HasMore = hasMore
            };

            return ResponseModel<CursorPagedResponseModel<SelectOptionModel>>.Ok(result);
        }
        catch (Exception ex)
        {
            return ResponseModel<CursorPagedResponseModel<SelectOptionModel>>.Failure(ex.Message);
        }
    }
}
