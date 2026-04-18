import { create } from 'zustand';

const STORAGE_KEY = 'committed-theme';

function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
}

const isDark = getInitialTheme();
applyTheme(isDark);

export const useThemeStore = create((set) => ({
  isDark,
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return { isDark: next };
    }),
}));
