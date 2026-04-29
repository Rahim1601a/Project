using MediatR;
using DotNetExampleApi.Models;

namespace DotNetExampleApi.Features.Employees;

public class GetEmployeesHandler : IRequestHandler<GetEmployeesQuery, ResponseModel<CursorPagedResponseModel<Employee>>>
{
    private static readonly List<Employee> DummyEmployees = new()
    {
        new Employee(1, "John", "Doe", "Software Engineer", "Engineering", 85000),
        new Employee(2, "Jane", "Smith", "Product Manager", "Product", 95000),
        new Employee(3, "Bob", "Johnson", "UI/UX Designer", "Design", 75000),
        new Employee(4, "Alice", "Brown", "QA Engineer", "Engineering", 70000),
        new Employee(5, "Charlie", "Green", "HR Specialist", "Human Resources", 60000),
        new Employee(6, "David", "White", "Data Scientist", "Engineering", 90000),
        new Employee(7, "Eva", "Black", "Marketing Manager", "Marketing", 80000),
        new Employee(8, "Frank", "Gray", "Sales Rep", "Sales", 65000)
    };

    public Task<ResponseModel<CursorPagedResponseModel<Employee>>> Handle(GetEmployeesQuery request, CancellationToken cancellationToken)
    {
        var query = DummyEmployees.AsQueryable();

        if (request.Cursor.HasValue)
        {
            query = query.Where(e => e.Id > request.Cursor.Value);
        }

        var items = query.OrderBy(e => e.Id).Take(request.PageSize).ToList();
        var nextCursor = items.LastOrDefault()?.Id;
        var hasMore = nextCursor.HasValue && DummyEmployees.Any(e => e.Id > nextCursor.Value);

        var pagedData = CursorPagedResponseModel<Employee>.Create(items, nextCursor, hasMore);
        var response = ResponseModel<CursorPagedResponseModel<Employee>>.Ok(pagedData, "Employee list retrieved successfully");
        
        return Task.FromResult(response);
    }
}
