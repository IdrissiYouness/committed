# Notification Service Development Skill

## Service Overview

**Service Name**: Notification Service  
**Technology**: .NET Core 8.0  
**Language**: C# 12  
**Port**: 5001  
**IDE**: VSCode  
**Build Tool**: dotnet CLI  
**Database**: Oracle Database 21c XE (via Oracle.ManagedDataAccess)

---

## Technology Stack & Versions

### Core Dependencies

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <!-- ASP.NET Core -->
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
    
    <!-- Database -->
    <PackageReference Include="Oracle.ManagedDataAccess.Core" Version="23.6.0" />
    <PackageReference Include="Oracle.ManagedDataAccess.EntityFramework" Version="23.6.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    
    <!-- Email -->
    <PackageReference Include="MailKit" Version="4.6.0" />
    <PackageReference Include="MimeKit" Version="4.6.0" />
    
    <!-- Validation -->
    <PackageReference Include="FluentValidation" Version="11.9.0" />
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.9.0" />
    
    <!-- Logging -->
    <PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
    <PackageReference Include="Serilog.Sinks.Console" Version="5.0.0" />
    <PackageReference Include="Serilog.Sinks.File" Version="5.0.0" />
  </ItemGroup>

  <ItemGroup>
    <Folder Include="Controllers\" />
    <Folder Include="Services\" />
    <Folder Include="Models\" />
    <Folder Include="Data\" />
  </ItemGroup>

</Project>
```

---

## Project Structure

```
services/notifications/
├── Controllers/
│   ├── HealthController.cs
│   ├── NotificationController.cs
│   └── EmailController.cs
├── Services/
│   ├── IEmailService.cs
│   ├── EmailService.cs
│   ├── INotificationService.cs
│   └── NotificationService.cs
├── Models/
│   ├── DTOs/
│   │   ├── SendNotificationRequest.cs
│   │   ├── SendEmailRequest.cs
│   │   └── NotificationResponse.cs
│   ├── Entities/
│   │   ├── Notification.cs
│   │   └── EmailLog.cs
│   └── Validators/
│       └── SendEmailRequestValidator.cs
├── Data/
│   ├── AppDbContext.cs
│   └── Repositories/
│       ├── INotificationRepository.cs
│       └── NotificationRepository.cs
├── Middleware/
│   └── ExceptionMiddleware.cs
├── Exceptions/
│   ├── NotFoundException.cs
│   ├── ValidationException.cs
│   └── ServiceException.cs
├── Configuration/
│   ├── SmtpSettings.cs
│   └── EmailTemplateSettings.cs
├── Templates/
│   ├── WelcomeEmail.html
│   ├── AssignmentCreatedEmail.html
│   ├── AnalysisCompletedEmail.html
│   └── GradePublishedEmail.html
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── appsettings.Production.json
├── Notifications.csproj
├── Dockerfile
└── README.md
```

---

## Code Style & Conventions

### Naming Conventions

#### Classes and Interfaces
```csharp
// Classes: PascalCase
public class EmailService { }
public class NotificationController { }
public class SendEmailRequest { }

// Interfaces: PascalCase with 'I' prefix
public interface IEmailService { }
public interface INotificationRepository { }
```

#### Methods
```csharp
// PascalCase, start with verb
public async Task SendEmailAsync(SendEmailRequest request) { }
public async Task<Notification> GetNotificationByIdAsync(int id) { }
public bool IsEmailValid(string email) { }
```

#### Variables and Properties
```csharp
// PascalCase for public properties
public string EmailAddress { get; set; }
public DateTime CreatedAt { get; set; }

// camelCase for local variables
string emailAddress = "user@example.com";
DateTime createdAt = DateTime.UtcNow;
bool isSent = false;
```

#### Constants
```csharp
// PascalCase
public const int MaxRetryAttempts = 3;
public const string DefaultFromEmail = "noreply@committed.com";
public const TimeSpan EmailTimeout = TimeSpan.FromSeconds(30);
```

### Code Formatting

Use **.editorconfig** with these settings:

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 4
insert_final_newline = true
trim_trailing_whitespace = true
end_of_line = lf

[*.{cs,vbproj}]
indent_size = 4

[*.{json,xml,yml,yaml}]
indent_size = 2
```

---

## Architecture Patterns

### Layered Architecture

```
Controller Layer (REST API)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database
```

### Controller Pattern

```csharp
using Microsoft.AspNetCore.Mvc;
using Notifications.Services;
using Notifications.Models.DTOs;

namespace Notifications.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(
        INotificationService notificationService,
        ILogger<NotificationController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request)
    {
        try
        {
            _logger.LogInformation("Sending notification to user {UserId}", request.UserId);

            var result = await _notificationService.SendNotificationAsync(request);

            return Ok(new NotificationResponse
            {
                Success = true,
                Message = "Notification sent successfully",
                NotificationId = result.NotificationId
            });
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error: {Message}", ex.Message);
            return BadRequest(new NotificationResponse
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification");
            return StatusCode(500, new NotificationResponse
            {
                Success = false,
                Message = "An error occurred while sending notification"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNotification(int id)
    {
        try
        {
            var notification = await _notificationService.GetNotificationByIdAsync(id);

            if (notification == null)
            {
                return NotFound(new NotificationResponse
                {
                    Success = false,
                    Message = "Notification not found"
                });
            }

            return Ok(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving notification {NotificationId}", id);
            return StatusCode(500, new NotificationResponse
            {
                Success = false,
                Message = "An error occurred while retrieving notification"
            });
        }
    }
}
```

### Service Pattern

```csharp
using Notifications.Models.DTOs;
using Notifications.Models.Entities;
using Notifications.Data.Repositories;
using Notifications.Configuration;
using MimeKit;
using MailKit.Net.Smtp;
using Serilog;

namespace Notifications.Services;

public class EmailService : IEmailService
{
    private readonly SmtpSettings _smtpSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<SmtpSettings> smtpSettings,
        ILogger<EmailService> logger)
    {
        _smtpSettings = smtpSettings.Value;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string? textBody = null)
    {
        try
        {
            _logger.LogInformation("Sending email to {Email}", toEmail);

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_smtpSettings.FromEmail, _smtpSettings.FromName));
            message.To.Add(new MailboxAddress(toEmail));
            message.Subject = subject;

            var builder = new BodyBuilder();
            builder.HtmlBody = htmlBody;
            if (!string.IsNullOrEmpty(textBody))
            {
                builder.TextBody = textBody;
            }
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            return false;
        }
    }

    public async Task<bool> SendEmailWithTemplateAsync(string toEmail, string templateName, Dictionary<string, string> placeholders)
    {
        try
        {
            var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", templateName);
            var template = await File.ReadAllTextAsync(templatePath);

            foreach (var placeholder in placeholders)
            {
                template = template.Replace($"{{{placeholder.Key}}}", placeholder.Value);
            }

            var subject = ExtractSubjectFromTemplate(template);
            var htmlBody = ExtractBodyFromTemplate(template);

            return await SendEmailAsync(toEmail, subject, htmlBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email with template {TemplateName}", templateName);
            return false;
        }
    }

    private string ExtractSubjectFromTemplate(string template)
    {
        var match = Regex.Match(template, @"<!-- SUBJECT: (.+?) -->");
        return match.Success ? match.Groups[1].Value.Trim() : "Notification";
    }

    private string ExtractBodyFromTemplate(string template)
    {
        var match = Regex.Match(template, @"<!-- BODY -->(.+?)<!-- END BODY -->", RegexOptions.Singleline);
        return match.Success ? match.Groups[1].Value.Trim() : template;
    }
}
```

```csharp
using Notifications.Models.DTOs;
using Notifications.Models.Entities;
using Notifications.Data.Repositories;
using Serilog;

namespace Notifications.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        IEmailService emailService,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Notification> SendNotificationAsync(SendNotificationRequest request)
    {
        var notification = new Notification
        {
            UserId = request.UserId,
            Type = request.Type,
            Subject = request.Subject,
            Message = request.Message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        _logger.LogInformation("Notification created: {NotificationId}", notification.NotificationId);

        // Send email if requested
        if (request.SendEmail && !string.IsNullOrEmpty(request.UserEmail))
        {
            var emailSent = await _emailService.SendEmailAsync(
                request.UserEmail,
                request.Subject,
                request.Message
            );

            if (emailSent)
            {
                notification.EmailSentAt = DateTime.UtcNow;
                await _notificationRepository.SaveChangesAsync();
            }
        }

        return notification;
    }

    public async Task<Notification?> GetNotificationByIdAsync(int id)
    {
        return await _notificationRepository.GetByIdAsync(id);
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 20)
    {
        return await _notificationRepository.GetByUserIdAsync(userId, page, pageSize);
    }

    public async Task MarkAsReadAsync(int notificationId)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _notificationRepository.SaveChangesAsync();
        }
    }
}
```

### Repository Pattern

```csharp
using Notifications.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Notifications.Data.Repositories;

public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(int id);
    Task<List<Notification>> GetByUserIdAsync(int userId, int page, int pageSize);
    Task AddAsync(Notification notification);
    Task UpdateAsync(Notification notification);
    Task DeleteAsync(Notification notification);
    Task SaveChangesAsync();
}

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _context;

    public NotificationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Notification?> GetByIdAsync(int id)
    {
        return await _context.Notifications.FindAsync(id);
    }

    public async Task<List<Notification>> GetByUserIdAsync(int userId, int page, int pageSize)
    {
        var skip = (page - 1) * pageSize;
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task AddAsync(Notification notification)
    {
        await _context.Notifications.AddAsync(notification);
    }

    public async Task UpdateAsync(Notification notification)
    {
        _context.Notifications.Update(notification);
    }

    public async Task DeleteAsync(Notification notification)
    {
        _context.Notifications.Remove(notification);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
```

### Entity Pattern

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Notifications.Models.Entities;

[Table("notification")]
public class Notification
{
    [Key]
    [Column("notification_id")]
    public int NotificationId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("type")]
    public string Type { get; set; } = "info";

    [Required]
    [MaxLength(500)]
    [Column("subject")]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [Column("message", TypeName = "CLOB")]
    public string Message { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("read_at")]
    public DateTime? ReadAt { get; set; }

    [Column("email_sent_at")]
    public DateTime? EmailSentAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### DTO Pattern

```csharp
using System.ComponentModel.DataAnnotations;

namespace Notifications.Models.DTOs;

public class SendNotificationRequest
{
    [Required(ErrorMessage = "User ID is required")]
    public int UserId { get; set; }

    [Required(ErrorMessage = "Notification type is required")]
    [MaxLength(50, ErrorMessage = "Type cannot exceed 50 characters")]
    public string Type { get; set; } = string.Empty;

    [Required(ErrorMessage = "Subject is required")]
    [MaxLength(500, ErrorMessage = "Subject cannot exceed 500 characters")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Message is required")]
    public string Message { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string? UserEmail { get; set; }

    public bool SendEmail { get; set; } = false;
}

public class SendEmailRequest
{
    [Required(ErrorMessage = "To email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string ToEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Subject is required")]
    [MaxLength(500, ErrorMessage = "Subject cannot exceed 500 characters")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Body is required")]
    public string HtmlBody { get; set; } = string.Empty;

    public string? TextBody { get; set; }
}

public class NotificationResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? NotificationId { get; set; }
}
```

### Validation Pattern

```csharp
using FluentValidation;
using Notifications.Models.DTOs;

namespace Notifications.Models.Validators;

public class SendEmailRequestValidator : AbstractValidator<SendEmailRequest>
{
    public SendEmailRequestValidator()
    {
        RuleFor(x => x.ToEmail)
            .NotEmpty().WithMessage("To email is required")
            .EmailAddress().WithMessage("Invalid email address");

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subject is required")
            .MaximumLength(500).WithMessage("Subject cannot exceed 500 characters");

        RuleFor(x => x.HtmlBody)
            .NotEmpty().WithMessage("Body is required");
    }
}
```

---

## Error Handling

### Custom Exceptions

```csharp
namespace Notifications.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}

public class ServiceException : Exception
{
    public ServiceException(string message) : base(message) { }
    public ServiceException(string message, Exception innerException) 
        : base(message, innerException) { }
}
```

### Exception Middleware

```csharp
using System.Net;
using System.Text.Json;
using Notifications.Exceptions;
using Serilog;

namespace Notifications.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        Log.Error(exception, "An unhandled exception occurred");

        var response = context.Response;
        response.ContentType = "application/json";

        var statusCode = exception switch
        {
            NotFoundException => HttpStatusCode.NotFound,
            ValidationException => HttpStatusCode.BadRequest,
            _ => HttpStatusCode.InternalServerError
        };

        response.StatusCode = (int)statusCode;

        var result = new
        {
            success = false,
            message = exception.Message,
            timestamp = DateTime.UtcNow.ToString("o")
        };

        var json = JsonSerializer.Serialize(result);
        return response.WriteAsync(json);
    }
}
```

---

## Configuration

### appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "OracleDb": "User Id=committed_user;Password=SecurePassword123!;Data Source=oracle-db:1521/XEPDB1"
  },
  "SmtpSettings": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-specific-password",
    "FromEmail": "noreply@committed.com",
    "FromName": "Committed Platform",
    "UseSsl": true
  },
  "AllowedOrigins": [
    "http://localhost:3000",
    "http://localhost"
  ]
}
```

### Configuration Classes

```csharp
namespace Notifications.Configuration;

public class SmtpSettings
{
    public const string SectionName = "SmtpSettings";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public bool UseSsl { get; set; } = true;
}
```

### Program.cs Configuration

```csharp
using Notifications.Configuration;
using Notifications.Data;
using Notifications.Middleware;
using Serilog;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure SmtpSettings
builder.Services.Configure<SmtpSettings>(
    builder.Configuration.GetSection(SmtpSettings.SectionName));

// Register services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();

// Configure database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseOracle(
        builder.Configuration.GetConnectionString("OracleDb"),
        oracleOptions => oracleOptions.UseOracleSQLCompatibility("11")));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/notifications-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

var app = builder.Build();

// Configure middleware
app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();
```

---

## Email Templates

### Template Structure

```html
<!-- SUBJECT: Assignment Created -->
<!-- BODY -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Committed Platform</h1>
        </div>
        <div class="content">
            <h2>New Assignment Created</h2>
            <p>Hello {{UserName}},</p>
            <p>A new assignment has been created in your course <strong>{{CourseName}}</strong>.</p>
            <p><strong>Assignment:</strong> {{AssignmentTitle}}</p>
            <p><strong>Due Date:</strong> {{DueDate}}</p>
            <a href="{{AssignmentUrl}}" class="button">View Assignment</a>
        </div>
        <div class="footer">
            <p>&copy; 2026 Committed Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
<!-- END BODY -->
```

---

## Testing

### Unit Test Example

```csharp
using Xunit;
using Moq;
using Notifications.Services;
using Notifications.Models.DTOs;
using Notifications.Exceptions;

namespace Notifications.Tests.Services;

public class NotificationServiceTests
{
    private readonly Mock<INotificationRepository> _mockRepository;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly NotificationService _service;

    public NotificationServiceTests()
    {
        _mockRepository = new Mock<INotificationRepository>();
        _mockEmailService = new Mock<IEmailService>();
        _service = new NotificationService(
            _mockRepository.Object,
            _mockEmailService.Object,
            Mock.Of<ILogger<NotificationService>>()
        );
    }

    [Fact]
    public async Task SendNotificationAsync_WithValidRequest_CreatesNotification()
    {
        // Arrange
        var request = new SendNotificationRequest
        {
            UserId = 1,
            Type = "info",
            Subject = "Test Subject",
            Message = "Test Message",
            SendEmail = false
        };

        // Act
        var result = await _service.SendNotificationAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.UserId);
        Assert.Equal("Test Subject", result.Subject);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Notification>()), Times.Once);
        _mockRepository.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task SendNotificationAsync_WithEmail_SendsEmail()
    {
        // Arrange
        var request = new SendNotificationRequest
        {
            UserId = 1,
            Type = "info",
            Subject = "Test Subject",
            Message = "Test Message",
            UserEmail = "test@example.com",
            SendEmail = true
        };

        _mockEmailService.Setup(e => e.SendEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>()
        )).ReturnsAsync(true);

        // Act
        var result = await _service.SendNotificationAsync(request);

        // Assert
        _mockEmailService.Verify(e => e.SendEmailAsync(
            "test@example.com",
            "Test Subject",
            "Test Message"
        ), Times.Once);
        Assert.NotNull(result.EmailSentAt);
    }
}
```

### Integration Test Example

```csharp
using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Notifications;

namespace Notifications.Tests.Integration;

public class NotificationControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public NotificationControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SendNotification_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new SendNotificationRequest
        {
            UserId = 1,
            Type = "info",
            Subject = "Test Subject",
            Message = "Test Message"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(request),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await _client.PostAsync("/api/notification/send", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseString = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<NotificationResponse>(responseString);
        
        Assert.True(result.Success);
    }

    [Fact]
    public async Task SendNotification_WithInvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var request = new SendNotificationRequest
        {
            UserId = 0, // Invalid
            Type = "info",
            Subject = "", // Invalid
            Message = "Test Message"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(request),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await _client.PostAsync("/api/notification/send", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
```

### Test Coverage Target
- **Minimum**: 80% overall coverage
- **Services**: 90% coverage
- **Controllers**: 80% coverage
- **Repositories**: 70% coverage

---

## Best Practices

1. **Use dependency injection** with constructor injection
2. **Validate all inputs** using FluentValidation
3. **Use async/await** for all I/O operations
4. **Handle exceptions** with custom exception classes
5. **Log important events** using Serilog
6. **Use interfaces** for services and repositories
7. **Follow .NET naming conventions**
8. **Write tests** for all business logic
9. **Use async methods** for database operations
10. **Configure CORS** properly for cross-origin requests

---

## Quick Reference Commands

```bash
# Build
dotnet build

# Run
dotnet run

# Run with specific environment
dotnet run --environment Development

# Test
dotnet test

# Test with coverage
dotnet test --collect:"XPlat Code Coverage"

# Publish
dotnet publish -c Release -o ./publish

# Add package
dotnet add package PackageName

# Restore packages
dotnet restore

# Clean
dotnet clean
```

---

## Resources

- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [MailKit Documentation](https://docs.mimekit.net/)
- [FluentValidation Documentation](https://docs.fluentvalidation.net/)
- [Serilog Documentation](https://serilog.net/)
- [xUnit Documentation](https://xunit.net/)
