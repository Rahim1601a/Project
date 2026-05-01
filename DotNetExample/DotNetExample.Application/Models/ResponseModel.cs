namespace DotNetExample.Application.Models;

public class ResponseModel<T>
{
    public T? Data { get; set; }
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int StatusCode { get; set; }

    public static ResponseModel<T> Ok(T data, string? message = null)
    {
        return new ResponseModel<T>
        {
            Data = data,
            Success = true,
            Message = message,
            StatusCode = 200
        };
    }

    public static ResponseModel<T> Failure(string message, int statusCode = 400)
    {
        return new ResponseModel<T>
        {
            Success = false,
            Message = message,
            StatusCode = statusCode
        };
    }
}
