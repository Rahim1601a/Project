using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Companies;

public class GetCompaniesHandler : IRequestHandler<GetCompaniesQuery, ResponseModel<CursorPagedResponseModel<SelectOptionModel>>>
{
    private readonly IEmployeeRepository _repository;

    public GetCompaniesHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<CursorPagedResponseModel<SelectOptionModel>>> Handle(GetCompaniesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var companies = await _repository.GetCompaniesAsync(request.Cursor, request.PageSize);
            var companyList = companies.ToList();
            
            var options = companyList.Select(c => new SelectOptionModel 
            { 
                Value = c.Id, 
                Label = c.Name 
            }).ToList();

            int? nextCursor = companyList.LastOrDefault()?.Id;
            bool hasMore = nextCursor.HasValue && await _repository.HasMoreCompaniesAsync(nextCursor.Value);

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
