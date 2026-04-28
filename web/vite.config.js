import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.js"],
        css: true,
        coverage: {
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "src/test/",
                "src/main.jsx",
                "*.config.js",
            ],
        },
    },
});