# IDE Setup Guide

This guide explains how to open and configure each service in its respective IDE.

## Prerequisites

Before setting up the IDEs, ensure you have:

1. **Docker Desktop** installed and running (with at least 4GB RAM)
2. **Oracle Container Registry** account - Sign up at https://container-registry.oracle.com
3. **Git** installed

### Oracle Container Registry Login

```bash
docker login container-registry.oracle.com
# Enter your Oracle account credentials
```

---

## Gateway Service (Java Spring Boot) - IntelliJ IDEA

### Opening the Project

1. Open **IntelliJ IDEA**
2. Click **File → Open**
3. Navigate to `commit-ed/services/gateway`
4. Click **OK**
5. IntelliJ will detect the Maven project and start importing dependencies
6. Wait for the indexing to complete (progress bar at bottom)

### Configuring the Run Configuration

1. Click **Run → Edit Configurations**
2. Click **+** → **Spring Boot**
3. Configure:
   - **Name**: `GatewayApplication`
   - **Main class**: `com.committed.gateway.GatewayApplication`
   - **Active profiles**: (leave empty for default)
4. Click **Modify options → Environment variables**
5. Add the following environment variables:
   ```
   SPRING_DATASOURCE_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1
   SPRING_DATASOURCE_USERNAME=committed_user
   SPRING_DATASOURCE_PASSWORD=SecurePassword123!
   CORE_SERVICE_URL=http://localhost:8000
   ANALYZER_SERVICE_URL=http://localhost:5000
   NOTIFICATION_SERVICE_URL=http://localhost:5001
   ```
6. Click **Apply** and **OK**

### Running the Service

1. Ensure Oracle database is running (via Docker)
2. Click the green **Run** button or press `Shift+F10`
3. The service will start on port 8080

### Testing

```bash
curl http://localhost:8080/health
curl http://localhost:8080/actuator/health
```

---

## Core Service (PHP Symfony) - PhpStorm

### Opening the Project

1. Open **PhpStorm**
2. Click **File → Open**
3. Navigate to `commit-ed/services/core`
4. Click **OK**
5. PhpStorm will detect the Symfony project

### Installing Dependencies

Open the terminal in PhpStorm (`Alt+F12`) and run:

```bash
composer install
```

### Configuring PHP Interpreter

1. Go to **Settings → PHP**
2. Click **...** next to CLI Interpreter
3. Add a new interpreter:
   - **Local PHP** (if PHP 8.2 is installed locally)
   - Or **Docker** (recommended for consistency)
4. Select PHP 8.2 or higher

### Configuring the Run Configuration

1. Click **Run → Edit Configurations**
2. Click **+** → **PHP Built-in Web Server**
3. Configure:
   - **Name**: `Core Service`
   - **Host**: `localhost`
   - **Port**: `8000`
   - **Document root**: Select the `public` folder
4. Click **Modify options → Environment variables**
5. Add:
   ```
   APP_ENV=dev
   APP_SECRET=symfony-secret-key-change-this
   DATABASE_URL=oci8://committed_user:SecurePassword123!@localhost:1521/XEPDB1
   ```
6. Click **Apply** and **OK**

### Running the Service

1. Ensure Oracle database is running
2. Click the green **Run** button
3. The service will start on port 8000

### Testing

```bash
curl http://localhost:8000/health
curl http://localhost:8000/db-test
```

---

## Code Analyzer Service (Python Flask) - VSCode

### Opening the Project

1. Open **VSCode**
2. Click **File → Open Folder**
3. Navigate to `commit-ed/services/code-analyzer`
4. Click **Select Folder**

### Installing Python Extension

1. Go to Extensions (`Ctrl+Shift+X`)
2. Search for "Python"
3. Install the **Python** extension by Microsoft

### Setting Up Virtual Environment

Open the terminal (`Ctrl+``) and run:

```bash
# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### Configuring VSCode

Create `.vscode/settings.json`:
```json
{
    "python.defaultInterpreterPath": "./venv/bin/python",
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": true
}
```

Create `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Flask",
            "type": "python",
            "request": "launch",
            "module": "flask",
            "env": {
                "FLASK_APP": "app.py",
                "FLASK_DEBUG": "1",
                "DATABASE_URL": "oracle+cx_oracle://committed_user:SecurePassword123!@localhost:1521/XEPDB1"
            },
            "args": ["run", "--host=0.0.0.0", "--port=5000"],
            "jinja": true
        }
    ]
}
```

### Running the Service

1. Press `F5` to start debugging
2. Or run from terminal: `python app.py`
3. The service will start on port 5000

### Testing

```bash
curl http://localhost:5000/health
curl http://localhost:5000/db-test
```

---

## Notifications Service (.NET Core) - VSCode

### Opening the Project

1. Open **VSCode**
2. Click **File → Open Folder**
3. Navigate to `commit-ed/services/notifications`
4. Click **Select Folder**

### Installing C# Extension

1. Go to Extensions (`Ctrl+Shift+X`)
2. Search for "C#"
3. Install the **C#** extension by Microsoft
4. VSCode will prompt to restore packages - click **Restore**

### Restoring Dependencies

If not prompted, open terminal and run:

```bash
dotnet restore
```

### Configuring VSCode

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

### Running the Service

1. Press `F5` to start debugging
2. Or run from terminal: `dotnet run`
3. The service will start on port 5001

### Testing

```bash
curl http://localhost:5001/health
curl http://localhost:5001/db-test
```

---

## Web Frontend (React + Vite) - VSCode

### Opening the Project

1. Open **VSCode**
2. Click **File → Open Folder**
3. Navigate to `commit-ed/web`
4. Click **Select Folder**

### Installing Extensions

Install these recommended extensions:
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint

### Installing Dependencies

Open terminal and run:

```bash
npm install
```

### Configuring VSCode

Create `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Launch Chrome",
            "url": "http://localhost:3000",
            "webRoot": "${workspaceFolder}/src"
        }
    ]
}
```

### Running the Service

1. Run from terminal: `npm run dev`
2. Open browser to http://localhost:3000
3. Or press `F5` to launch Chrome debugger

### Testing

Open http://localhost:3000 in your browser and click "Test Service Chain"

---

## Running All Services Together

### Option 1: Docker Compose (Recommended)

```bash
# From project root
cd docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Individual Services (Development)

1. Start Oracle database first:
   ```bash
   cd docker
   docker-compose up -d oracle-db
   # Wait for it to be healthy (2-3 minutes)
   docker-compose ps
   ```

2. Start each service in its IDE:
   - Gateway (IntelliJ) - Port 8080
   - Core (PhpStorm) - Port 8000
   - Code Analyzer (VSCode) - Port 5000
   - Notifications (VSCode) - Port 5001
   - Web (VSCode) - Port 3000

3. Test the chain:
   ```bash
   curl http://localhost:8080/test-chain
   ```

---

## Troubleshooting

### Oracle Database Won't Start
- Ensure Docker has at least 4GB RAM allocated
- Check if port 1521 is already in use
- View logs: `docker-compose logs oracle-db`

### Service Can't Connect to Database
- Ensure Oracle is healthy: `docker-compose ps`
- Check connection string format
- Verify credentials match `.env` file

### Port Already in Use
- Find process: `lsof -i :PORT` (Linux/Mac) or `netstat -ano | findstr :PORT` (Windows)
- Kill process or change port in configuration

### Composer/npm/pip Install Fails
- Check internet connection
- Try clearing cache:
  - Composer: `composer clear-cache`
  - npm: `npm cache clean --force`
  - pip: `pip cache purge`
