using Microsoft.AspNetCore.Mvc;

namespace Notifications.Controllers;

[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/health")]
    public IActionResult Health() =>
        Ok(new
        {
            status = "UP",
            service = "notifications",
            timestamp = DateTime.UtcNow.ToString("o")
        });
}
