/**
 * Tailwind-like atomic utility classes.
 *
 * Maps familiar Tailwind class names to our CSS variable system.
 * LLMs already know Tailwind syntax from training data — by providing
 * these utilities, we ensure any model produces visually consistent HTML
 * that automatically respects light/dark mode.
 *
 * This is NOT a full Tailwind build. It's a curated subset:
 * - Layout (flex, grid, gap)
 * - Spacing (p-*, m-*)
 * - Typography (text-*, font-*)
 * - Colors (text-*, bg-*, border-*)
 * - Borders & radius
 * - Shadows & effects
 * - Sizing & overflow
 */

export function generateUtilityCSS(): string {
  return `
/* ══════════════════════════════════════════
   Tailwind-compatible utility classes
   Mapped to CSS variable theming system
   ══════════════════════════════════════════ */

/* ── Display ── */
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.hidden { display: none; }

/* ── Flex ── */
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }
.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-none { flex: none; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }
.items-baseline { align-items: baseline; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.justify-evenly { justify-content: space-evenly; }
.self-start { align-self: flex-start; }
.self-center { align-self: center; }
.self-end { align-self: flex-end; }
.shrink-0 { flex-shrink: 0; }
.grow { flex-grow: 1; }

/* ── Grid ── */
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.col-span-2 { grid-column: span 2 / span 2; }
.col-span-3 { grid-column: span 3 / span 3; }
.col-span-full { grid-column: 1 / -1; }

/* ── Gap ── */
.gap-1 { gap: var(--sp-1); }
.gap-2 { gap: var(--sp-2); }
.gap-3 { gap: var(--sp-3); }
.gap-4 { gap: var(--sp-4); }
.gap-5 { gap: var(--sp-5); }
.gap-6 { gap: var(--sp-6); }
.gap-8 { gap: var(--sp-8); }

/* ── Padding ── */
.p-0 { padding: 0; }
.p-1 { padding: var(--sp-1); }
.p-2 { padding: var(--sp-2); }
.p-3 { padding: var(--sp-3); }
.p-4 { padding: var(--sp-4); }
.p-5 { padding: var(--sp-5); }
.p-6 { padding: var(--sp-6); }
.p-8 { padding: var(--sp-8); }
.px-1 { padding-left: var(--sp-1); padding-right: var(--sp-1); }
.px-2 { padding-left: var(--sp-2); padding-right: var(--sp-2); }
.px-3 { padding-left: var(--sp-3); padding-right: var(--sp-3); }
.px-4 { padding-left: var(--sp-4); padding-right: var(--sp-4); }
.px-6 { padding-left: var(--sp-6); padding-right: var(--sp-6); }
.py-1 { padding-top: var(--sp-1); padding-bottom: var(--sp-1); }
.py-2 { padding-top: var(--sp-2); padding-bottom: var(--sp-2); }
.py-3 { padding-top: var(--sp-3); padding-bottom: var(--sp-3); }
.py-4 { padding-top: var(--sp-4); padding-bottom: var(--sp-4); }
.py-6 { padding-top: var(--sp-6); padding-bottom: var(--sp-6); }
.pt-2 { padding-top: var(--sp-2); }
.pt-4 { padding-top: var(--sp-4); }
.pb-2 { padding-bottom: var(--sp-2); }
.pb-4 { padding-bottom: var(--sp-4); }
.pl-3 { padding-left: var(--sp-3); }
.pl-4 { padding-left: var(--sp-4); }
.pr-3 { padding-right: var(--sp-3); }

/* ── Margin ── */
.m-0 { margin: 0; }
.m-auto { margin: auto; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-1 { margin-top: var(--sp-1); }
.mt-2 { margin-top: var(--sp-2); }
.mt-3 { margin-top: var(--sp-3); }
.mt-4 { margin-top: var(--sp-4); }
.mt-6 { margin-top: var(--sp-6); }
.mt-8 { margin-top: var(--sp-8); }
.mb-1 { margin-bottom: var(--sp-1); }
.mb-2 { margin-bottom: var(--sp-2); }
.mb-3 { margin-bottom: var(--sp-3); }
.mb-4 { margin-bottom: var(--sp-4); }
.mb-6 { margin-bottom: var(--sp-6); }
.ml-2 { margin-left: var(--sp-2); }
.ml-3 { margin-left: var(--sp-3); }
.mr-2 { margin-right: var(--sp-2); }
.mr-3 { margin-right: var(--sp-3); }

/* ── Width & Height ── */
.w-full { width: 100%; }
.w-auto { width: auto; }
.w-fit { width: fit-content; }
.max-w-sm { max-width: 24rem; }
.max-w-md { max-width: 28rem; }
.max-w-lg { max-width: 32rem; }
.max-w-xl { max-width: 36rem; }
.max-w-2xl { max-width: 42rem; }
.max-w-3xl { max-width: 48rem; }
.max-w-4xl { max-width: 56rem; }
.max-w-full { max-width: 100%; }
.max-w-prose { max-width: 65ch; }
.min-w-0 { min-width: 0; }
.h-auto { height: auto; }
.h-full { height: 100%; }
.min-h-0 { min-height: 0; }

/* ── Typography ── */
.text-xs { font-size: var(--text-xs); }
.text-sm { font-size: var(--text-sm); }
.text-base { font-size: var(--text-base); }
.text-lg { font-size: var(--text-lg); }
.text-xl { font-size: var(--text-xl); }
.text-2xl { font-size: var(--text-2xl); }
.text-3xl { font-size: var(--text-3xl); }
.font-sans { font-family: var(--font-sans); }
.font-mono { font-family: var(--font-mono); }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.italic { font-style: italic; }
.not-italic { font-style: normal; }
.leading-none { line-height: 1; }
.leading-tight { line-height: 1.25; }
.leading-snug { line-height: 1.375; }
.leading-normal { line-height: 1.5; }
.leading-relaxed { line-height: 1.625; }
.tracking-tight { letter-spacing: -0.025em; }
.tracking-normal { letter-spacing: 0; }
.tracking-wide { letter-spacing: 0.025em; }
.tracking-wider { letter-spacing: 0.05em; }
.uppercase { text-transform: uppercase; }
.lowercase { text-transform: lowercase; }
.capitalize { text-transform: capitalize; }
.normal-case { text-transform: none; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.underline { text-decoration: underline; }
.no-underline { text-decoration: none; }
.line-through { text-decoration: line-through; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.whitespace-pre { white-space: pre; }
.whitespace-pre-wrap { white-space: pre-wrap; }
.whitespace-nowrap { white-space: nowrap; }
.break-words { word-break: break-word; overflow-wrap: break-word; }
.break-all { word-break: break-all; }
.tabular-nums { font-variant-numeric: tabular-nums; }

/* ── Text Colors ── */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-tertiary { color: var(--text-tertiary); }
.text-inverse { color: var(--text-inverse); }
.text-accent { color: var(--accent); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }
.text-info { color: var(--info); }

/* ── Background Colors ── */
.bg-primary { background-color: var(--bg-primary); }
.bg-secondary { background-color: var(--bg-secondary); }
.bg-tertiary { background-color: var(--bg-tertiary); }
.bg-elevated { background-color: var(--bg-elevated); }
.bg-accent { background-color: var(--accent); }
.bg-accent-subtle { background-color: var(--accent-subtle); }
.bg-success { background-color: var(--success); }
.bg-success-subtle { background-color: var(--success-subtle); }
.bg-warning { background-color: var(--warning); }
.bg-warning-subtle { background-color: var(--warning-subtle); }
.bg-danger { background-color: var(--danger); }
.bg-danger-subtle { background-color: var(--danger-subtle); }
.bg-info { background-color: var(--info); }
.bg-info-subtle { background-color: var(--info-subtle); }
.bg-transparent { background-color: transparent; }

/* ── Borders ── */
.border { border: 1px solid var(--border); }
.border-2 { border: 2px solid var(--border); }
.border-t { border-top: 1px solid var(--border); }
.border-b { border-bottom: 1px solid var(--border); }
.border-l { border-left: 1px solid var(--border); }
.border-r { border-right: 1px solid var(--border); }
.border-strong { border-color: var(--border-strong); }
.border-accent { border-color: var(--accent); }
.border-success { border-color: var(--success); }
.border-warning { border-color: var(--warning); }
.border-danger { border-color: var(--danger); }
.border-transparent { border-color: transparent; }
.border-none { border: none; }

/* ── Border Radius ── */
.rounded-none { border-radius: 0; }
.rounded-sm { border-radius: var(--radius-sm); }
.rounded { border-radius: var(--radius-md); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-full { border-radius: var(--radius-full); }

/* ── Shadows ── */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow { box-shadow: var(--shadow-md); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-none { box-shadow: none; }

/* ── Overflow ── */
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-x-auto { overflow-x: auto; }
.overflow-y-auto { overflow-y: auto; }
.overflow-scroll { overflow: scroll; }

/* ── Position ── */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.top-0 { top: 0; }
.right-0 { right: 0; }
.bottom-0 { bottom: 0; }
.left-0 { left: 0; }

/* ── Z-Index ── */
.z-0 { z-index: 0; }
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-50 { z-index: 50; }

/* ── Opacity ── */
.opacity-0 { opacity: 0; }
.opacity-25 { opacity: 0.25; }
.opacity-50 { opacity: 0.5; }
.opacity-75 { opacity: 0.75; }
.opacity-100 { opacity: 1; }

/* ── Cursor ── */
.cursor-pointer { cursor: pointer; }
.cursor-default { cursor: default; }
.select-none { user-select: none; }

/* ── Transitions ── */
.transition { transition: all var(--duration-normal) var(--ease-out); }
.transition-colors { transition: color var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out); }

/* ── List ── */
.list-none { list-style: none; }
.list-disc { list-style-type: disc; }
.list-decimal { list-style-type: decimal; }
.list-inside { list-style-position: inside; }

/* ── Table ── */
.table { display: table; }
.table-auto { table-layout: auto; }
.table-fixed { table-layout: fixed; }
.border-collapse { border-collapse: collapse; }

/* ── SVG ── */
.fill-current { fill: currentColor; }
.stroke-current { stroke: currentColor; }

/* ── Responsive ── */
@media (min-width: 640px) {
  .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sm\\:flex-row { flex-direction: row; }
  .sm\\:text-lg { font-size: var(--text-lg); }
  .sm\\:text-xl { font-size: var(--text-xl); }
  .sm\\:p-6 { padding: var(--sp-6); }
}
@media (min-width: 768px) {
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .md\\:flex-row { flex-direction: row; }
  .md\\:text-2xl { font-size: var(--text-2xl); }
  .md\\:text-3xl { font-size: var(--text-3xl); }
  .md\\:p-8 { padding: var(--sp-8); }
}
`;
}
