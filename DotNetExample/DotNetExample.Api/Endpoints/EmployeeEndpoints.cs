using DotNetExample.Application.Features.Employees;
using MediatR;

namespace DotNetExample.Api.Endpoints;

public static class EmployeeEndpoints
{
    public static void MapEmployeeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/employees").WithTags("Employees");

        group.MapGet("/", async (int? cursor, int? pageSize, int? countryId, ISender mediator) =>
        {
            var result = await mediator.Send(new GetEmployeesQuery(cursor, pageSize ?? 10, countryId));
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        });

        group.MapGet("/lookup", async (int? cursor, int? pageSize, ISender mediator) =>
        {
            var result = await mediator.Send(new GetEmployeesLookupQuery(cursor, pageSize ?? 100));
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        });

        group.MapGet("/search", async (string? q, int? limit, ISender mediator) =>
        {
            var result = await mediator.Send(new SearchEmployeesQuery(q ?? "", limit ?? 10));
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        });

        group.MapGet("/{id:int}", async (int id, ISender mediator) =>
        {
            var result = await mediator.Send(new GetEmployeeByIdQuery(id));
            return result.Success ? Results.Ok(result) : Results.NotFound(result);
        });

        group.MapPost("/", async (CreateEmployeeCommand command, ISender mediator) =>
        {
            var result = await mediator.Send(command);
            return result.Success
                ? Results.Created($"/employees/{result.Data!.Id}", result)
                : Results.BadRequest(result);
        });

        group.MapPut("/{id:int}", async (int id, UpdateEmployeeCommand command, ISender mediator) =>
        {
            if (id != command.Id) return Results.BadRequest("ID mismatch");
            var result = await mediator.Send(command);
            return result.Success ? Results.Ok(result) : Results.NotFound(result);
        });

        group.MapDelete("/{id:int}", async (int id, ISender mediator) =>
        {
            var result = await mediator.Send(new DeleteEmployeeCommand(id));
            return result.Success ? Results.Ok(result) : Results.NotFound(result);
        });
    }
}
