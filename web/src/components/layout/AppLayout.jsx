import { useState } from 'react';

import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

/**
 * AppLayout
 *
 * The master shell for all authenticated pages.
 * Composes AppHeader + Sidebar + main content area.
 *
 * Layout structure:
 *
 *  ┌─────────────────────────────────────────────┐  ← AppHeader (fixed, h-16)
 *  ├──────────────┬──────────────────────────────┤
 *  │              │  Breadcrumbs                 │
 *  │   Sidebar    │  ─────────────────────────── │
 *  │   (w-64)     │  <children>                  │
 *  │              │                              │
 *  └──────────────┴──────────────────────────────┘
 *
 * Responsiveness:
 *   - Desktop (lg+): Sidebar always visible, main has left margin
 *   - Mobile/tablet : Sidebar hidden by default, toggled by hamburger in AppHeader
 *
 * Usage:
 *   <AppLayout>
 *     <DashboardPage />
 *   </AppLayout>
 */
export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* Fixed top header — always visible */}
      <AppHeader onMenuToggle={() => setSidebarOpen((o) => !o)} />

      {/* Sidebar — fixed on desktop, overlay on mobile */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      {/* lg:ml-64 offsets the fixed sidebar width on desktop */}
      <main
        id="main-content"
        className="pt-16 lg:ml-64 min-h-screen flex flex-col"
      >
        {/* Inner content wrapper with consistent padding */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">

          {/* Breadcrumb trail — auto-generated from current URL */}
          <div className="mb-5">
            <Breadcrumbs />
          </div>

          {/* Page content injected here */}
          {children}

        </div>
      </main>

    </div>
  );
}