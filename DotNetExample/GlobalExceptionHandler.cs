using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using DotNetExampleApi.Models;
using System.Text.Json;

namespace DotNetExampleApi;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);

        var statusCode = exception switch
        {
            ArgumentException => StatusCodes.Status400BadRequest,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status500InternalServerError
        };

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";

        var response = ResponseModel<object>.Failure(exception.Message, statusCode);

        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

        return true;
    }
}
