using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;

namespace Notifications.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public HealthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("/health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "UP",
            service = "notifications",
            timestamp = DateTime.UtcNow.ToString("o")
        });
    }

    [HttpGet("/db-test")]
    public IActionResult DbTest()
    {
        var dbConnected = false;
        var dbMessage = "";

        try
        {
            var connectionString = _configuration.GetConnectionString("OracleDb");
            
            if (!string.IsNullOrEmpty(connectionString))
            {
                using var connection = new OracleConnection(connectionString);
                connection.Open();
                
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT 1 FROM DUAL";
                var result = command.ExecuteScalar();
                
                if (result != null)
                {
                    dbConnected = true;
                    dbMessage = "Oracle database connected successfully";
                }
            }
            else
            {
                dbMessage = "Connection string not configured";
            }
        }
        catch (Exception ex)
        {
            dbMessage = $"Exception: {ex.Message}";
        }

        return Ok(new
        {
            service = "notifications",
            database = dbConnected ? "connected" : "disconnected",
            message = dbMessage,
            timestamp = DateTime.UtcNow.ToString("o")
        });
    }

    [HttpPost("/notify")]
    public IActionResult Notify([FromBody] NotificationRequest request)
    {
        // Placeholder for notification logic
        return Ok(new
        {
            status = "not_implemented",
            message = "Notification endpoint - to be implemented",
            timestamp = DateTime.UtcNow.ToString("o")
        });
    }
}

public class NotificationRequest
{
    public string? UserId { get; set; }
    public string? Type { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }
}
