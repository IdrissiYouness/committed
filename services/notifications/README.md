# Notifications Service

.NET Core service for email notifications in the CommitEd platform.

## Technology Stack

- .NET 8.0
- ASP.NET Core Web API
- Oracle.ManagedDataAccess.Core

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

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/db-test` | Database connectivity test |
| POST | `/notify` | Send notification (placeholder) |

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
docker build -t commit-ed-notifications .

# Run container
docker run -p 5001:5001 commit-ed-notifications
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ConnectionStrings__OracleDb | Oracle connection string | (required) |
| SmtpSettings__Host | SMTP server host | smtp.gmail.com |
| SmtpSettings__Port | SMTP server port | 587 |
| SmtpSettings__Username | SMTP username | (required) |
| SmtpSettings__Password | SMTP password | (required) |
| SmtpSettings__FromEmail | Sender email | noreply@commit-ed.com |
| SmtpSettings__FromName | Sender name | CommitEd Platform |
| ASPNETCORE_URLS | Server URL | http://+:5001 |
