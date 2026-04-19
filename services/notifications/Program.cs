using Notifications.BackgroundWorkers;
using Notifications.Configuration;
using Notifications.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<NotificationService>();

builder.Services.AddSingleton<NotificationQueue>();
builder.Services.AddHostedService<NotificationWorker>();

var app = builder.Build();

app.MapControllers();

app.Run();
