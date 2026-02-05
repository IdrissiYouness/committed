# Web Frontend Development Skill

## Service Overview

**Service Name**: Web Frontend  
**Technology**: React 18 + Vite 5  
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

#### Styling
```bash
npm install tailwindcss@^3.4.0 postcss@^8.4.32 autoprefixer@^10.4.16
# OR use CSS Modules (built into Vite)
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
│   ├── main.jsx                # Application entry point
│   ├── App.jsx                 # Root component
│   │
│   ├── components/             # Reusable components
│   │   ├── common/            # Generic components
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
│   ├── styles/                # Global styles
│   │   ├── index.css         # Global CSS
│   │   ├── variables.css     # CSS variables
│   │   └── tailwind.css      # Tailwind imports (if using)
│   │
│   └── assets/                # Images, fonts, etc.
│       ├── images/
│       └── fonts/
│
├── .env.development           # Development environment variables
├── .env.production            # Production environment variables
├── index.html                 # HTML template
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
└── README.md                 # Service documentation
```

---

## Design System

### Color Palette

#### Primary Colors
```css
--primary-50: #f5f3ff;
--primary-100: #ede9fe;
--primary-200: #ddd6fe;
--primary-300: #c4b5fd;
--primary-400: #a78bfa;
--primary-500: #8b5cf6;   /* Main primary */
--primary-600: #7c3aed;
--primary-700: #6d28d9;
--primary-800: #5b21b6;
--primary-900: #4c1d95;
```

#### Secondary Colors
```css
--secondary-50: #fdf4ff;
--secondary-100: #fae8ff;
--secondary-200: #f5d0fe;
--secondary-300: #f0abfc;
--secondary-400: #e879f9;
--secondary-500: #d946ef;   /* Main secondary */
--secondary-600: #c026d3;
--secondary-700: #a21caf;
--secondary-800: #86198f;
--secondary-900: #701a75;
```

#### Neutral Colors
```css
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

#### Semantic Colors
```css
--success: #10b981;    /* Green */
--warning: #f59e0b;    /* Amber */
--error: #ef4444;      /* Red */
--info: #3b82f6;       /* Blue */
```

#### Background Colors
```css
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
--bg-tertiary: #f3f4f6;
--bg-dark: #111827;
```

### Typography

#### Font Families
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
```

#### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
```

#### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

#### Line Heights
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

### Border Radius
```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-base: 0.25rem;  /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-full: 9999px;
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Component Styling Approach

**Use CSS Modules** for component-specific styles:

```jsx
// Button.jsx
import styles from './Button.module.css';

export function Button({ variant = 'primary', children, ...props }) {
  return (
    <button className={styles[variant]} {...props}>
      {children}
    </button>
  );
}
```

```css
/* Button.module.css */
.primary {
  background-color: var(--primary-500);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: background-color 0.2s;
}

.primary:hover {
  background-color: var(--primary-600);
}
```

---

## Code Style & Conventions

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.jsx`)
- **Utilities**: camelCase (e.g., `formatDate.js`)
- **CSS Modules**: ComponentName.module.css (e.g., `Button.module.css`)
- **Constants**: UPPER_SNAKE_CASE in `constants.js`

### Component Structure

```jsx
// 1. Imports
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './ComponentName.module.css';

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
  
  // 6. Return JSX
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
}

// 7. PropTypes
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  children: PropTypes.node,
};

// 8. Default props (if needed)
ComponentName.defaultProps = {
  prop2: 0,
};
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
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off', // Not needed in React 18
    'react/prop-types': 'warn',
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  settings: {
    react: {
      version: 'detect',
    },
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
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
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

// Request interceptor - add auth token
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

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
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
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  if (!courses || courses.length === 0) {
    return <EmptyState message="No courses found" />;
  }
  
  return (
    <div>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

### Modal Pattern

```jsx
function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete "{itemName}"?</p>
        <div className={styles.actions}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm} className={styles.danger}>
            Delete
          </button>
        </div>
      </div>
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

// Loading
const toastId = toast.loading('Creating course...');
// Later...
toast.success('Course created!', { id: toastId });

// Custom
toast.custom((t) => (
  <div className={styles.customToast}>
    <span>Custom notification</span>
    <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
  </div>
));
```

---

## Responsive Breakpoints

```css
/* Mobile first approach */

/* Small devices (phones, 640px and up) */
@media (min-width: 640px) {
  /* sm: styles */
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  /* md: styles */
}

/* Large devices (desktops, 1024px and up) */
@media (min-width: 1024px) {
  /* lg: styles */
}

/* Extra large devices (large desktops, 1280px and up) */
@media (min-width: 1280px) {
  /* xl: styles */
}

/* 2X large devices (larger desktops, 1536px and up) */
@media (min-width: 1536px) {
  /* 2xl: styles */
}
```

### Responsive Component Example

```jsx
function ResponsiveGrid({ children }) {
  return (
    <div className={styles.grid}>
      {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
      {children}
    </div>
  );
}
```

```css
.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
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
    <Suspense fallback={<LoadingSpinner />}>
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
/>

// Responsive images
<picture>
  <source media="(min-width: 768px)" srcSet="/images/course-large.webp" />
  <source media="(min-width: 480px)" srcSet="/images/course-medium.webp" />
  <img src="/images/course-small.webp" alt="Course thumbnail" />
</picture>
```

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

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run test             # Run tests
npm run test:coverage    # Run tests with coverage

# Dependencies
npm install              # Install dependencies
npm install <package>    # Add new dependency
npm install -D <package> # Add dev dependency
npm update               # Update dependencies
```

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
- [React Query Documentation](https://tanstack.com/query)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
