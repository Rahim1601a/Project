using DotNetExampleApi.Features.Weather;
using DotNetExampleApi.Features.Employees;
using DotNetExampleApi;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
builder.Services.AddResponseCompression();
builder.Services.AddOutputCache();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseResponseCompression();
app.UseOutputCache();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.MapGet("/weatherforecast", async (IMediator mediator) =>
{
    var result = await mediator.Send(new GetWeatherForecastQuery());
    return Results.Ok(result);
})
.WithName("GetWeatherForecast")
.CacheOutput(p => p.Expire(TimeSpan.FromSeconds(10)));

app.MapGet("/employees", async (IMediator mediator, int? cursor, int? pageSize) =>
{
    var result = await mediator.Send(new GetEmployeesQuery(cursor, pageSize ?? 3));
    return Results.Ok(result);
})
.WithName("GetEmployees")
.CacheOutput(p => p.Expire(TimeSpan.FromSeconds(5)));

app.Run();
