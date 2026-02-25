# Notifications Service

.NET Core service for email notifications in the Committed platform.

## Technology Stack

- .NET 8.0
- ASP.NET Core Web API
- Npgsql (PostgreSQL)

## IDE Setup (VSCode)

1. Open VSCode
2. File → Open Folder → Select `services/notifications` directory
3. Install C# extension (ms-dotnettools.csharp)
4. VSCode will prompt to restore packages - click "Restore"

### Restore Dependencies

```bash
dotnet restore
```

### Launch Configuration

Create `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": ".NET Core Launch (web)",
            "type": "coreclr",
            "request": "launch",
            "preLaunchTask": "build",
            "program": "${workspaceFolder}/bin/Debug/net8.0/Notifications.dll",
            "args": [],
            "cwd": "${workspaceFolder}",
            "stopAtEntry": false,
            "env": {
                "ASPNETCORE_ENVIRONMENT": "Development",
                "ASPNETCORE_URLS": "http://localhost:5001"
            }
        }
    ]
}
```

Create `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "build",
            "command": "dotnet",
            "type": "process",
            "args": [
                "build",
                "${workspaceFolder}/Notifications.csproj",
                "/property:GenerateFullPaths=true",
                "/consoleloggerparameters:NoSummary"
            ],
            "problemMatcher": "$msCompile"
        }
    ]
}
```

## Endpoints

| Method | Path      | Description           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Health check endpoint |
| POST   | `/notify` | Send notification     |

## Local Development

```bash
# Restore dependencies
dotnet restore

# Run development server
dotnet run

# Or with watch mode
dotnet watch run
```

## Docker

```bash
# Build image
docker build -t committed-notifications .

# Run container
docker run -p 5001:5001 committed-notifications
```

## Environment Variables

| Variable                               | Description                  | Default                                                                                           |
| -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| ConnectionStrings\_\_DefaultConnection | PostgreSQL connection string | Host=postgres-db;Port=5432;Database=committed_core;Username=core_user;Password=CoreSecurePass123! |
| SmtpSettings\_\_Host                   | SMTP server host             | smtp.gmail.com                                                                                    |
| SmtpSettings\_\_Port                   | SMTP server port             | 587                                                                                               |
| SmtpSettings\_\_Username               | SMTP username                | (required)                                                                                        |
| SmtpSettings\_\_Password               | SMTP password                | (required)                                                                                        |
| SmtpSettings\_\_FromEmail              | Sender email                 | noreply@committed.com                                                                             |
| SmtpSettings\_\_FromName               | Sender name                  | Committed Platform                                                                                |
| ASPNETCORE_URLS                        | Server URL                   | http://+:5001                                                                                     |
