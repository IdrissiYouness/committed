# Web Frontend

React + Vite frontend application for the Committed platform, styled with Tailwind CSS.

## Technology Stack

- React 18
- Vite 5
- Tailwind CSS 3
- PostCSS + Autoprefixer
- JavaScript/JSX

## IDE Setup (VSCode)

1. Open VSCode
2. File → Open Folder → Select `web` directory
3. Install recommended extensions:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - Tailwind CSS IntelliSense

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
docker build -t committed-web .

# Run container
docker run -p 3000:80 committed-web
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | API base URL | /api |

## Project Structure

```
web/
├── public/              # Static assets
├── src/
│   ├── index.css        # Tailwind CSS directives & global styles
│   ├── main.jsx         # Entry point (imports index.css)
│   └── App.jsx          # Main component (uses Tailwind utility classes)
├── index.html           # HTML template
├── package.json         # Dependencies
├── postcss.config.js    # PostCSS config (Tailwind + Autoprefixer)
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.js       # Vite configuration
├── nginx.conf           # Production nginx config
└── Dockerfile           # Container build
```

## Styling with Tailwind CSS

This project uses [Tailwind CSS](https://tailwindcss.com/) — a utility-first CSS framework — for all styling. Instead of writing custom CSS or inline style objects, you compose designs directly in your JSX using Tailwind's utility classes.

### How It Works

1. **`tailwind.config.js`** — Configures Tailwind's content paths, theme customizations, and plugins.
2. **`postcss.config.js`** — Wires up the Tailwind and Autoprefixer PostCSS plugins, which Vite picks up automatically.
3. **`src/index.css`** — Contains the three Tailwind directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`) that inject Tailwind's styles into the build.
4. **`src/main.jsx`** — Imports `index.css` so the styles are available app-wide.

### Example Usage

```jsx
{/* Instead of inline styles or CSS modules: */}
<button className="rounded-lg bg-indigo-500 px-6 py-3 text-white hover:bg-indigo-600">
  Click me
</button>
```

### Customising the Theme

Extend or override Tailwind's default design tokens in `tailwind.config.js`:

```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#667eea",
      },
    },
  },
  plugins: [],
}
```

### Useful Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind CSS IntelliSense (VSCode extension)](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Tailwind CSS Cheat Sheet](https://tailwindcomponents.com/cheatsheet/)

## Features

- Service status dashboard
- Chain connectivity test
- Architecture visualization