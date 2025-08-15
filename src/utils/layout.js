export const round = (n, p = 1) => Math.round(n * 10 ** p) / 10 ** p;

export function computeLayout({ paperW, paperH, margin, labelW, labelH, gapX, gapY }) {
  const usableW = paperW - margin * 2;
  const usableH = paperH - margin * 2;
  const cols = Math.max(1, Math.floor((usableW + gapX) / (labelW + gapX)));
  const rows = Math.max(1, Math.floor((usableH + gapY) / (labelH + gapY)));
  return { rows, cols, perPage: rows * cols };
}

// ---- Tiny runtime tests (dev aid) ----
(function devTests(){
  try {
    const t = computeLayout({ paperW: 210, paperH: 297, margin: 10, labelW: 70, labelH: 50, gapX: 3, gapY: 3 });
    const cols = Math.floor(((210 - 20) + 3) / (70 + 3));
    const rows = Math.floor(((297 - 20) + 3) / (50 + 3));
    console.assert(t.cols === cols && t.rows === rows && t.perPage === cols*rows, "computeLayout failed basic test");
  } catch(e) { /* non‑fatal in prod */ }
})();
