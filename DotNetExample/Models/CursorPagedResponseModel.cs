namespace DotNetExampleApi.Models;

public class CursorPagedResponseModel<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int? NextCursor { get; set; }
    public bool HasMore { get; set; }

    public static CursorPagedResponseModel<T> Create(IEnumerable<T> items, int? nextCursor, bool hasMore)
    {
        return new CursorPagedResponseModel<T>
        {
            Items = items,
            NextCursor = nextCursor,
            HasMore = hasMore
        };
    }
}
