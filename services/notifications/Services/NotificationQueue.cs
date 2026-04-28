using System.Threading.Channels;
using Notifications.Models;

namespace Notifications.Services;

public class NotificationQueue
{
    private readonly Channel<NotifyRequest> _channel;

    public NotificationQueue(int capacity = 500)
    {
        _channel = Channel.CreateBounded<NotifyRequest>(new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.DropOldest
        });
    }

    public bool Enqueue(NotifyRequest request) =>
        _channel.Writer.TryWrite(request);

    public IAsyncEnumerable<NotifyRequest> ReadAllAsync(CancellationToken ct) =>
        _channel.Reader.ReadAllAsync(ct);
}
