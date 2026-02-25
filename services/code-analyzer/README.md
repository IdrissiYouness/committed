# Code Analyzer Service

Python Flask service for code analysis and AI feedback in the Committed platform.

> **Note**: This service does **not** connect to the database directly. It receives all necessary data from the Gateway service via HTTP requests.

## Technology Stack

- Python 3.11
- Flask 3.0
- OpenAI API for AI analysis
- Requests library for service-to-service communication

## IDE Setup (VSCode)

1. Open VSCode
2. File → Open Folder → Select `services/code-analyzer` directory
3. Install Python extension if not already installed
4. Create virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/Mac
    # or
    .\venv\Scripts\activate  # Windows
    ```
5. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### VSCode Settings

Create `.vscode/settings.json`:

```json
{
    "python.defaultInterpreterPath": "./venv/bin/python",
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": true
}
```

### Launch Configuration

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
                "GATEWAY_SERVICE_URL": "http://localhost:8080",
                "NOTIFICATION_SERVICE_URL": "http://localhost:5001"
            },
            "args": ["run", "--host=0.0.0.0", "--port=5000"],
            "jinja": true
        }
    ]
}
```

## Endpoints

| Method | Path           | Description           |
| ------ | -------------- | --------------------- |
| GET    | `/health`      | Health check endpoint |
| POST   | `/analyze`     | Trigger code analysis |
| GET    | `/status/{id}` | Check analysis status |

## Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py

# Or with Flask CLI
flask run --host=0.0.0.0 --port=5000
```

## Docker

```bash
# Build image
docker build -t committed-analyzer .

# Run container
docker run -p 5000:5000 committed-analyzer
```

## Environment Variables

| Variable                 | Description                 | Default                   |
| ------------------------ | --------------------------- | ------------------------- |
| OPENAI_API_KEY           | OpenAI API key              | (required for analysis)   |
| TEMP_CLONE_DIR           | Directory for cloning repos | /tmp/code-analysis        |
| GATEWAY_SERVICE_URL      | Gateway service URL         | http://gateway:8080       |
| NOTIFICATION_SERVICE_URL | Notification service URL    | http://notifications:5001 |
| PORT                     | Server port                 | 5000                      |
| FLASK_DEBUG              | Enable debug mode           | false                     |
