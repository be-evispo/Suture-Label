// src/lib/asset.js
// Turns "labels/FR2433.svg" into a full URL that works on GitHub Pages.
// Example -> "https://<you>.github.io/<repo>/labels/FR2433.svg"
export function asset(p) {
  if (!p) return '';
  // already a full URL or data: — leave it
  if (/^(https?|data|blob):/i.test(p)) return p;

  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/'); // e.g. "/label-printing-app/"
  const clean = p.replace(/^\/+/, ''); // remove any leading "/"
  return new URL(base + clean, window.location.origin).href;
}
