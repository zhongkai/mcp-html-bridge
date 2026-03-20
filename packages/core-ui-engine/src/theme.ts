// ── Theme system: CSS variables + dark mode + glassmorphism ──

export function generateThemeCSS(): string {
  return `
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── CSS Variables (Light) ── */
:root {
  /* Surface */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fb;
  --bg-tertiary: #f0f2f5;
  --bg-elevated: #ffffff;

  /* Text */
  --text-primary: #1a1d23;
  --text-secondary: #5f6672;
  --text-tertiary: #9aa0ab;
  --text-inverse: #ffffff;

  /* Accent */
  --accent: #4f6ef7;
  --accent-hover: #3b5ce4;
  --accent-subtle: #eef1fe;
  --accent-text: #ffffff;

  /* Semantic */
  --success: #22c55e;
  --success-subtle: #f0fdf4;
  --warning: #f59e0b;
  --warning-subtle: #fffbeb;
  --danger: #ef4444;
  --danger-subtle: #fef2f2;
  --info: #3b82f6;
  --info-subtle: #eff6ff;

  /* Borders */
  --border: #e2e5ea;
  --border-strong: #cdd1d8;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.12);

  /* Glass */
  --glass-bg: rgba(255,255,255,0.72);
  --glass-border: rgba(255,255,255,0.2);
  --glass-blur: 16px;

  /* Typography scale */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;

  /* Spacing scale */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-8: 32px;
  --sp-10: 40px;
  --sp-12: 48px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
}

/* ── Dark Mode ── */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f1117;
    --bg-secondary: #161922;
    --bg-tertiary: #1e212b;
    --bg-elevated: #1e212b;

    --text-primary: #e8eaed;
    --text-secondary: #9aa0ab;
    --text-tertiary: #6b7280;
    --text-inverse: #0f1117;

    --accent: #6b8aff;
    --accent-hover: #8ba3ff;
    --accent-subtle: #1c2444;
    --accent-text: #0f1117;

    --success-subtle: #052e16;
    --warning-subtle: #451a03;
    --danger-subtle: #450a0a;
    --info-subtle: #172554;

    --border: #2a2d38;
    --border-strong: #3b3f4c;

    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
    --shadow-lg: 0 12px 32px rgba(0,0,0,0.5);

    --glass-bg: rgba(15,17,23,0.72);
    --glass-border: rgba(255,255,255,0.08);
  }
}

/* ── Base styles ── */
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
  padding: var(--sp-6);
  -webkit-font-smoothing: antialiased;
}

/* ── Utility classes ── */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--sp-6);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-success { background: var(--success-subtle); color: var(--success); }
.badge-warning { background: var(--warning-subtle); color: var(--warning); }
.badge-danger { background: var(--danger-subtle); color: var(--danger); }
.badge-info { background: var(--info-subtle); color: var(--info); }

.section-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--sp-4);
  padding-bottom: var(--sp-2);
  border-bottom: 2px solid var(--border);
}

/* ── Animations ── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeIn var(--duration-normal) var(--ease-out) both;
}
`;
}
