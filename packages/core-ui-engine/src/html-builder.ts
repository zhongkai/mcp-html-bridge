// ── Safe HTML string builder with XSS prevention ──

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape HTML special characters to prevent XSS */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/** Build an HTML opening tag with attributes */
export function tag(
  name: string,
  attrs: Record<string, string | boolean | undefined> = {},
  selfClosing = false
): string {
  const attrStr = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${escapeHtml(String(v))}"`))
    .join(' ');
  const open = attrStr ? `<${name} ${attrStr}` : `<${name}`;
  return selfClosing ? `${open} />` : `${open}>`;
}

/** Wrap content in a style tag */
export function style(css: string): string {
  return `<style>\n${css}\n</style>`;
}

/** Wrap content in a script tag */
export function script(js: string): string {
  return `<script>\n${js}\n</script>`;
}

/** Wrap content in a complete HTML document */
export function document(opts: {
  title?: string;
  css?: string;
  js?: string;
  body: string;
}): string {
  const titleTag = opts.title ? `<title>${escapeHtml(opts.title)}</title>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${titleTag}
${opts.css ? style(opts.css) : ''}
</head>
<body>
${opts.body}
${opts.js ? script(opts.js) : ''}
</body>
</html>`;
}
