using Microsoft.AspNetCore.Mvc;
using Notifications.Models;
using Notifications.Services;

namespace Notifications.Controllers;

[ApiController]
public class NotificationController : ControllerBase
{
    private readonly NotificationQueue _queue;
    private readonly ILogger<NotificationController> _logger;

    private static readonly HashSet<string> ValidTypes =
    [
        "announcement.created",
        "assignment.created",
        "grade.created",
        "grade.validated",
        "analysis.completed",
        "analysis.failed",
    ];

    public NotificationController(NotificationQueue queue, ILogger<NotificationController> logger)
    {
        _queue = queue;
        _logger = logger;
    }

    [HttpPost("/internal/notify")]
    public IActionResult Notify([FromBody] NotifyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Type) || !ValidTypes.Contains(request.Type))
            return BadRequest(new { error = $"Unknown notification type: '{request.Type}'" });

        if (string.IsNullOrWhiteSpace(request.RecipientEmail))
            return BadRequest(new { error = "RecipientEmail is required" });

        _queue.Enqueue(request);

        _logger.LogInformation("Queued notification type={Type} for={Email}", request.Type, request.RecipientEmail);

        return Accepted();
    }
}
