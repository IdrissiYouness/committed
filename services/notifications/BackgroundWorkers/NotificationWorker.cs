using Notifications.Services;

namespace Notifications.BackgroundWorkers;

public class NotificationWorker : BackgroundService
{
    private readonly NotificationQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationWorker> _logger;

    public NotificationWorker(NotificationQueue queue, IServiceScopeFactory scopeFactory, ILogger<NotificationWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationWorker started");

        await foreach (var request in _queue.ReadAllAsync(stoppingToken))
        {
            using var scope = _scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<NotificationService>();
            await service.ProcessAsync(request);
        }

        _logger.LogInformation("NotificationWorker stopped");
    }
}
