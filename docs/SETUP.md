# IDE Setup Guide

This guide explains how to open and configure each service in its respective IDE.

## Prerequisites

Before setting up the IDEs, ensure you have:

1. **Docker Desktop** installed and running (with at least 4GB RAM)
2. **Git** installed

> **Note**: PostgreSQL images are pulled directly from Docker Hub — no registry login or license agreement is needed.

---

## Gateway Service (Java Spring Boot) - IntelliJ IDEA

### Opening the Project

1. Open **IntelliJ IDEA**
2. Click **File → Open**
3. Navigate to `committed/services/gateway`
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
    SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/committed_core
    SPRING_DATASOURCE_USERNAME=core_user
    SPRING_DATASOURCE_PASSWORD=CoreSecurePass123!
    SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
    SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
    CORE_SERVICE_URL=http://localhost:8000
    ANALYZER_SERVICE_URL=http://localhost:5000
    NOTIFICATION_SERVICE_URL=http://localhost:5001
    ```
6. Click **Apply** and **OK**

### Running the Service

1. Ensure PostgreSQL database is running (via Docker)
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
3. Navigate to `committed/services/core`
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
    - **Local PHP** (if PHP 8.3 is installed locally)
    - Or **Docker** (recommended for consistency)
4. Select PHP 8.3 or higher

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
    DATABASE_URL=postgresql://core_user:CoreSecurePass123!@localhost:5432/committed_core?serverVersion=16&charset=utf8
    ```
6. Click **Apply** and **OK**

### Running the Service

1. Ensure PostgreSQL database is running
2. Click the green **Run** button
3. The service will start on port 8000

### Testing

```bash
# Healthcheck endpoint (returns DB status + user data)
curl http://localhost:8000/health
```

---

## Code Analyzer Service (Python Flask) - VSCode

The Code Analyzer runs entirely inside Docker — it bundles the Kilo Code CLI, Typst PDF compiler, and all Python dependencies. No local Python or Node.js setup is needed.

### Running via Docker (recommended)

Ensure `KILO_AUTH_JSON_B64` is set in `docker/.env` (see [QUICKSTART.md — Step 0](QUICKSTART.md)), then:

```bash
cd docker
docker compose up code-analyzer --no-deps
```

To skip AI analysis during development (no auth token needed):

```bash
# In docker/.env, set:
AGENT_RUNNER=mock
```

### Testing

```bash
# Health check
curl http://localhost:5000/health

# Trigger a mock analysis
curl -s -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"submissionId": 1, "repoUrl": "https://github.com/gothinkster/realworld", "studentId": 1}' \
  | python3 -m json.tool

# Fetch generated PDF report
curl -o report.pdf http://localhost:5000/reports/1.pdf
```

### Local Development (without Docker)

If you need to run the service outside Docker (e.g. to step through Python code):

```bash
cd services/code-analyzer

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
# Set AGENT_RUNNER=mock to avoid needing the Kilo CLI locally

# Run
python app.py
```

> **Note**: With `AGENT_RUNNER=kilo` locally, you also need the Kilo CLI installed (`npm install -g @kilocode/cli`) and authenticated (`kilo auth login`).

### Rebuilding the image

After changing `requirements.txt`, the `Dockerfile`, or any `.kilo/` agent config:

```bash
cd docker
docker compose build code-analyzer
```

**Note**: The Code Analyzer does NOT connect to the database directly. It receives all necessary data from the Gateway service via HTTP requests.

---

## Notifications Service (.NET Core) - VSCode

### Opening the Project

1. Open **VSCode**
2. Click **File → Open Folder**
3. Navigate to `committed/services/notifications`
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
```

---

## Web Frontend (React + Vite) - VSCode

### Opening the Project

1. Open **VSCode**
2. Click **File → Open Folder**
3. Navigate to `committed/web`
4. Click **Select Folder**

### Installing Extensions

Install these recommended extensions:

- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - Autocomplete, linting, and hover previews for Tailwind classes

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

### Tailwind CSS

The frontend uses **Tailwind CSS** for styling. Key config files:

- `tailwind.config.js` — Content paths, theme customizations, plugins
- `postcss.config.js` — Wires up Tailwind and Autoprefixer as PostCSS plugins (Vite picks these up automatically)
- `src/index.css` — Contains the Tailwind directives (`@tailwind base/components/utilities`)

All styling is done via utility classes directly in JSX — no custom CSS files or inline style objects are needed.

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
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Option 2: Individual Services (Development)

1. Start PostgreSQL database first:

    ```bash
    cd docker
    docker compose up -d postgres-db
    # Wait for it to be healthy (usually under 10 seconds)
    docker compose ps
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

4. Test Core healthcheck:
    ```bash
    curl http://localhost:8000/health
    ```

---

## Troubleshooting

### PostgreSQL Won't Start

- Check if port 5432 is already in use
- View logs: `docker compose logs postgres-db`

### Service Can't Connect to Database

- Ensure PostgreSQL is healthy: `docker compose ps`
- Check connection string format (must use `postgresql://` scheme for Symfony, `jdbc:postgresql://` for Spring Boot)
- Verify credentials match `.env` file (`core_user` / `CoreSecurePass123!`)

### Core Returns "could not find driver"

- The Docker image needs to be rebuilt with the `pdo_pgsql` extension:
    ```bash
    docker compose up -d --build core
    ```

### Port Already in Use

- Find process: `lsof -i :PORT` (Linux/Mac) or `netstat -ano | findstr :PORT` (Windows)
- Kill process or change port in configuration

### Composer/npm/pip Install Fails

- Check internet connection
- Try clearing cache:
    - Composer: `composer clear-cache`
    - npm: `npm cache clean --force`
    - pip: `pip cache purge`
