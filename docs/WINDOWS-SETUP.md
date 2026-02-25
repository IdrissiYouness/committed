# 🪟 Windows Setup Guide for Committed Project

This guide is specifically for team members using **Windows** with **Docker Desktop**.

## 📌 Important: Docker Desktop on Windows DOES Support Docker CLI!

**Good news!** You can use all the same `docker` and `docker compose` commands on Windows. Docker Desktop for Windows includes the full Docker CLI toolset.

---

## ✅ Prerequisites

### 1. Install Docker Desktop for Windows

1. Download from: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. **Enable WSL 2** (recommended for better performance)
4. Restart your computer if prompted

### 2. Verify Installation

> **Note**: PostgreSQL images are pulled directly from Docker Hub — no container registry login or license agreement is needed.

Open **PowerShell** or **Command Prompt** and run:

```powershell
docker --version
docker compose version
```

You should see version information for both commands.

### 3. Configure Docker Desktop

1. Open Docker Desktop
2. Go to **Settings** → **Resources**
3. Set **Memory** to at least **4 GB** (6 GB recommended)
4. Set **CPUs** to at least **2**
5. Click **Apply & Restart**

---

## 🚀 Quick Start on Windows

### Option 1: Using PowerShell (Recommended)

```powershell
# 1. Clone the repository
git clone https://gitlab.com/iliassai/committed.git
cd committed

# 2. Copy environment file
Copy-Item .env.example .env

# 3. Edit .env (use any text editor)
notepad .env

# 4. Start the services
cd docker
docker compose up -d

# 5. Check status
docker compose ps

# 6. Test Core healthcheck (database connectivity)
curl http://localhost:8000/health

# 7. View logs
docker compose logs -f

# 8. Stop services when done
docker compose down
```

### Option 2: Using Command Prompt (cmd)

```cmd
:: 1. Clone the repository
git clone https://gitlab.com/iliassai/committed.git
cd committed

:: 2. Copy environment file
copy .env.example .env

:: 3. Edit .env
notepad .env

:: 4. Start the services
cd docker
docker compose up -d

:: 5. Check status
docker compose ps

:: 6. Test Core healthcheck
curl http://localhost:8000/health

:: 7. View logs
docker compose logs -f

:: 8. Stop services
docker compose down
```

### Option 3: Using Git Bash

```bash
# Same commands as Linux/Mac!
git clone https://gitlab.com/iliassai/committed.git
cd committed
cp .env.example .env
nano .env  # or use: notepad .env
cd docker
docker compose up -d
docker compose ps
curl http://localhost:8000/health
docker compose logs -f
docker compose down
```

### Option 4: Using WSL2 (Windows Subsystem for Linux)

If you have WSL2 enabled, you can use Linux commands directly:

```bash
# Inside WSL2 terminal (Ubuntu, etc.)
cd /mnt/c/Users/YourUsername/Projects  # Navigate to your Windows folder
git clone https://gitlab.com/iliassai/committed.git
cd committed
cp .env.example .env
nano .env
cd docker
docker compose up -d
docker compose ps
curl http://localhost:8000/health
docker compose logs -f
docker compose down
```

---

## 🛠️ Windows-Specific Considerations

### 1. Line Endings (IMPORTANT!)

Windows uses `CRLF` line endings, while Linux/Docker uses `LF`. This can cause issues.

**Solution: Configure Git to handle line endings automatically**

```powershell
# Run this BEFORE cloning the repository
git config --global core.autocrlf true
```

If you already cloned, fix line endings:

```powershell
cd committed
git config core.autocrlf true
git rm --cached -r .
git reset --hard
```

### 2. File Paths

Windows uses backslashes `\`, but Docker uses forward slashes `/`.

**Don't worry!** Docker Desktop automatically handles this. Just use forward slashes in your commands:

```powershell
# ✅ Correct (works on Windows with Docker)
docker compose -f docker/docker-compose.yml up -d

# ❌ Don't use backslashes
docker compose -f docker\docker-compose.yml up -d
```

### 3. Mounting Volumes

Docker Desktop automatically shares your `C:\Users` folder with Docker.

If your project is in a different drive (like `D:\`):

1. Open Docker Desktop
2. Go to **Settings** → **Resources** → **File Sharing**
3. Add your drive (e.g., `D:\`)
4. Click **Apply & Restart**

### 4. Firewall Issues

If services can't communicate:

1. Open **Windows Defender Firewall**
2. Click **Allow an app through firewall**
3. Ensure **Docker Desktop** is allowed on both Private and Public networks

---

## 🔧 Common Windows Issues & Solutions

### Issue 1: "docker: command not found"

**Cause:** Docker Desktop not installed or not in PATH

**Solution:**

1. Restart PowerShell/Command Prompt after installing Docker Desktop
2. If still not working, add Docker to PATH:
    - Open **System Properties** → **Environment Variables**
    - Add to PATH: `C:\Program Files\Docker\Docker\resources\bin`
    - Restart terminal

### Issue 2: "Error: daemon is not running"

**Cause:** Docker Desktop service not started

**Solution:**

1. Open **Docker Desktop** application
2. Wait for the whale icon in system tray to stop animating
3. You should see "Docker Desktop is running"

### Issue 3: PostgreSQL won't start

**Cause:** Port conflict or Docker resource issue

**Solution:**

```powershell
# Start PostgreSQL first and wait
cd docker
docker compose up -d postgres-db

# Watch logs until you see "database system is ready to accept connections"
docker compose logs -f postgres-db

# Then start other services (Ctrl+C to stop logs first)
docker compose up -d
```

### Issue 4: "Port already in use"

**Cause:** Another application is using the same port

**Solution:**

```powershell
# Find what's using port 8080 (example)
netstat -ano | findstr :8080

# Kill the process (replace 1234 with actual PID from above)
taskkill /PID 1234 /F

# Or change the port in .env file
notepad .env
```

### Issue 5: "Permission denied" or "Access is denied"

**Cause:** File permissions or antivirus blocking Docker

**Solution:**

1. Run PowerShell/Command Prompt **as Administrator**
2. Or temporarily disable antivirus for Docker folders
3. Or add Docker folders to antivirus exclusions:
    - `C:\Program Files\Docker`
    - `C:\ProgramData\Docker`
    - Your project folder

### Issue 6: Containers are very slow

**Cause:** Antivirus scanning Docker volumes

**Solution:**

1. Open **Windows Security**
2. Go to **Virus & threat protection** → **Manage settings**
3. Scroll to **Exclusions** → **Add or remove exclusions**
4. Add these folders:
    - `C:\ProgramData\Docker`
    - `%LOCALAPPDATA%\Docker`
    - Your project directory

### Issue 7: "invalid mount config for type bind"

**Cause:** Windows path format issue

**Solution:**

```powershell
# Instead of:
# ./db/init.sql  (may fail on some Windows versions)

# Use absolute path in docker-compose.yml:
# ${PWD}/db/init.sql

# Or ensure you're in the correct directory
cd docker
docker compose up -d
```

---

## 💻 Recommended Terminal for Windows

### PowerShell (Built-in, Recommended)

- ✅ Pre-installed
- ✅ Supports all Docker commands
- ✅ Modern and powerful
- ✅ Tab completion works

### Windows Terminal (Best Experience)

1. Install from **Microsoft Store**: "Windows Terminal"
2. Supports multiple tabs
3. Better colors and fonts
4. Can run PowerShell, CMD, WSL2 in tabs

### Git Bash (If you prefer Linux-style)

- Comes with Git for Windows
- Use Linux commands on Windows
- Familiar for Linux users

---

## 🎯 Step-by-Step First Time Setup (Windows)

### Step 1: Install Required Software

1. **Docker Desktop**
    - Download: https://www.docker.com/products/docker-desktop/
    - Install and restart

2. **Git for Windows**
    - Download: https://git-scm.com/download/win
    - Install with default options

3. **Your IDE** (choose based on service):
    - IntelliJ IDEA (for Gateway - Java)
    - PhpStorm (for Core - PHP)
    - Visual Studio Code (for others)

### Step 2: Clone and Setup Project

Open PowerShell and run:

```powershell
# Navigate to where you want the project
cd C:\Users\YourUsername\Projects

# Clone repository
git clone https://gitlab.com/iliassai/committed.git
cd committed

# Configure line endings (important!)
git config core.autocrlf true

# Copy environment template
Copy-Item .env.example .env

# Edit environment file
notepad .env
```

### Step 3: Start Services

```powershell
# Navigate to docker folder
cd docker

# Start all services
docker compose up -d

# This will take 3-5 minutes on first run (downloading images)
```

### Step 4: Verify Everything Works

```powershell
# Check all containers are running
docker compose ps

# You should see these services:
# - committed-postgres (healthy)
# - committed-gateway
# - committed-core
# - committed-analyzer
# - committed-notifications
# - committed-web
# - committed-nginx

# Test Core healthcheck (database connectivity + user data)
curl http://localhost:8000/health

# Test the full chain
curl http://localhost/api/test-chain

# Or open in browser:
# http://localhost
```

### Step 5: View Logs (if needed)

```powershell
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f gateway

# Press Ctrl+C to stop viewing logs
```

### Step 6: Stop Services When Done

```powershell
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

---

## 🔍 Useful Windows Commands

### Docker Commands

```powershell
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart a specific service
docker compose restart gateway

# View logs
docker compose logs -f [service-name]

# Execute command in PostgreSQL container
docker exec -it committed-postgres psql -U core_user -d committed_core

# Test Core healthcheck
curl http://localhost:8000/health

# Remove everything and start fresh
docker compose down -v
docker system prune -a
```

### Windows System Commands

```powershell
# Check port usage
netstat -ano | findstr :8080

# Kill process by PID
taskkill /PID 1234 /F

# Check Docker Desktop status
Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

# Check available disk space
Get-PSDrive C
```

---

## 📚 Quick Reference Card (Windows)

```
┌─────────────────────────────────────────────────────────────┐
│              WINDOWS DOCKER COMMANDS                         │
├─────────────────────────────────────────────────────────────┤
│ Start Docker Desktop:                                        │
│   - Click Docker Desktop icon from Start menu                │
│   - Wait for whale icon in system tray                       │
│                                                              │
│ Open Terminal:                                               │
│   - Press Win+X → Windows PowerShell                         │
│   - Or open Windows Terminal from Start menu                 │
│                                                              │
│ Navigate to Project:                                         │
│   cd C:\Users\YourName\Projects\committed                    │
│                                                              │
│ Start Services:                                              │
│   cd docker                                                  │
│   docker compose up -d                                       │
│                                                              │
│ Check Status:                                                │
│   docker compose ps                                          │
│                                                              │
│ Test Core + Database:                                        │
│   curl http://localhost:8000/health                           │
│                                                              │
│ View Logs:                                                   │
│   docker compose logs -f                                     │
│                                                              │
│ Stop Services:                                               │
│   docker compose down                                        │
│                                                              │
│ Access Application:                                          │
│   - Frontend: http://localhost                               │
│   - API: http://localhost/api                                │
│   - Core Health: http://localhost:8000/health                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤝 Working with Team (Windows + Linux/Mac Mix)

### File Line Endings (Critical!)

Your team has mixed OS, so configure Git properly:

```powershell
# Windows users should run:
git config --global core.autocrlf true

# This ensures:
# - Checkout: CRLF on Windows
# - Commit: LF in repository (Linux compatible)
```

**Linux/Mac users should run:**

```bash
git config --global core.autocrlf input
```

### Path Separators

Always use forward slashes `/` in:

- `.env` files
- `docker-compose.yml`
- Documentation
- Git commits

Example:

```env
# ✅ Good (works on all OS)
TEMP_CLONE_DIR=/tmp/code-analysis

# ❌ Bad (Windows only)
TEMP_CLONE_DIR=C:\temp\code-analysis
```

### Script Compatibility

If you create shell scripts (`.sh` files):

1. Use LF line endings (not CRLF)
2. Test in Git Bash on Windows
3. Add shebang: `#!/bin/bash`

---

## ✅ Checklist for Windows Users

Before starting development:

- [ ] Docker Desktop installed and running
- [ ] Docker has 4GB+ RAM allocated
- [ ] Git for Windows installed
- [ ] Git line ending configured: `git config core.autocrlf true`
- [ ] Project cloned
- [ ] `.env` file created from `.env.example`
- [ ] Services start successfully: `docker compose up -d`
- [ ] Core healthcheck works: `curl http://localhost:8000/health`
- [ ] Can access: http://localhost
- [ ] IDE installed and opened the correct service folder

---

## 🆘 Getting Help

### If Commands Don't Work

1. **Ensure Docker Desktop is running**
    - Look for whale icon in system tray
    - Should say "Docker Desktop is running"

2. **Restart PowerShell/Terminal**
    - Close and reopen after installing Docker

3. **Check Docker is in PATH**

    ```powershell
    $env:PATH -split ';' | Select-String -Pattern 'docker'
    ```

4. **Run as Administrator** (if permission issues)
    - Right-click PowerShell → Run as Administrator

### Ask Your Team

- Share the exact error message
- Include your Windows version: `winver`
- Include Docker version: `docker --version`
- Share screenshot if helpful

### Useful Links

- Docker Desktop Windows docs: https://docs.docker.com/desktop/install/windows-install/
- WSL2 setup: https://docs.microsoft.com/en-us/windows/wsl/install
- Git for Windows: https://git-scm.com/download/win

---

## 🎉 You're All Set!

Windows works great with Docker Desktop. All the same commands from the main documentation work on Windows too!

**Next steps:**

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for team workflow
2. Read [SETUP.md](./SETUP.md) for IDE configuration
3. Start coding! 🚀

---

_Last updated: February 2026_
