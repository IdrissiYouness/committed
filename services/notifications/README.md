# Notifications Service

.NET 8 service responsible for sending transactional emails on the Committed platform.
Receives HTTP events from the Gateway and dispatches HTML emails asynchronously via SMTP.

## Technology Stack

- .NET 8 / ASP.NET Core
- MailKit (SMTP)
- Channel\<T\> background queue (fire-and-forget email dispatch)

---

## Setup Guide

### Step 1 — Get a Gmail App Password

The service uses Gmail SMTP. You need an **App Password** — a special one-time password for apps (your regular Gmail password will not work).

1. Make sure **2-Step Verification is enabled** on your Google account
   - Go to: https://myaccount.google.com/security
2. Go to: https://myaccount.google.com/apppasswords
3. In the "App name" field type `Committed` and click **Create**
4. Google shows you a **16-character password** — copy it immediately (you won't see it again)
5. Remove any spaces from it before using it (e.g. `abcd efgh ijkl mnop` → `abcdefghijklmnop`)

---

### Step 2 — Configure `docker/.env`

Open `docker/.env` and fill in the notification block:

```env
NOTIFICATION_PORT=5001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com          # your Gmail address
SMTP_PASSWORD=abcdefghijklmnop   # the 16-char app password, no spaces
FROM_EMAIL=you@gmail.com         # must be the same as SMTP_USER for Gmail
FROM_NAME=Committed Platform
PLATFORM_URL=http://localhost    # base URL used in email links — change for production
```

> `SMTP_USER` and `FROM_EMAIL` must be the same Gmail address. Gmail does not allow sending from a different address.

This config is used when running via **Docker**.

---

### Step 3 — Configure `appsettings.Development.json` (local dev only)

When running with `dotnet run` (outside Docker), the service reads from `appsettings.Development.json` instead of environment variables. This file is **gitignored** so your credentials are never committed.

Create `services/notifications/appsettings.Development.json`:

```json
{
  "Platform": {
    "Url": "http://localhost"
  },
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "you@gmail.com",
    "Password": "abcdefghijklmnop",
    "FromEmail": "you@gmail.com",
    "FromName": "Committed Platform",
    "UseSsl": true
  }
}
```

> `appsettings.json` (tracked by git) contains only empty placeholders — never put real credentials there.

---

### Step 4 — Run

**Via Docker (recommended):**

```bash
cd docker
docker-compose build notifications
docker-compose up -d notifications
```

**Locally:**

```bash
cd services/notifications
dotnet run
```

Check it started:

```bash
# Docker
docker-compose logs notifications

# Local
# You should see: Now listening on: http://localhost:5001
```

---

### Step 5 — Test it

Send a test notification with curl — replace the email with yours:

```bash
curl -v -X POST http://localhost:5001/internal/notify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "announcement.created",
    "recipientEmail": "you@gmail.com",
    "recipientName": "Your Name",
    "courseName": "Introduction to Computer Science",
    "announcementTitle": "Exam next week",
    "announcementContent": "The exam will cover chapters 1 to 5. Good luck!",
    "professorName": "Dr. Smith"
  }'
```

You should receive `HTTP 202` immediately and an email within a few seconds.
Check your **spam folder** if it doesn't appear in your inbox.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Authentication failed` | App password is wrong or has spaces — remove all spaces |
| No App Password option on Google | Enable 2-Step Verification first |
| Email goes to spam | Normal for local/dev sending — mark as not spam |
| `Connection refused` on port 5001 | Service is not running — check `docker-compose logs notifications` |
| `202` returned but no email received | Check logs: `docker-compose logs notifications \| grep -i "error\|failed"` |

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/internal/notify` | Queue an email notification |

---

## Supported Event Types

| `type` | Trigger | Recipient |
|--------|---------|-----------|
| `announcement.created` | Professor posts an announcement | Enrolled students |
| `assignment.created` | Professor creates an assignment | Enrolled students |
| `grade.created` | A grade is saved | Submitting student |
| `grade.validated` | Professor validates an AI grade | Submitting student |
| `analysis.completed` | Code analysis finishes successfully | Submitting student |
| `analysis.failed` | Code analysis fails | Submitting student |

---

## Payload Reference

All events share the same endpoint. Only fill the fields relevant to the event type:

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

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `Smtp__Host` | SMTP server | Yes |
| `Smtp__Port` | SMTP port (`587` for Gmail) | Yes |
| `Smtp__Username` | Your Gmail address | Yes |
| `Smtp__Password` | Gmail App Password (16 chars, no spaces) | Yes |
| `Smtp__FromEmail` | Sender address — must match `Smtp__Username` | Yes |
| `Smtp__FromName` | Display name shown in inbox | No |
| `Smtp__UseSsl` | `true` for Gmail STARTTLS | Yes |
| `Platform__Url` | Base URL for email links (no trailing slash) | No (defaults to `http://localhost`) |
