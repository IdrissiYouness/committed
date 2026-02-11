/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            // Palette 2: Cool & Professional — designed for education platforms
            colors: {
                primary: {
                    50: "#f5f7fa",
                    100: "#e8ecf3",
                    200: "#d1d9e6",
                    300: "#aebfd6",
                    400: "#85a0c2",
                    500: "#6384ad", // Main primary — Deep Navy
                    600: "#4a6a94",
                    700: "#3d577a",
                    800: "#364a66",
                    900: "#2f4057",
                },
                secondary: {
                    50: "#f0f9f8",
                    100: "#dff4f0",
                    200: "#bfe8e0",
                    300: "#8dd4c6",
                    400: "#5ab8a8",
                    500: "#349e8e", // Main secondary — Teal
                    600: "#288073",
                    700: "#22665d",
                    800: "#1e544d",
                    900: "#1a4642",
                },
                neutral: {
                    50: "#f8fafc",
                    100: "#f1f5f9",
                    200: "#e2e8f0",
                    300: "#cbd5e1",
                    400: "#94a3b8",
                    500: "#64748b", // Slate grays
                    600: "#475569",
                    700: "#334155",
                    800: "#1e293b",
                    900: "#0f172a",
                },
                success: "#0d9488",
                warning: "#d97706",
                error: "#dc2626",
                info: "#2563eb",
            },

            // Pairing 3: Friendly & Approachable — education, community platforms
            fontFamily: {
                display: ["Quicksand", "sans-serif"],
                body: ["Nunito", "system-ui", "sans-serif"],
                mono: ["Fira Code", "monospace"],
            },

            // Custom font sizes with tuned line-height & letter-spacing
            fontSize: {
                xs: ["0.75rem", { lineHeight: "1.2", letterSpacing: "0.02em" }],
                sm: ["0.875rem", { lineHeight: "1.4" }],
                base: ["1rem", { lineHeight: "1.6" }],
                lg: ["1.125rem", { lineHeight: "1.5" }],
                xl: ["1.25rem", { lineHeight: "1.4" }],
                "2xl": [
                    "1.5rem",
                    { lineHeight: "1.3", letterSpacing: "-0.01em" },
                ],
                "3xl": [
                    "1.875rem",
                    { lineHeight: "1.25", letterSpacing: "-0.02em" },
                ],
                "4xl": [
                    "2.25rem",
                    { lineHeight: "1.2", letterSpacing: "-0.025em" },
                ],
                "5xl": [
                    "3rem",
                    { lineHeight: "1.1", letterSpacing: "-0.03em" },
                ],
                "6xl": [
                    "3.75rem",
                    { lineHeight: "1", letterSpacing: "-0.035em" },
                ],
                "7xl": [
                    "4.5rem",
                    { lineHeight: "1", letterSpacing: "-0.04em" },
                ],
            },

            // In-between spacing values for distinctive rhythm
            spacing: {
                4.5: "1.125rem", // 18px
                5.5: "1.375rem", // 22px
                7: "1.75rem", // 28px
                9: "2.25rem", // 36px
                11: "2.875rem", // 46px
                13: "3.375rem", // 54px
                15: "3.875rem", // 62px
                18: "4.5rem", // 72px
                22: "5.5rem", // 88px
            },

            // Custom border radius scale
            borderRadius: {
                none: "0",
                subtle: "0.1875rem", // 3px
                sm: "0.3125rem", // 5px
                DEFAULT: "0.5rem", // 8px
                md: "0.625rem", // 10px
                lg: "0.875rem", // 14px
                xl: "1.125rem", // 18px
                "2xl": "1.5rem", // 24px
                "3xl": "2rem", // 32px
                pill: "624.9375rem", // Pill shape
                full: "9999px",
            },

            // Colored shadows — not flat gray
            boxShadow: {
                elegant: "0 2px 8px rgba(99, 132, 173, 0.08)",
                elevated: "0 4px 16px rgba(99, 132, 173, 0.12)",
                floating: "0 8px 32px rgba(99, 132, 173, 0.16)",
                dramatic: "0 20px 60px rgba(99, 132, 173, 0.24)",
                "inner-glow": "inset 0 2px 12px rgba(99, 132, 173, 0.1)",
                glow: "0 0 20px rgba(99, 132, 173, 0.3)",
            },

            // Custom easing curves
            transitionTimingFunction: {
                smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
                "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                elastic: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
            },

            // Custom keyframes
            keyframes: {
                "slide-up": {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "scale-in": {
                    "0%": { transform: "scale(0.95)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-1000px 0" },
                    "100%": { backgroundPosition: "1000px 0" },
                },
            },

            // Named animations
            animation: {
                "slide-up": "slide-up 0.5s ease-out",
                "fade-in": "fade-in 0.4s ease-out",
                "scale-in": "scale-in 0.3s ease-out",
                shimmer: "shimmer 2s infinite",
            },

            // Semantic grid layouts
            gridTemplateColumns: {
                sidebar: "280px 1fr",
                dashboard: "repeat(auto-fill, minmax(320px, 1fr))",
                asymmetric: "2fr 1fr",
            },

            // Custom background patterns
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                noise: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
        require("@tailwindcss/aspect-ratio"),
        require("@tailwindcss/container-queries"),
    ],
};
