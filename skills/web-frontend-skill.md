# Web Frontend Development Skill

## Service Overview

**Service Name**: Web Frontend
**Technology**: React 18 + Vite 5 + Tailwind CSS 3
**Language**: JavaScript (ES6+) / JSX
**Port**: 3000 (development), 80 (production via Nginx)
**IDE**: VSCode
**Package Manager**: npm

---

## Technology Stack & Versions

### Core Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "vite": "^5.0.8"
}
```

### Styling (Required)
```bash
npm install -D tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20
npx tailwindcss init -p
```

### Recommended Additional Libraries

#### Routing
```bash
npm install react-router-dom@^6.20.0
```

#### State Management
```bash
npm install zustand@^4.4.7
# OR
npm install @tanstack/react-query@^5.14.0
```

#### Form Handling
```bash
npm install react-hook-form@^7.49.0
npm install zod@^3.22.4  # For validation
```

#### HTTP Client
```bash
npm install axios@^1.6.2
```

#### UI Components (Optional)
```bash
npm install @headlessui/react@^1.7.17
npm install @heroicons/react@^2.1.1
```

#### Tailwind Plugins (Recommended)
```bash
npm install -D @tailwindcss/forms@^0.5.7
npm install -D @tailwindcss/typography@^0.5.10
npm install -D @tailwindcss/aspect-ratio@^0.4.2
npm install -D @tailwindcss/container-queries@^0.1.1
```

#### Date Handling
```bash
npm install date-fns@^3.0.0
```

#### Notifications/Toasts
```bash
npm install react-hot-toast@^2.4.1
```

---

## Project Structure

```
web/
├── public/                      # Static assets
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── main.jsx                # Application entry point (imports index.css)
│   ├── App.jsx                 # Root component
│   │
│   ├── components/             # Reusable components
│   │   ├── common/            # Generic components (Tailwind utility classes)
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── MainLayout.jsx
│   │   │
│   │   └── features/          # Feature-specific components
│   │       ├── auth/
│   │       ├── courses/
│   │       ├── assignments/
│   │       └── profile/
│   │
│   ├── pages/                 # Page components (routes)
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── dashboard/
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── ProfessorDashboard.jsx
│   │   ├── courses/
│   │   │   ├── CoursesPage.jsx
│   │   │   └── CourseDetailPage.jsx
│   │   ├── assignments/
│   │   │   ├── AssignmentsPage.jsx
│   │   │   ├── AssignmentDetailPage.jsx
│   │   │   └── SubmissionPage.jsx
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useCourses.js
│   │   ├── useAssignments.js
│   │   └── useApi.js
│   │
│   ├── services/              # API service layer
│   │   ├── api.js            # Axios instance configuration
│   │   ├── authService.js
│   │   ├── courseService.js
│   │   ├── assignmentService.js
│   │   └── userService.js
│   │
│   ├── store/                 # State management
│   │   ├── authStore.js
│   │   ├── courseStore.js
│   │   └── uiStore.js
│   │
│   ├── utils/                 # Utility functions
│   │   ├── formatters.js     # Date, number formatting
│   │   ├── validators.js     # Input validation
│   │   ├── constants.js      # App constants
│   │   └── helpers.js        # Helper functions
│   │
│   ├── styles/                # Stylesheets
│   │   ├── index.css         # Tailwind directives + global base styles
│   │   └── animations.css    # Complex @keyframes (CSS Modules fallback)
│   │
│   └── assets/                # Images, fonts, etc.
│       ├── images/
│       └── fonts/
│
├── .env.development           # Development environment variables
├── .env.production            # Production environment variables
├── index.html                 # HTML template
├── tailwind.config.js         # HEAVILY customized Tailwind config
├── postcss.config.js          # PostCSS config (Tailwind + Autoprefixer)
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
└── README.md                  # Service documentation
```

---

## Styling Approach: Tailwind CSS + Custom Configuration

This project uses **Tailwind CSS with extensive customization** as the primary styling approach.

### Why Tailwind CSS?

**For Multi-Page Applications:**
- ✅ Consistency across 10+ pages without writing repetitive CSS
- ✅ Rapid development with utility classes
- ✅ Built-in responsive design and dark mode
- ✅ Automatic purging of unused styles in production
- ✅ Easier team collaboration — styles live next to the markup
- ✅ No naming collisions, no specificity wars

**Critical: Customization is Required**
❌ Default Tailwind = Generic SaaS look
✅ Heavily customized Tailwind = Distinctive, beautiful design

### Installation

```bash
npm install -D tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`. Then create the entry CSS file:

```css
/* src/styles/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply min-h-screen antialiased;
}
```

Import it in `src/main.jsx`:

```jsx
import './styles/index.css';
```

### When to Use CSS Modules Instead

Use CSS Modules (`.module.css`) for:
- Complex animations with `@keyframes`
- Unique one-off components with special visual effects
- Third-party component styling overrides
- When Tailwind utilities become unreadable (10+ classes on a single element)

**Rule of thumb:** 80% Tailwind utilities, 20% CSS Modules for special cases.

---

## Design System

> **The Golden Rule:**
> "Tailwind CSS is not a design system — it's a tool for building YOUR design system. The default config produces generic results. Your job is to customize it extensively."

### Color Palette Library

**Choose ONE palette that fits your project's purpose. Don't default to purple.**

Every palette below is provided as a `tailwind.config.js` `extend.colors` block. Copy the one you pick into your config.

#### Palette 1: Warm & Earthy
**Use for:** Wellness apps, organic food brands, eco-friendly products, artisanal services

```javascript
// tailwind.config.js → theme.extend.colors
colors: {
  primary: {
    50:  '#fef7f5',
    100: '#fdece8',
    200: '#fad9d1',
    300: '#f5bbae',
    400: '#ef9280',
    500: '#e86d5a',  // Main primary — Terracotta
    600: '#d9523f',
    700: '#b63e2f',
    800: '#953329',
    900: '#7a2b24',
  },
  secondary: {
    50:  '#f7f9f7',
    100: '#eef3ee',
    200: '#dce7dc',
    300: '#bfd4be',
    400: '#9dbba0',
    500: '#7fa386',  // Main secondary — Sage
    600: '#64856b',
    700: '#526a56',
    800: '#455748',
    900: '#3c4a3e',
  },
  neutral: {
    50:  '#fdfcf9',
    100: '#f8f6f1',
    200: '#efebe1',
    300: '#e0d9c9',
    400: '#c5bba6',
    500: '#a89a80',  // Cream grays
    600: '#8a7b62',
    700: '#6e6150',
    800: '#5a4e41',
    900: '#4a4137',
  },
  success: '#5a8f5a',
  warning: '#c9a227',
  error:   '#c94a4a',
  info:    '#4a7a9a',
},
```

#### Palette 2: Cool & Professional
**Use for:** Financial apps, B2B SaaS, legal services, corporate dashboards, **education platforms**

```javascript
colors: {
  primary: {
    50:  '#f5f7fa',
    100: '#e8ecf3',
    200: '#d1d9e6',
    300: '#aebfd6',
    400: '#85a0c2',
    500: '#6384ad',  // Main primary — Deep Navy
    600: '#4a6a94',
    700: '#3d577a',
    800: '#364a66',
    900: '#2f4057',
  },
  secondary: {
    50:  '#f0f9f8',
    100: '#dff4f0',
    200: '#bfe8e0',
    300: '#8dd4c6',
    400: '#5ab8a8',
    500: '#349e8e',  // Main secondary — Teal
    600: '#288073',
    700: '#22665d',
    800: '#1e544d',
    900: '#1a4642',
  },
  neutral: {
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',  // Slate grays
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: '#0d9488',
  warning: '#d97706',
  error:   '#dc2626',
  info:    '#2563eb',
},
```

#### Palette 3: Bold & Energetic
**Use for:** Fitness apps, creative agencies, youth platforms, entertainment

```javascript
colors: {
  primary: {
    50:  '#fff5f3',
    100: '#ffe8e3',
    200: '#ffd1c6',
    300: '#ffa996',
    400: '#ff7a62',
    500: '#ff5238',  // Main primary — Coral
    600: '#e6392b',
    700: '#c92e23',
    800: '#a8261f',
    900: '#8b221a',
  },
  secondary: {
    50:  '#f0f7ff',
    100: '#dff0ff',
    200: '#bce0ff',
    300: '#85c5ff',
    400: '#4da6ff',
    500: '#1a8cff',  // Main secondary — Electric Blue
    600: '#0070e6',
    700: '#0058b8',
    800: '#004796',
    900: '#003b7d',
  },
  neutral: {
    50:  '#faf9f7',
    100: '#f5f3ef',
    200: '#e8e5de',
    300: '#d4cfc4',
    400: '#b5ada0',
    500: '#968d7d',  // Warm grays
    600: '#7a7060',
    700: '#625a4d',
    800: '#514a40',
    900: '#443e36',
  },
  success: '#16a34a',
  warning: '#ea580c',
  error:   '#dc2626',
  info:    '#0891b2',
},
```

#### Palette 4: Sophisticated & Muted
**Use for:** Luxury brands, boutique services, art galleries, high-end consulting

```javascript
colors: {
  primary: {
    50:  '#f7f7f7',
    100: '#eeeeee',
    200: '#dddddd',
    300: '#c0c0c0',
    400: '#9e9e9e',
    500: '#7a7a7a',  // Main primary — Charcoal
    600: '#626262',
    700: '#525252',
    800: '#464646',
    900: '#3d3d3d',
  },
  secondary: {
    50:  '#fdf8fb',
    100: '#fbf1f6',
    200: '#f6e3ed',
    300: '#eec9db',
    400: '#e2a6c5',
    500: '#d486b0',  // Main secondary — Mauve
    600: '#b86a96',
    700: '#9a567d',
    800: '#82486a',
    900: '#6e3e5b',
  },
  neutral: {
    50:  '#faf9f8',
    100: '#f5f3f1',
    200: '#ebe7e3',
    300: '#dcd6cf',
    400: '#c4bbb1',
    500: '#a89d90',  // Dusty grays
    600: '#8a7e70',
    700: '#6e6459',
    800: '#5a5249',
    900: '#4b453e',
  },
  success: '#6b8e6b',
  warning: '#b8860b',
  error:   '#b86b6b',
  info:    '#6b8eb8',
},
```

#### Palette 5: Vibrant & Playful
**Use for:** Children's apps, gaming platforms, social media, creative tools

```javascript
colors: {
  primary: {
    50:  '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',  // Main primary — Tangerine
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  secondary: {
    50:  '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',  // Main secondary — Magenta
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  neutral: {
    50:  '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',  // Soft grays
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  success: '#22c55e',
  warning: '#eab308',
  error:   '#ef4444',
  info:    '#3b82f6',
},
```

#### Palette 6: Monochromatic & Modern
**Use for:** Minimalist apps, developer tools, documentation sites, clean interfaces

```javascript
colors: {
  primary: {
    50:  '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',  // Main primary — Dark Gray
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  secondary: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main secondary — Accent Blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  neutral: {
    50:  '#ffffff',
    100: '#f9fafb',
    200: '#f3f4f6',
    300: '#e5e7eb',
    400: '#d1d5db',
    500: '#9ca3af',  // Pure grayscale
    600: '#6b7280',
    700: '#4b5563',
    800: '#374151',
    900: '#1f2937',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error:   '#ef4444',
  info:    '#3b82f6',
},
```

---

### Typography

**Avoid defaulting to Inter, Roboto, or system fonts unless intentionally designing for brutalist/minimalist aesthetic.**

All font pairings below are written as `tailwind.config.js` `extend.fontFamily` blocks. Pick one, add the corresponding Google Fonts `@import` to your `index.css`.

#### Pairing 1: Editorial Elegance
**Use case:** Blogs, magazines, content-heavy sites, journalism platforms

```css
/* Add to src/styles/index.css — BEFORE the @tailwind directives */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap');
```

```javascript
// tailwind.config.js → theme.extend.fontFamily
fontFamily: {
  display: ['Playfair Display', 'Georgia', 'serif'],
  body:    ['Outfit', 'system-ui', 'sans-serif'],
  mono:    ['Fira Code', 'monospace'],
},
```

#### Pairing 2: Tech & Modern
**Use case:** SaaS dashboards, tech products, developer tools, analytics platforms

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
```

```javascript
fontFamily: {
  display: ['Space Grotesk', 'sans-serif'],
  body:    ['DM Sans', 'system-ui', 'sans-serif'],
  mono:    ['JetBrains Mono', 'monospace'],
},
```

#### Pairing 3: Friendly & Approachable
**Use case:** Education, community platforms, health apps, consumer products

```css
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700;800&display=swap');
```

```javascript
fontFamily: {
  display: ['Quicksand', 'sans-serif'],
  body:    ['Nunito', 'system-ui', 'sans-serif'],
  mono:    ['Fira Code', 'monospace'],
},
```

#### Pairing 4: Bold & Impactful
**Use case:** Landing pages, marketing sites, creative portfolios, brand showcases

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&display=swap');
```

```javascript
fontFamily: {
  display: ['Syne', 'sans-serif'],
  body:    ['Manrope', 'system-ui', 'sans-serif'],
  mono:    ['Space Mono', 'monospace'],
},
```

#### Pairing 5: Classic & Trustworthy
**Use case:** Financial services, legal platforms, enterprise software, government sites

```css
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
```

```javascript
fontFamily: {
  display: ['Libre Baskerville', 'Georgia', 'serif'],
  body:    ['Work Sans', 'system-ui', 'sans-serif'],
  mono:    ['IBM Plex Mono', 'monospace'],
},
```

#### Pairing 6: Creative & Artistic
**Use case:** Design tools, creative agencies, art platforms, portfolio sites

```css
@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@300;400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap');
```

```javascript
fontFamily: {
  display: ['Clash Display', 'sans-serif'],
  body:    ['Instrument Sans', 'system-ui', 'sans-serif'],
  mono:    ['Space Grotesk Mono', 'monospace'],
},
```

#### Pairing 7: Minimalist & Clean
**Use case:** E-commerce, productivity apps, documentation, clean interfaces

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
```

```javascript
fontFamily: {
  display: ['Sora', 'sans-serif'],
  body:    ['Inter', 'system-ui', 'sans-serif'],
  mono:    ['JetBrains Mono', 'monospace'],
},
```

#### Pairing 8: Retro & Vintage
**Use case:** Nostalgic brands, retro games, vintage shops, themed experiences

```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
```

```javascript
fontFamily: {
  display: ['Bebas Neue', 'sans-serif'],
  body:    ['DM Sans', 'system-ui', 'sans-serif'],
  mono:    ['VT323', 'monospace'],
},
```

---

### Custom Font Sizes

Never rely solely on Tailwind defaults. Add custom line-height and letter-spacing tuning:

```javascript
// tailwind.config.js → theme.extend.fontSize
fontSize: {
  'xs':  ['0.75rem',  { lineHeight: '1.2', letterSpacing: '0.02em' }],
  'sm':  ['0.875rem', { lineHeight: '1.4' }],
  'base': ['1rem',    { lineHeight: '1.6' }],
  'lg':  ['1.125rem', { lineHeight: '1.5' }],
  'xl':  ['1.25rem',  { lineHeight: '1.4' }],
  '2xl': ['1.5rem',   { lineHeight: '1.3', letterSpacing: '-0.01em' }],
  '3xl': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
  '4xl': ['2.25rem',  { lineHeight: '1.2', letterSpacing: '-0.025em' }],
  '5xl': ['3rem',     { lineHeight: '1.1', letterSpacing: '-0.03em' }],
  '6xl': ['3.75rem',  { lineHeight: '1', letterSpacing: '-0.035em' }],
  '7xl': ['4.5rem',   { lineHeight: '1', letterSpacing: '-0.04em' }],
},
```

---

### Custom Spacing

Add in-between values for distinctive rhythm:

```javascript
// tailwind.config.js → theme.extend.spacing
spacing: {
  '4.5': '1.125rem',   // 18px
  '5.5': '1.375rem',   // 22px
  '7':   '1.75rem',    // 28px
  '9':   '2.25rem',    // 36px
  '11':  '2.875rem',   // 46px
  '13':  '3.375rem',   // 54px
  '15':  '3.875rem',   // 62px
  '18':  '4.5rem',     // 72px
  '22':  '5.5rem',     // 88px
},
```

---

### Custom Border Radius

```javascript
// tailwind.config.js → theme.extend.borderRadius
borderRadius: {
  'none':    '0',
  'subtle':  '0.1875rem',   // 3px
  'sm':      '0.3125rem',   // 5px
  'DEFAULT': '0.5rem',      // 8px
  'md':      '0.625rem',    // 10px
  'lg':      '0.875rem',    // 14px
  'xl':      '1.125rem',    // 18px
  '2xl':     '1.5rem',      // 24px
  '3xl':     '2rem',        // 32px
  'pill':    '624.9375rem', // Pill shape
  'full':    '9999px',
},
```

---

### Custom Shadows

Always use colored shadows — not flat gray:

```javascript
// tailwind.config.js → theme.extend.boxShadow
boxShadow: {
  'elegant':    '0 2px 8px rgba(99, 132, 173, 0.08)',
  'elevated':   '0 4px 16px rgba(99, 132, 173, 0.12)',
  'floating':   '0 8px 32px rgba(99, 132, 173, 0.16)',
  'dramatic':   '0 20px 60px rgba(99, 132, 173, 0.24)',
  'inner-glow': 'inset 0 2px 12px rgba(99, 132, 173, 0.1)',
  'glow':       '0 0 20px rgba(99, 132, 173, 0.3)',
},
```

---

### Custom Transitions

```javascript
// tailwind.config.js → theme.extend
transitionTimingFunction: {
  'smooth':    'cubic-bezier(0.4, 0, 0.2, 1)',
  'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'elastic':   'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
},
```

---

### Custom Animations

```javascript
// tailwind.config.js → theme.extend
keyframes: {
  'slide-up': {
    '0%':   { transform: 'translateY(20px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  'fade-in': {
    '0%':   { opacity: '0' },
    '100%': { opacity: '1' },
  },
  'scale-in': {
    '0%':   { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  'shimmer': {
    '0%':   { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },
},
animation: {
  'slide-up': 'slide-up 0.5s ease-out',
  'fade-in':  'fade-in 0.4s ease-out',
  'scale-in': 'scale-in 0.3s ease-out',
  'shimmer':  'shimmer 2s infinite',
},
```

---

### Custom Grid Columns

```javascript
// tailwind.config.js → theme.extend
gridTemplateColumns: {
  'sidebar':    '280px 1fr',
  'dashboard':  'repeat(auto-fill, minmax(320px, 1fr))',
  'asymmetric': '2fr 1fr',
},
```

---

### Custom Background Patterns

```javascript
// tailwind.config.js → theme.extend
backgroundImage: {
  'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
  'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
},
```

---

## Complete Tailwind Config Examples

Below are 6 fully assembled `tailwind.config.js` files — one per aesthetic. Copy the one that matches your project.

### Config 1: Cool & Professional (Education / Finance)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { 50: '#f5f7fa', 100: '#e8ecf3', 200: '#d1d9e6', 300: '#aebfd6', 400: '#85a0c2', 500: '#6384ad', 600: '#4a6a94', 700: '#3d577a', 800: '#364a66', 900: '#2f4057' },
        secondary: { 50: '#f0f9f8', 100: '#dff4f0', 200: '#bfe8e0', 300: '#8dd4c6', 400: '#5ab8a8', 500: '#349e8e', 600: '#288073', 700: '#22665d', 800: '#1e544d', 900: '#1a4642' },
        neutral:   { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
        success: '#0d9488', warning: '#d97706', error: '#dc2626', info: '#2563eb',
      },
      fontFamily: {
        display: ['Quicksand', 'sans-serif'],
        body:    ['Nunito', 'system-ui', 'sans-serif'],
        mono:    ['Fira Code', 'monospace'],
      },
      fontSize: {
        'xs':  ['0.75rem',  { lineHeight: '1.2', letterSpacing: '0.02em' }],
        'sm':  ['0.875rem', { lineHeight: '1.4' }],
        'base': ['1rem',    { lineHeight: '1.6' }],
        'lg':  ['1.125rem', { lineHeight: '1.5' }],
        'xl':  ['1.25rem',  { lineHeight: '1.4' }],
        '2xl': ['1.5rem',   { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem',  { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        '5xl': ['3rem',     { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },
      spacing: { '4.5': '1.125rem', '5.5': '1.375rem', '7': '1.75rem', '9': '2.25rem', '11': '2.875rem', '13': '3.375rem', '15': '3.875rem', '18': '4.5rem', '22': '5.5rem' },
      borderRadius: { 'subtle': '0.1875rem', 'sm': '0.3125rem', 'DEFAULT': '0.5rem', 'md': '0.625rem', 'lg': '0.875rem', 'xl': '1.125rem', '2xl': '1.5rem', 'pill': '624.9375rem' },
      boxShadow: {
        'elegant':  '0 2px 8px rgba(99, 132, 173, 0.08)',
        'elevated': '0 4px 16px rgba(99, 132, 173, 0.12)',
        'floating': '0 8px 32px rgba(99, 132, 173, 0.16)',
        'dramatic': '0 20px 60px rgba(99, 132, 173, 0.24)',
      },
      transitionTimingFunction: { 'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)', 'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
      keyframes: {
        'slide-up': { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'fade-in':  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: { 'slide-up': 'slide-up 0.5s ease-out', 'fade-in': 'fade-in 0.4s ease-out', 'scale-in': 'scale-in 0.3s ease-out' },
      gridTemplateColumns: { 'sidebar': '280px 1fr', 'dashboard': 'repeat(auto-fill, minmax(320px, 1fr))' },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### Config 2: Warm & Earthy (Wellness / Organic)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { 50: '#fef7f5', 100: '#fdece8', 200: '#fad9d1', 300: '#f5bbae', 400: '#ef9280', 500: '#e86d5a', 600: '#d9523f', 700: '#b63e2f', 800: '#953329', 900: '#7a2b24' },
        secondary: { 50: '#f7f9f7', 100: '#eef3ee', 200: '#dce7dc', 300: '#bfd4be', 400: '#9dbba0', 500: '#7fa386', 600: '#64856b', 700: '#526a56', 800: '#455748', 900: '#3c4a3e' },
        neutral:   { 50: '#fdfcf9', 100: '#f8f6f1', 200: '#efebe1', 300: '#e0d9c9', 400: '#c5bba6', 500: '#a89a80', 600: '#8a7b62', 700: '#6e6150', 800: '#5a4e41', 900: '#4a4137' },
        success: '#5a8f5a', warning: '#c9a227', error: '#c94a4a', info: '#4a7a9a',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Outfit', 'system-ui', 'sans-serif'],
        mono:    ['Fira Code', 'monospace'],
      },
      borderRadius: { 'soft': '1rem', 'softer': '1.5rem', 'pill': '624.9375rem' },
      boxShadow: {
        'warm':     '0 4px 16px rgba(232, 109, 90, 0.08)',
        'warm-lg':  '0 8px 32px rgba(232, 109, 90, 0.12)',
        'warm-xl':  '0 20px 60px rgba(232, 109, 90, 0.16)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

### Config 3: Bold & Energetic (Fitness / Creative)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { 50: '#fff5f3', 100: '#ffe8e3', 200: '#ffd1c6', 300: '#ffa996', 400: '#ff7a62', 500: '#ff5238', 600: '#e6392b', 700: '#c92e23', 800: '#a8261f', 900: '#8b221a' },
        secondary: { 50: '#f0f7ff', 100: '#dff0ff', 200: '#bce0ff', 300: '#85c5ff', 400: '#4da6ff', 500: '#1a8cff', 600: '#0070e6', 700: '#0058b8', 800: '#004796', 900: '#003b7d' },
        neutral:   { 50: '#faf9f7', 100: '#f5f3ef', 200: '#e8e5de', 300: '#d4cfc4', 400: '#b5ada0', 500: '#968d7d', 600: '#7a7060', 700: '#625a4d', 800: '#514a40', 900: '#443e36' },
        success: '#16a34a', warning: '#ea580c', error: '#dc2626', info: '#0891b2',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Manrope', 'system-ui', 'sans-serif'],
        mono:    ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'bold':    '0 4px 16px rgba(255, 82, 56, 0.15)',
        'bold-lg': '0 8px 32px rgba(255, 82, 56, 0.2)',
        'neon':    '0 0 30px rgba(26, 140, 255, 0.4)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

### Config 4: Sophisticated & Muted (Luxury / Art)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { 50: '#f7f7f7', 100: '#eeeeee', 200: '#dddddd', 300: '#c0c0c0', 400: '#9e9e9e', 500: '#7a7a7a', 600: '#626262', 700: '#525252', 800: '#464646', 900: '#3d3d3d' },
        secondary: { 50: '#fdf8fb', 100: '#fbf1f6', 200: '#f6e3ed', 300: '#eec9db', 400: '#e2a6c5', 500: '#d486b0', 600: '#b86a96', 700: '#9a567d', 800: '#82486a', 900: '#6e3e5b' },
        neutral:   { 50: '#faf9f8', 100: '#f5f3f1', 200: '#ebe7e3', 300: '#dcd6cf', 400: '#c4bbb1', 500: '#a89d90', 600: '#8a7e70', 700: '#6e6459', 800: '#5a5249', 900: '#4b453e' },
        success: '#6b8e6b', warning: '#b8860b', error: '#b86b6b', info: '#6b8eb8',
      },
      fontFamily: {
        display: ['Libre Baskerville', 'Georgia', 'serif'],
        body:    ['Work Sans', 'system-ui', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'luxury':    '0 4px 12px rgba(0, 0, 0, 0.04)',
        'luxury-lg': '0 12px 40px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

### Config 5: Vibrant & Playful (Gaming / Social)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
        secondary: { 50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75' },
        neutral:   { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b' },
        success: '#22c55e', warning: '#eab308', error: '#ef4444', info: '#3b82f6',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { 'bubbly': '1.25rem', 'pill': '624.9375rem' },
      boxShadow: {
        'playful':    '0 8px 16px rgba(249, 115, 22, 0.2)',
        'playful-lg': '0 16px 48px rgba(217, 70, 239, 0.15)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

### Config 6: Minimalist & Zen (Productivity / Docs)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' },
        secondary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
        neutral:   { 50: '#ffffff', 100: '#f9fafb', 200: '#f3f4f6', 300: '#e5e7eb', 400: '#d1d5db', 500: '#9ca3af', 600: '#6b7280', 700: '#4b5563', 800: '#374151', 900: '#1f2937' },
        success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'zen':    '0 1px 3px rgba(0, 0, 0, 0.04)',
        'zen-lg': '0 4px 12px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

---

## Component Pattern Library with Tailwind

### Pattern: From Generic to Distinctive

```jsx
// ❌ GENERIC (default Tailwind — looks like every SaaS)
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>

// ⚠️ BETTER (using custom colors, but still basic)
<button className="bg-primary-600 text-white px-4 py-2 rounded-lg">
  Click me
</button>

// ✅ DISTINCTIVE (custom everything + micro-interactions)
<button className="group relative px-6 py-3.5
                   bg-gradient-to-br from-primary-600 to-primary-700
                   text-white font-medium font-body
                   rounded-pill shadow-elegant hover:shadow-floating
                   transition-all duration-300 ease-smooth
                   hover:-translate-y-0.5 hover:scale-[1.02]
                   active:translate-y-0 active:scale-100
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                   overflow-hidden">
  {/* Shimmer effect on hover */}
  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                   -translate-x-full group-hover:translate-x-full
                   transition-transform duration-1000" />
  <span className="relative">Click me</span>
</button>
```

---

### 1. Buttons

```jsx
// Primary Button
export function Button({ children, variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary:   'bg-primary-600 text-white hover:bg-primary-700 shadow-elegant hover:shadow-elevated',
    secondary: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 ring-1 ring-neutral-200',
    ghost:     'bg-transparent text-primary-600 hover:bg-primary-50',
    danger:    'bg-error text-white hover:bg-red-700 shadow-elegant',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-body font-medium rounded-lg
        transition-all duration-300 ease-smooth
        hover:-translate-y-0.5 active:translate-y-0
        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${variants[variant]}
        ${sizes[size]}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// Icon Button
export function IconButton({ icon: Icon, label, ...props }) {
  return (
    <button
      aria-label={label}
      className="p-2.5 rounded-lg text-neutral-500
                 hover:bg-neutral-100 hover:text-neutral-700
                 transition-colors duration-200
                 focus:outline-none focus:ring-2 focus:ring-primary-400"
      {...props}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
```

### 2. Cards

```jsx
// Basic Card
export function Card({ children, className = '' }) {
  return (
    <div className={`
      bg-white rounded-xl shadow-elegant p-7
      border border-neutral-100
      transition-all duration-500
      hover:shadow-floating hover:-translate-y-1
      ${className}
    `}>
      {children}
    </div>
  );
}

// Card with Image
export function ImageCard({ image, title, description, tag }) {
  return (
    <div className="group bg-white rounded-xl shadow-elegant overflow-hidden
                    border border-neutral-100
                    transition-all duration-500
                    hover:shadow-floating hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover
                     transition-transform duration-700
                     group-hover:scale-105"
        />
        {tag && (
          <span className="absolute top-3 right-3
                           bg-white/90 backdrop-blur-sm
                           text-xs font-semibold text-primary-700
                           px-3 py-1 rounded-pill">
            {tag}
          </span>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold text-neutral-900 mb-2">
          {title}
        </h3>
        <p className="text-neutral-500 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// Card with Gradient Header
export function GradientCard({ title, children, accent = 'primary' }) {
  return (
    <div className="rounded-xl shadow-elegant overflow-hidden border border-neutral-100">
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-5">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="bg-white p-6">{children}</div>
    </div>
  );
}
```

### 3. Inputs

```jsx
// Text Input
export function Input({ label, error, icon: Icon, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 font-body">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
        )}
        <input
          className={`
            w-full rounded-lg border bg-white font-body
            px-4 py-3 text-neutral-900 placeholder:text-neutral-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400
            ${Icon ? 'pl-11' : ''}
            ${error
              ? 'border-error focus:ring-error/30'
              : 'border-neutral-200 hover:border-neutral-300'}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-error font-body">{error}</p>
      )}
    </div>
  );
}

// Search Input
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400"
           fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3 rounded-pill
                   border border-neutral-200 bg-neutral-50
                   text-neutral-900 placeholder:text-neutral-400
                   transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-primary-400
                   focus:bg-white focus:border-primary-400"
      />
    </div>
  );
}
```

### 4. Modals

```jsx
// Centered Modal
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm
                   animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-lg
                      bg-white rounded-2xl shadow-dramatic
                      animate-scale-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h2 className="font-display text-xl font-semibold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-neutral-400
                       hover:bg-neutral-100 hover:text-neutral-600
                       transition-colors duration-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
export function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete">
      <p className="text-neutral-600 mb-6">
        Are you sure you want to delete "<strong>{itemName}</strong>"?
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Delete</Button>
      </div>
    </Modal>
  );
}
```

### 5. Navigation

```jsx
// Header Navigation
export function Header() {
  return (
    <header className="sticky top-0 z-40
                       bg-white/80 backdrop-blur-lg
                       border-b border-neutral-100 shadow-elegant">
      <div className="max-w-7xl mx-auto px-6 py-4
                      flex items-center justify-between">
        <a href="/" className="font-display text-2xl font-bold
                               bg-gradient-to-r from-primary-600 to-secondary-500
                               bg-clip-text text-transparent">
          🎓 Committed
        </a>
        <nav className="hidden md:flex items-center gap-1">
          {['Dashboard', 'Courses', 'Assignments'].map((item) => (
            <a
              key={item}
              href={`/${item.toLowerCase()}`}
              className="px-4 py-2 rounded-lg text-sm font-medium
                         text-neutral-600 hover:text-primary-600 hover:bg-primary-50
                         transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

// Tab Navigation
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${activeTab === tab.id
              ? 'bg-white text-primary-700 shadow-elegant'
              : 'text-neutral-500 hover:text-neutral-700'}
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### 6. Tables

```jsx
export function DataTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-elegant">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-left font-semibold text-neutral-600
                           uppercase tracking-wider text-xs"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row, i) => (
            <tr
              key={i}
              className="bg-white hover:bg-primary-50/50
                         transition-colors duration-150"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-neutral-700">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 7. Forms

```jsx
// Multi-step Form Shell
export function MultiStepForm({ steps, currentStep, children }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-10">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              text-sm font-bold transition-colors duration-300
              ${i <= currentStep
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-200 text-neutral-500'}
            `}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`
                w-16 h-0.5 mx-2 transition-colors duration-300
                ${i < currentStep ? 'bg-primary-600' : 'bg-neutral-200'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-elevated p-8
                      animate-fade-in">
        {children}
      </div>
    </div>
  );
}
```

### 8. Toast Notifications

```jsx
import toast from 'react-hot-toast';

// Success
toast.success('Course created successfully');

// Error
toast.error('Failed to create course');

// Loading → Success
const toastId = toast.loading('Creating course…');
toast.success('Course created!', { id: toastId });

// Custom styled toast
toast.custom((t) => (
  <div className={`
    flex items-center gap-3 px-5 py-4
    bg-white rounded-xl shadow-floating
    border border-neutral-100
    transition-all duration-300
    ${t.visible ? 'animate-slide-up' : 'opacity-0 translate-y-2'}
  `}>
    <span className="text-sm text-neutral-700">Custom notification</span>
    <button
      onClick={() => toast.dismiss(t.id)}
      className="text-xs text-neutral-400 hover:text-neutral-600
                 transition-colors"
    >
      Dismiss
    </button>
  </div>
));
```

### 9. Loading States

```jsx
// Skeleton Loader
export function Skeleton({ className = '' }) {
  return (
    <div className={`
      animate-pulse rounded-lg bg-neutral-200
      ${className}
    `} />
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-elegant p-7 border border-neutral-100">
      <Skeleton className="h-5 w-2/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-4/5 mb-6" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

// Spinner
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <svg
      className={`animate-spin text-primary-600 ${sizes[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
```

### 10. Empty States

```jsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-18 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
          <Icon className="h-8 w-8 text-primary-400" />
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-neutral-800 mb-2">
        {title}
      </h3>
      <p className="text-neutral-500 text-sm max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}
```

### 11. Status Badges

```jsx
export function Badge({ status, label }) {
  const styles = {
    success:  'bg-green-50 text-green-700 ring-green-600/20',
    warning:  'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    error:    'bg-red-50 text-red-700 ring-red-600/20',
    info:     'bg-blue-50 text-blue-700 ring-blue-600/20',
    neutral:  'bg-neutral-50 text-neutral-600 ring-neutral-500/20',
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5
      rounded-pill px-3 py-1
      text-xs font-semibold ring-1 ring-inset
      ${styles[status] || styles.neutral}
    `}>
      <span className={`
        h-1.5 w-1.5 rounded-full
        ${status === 'success' ? 'bg-green-500' :
          status === 'warning' ? 'bg-yellow-500' :
          status === 'error'   ? 'bg-red-500' :
          status === 'info'    ? 'bg-blue-500' : 'bg-neutral-400'}
      `} />
      {label}
    </span>
  );
}
```

---

## Design Anti-Patterns to Avoid

These are overused patterns that make frontends look generic and AI-generated.

### ❌ Using Default Config Without Customization

**Bad:**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  // Using ALL defaults — generic SaaS look guaranteed
}
```

**Good:**
```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors:     { /* custom palette */ },
      fontFamily: { /* distinctive fonts */ },
      boxShadow:  { /* colored shadows */ },
      // ... extensive customization
    }
  }
}
```

### ❌ Generic Utility Combinations

**Bad (looks like every SaaS app):**
```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold mb-4">Title</h2>
  <p className="text-gray-600">Description</p>
</div>
```

**Good (distinctive and unique):**
```jsx
<div className="bg-gradient-to-br from-white to-neutral-50
                rounded-xl shadow-elegant
                p-7 border border-neutral-100
                hover:shadow-floating transition-all duration-500">
  <h2 className="font-display text-2xl font-semibold mb-3
                 bg-gradient-to-r from-primary-700 to-secondary-600
                 bg-clip-text text-transparent">
    Title
  </h2>
  <p className="text-neutral-600 leading-relaxed">Description</p>
</div>
```

### ❌ Not Using Custom Values

**Bad:**
```jsx
<div className="p-4 rounded-lg">  {/* Generic 1rem padding, 0.5rem radius */}
```

**Good:**
```jsx
<div className="p-7 rounded-xl">  {/* Custom 1.75rem padding, 1.125rem radius */}
```

### ❌ Ignoring Hover/Focus States

**Bad:**
```jsx
<button className="bg-primary-600 text-white px-4 py-2 rounded">Click</button>
```

**Good:**
```jsx
<button className="bg-primary-600 hover:bg-primary-700
                   active:bg-primary-800
                   text-white px-4 py-2 rounded
                   transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                   hover:-translate-y-0.5 hover:shadow-lg">
  Click
</button>
```

### ❌ Overusing Arbitrary Values

**Bad (defeats purpose of design system):**
```jsx
<div className="p-[13px] text-[17px] rounded-[9px]">
```

**Good (use config instead):**
```javascript
// tailwind.config.js
spacing: { '13': '3.375rem' }

// Component
<div className="p-13">
```

### ❌ Color Anti-Patterns
- Purple (#8b5cf6) or purple-pink gradients as primary colors
- Identical Material Design or Tailwind default colors without customization
- Evenly distributed rainbow palettes with no dominant color
- Pure white backgrounds with pure black text (no warmth or character)

### ❌ Typography Anti-Patterns
- Using only system fonts without any distinctive display font
- Inter or Roboto without any font pairing
- Setting all headings and body text to the same font family
- Font sizes that exactly match Tailwind defaults without line-height tuning

### ❌ Layout Anti-Patterns
- Every section using the same max-width container
- Perfectly symmetrical, centered layouts with no visual tension
- Card grids with identical padding and spacing
- Hamburger menus on desktop (when space allows for full navigation)

### ❌ Component Anti-Patterns
- Rounded corners that are all the same radius (8px everywhere)
- Buttons that are exactly 40px or 44px tall without variation
- Shadows using identical `rgba(0,0,0,0.1)` values
- Hover states that only change opacity

### ✅ Instead, Do This
- Choose unexpected color combinations that fit your domain
- Use distinctive typography with at least 2 font families
- Create visual hierarchy through asymmetry and varied spacing
- Customize every value intentionally — don't accept framework defaults
- Always include hover, focus, and active states
- Use colored shadows, not just gray

---

## Aesthetic Direction Guide

Choose ONE aesthetic direction that aligns with your project's purpose and brand identity. Each direction below is expressed through Tailwind classes.

### Direction 1: Brutalist/Raw

**Description:** Bold, unapologetic design with harsh borders and high contrast.

**Key Tailwind patterns:**
```jsx
<div className="border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
  <h2 className="font-mono text-2xl font-bold uppercase tracking-widest">Title</h2>
</div>
```

**Characteristics:** `rounded-none`, thick borders, mono fonts, no shadows or harsh offset shadows, dense spacing

**Use cases:** Portfolio sites, experimental projects, tech blogs, developer tools

### Direction 2: Soft/Organic

**Description:** Gentle, flowing design with rounded corners and pastel colors.

**Key Tailwind patterns:**
```jsx
<div className="bg-neutral-50 rounded-3xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
  <h2 className="font-display text-2xl font-semibold text-neutral-800">Title</h2>
</div>
```

**Characteristics:** `rounded-2xl` to `rounded-3xl`, soft diffused shadows, generous spacing, pastel colors

**Use cases:** Wellness apps, children's products, lifestyle brands, community platforms

### Direction 3: Editorial/Magazine

**Description:** Sophisticated, content-focused design with serif headings and asymmetric layouts.

**Key Tailwind patterns:**
```jsx
<div className="border-b border-neutral-200 pb-6">
  <h2 className="font-display text-4xl font-semibold tracking-tight text-neutral-900">Title</h2>
  <p className="mt-3 text-lg leading-relaxed text-neutral-600 max-w-prose">Content</p>
</div>
```

**Characteristics:** serif `font-display`, thin borders, varied column widths, generous line-heights

**Use cases:** Blogs, magazines, news sites, content platforms

### Direction 4: Retro/Vintage

**Description:** Nostalgic design with warm tones, texture overlays, and classic typography.

**Key Tailwind patterns:**
```jsx
<div className="bg-[#f5f0e6] rounded border-2 border-[#8b7355] p-6
                shadow-[4px_4px_0px_rgba(139,115,85,0.3)]">
  <h2 className="font-display text-3xl uppercase tracking-wider">Title</h2>
</div>
```

**Characteristics:** warm neutral backgrounds, visible colored borders, offset shadows, uppercase headings

**Use cases:** Vintage shops, themed restaurants, nostalgic brands, retro games

### Direction 5: High-Tech/Futuristic

**Description:** Cutting-edge design with neon accents, dark backgrounds, and geometric patterns.

**Key Tailwind patterns:**
```jsx
<div className="bg-[#0a0a0f] rounded-lg border border-[rgba(0,255,136,0.3)] p-6
                shadow-[0_0_20px_rgba(0,255,136,0.5)]">
  <h2 className="font-mono text-2xl font-bold text-[#00ff88]">Title</h2>
</div>
```

**Characteristics:** dark mode default, neon accent colors, mono fonts, glowing shadows, thin glowing borders

**Use cases:** Tech startups, crypto platforms, gaming sites, developer tools

### Direction 6: Luxury/Refined

**Description:** Elegant, premium design with serif fonts, gold accents, and generous whitespace.

**Key Tailwind patterns:**
```jsx
<div className="bg-[#faf9f6] rounded-md p-10 border border-neutral-100
                shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
  <h2 className="font-display text-3xl font-semibold text-neutral-900 tracking-tight">Title</h2>
  <div className="w-12 h-0.5 bg-[#c9a227] mt-4" />
</div>
```

**Characteristics:** very generous spacing, gold/brass accents, serif headings, subtle shadows, thin borders

**Use cases:** Luxury brands, high-end services, premium products

### Direction 7: Playful/Friendly

**Description:** Cheerful, energetic design with bright colors, bubbly shapes, and rounded fonts.

**Key Tailwind patterns:**
```jsx
<div className="bg-white rounded-[1.25rem] p-7
                shadow-[0_8px_16px_rgba(255,107,107,0.2)]
                hover:-rotate-1 hover:scale-[1.02]
                transition-all duration-300">
  <h2 className="font-display text-2xl font-bold text-neutral-800">Title 🎉</h2>
</div>
```

**Characteristics:** `rounded-2xl`+, colorful shadows, slight rotations on hover, emoji use, rounded fonts

**Use cases:** Children's apps, gaming platforms, social media, creative tools

### Direction 8: Minimalist/Zen

**Description:** Ultra-clean design with monochromatic colors, extreme whitespace, and one accent color.

**Key Tailwind patterns:**
```jsx
<div className="py-16 px-6">
  <h2 className="font-body text-xl font-medium text-neutral-800 mb-4">Title</h2>
  <div className="w-8 h-px bg-neutral-300 mb-4" />
  <p className="text-sm text-neutral-500 leading-loose max-w-md">Content</p>
</div>
```

**Characteristics:** extreme whitespace, hairline borders or none, minimal shadows, single accent color

**Use cases:** Productivity apps, documentation, developer tools, clean interfaces

---

## Tailwind CSS Best Practices

### 1. Extract Repeated Patterns to Components

❌ **Don't repeat utilities:**
```jsx
<button className="px-6 py-3 bg-primary-600 text-white rounded-lg shadow-md hover:shadow-lg transition">Submit</button>
<button className="px-6 py-3 bg-primary-600 text-white rounded-lg shadow-md hover:shadow-lg transition">Cancel</button>
<button className="px-6 py-3 bg-primary-600 text-white rounded-lg shadow-md hover:shadow-lg transition">Delete</button>
```

✅ **Do extract to a component:**
```jsx
<Button variant="primary">Submit</Button>
<Button variant="primary">Cancel</Button>
<Button variant="primary">Delete</Button>
```

### 2. Use @apply Sparingly

Only use `@apply` for:
- Base element styles (typography resets)
- Complex repeated patterns inside `@layer components`

❌ **Don't use @apply for everything:**
```css
.button { @apply px-6 py-3 bg-primary-600 text-white rounded-lg; }
```

✅ **Do use component extraction instead:**
```jsx
<Button variant="primary">Click me</Button>
```

The exception — `@layer components` for shared low-level patterns:
```css
@layer components {
  .card-elegant {
    @apply bg-white rounded-xl shadow-elegant p-7;
    @apply border border-neutral-100;
    @apply transition-all duration-500;
    @apply hover:shadow-floating hover:-translate-y-1;
  }

  .btn-primary {
    @apply px-6 py-3.5 rounded-pill;
    @apply bg-gradient-to-br from-primary-600 to-primary-700;
    @apply text-white font-medium;
    @apply shadow-elegant hover:shadow-floating;
    @apply transition-all duration-300;
  }
}
```

### 3. Organize Classes Logically

**Recommended order:**
1. Layout (`flex`, `grid`, `relative`, `sticky`)
2. Spacing (`p-`, `m-`, `gap-`)
3. Sizing (`w-`, `h-`, `max-w-`)
4. Typography (`font-`, `text-`, `leading-`)
5. Visual (`bg-`, `border-`, `shadow-`, `rounded-`)
6. Interaction (`cursor-`, `transition-`, `hover:`, `focus:`)

```jsx
<div className="
  flex items-center justify-between    {/* Layout */}
  px-6 py-4                            {/* Spacing */}
  w-full                               {/* Sizing */}
  font-body text-lg text-neutral-900   {/* Typography */}
  bg-white rounded-lg shadow-elegant   {/* Visual */}
  cursor-pointer transition-all        {/* Interaction */}
  hover:shadow-floating hover:-translate-y-1
">
```

### 4. Responsive Design — Mobile-First

Use Tailwind's responsive prefixes:

```jsx
<div className="
  grid grid-cols-1           {/* Mobile: 1 column */}
  md:grid-cols-2             {/* Tablet: 2 columns */}
  lg:grid-cols-3             {/* Desktop: 3 columns */}
  xl:grid-cols-4             {/* Large: 4 columns */}
  gap-4 md:gap-6 lg:gap-8   {/* Responsive gaps */}
">
```

Breakpoints:
| Prefix | Min-width | Target |
|--------|-----------|--------|
| (none) | 0px       | Mobile |
| `sm:`  | 640px     | Small tablets |
| `md:`  | 768px     | Tablets |
| `lg:`  | 1024px    | Desktops |
| `xl:`  | 1280px    | Large desktops |
| `2xl:` | 1536px    | Ultra-wide |

### 5. Dark Mode Strategy

```javascript
// tailwind.config.js
darkMode: 'class', // or 'media'
```

```jsx
<div className="bg-white dark:bg-neutral-900
                text-neutral-900 dark:text-neutral-100
                border-neutral-200 dark:border-neutral-700">
  Content
</div>
```

### 6. Performance: Purge Unused Styles

Always configure `content` correctly — Tailwind's JIT mode only includes classes that appear in scanned files:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
}
```

**Never dynamically construct class names:**
```jsx
// ❌ Bad — Tailwind can't detect this
<div className={`text-${color}-500`}>

// ✅ Good — full class names are scannable
const colorClasses = {
  red:  'text-red-500',
  blue: 'text-blue-500',
};
<div className={colorClasses[color]}>
```

---

## Advanced Tailwind Techniques

### 1. Custom Variants

Create your own utility modifiers:

```javascript
// tailwind.config.js
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('child', '& > *')
      addVariant('not-last', '&:not(:last-child)')
      addVariant('hocus', ['&:hover', '&:focus'])
    })
  ]
}
```

**Usage:**
```jsx
<div className="child:p-4 child:rounded-lg">
  <div>Auto padding and radius</div>
  <div>Auto padding and radius</div>
</div>

<div className="not-last:border-b">
  <div>Has border</div>
  <div>No border (last)</div>
</div>

<button className="hocus:scale-105">Scales on hover OR focus</button>
```

### 2. Container Queries

```javascript
// tailwind.config.js
plugins: [require('@tailwindcss/container-queries')]
```

```jsx
<div className="@container">
  <div className="@lg:grid-cols-2 @xl:grid-cols-3">
    {/* Responds to container size, not viewport */}
  </div>
</div>
```

### 3. CSS Variables + Tailwind

Combine for dynamic theming:

```css
/* src/styles/index.css */
:root {
  --card-hover-scale: 1.02;
  --transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

```jsx
<div className="transition-transform duration-300
                hover:scale-[var(--card-hover-scale)]">
```

### 4. Group Variants for Parent-Child Interactions

```jsx
<div className="group">
  {/* Parent card */}
  <div className="bg-white group-hover:bg-neutral-50 transition-colors">
    Card content
  </div>

  {/* Child appears only when parent is hovered */}
  <button className="opacity-0 group-hover:opacity-100
                     translate-y-2 group-hover:translate-y-0
                     transition-all duration-300">
    Hidden button
  </button>
</div>
```

### 5. Peer Variants for Sibling Interactions

```jsx
<div>
  <input type="checkbox" className="peer hidden" id="toggle" />

  {/* Sibling reacts to input state */}
  <label htmlFor="toggle"
         className="peer-checked:bg-primary-600
                    peer-checked:text-white
                    transition-colors duration-200">
    Toggle me
  </label>
</div>
```

### 6. Composition with @layer

```css
/* src/styles/index.css */
@layer components {
  .card-elegant {
    @apply bg-white rounded-xl shadow-elegant p-7;
    @apply border border-neutral-100;
    @apply transition-all duration-500;
    @apply hover:shadow-floating hover:-translate-y-1;
  }

  .btn-primary {
    @apply px-6 py-3.5 rounded-pill;
    @apply bg-gradient-to-br from-primary-600 to-primary-700;
    @apply text-white font-medium;
    @apply shadow-elegant hover:shadow-floating;
    @apply transition-all duration-300;
  }
}
```

### 7. Design Tokens as Tailwind Config

Translate Figma design tokens directly:

**Figma Design Tokens:**
```
Colors/Primary/500: #6384ad
Spacing/MD: 24px
Radius/Card: 10px
Shadow/Elevated: 0 4px 16px rgba(99, 132, 173, 0.12)
```

**Tailwind Config:**
```javascript
theme: {
  extend: {
    colors: {
      primary: { 500: '#6384ad' }
    },
    spacing: {
      'md': '1.5rem',     // 24px
    },
    borderRadius: {
      'card': '0.625rem', // 10px
    },
    boxShadow: {
      'elevated': '0 4px 16px rgba(99, 132, 173, 0.12)',
    }
  }
}
```

### Naming Convention Best Practices

**Use semantic names:**
```javascript
colors: {
  // ✅ Good — semantic
  primary:   { /* shades */ },
  secondary: { /* shades */ },
  accent:    { /* shades */ },

  // ❌ Avoid — generic color names
  blue:   { /* shades */ },
  purple: { /* shades */ },
}

spacing: {
  // ✅ Good — purposeful
  'card-padding': '1.75rem',
  'section-gap':  '4.5rem',

  // ❌ Avoid — meaningless numbers outside the scale
  '28': '1.75rem',
}
```

---

## When to Combine Tailwind + CSS Modules

### Use Tailwind for: (80% of code)
- Layout and spacing
- Responsive design
- Color and typography
- Common component patterns
- Hover/focus states
- Dark mode

### Use CSS Modules for: (20% of code)
- Complex animations with `@keyframes`
- Highly specific one-off visual effects
- Third-party component styling overrides
- When utilities become unreadable (10+ classes)

### Example: Complex Card with Both

```jsx
// Card.jsx
import styles from './Card.module.css';

export function AnimatedCard({ children }) {
  return (
    <div className={`
      bg-white rounded-xl shadow-elegant p-7
      border border-neutral-100
      hover:shadow-floating
      transition-all duration-500
      ${styles.cardSpecial}
    `}>
      {children}
      <div className={styles.decorativeElement} />
    </div>
  );
}
```

```css
/* Card.module.css — Only for complex stuff Tailwind can't do */
.cardSpecial {
  background:
    linear-gradient(135deg, white 0%, #f8fafc 100%),
    url("data:image/svg+xml,..."); /* complex pattern */
}

.decorativeElement {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(99, 132, 173, 0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-20px); }
}
```

---

## Migrating from Pure CSS to Tailwind

### Step 1: Identify Design Tokens

Extract all CSS variables into Tailwind config:

**Before (CSS Variables):**
```css
:root {
  --primary-500: #6384ad;
  --space-6: 1.75rem;
  --radius-card: 0.625rem;
}
```

**After (Tailwind Config):**
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: { primary: { 500: '#6384ad' } },
    spacing: { '6': '1.75rem' },
    borderRadius: { 'card': '0.625rem' },
  }
}
```

### Step 2: Convert Components Gradually

Start with simple components, then move to complex:

**Before (CSS Module):**
```jsx
import styles from './Button.module.css';
<button className={styles.primary}>Click</button>
```

```css
/* Button.module.css */
.primary {
  background: var(--primary-600);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  color: white;
}
```

**After (Tailwind):**
```jsx
<button className="bg-primary-600 px-6 py-3 rounded-lg text-white
                   hover:bg-primary-700 transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-primary-400">
  Click
</button>
```

### Step 3: Keep Complex Animations in CSS

Don't force everything into Tailwind:

```jsx
import styles from './AnimatedCard.module.css';

<div className={`
  bg-white rounded-xl p-7
  ${styles.animated}
`}>
  Content
</div>
```

```css
/* AnimatedCard.module.css */
.animated {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
```

---

## Code Style & Conventions

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.jsx`)
- **Utilities**: camelCase (e.g., `formatDate.js`)
- **CSS Modules**: ComponentName.module.css (e.g., `AnimatedCard.module.css`) — only for complex animations
- **Constants**: UPPER_SNAKE_CASE in `constants.js`

### Component Structure

```jsx
// 1. Imports
import { useState, useEffect } from 'react';

// 2. Component definition
export function ComponentName({ prop1, prop2, children }) {
  // 3. Hooks
  const [state, setState] = useState(null);

  useEffect(() => {
    // Effect logic
  }, []);

  // 4. Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // 5. Render helpers (if needed)
  const renderContent = () => {
    // Complex rendering logic
  };

  // 6. Return JSX with Tailwind classes
  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-xl shadow-elegant">
      {/* Component content */}
    </div>
  );
}
```

### Naming Conventions

#### Variables & Functions
```javascript
// Use camelCase
const userName = 'John';
const isAuthenticated = true;
const handleSubmit = () => {};

// Boolean variables should be prefixed with is/has/should
const isLoading = false;
const hasError = true;
const shouldRender = false;

// Event handlers should be prefixed with handle
const handleClick = () => {};
const handleChange = () => {};
const handleSubmit = () => {};
```

#### Constants
```javascript
// Use UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost/api';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const USER_ROLES = {
  STUDENT: 'student',
  PROFESSOR: 'professor',
  ADMIN: 'admin',
};
```

#### Components
```javascript
// Use PascalCase
function UserProfile() {}
function CourseCard() {}
function AssignmentList() {}
```

### Code Formatting

Use **Prettier** with the following configuration:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### ESLint Configuration

```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  settings: {
    react: { version: 'detect' },
  },
};
```

---

## Architecture Patterns

### State Management

#### Local State (useState)
Use for component-specific state:
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

#### Global State (Zustand)
Use for app-wide state:
```javascript
// store/authStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  updateUser: (user) => set({ user }),
}));
```

#### Server State (React Query)
Use for API data:
```javascript
// hooks/useCourses.js
import { useQuery } from '@tanstack/react-query';
import { courseService } from '../services/courseService';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Custom Hooks Pattern

```javascript
// hooks/useAuth.js
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();

  const handleLogin = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      login(response.user, response.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleLogout = () => {
    authService.logout();
    logout();
  };

  return {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
  };
}
```

### Protected Routes Pattern

```jsx
// components/common/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
```

### Error Boundary Pattern

```jsx
// components/common/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h1 className="font-display text-2xl font-bold text-neutral-900 mb-3">
            Something went wrong
          </h1>
          <p className="text-neutral-500">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## API Conventions

### API Service Layer

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Pattern

```javascript
// services/courseService.js
import api from './api';

export const courseService = {
  getAll: async () => {
    return api.get('/courses');
  },

  getById: async (id) => {
    return api.get(`/courses/${id}`);
  },

  create: async (data) => {
    return api.post('/courses', data);
  },

  update: async (id, data) => {
    return api.put(`/courses/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/courses/${id}`);
  },

  enroll: async (courseId) => {
    return api.post(`/courses/${courseId}/enroll`);
  },
};
```

### Request/Response Formats

#### Standard Response Format
```javascript
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "timestamp": "2026-02-05T18:00:00Z"
}
```

#### Error Response Format
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  },
  "timestamp": "2026-02-05T18:00:00Z"
}
```

---

## Error Handling

### Try-Catch Pattern

```javascript
async function handleSubmit(data) {
  try {
    setLoading(true);
    setError(null);

    const response = await courseService.create(data);

    toast.success('Course created successfully');
    navigate(`/courses/${response.id}`);
  } catch (error) {
    const message = error.response?.data?.message || 'An error occurred';
    setError(message);
    toast.error(message);
  } finally {
    setLoading(false);
  }
}
```

### Form Validation

```javascript
// Using react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" className="w-full">Login</Button>
    </form>
  );
}
```

---

## UI/UX Patterns

### Loading States

```jsx
function CourseList() {
  const { data: courses, isLoading, error } = useCourses();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return <EmptyState title="No courses found" description="Create your first course to get started." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <ImageCard key={course.id} {...course} />
      ))}
    </div>
  );
}
```

### Toast Notifications

```javascript
import toast from 'react-hot-toast';

// Success
toast.success('Course created successfully');

// Error
toast.error('Failed to create course');

// Loading → Success
const toastId = toast.loading('Creating course…');
toast.success('Course created!', { id: toastId });
```

---

## Responsive Design with Tailwind

Tailwind uses a mobile-first responsive system. All unprefixed utilities target mobile; use `sm:`, `md:`, `lg:`, `xl:`, `2xl:` for larger breakpoints.

### Responsive Component Example

```jsx
function ResponsiveGrid({ children }) {
  return (
    <div className="
      grid grid-cols-1 gap-4
      sm:grid-cols-2 sm:gap-5
      md:grid-cols-2 md:gap-6
      lg:grid-cols-3 lg:gap-8
      xl:grid-cols-4
    ">
      {children}
    </div>
  );
}
```

### Responsive Typography

```jsx
<h1 className="
  text-2xl font-bold           {/* Mobile */}
  sm:text-3xl                  {/* Small tablet */}
  md:text-4xl                  {/* Tablet */}
  lg:text-5xl                  {/* Desktop */}
">
  Page Title
</h1>
```

### Responsive Visibility

```jsx
{/* Mobile-only navigation toggle */}
<button className="md:hidden">☰</button>

{/* Desktop-only sidebar */}
<aside className="hidden md:block w-64">
  Sidebar
</aside>
```

---

## Accessibility Standards

### ARIA Labels

```jsx
<button aria-label="Close modal" onClick={onClose}>
  <CloseIcon />
</button>

<input
  type="text"
  aria-label="Search courses"
  aria-describedby="search-help"
/>
<span id="search-help">Enter course name or code</span>
```

### Keyboard Navigation

```jsx
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // ... rest of component
}
```

### Focus Management

```jsx
import { useRef, useEffect } from 'react';

function Modal({ isOpen }) {
  const firstFocusableRef = useRef(null);

  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div>
      <button ref={firstFocusableRef}>First button</button>
      {/* ... */}
    </div>
  );
}
```

### Semantic HTML

```jsx
// Good
<nav>
  <ul>
    <li><a href="/courses">Courses</a></li>
    <li><a href="/assignments">Assignments</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Course Title</h1>
    <p>Course description</p>
  </article>
</main>

// Avoid
<div className="nav">
  <div className="link">Courses</div>
  <div className="link">Assignments</div>
</div>
```

### Focus Rings with Tailwind

Always use visible focus rings for keyboard users:

```jsx
<button className="
  focus:outline-none
  focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
```

---

## Testing Requirements

### Unit Tests (Vitest)

```javascript
// Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Integration Tests

```javascript
// LoginPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { authService } from '../../services/authService';

vi.mock('../../services/authService');

describe('LoginPage', () => {
  it('logs in user successfully', async () => {
    authService.login.mockResolvedValue({
      user: { id: 1, email: 'test@example.com' },
      token: 'fake-token',
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
```

### Test Coverage Target
- **Minimum**: 70% overall coverage
- **Components**: 80% coverage
- **Utilities**: 90% coverage
- **Services**: 85% coverage

---

## Performance Optimization

### Code Splitting

```jsx
import { lazy, Suspense } from 'react';

const CoursesPage = lazy(() => import('./pages/courses/CoursesPage'));
const AssignmentsPage = lazy(() => import('./pages/assignments/AssignmentsPage'));

function App() {
  return (
    <Suspense fallback={<Spinner size="lg" />}>
      <Routes>
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```jsx
import { memo, useMemo, useCallback } from 'react';

// Memoize component
export const CourseCard = memo(function CourseCard({ course }) {
  return <div>{course.name}</div>;
});

// Memoize expensive calculations
function CourseList({ courses }) {
  const sortedCourses = useMemo(() => {
    return courses.sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  return <div>{/* render sorted courses */}</div>;
}

// Memoize callbacks
function Parent() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <Child onClick={handleClick} />;
}
```

### Image Optimization

```jsx
// Use appropriate image formats
<img
  src="/images/course.webp"
  alt="Course thumbnail"
  loading="lazy"
  width="300"
  height="200"
  className="w-full h-auto object-cover rounded-lg"
/>

// Responsive images
<picture>
  <source media="(min-width: 768px)" srcSet="/images/course-large.webp" />
  <source media="(min-width: 480px)" srcSet="/images/course-medium.webp" />
  <img src="/images/course-small.webp" alt="Course thumbnail" className="w-full rounded-lg" />
</picture>
```

### Tailwind Performance Tips

1. **JIT Mode is on by default** in Tailwind 3 — only classes used in your code are generated
2. **Verify `content` paths** — missing paths = missing classes; extra paths = slower builds
3. **Use `@apply` in `@layer components`** for repeated patterns rather than copying utilities across files
4. **Analyze output CSS size:**
   ```bash
   npx tailwindcss -o output.css --minify && ls -lh output.css
   ```
5. **Never dynamically construct class names** — use lookup objects instead

---

## Environment Variables

```bash
# .env.development
VITE_API_URL=http://localhost/api
VITE_APP_NAME=Committed
VITE_ENABLE_ANALYTICS=false

# .env.production
VITE_API_URL=https://api.committed.com
VITE_APP_NAME=Committed
VITE_ENABLE_ANALYTICS=true
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

---

## Common Utilities

### Date Formatting

```javascript
// utils/formatters.js
import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
```

### Validation Helpers

```javascript
// utils/validators.js
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidGitHubUrl = (url) => {
  return /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/.test(url);
};

export const isValidPassword = (password) => {
  return password.length >= 8;
};
```

---

## Best Practices

1. **Always use functional components** with hooks
2. **Keep components small** (< 200 lines)
3. **Extract reusable logic** into custom hooks
4. **Use TypeScript** for better type safety (optional but recommended)
5. **Write tests** for critical functionality
6. **Optimize images** and use lazy loading
7. **Handle loading and error states** consistently
8. **Use semantic HTML** for accessibility
9. **Follow the design system** for consistency
10. **Document complex logic** with comments
11. **Heavily customize Tailwind config** — never use defaults as-is
12. **Extract repeated utilities to components** — DRY principle
13. **Use Tailwind for 80% of styling**, CSS Modules for complex animations
14. **Organize utility classes logically** — layout → spacing → visual → interaction
15. **Always include hover/focus/active states** — improve UX
16. **Use custom spacing/colors from config** — avoid arbitrary values
17. **Leverage group/peer variants** — parent-child and sibling interactions
18. **Optimize with PurgeCSS** — ensure `content` paths are correct

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Dependencies
npm install              # Install dependencies
npm install <package>    # Add new dependency
npm install -D <package> # Add dev dependency
npm update               # Update dependencies

# Tailwind
npx tailwindcss init -p              # Initialize Tailwind + PostCSS config
npx tailwindcss -o output.css --minify  # Analyze output CSS size
```

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Cheat Sheet](https://tailwindcomponents.com/cheatsheet/)
- [Tailwind CSS IntelliSense (VSCode)](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [React Router Documentation](https://reactrouter.com)
- [React Query Documentation](https://tanstack.com/query)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Pre-Launch Design Checklist

Before deploying, verify your frontend is NOT generic:

- [ ] Uses a **custom color palette** that's NOT purple/pink gradients
- [ ] Has at least **2 distinctive font families** (not Inter or Roboto alone)
- [ ] Includes **custom spacing values** (not all multiples of 4 or 8)
- [ ] Has **varied border radius** (not 8px everywhere)
- [ ] Features **intentional animations/transitions** with custom timing
- [ ] Demonstrates **visual hierarchy** beyond just font-size
- [ ] Uses **colored shadows**, not just gray rgba values
- [ ] Has a clear, executed **aesthetic point-of-view**
- [ ] Would pass the **"squint test"** — recognizable silhouette
- [ ] Doesn't look like every other SaaS dashboard
- [ ] `tailwind.config.js` has **extensive customization** (colors, fonts, shadows, spacing)
- [ ] All interactive elements have **hover, focus, and active states**
- [ ] All repeated utility patterns are **extracted to React components**
- [ ] Complex animations use **CSS Modules**, not forced into Tailwind
- [ ] `content` paths in Tailwind config are **correct and complete**