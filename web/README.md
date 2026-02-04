# Web Frontend

React + Vite frontend application for the CommitEd platform.

## Technology Stack

- React 18
- Vite 5
- JavaScript/JSX

## IDE Setup (VSCode)

1. Open VSCode
2. File → Open Folder → Select `web` directory
3. Install recommended extensions:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint

### Install Dependencies

```bash
npm install
```

### Launch Configuration

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

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker

```bash
# Build image
docker build -t commit-ed-web .

# Run container
docker run -p 3000:80 commit-ed-web
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | API base URL | /api |

## Project Structure

```
web/
├── public/           # Static assets
├── src/
│   ├── main.jsx     # Entry point
│   └── App.jsx      # Main component
├── index.html       # HTML template
├── package.json     # Dependencies
├── vite.config.js   # Vite configuration
├── nginx.conf       # Production nginx config
└── Dockerfile       # Container build
```

## Features

- Service status dashboard
- Chain connectivity test
- Architecture visualization
