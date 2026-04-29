using MediatR;
using DotNetExampleApi.Models;

namespace DotNetExampleApi.Features.Weather;

public class GetWeatherForecastHandler : IRequestHandler<GetWeatherForecastQuery, ResponseModel<IEnumerable<WeatherForecast>>>
{
    private static readonly string[] Summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    public Task<ResponseModel<IEnumerable<WeatherForecast>>> Handle(GetWeatherForecastQuery request, CancellationToken cancellationToken)
    {
        var forecast = Enumerable.Range(1, 5).Select(index =>
            new WeatherForecast
            (
                DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                Random.Shared.Next(-20, 55),
                Summaries[Random.Shared.Next(Summaries.Length)]
            ))
            .ToArray();

        var response = ResponseModel<IEnumerable<WeatherForecast>>.Ok(forecast);
        return Task.FromResult(response);
    }
}
