using MediatR;
using DotNetExampleApi.Models;

namespace DotNetExampleApi.Features.Weather;

public record GetWeatherForecastQuery() : IRequest<ResponseModel<IEnumerable<WeatherForecast>>>;
