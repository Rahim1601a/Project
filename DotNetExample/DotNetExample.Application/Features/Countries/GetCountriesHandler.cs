using DotNetExample.Application.Interfaces;
using DotNetExample.Application.Models;
using DotNetExample.Domain.Entities;
using MediatR;

namespace DotNetExample.Application.Features.Countries;

public class GetCountriesHandler : IRequestHandler<GetCountriesQuery, ResponseModel<CursorPagedResponseModel<SelectOptionModel>>>
{
    private readonly IEmployeeRepository _repository;

    public GetCountriesHandler(IEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResponseModel<CursorPagedResponseModel<SelectOptionModel>>> Handle(GetCountriesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var countries = await _repository.GetCountriesAsync(request.Cursor, request.PageSize, request.CompanyId);
            var countryList = countries.ToList();
            
            var options = countryList.Select(c => new SelectOptionModel 
            { 
                Value = c.Id, 
                Label = c.Name 
            }).ToList();

            int? nextCursor = countryList.LastOrDefault()?.Id;
            bool hasMore = nextCursor.HasValue && await _repository.HasMoreCountriesAsync(nextCursor.Value, request.CompanyId);

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
