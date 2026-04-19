# Notifications Service

.NET 8 service responsible for sending transactional emails on the Committed platform.

## Technology Stack

- .NET 8 / ASP.NET Core
- MailKit (SMTP)
- Channel<T> background queue (fire-and-forget email dispatch)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/internal/notify` | Queue an email notification |

## Supported Event Types

| `type` | Trigger | Recipient |
|--------|---------|-----------|
| `announcement.created` | Professor posts an announcement | Enrolled students |
| `assignment.created` | Professor creates an assignment | Enrolled students |
| `grade.created` | A grade is saved | Submitting student |
| `grade.validated` | Professor validates an AI grade | Submitting student |
| `analysis.completed` | Code analysis finishes successfully | Submitting student |
| `analysis.failed` | Code analysis fails | Submitting student |

## Payload

All events share the same endpoint. Send a flat JSON body — only fill the fields relevant to the event type:

```json
POST /internal/notify
{
  "type": "announcement.created",
  "recipientEmail": "student@example.com",
  "recipientName": "Alice",
  "courseName": "Intro to CS",
  "announcementTitle": "Exam next week",
  "announcementContent": "Covers chapters 1-5.",
  "professorName": "Dr. Smith"
}
```

Returns `202 Accepted` immediately. The email is sent in the background.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `Smtp__Host` | SMTP server (e.g. `smtp.gmail.com`) |
| `Smtp__Port` | SMTP port (e.g. `587`) |
| `Smtp__Username` | Your Gmail address |
| `Smtp__Password` | Gmail App Password (not your regular password) |
| `Smtp__FromEmail` | Must match `Smtp__Username` for Gmail |
| `Smtp__FromName` | Display name (e.g. `Committed Platform`) |
| `Smtp__UseSsl` | `true` for Gmail |

## Local Development

Create `appsettings.Development.json` (gitignored) with your real SMTP credentials:

```json
{
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "you@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "you@gmail.com",
    "FromName": "Committed Platform",
    "UseSsl": true
  }
}
```

Then run:

```bash
dotnet run
```

## Docker

```bash
cd docker
docker-compose build notifications
docker-compose up -d notifications
```
