using DotNetExample.Application.Features.Companies;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DotNetExampleApi.Controllers;

[ApiController]
[Route("[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CompaniesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? cursor, [FromQuery] int? pageSize)
    {
        var result = await _mediator.Send(new GetCompaniesQuery(cursor, pageSize ?? 10));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
