using DotNetExample.Application.Features.Companies;
using MediatR;

namespace DotNetExample.Api.Endpoints;

public static class CompanyEndpoints
{
    public static void MapCompanyEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/companies").WithTags("Companies");

        group.MapGet("/", async (int? cursor, int? pageSize, ISender mediator) =>
        {
            var result = await mediator.Send(new GetCompaniesQuery(cursor, pageSize ?? 10));
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        });
    }
}
