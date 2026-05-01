using DotNetExample.Application.Features.Countries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DotNetExampleApi.Controllers;

[ApiController]
[Route("[controller]")]
public class CountriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CountriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? cursor, [FromQuery] int? pageSize)
    {
        var result = await _mediator.Send(new GetCountriesQuery(cursor, pageSize ?? 10));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
