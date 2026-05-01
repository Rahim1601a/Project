using DotNetExample.Application.Interfaces;
using DotNetExample.Infrastructure.Data;
using DotNetExample.Infrastructure.Repositories;
using DotNetExampleApi;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DotNetExample.Application.Features.Employees.GetEmployeesQuery).Assembly));
builder.Services.AddResponseCompression();
builder.Services.AddOutputCache();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Add Infrastructure
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("DotNetExampleDb"));
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();

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

app.MapControllers();

app.Run();
