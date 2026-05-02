using DotNetExample.Application.Features.Countries;
using MediatR;

namespace DotNetExample.Api.Endpoints;

public static class CountryEndpoints
{
    public static void MapCountryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/countries").WithTags("Countries");

        group.MapGet("/", async (int? cursor, int? pageSize, int? companyId, ISender mediator) =>
        {
            var result = await mediator.Send(new GetCountriesQuery(cursor, pageSize ?? 10, companyId));
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        });
    }
}
