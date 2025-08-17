"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LeftCard, RightCard, CardContent, CardSetting } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, NativeSelect, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { computeLayout } from "./utils/layout.js";
import { asset } from '@/lib/asset';
import FR2433Url from '@/assets/FR2433.svg?url';
import FT37321Url from '@/assets/FT37321.svg?url';

/**
 * Label Printing Web App — SVG/PNG export-first
 * - Exports and previews as SVG for perfect WYSIWYG in mm units
 * - Optional PNG export at chosen DPI
 * - Printing uses the generated SVG pages (not the live DOM grid)
 */

// ------------------------- Helpers -------------------------
const mm = (v) => `${v}mm`;
const MM_PER_INCH = 25.4;
const mmToPx = (mmVal, dpi) => Math.round((mmVal / MM_PER_INCH) * dpi);
const svgToDataUrl = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
async function svgToPngDataUrl(svg, widthPx, heightPx) {
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = svgToDataUrl(svg);
  await new Promise((res, rej) => {
    img.onload = () => res();
    img.onerror = (e) => rej(e);
  });
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");
  ctx.drawImage(img, 0, 0, widthPx, heightPx);
  return canvas.toDataURL("image/png");
}
function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Asset helper — resolve a (possibly relative) path to an absolute URL on this origin
function toAbs(url) {
  try { return url ? new URL(url, window.location.origin).href : ""; } catch { return url || ""; }
}

// --- Month formatting helpers ---
// Convert native month input value (YYYY-MM) -> MMYYYY string
function monthToMMYYYY(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  if (!y || !m) return "";
  return `${m}${y}`;
}
// Convert stored MMYYYY string -> value for <input type="month"> (YYYY-MM)
function mmYYYYToMonth(mmYYYY) {
  const v = (mmYYYY || "").replace(/[^0-9]/g, "");
  if (v.length !== 6) return "";
  const mm = v.slice(0, 2);
  const yyyy = v.slice(2);
  return `${yyyy}-${mm}`;
}

const BASE_SIZE = {
  labelWidthMm: 60.94,
  labelHeightMm: 64.939,
};

// shared fields (positions/fonts)
const BASE_FIELDS = [
  { key: 'lot', label: 'Lot', x: 8.8,  y: 48.5, width: 14, align: 'left',   fontSizeMm: 3.0, fontWeight: 600 },
  { key: 'exp', label: 'Exp', x: 27.4, y: 48.5, width: 14, align: 'left',   fontSizeMm: 3.0, fontWeight: 600 },
  { key: 'pro', label: 'Pro', x: 48.6, y: 48.5, width: 10, align: 'left',   fontSizeMm: 3.0, fontWeight: 600 },
  { key: 'nie', label: 'NIE', x: 21.07, y: 62.07, width: 60.94 - 2 * 21.07, align: 'center', fontSizeMm: 3.0, fontWeight: 600 },
];

// ------------------------- Templates -------------------------
const DEFAULT_TEMPLATES = [
  {
    code: "FR2433",
    name: "FR2433",
    BASE_SIZE,
    backgroundUrl: FR2433Url,
    fields: BASE_FIELDS.map(f => ({ ...f })),
  },
  {
    code: "FT37321",
    name: "FT37321",
    BASE_SIZE,
    backgroundUrl: FT37321Url,
    // Start with FR2433 text positions; tweak in Designer if FT37321 layout differs
    fields: BASE_FIELDS.map(f => ({ ...f })),
  }
];

// ------------------------- Paper sizes -------------------------
const PAPER_SIZES = {
  A4: { w: 210, h: 297 },
  Letter: { w: 215.9, h: 279.4 },
  Legal: { w: 215.9, h: 355.6 },
  A3: { w: 297, h: 420 }
};

const DEFAULT_SETTINGS = {
  paperPreset: "A4",
  customW: 210,
  customH: 297,
  orientation: "portrait",
  margin: 10,
  labelW: 60.94,
  labelH: 64.939,
  gapX: 3,
  gapY: 3,
  pages: 1,
};
// Fixed offsets (mm) — set by programmer; not exposed in UI
const PRINT_OFFSET = { x: 0, y: 0 };        // shifts entire label grid on page (export & print)
const PRINT_TEXT_OFFSET = { x: 0.3, y: 0.3 };   // shifts only text inside each label (export & print)


// ------------------------- SVG builders -------------------------
// ------------------------- SVG builders -------------------------
function buildLabelGroupSVG({
  template: t,
  values,
  labelW,
  labelH,
  bgUrl,            
  showOutlines,
  indexText,
  textOffsetX = 0,
  textOffsetY = 0,
}) {
  const sx = labelW / t.labelWidthMm;
  const sy = labelH / t.labelHeightMm;

  // normalize to absolute URL here
  const bgHref = bgUrl ? asset(bgUrl) : '';

  const bg = bgHref
    ? `<image href="${bgHref}" x="0" y="0" width="${labelW}" height="${labelH}" preserveAspectRatio="none" />`
    : "";

  const outline = showOutlines
    ? `<rect x="0" y="0" width="${labelW}" height="${labelH}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="0.2"/>`
    : "";

  const fontFamily =
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial';

  const fields = t.fields
    .map((f) => {
      const raw = values[f.key] || "";
      const text = f.uppercase ? String(raw).toUpperCase() : String(raw);
      const anchor = f.align === "center" ? "middle" : f.align === "right" ? "end" : "start";
      const x = (f.x ?? 0) * sx + textOffsetX;
      const y = (f.y ?? 0) * sy + textOffsetY;
      const w = f.width != null ? f.width * sx : undefined;
      const fontSize = (f.fontSizeMm ?? 3) * sy;
      let anchorX = x;
      if (w != null) {
        if (anchor === "middle") anchorX = x + w / 2;
        else if (anchor === "end") anchorX = x + w;
      }
      return `
        <text x="${anchorX}" y="${y}" font-family='${fontFamily}' font-weight="${f.fontWeight ?? 600}"
              font-size="${fontSize}" dominant-baseline="middle" text-anchor="${anchor}"
              text-rendering="geometricPrecision" style="font-kerning: none; font-variant-ligatures: none;"
              ${f.letterSpacing != null ? `letter-spacing="${f.letterSpacing}"` : ""}>${escapeXml(text)}</text>
      `;
    })
    .join("");

  const idx = indexText
    ? `<text x="${labelW - 1.5}" y="${labelH - 1.5}" font-size="2.5" fill="rgba(0,0,0,0.35)" text-anchor="end" dominant-baseline="ideographic">${escapeXml(indexText)}</text>`
    : "";

  return `${outline}${bg}${fields}${idx}`;
}


function buildPageSVG({
  paperW, paperH, margin,
  labelW, labelH, gapX, gapY,
  layout, template, values, bgUrl, showOutlines, pageIndex = 0,
  offsetX = 0, offsetY = 0,
  contentOffsetX = 0, contentOffsetY = 0,
}) {
  let groups = "";
  let defs = "";
  let counter = 0;
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const x = margin + offsetX + c * (labelW + gapX);
      const y = margin + offsetY + r * (labelH + gapY);
      const indexText = `#${counter + 1 + pageIndex * layout.perPage}`;
      const clipId = `cp_${pageIndex}_${r}_${c}`;
      defs += `<clipPath id="${clipId}"><rect x="0" y="0" width="${labelW}" height="${labelH}" /></clipPath>`;
      const labelGroup = buildLabelGroupSVG({
        template,
        values,
        labelW,
        labelH,
        bgUrl,
        showOutlines,
        indexText,
        textOffsetX: contentOffsetX,
        textOffsetY: contentOffsetY,
      });
      groups += `
<g transform="translate(${x}, ${y})" clip-path="url(#${clipId})">${labelGroup}</g>`;
      counter++;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${paperW}mm" height="${paperH}mm" viewBox="0 0 ${paperW} ${paperH}">
` +
    `  <defs>${defs}</defs>
` +
    `  <rect x="0" y="0" width="${paperW}" height="${paperH}" fill="white"/>
` +
    `  ${groups}
` +
    `</svg>`
  );
}

// ------------------------- Component -------------------------
export default function LabelPrintingApp() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [activeCode, setActiveCode] = useState(templates[0].code);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSetup, setShowSetup] = useState(false);
  const [printing, setPrinting] = useState(false);

  const activeTemplate = useMemo(
    () => templates.find((t) => t.code === activeCode) || templates[0],
    [templates, activeCode]
  );

  const [values, setValues] = useState({ lot: "", exp: "", pro: "", nie: "" });

  // Preview zoom
  const [showOutlines, setShowOutlines] = useState(false);
  const [zoom, setZoom] = useState(100); // %

  // Designer toggles
  const [designerMode, setDesignerMode] = useState(false);
  const [bgUrl, setBgUrl] = useState(activeTemplate.backgroundUrl || "");
  // Just use local assets (served from /public). Resolve to absolute URL so print window works too.
  useEffect(() => {
    const raw = activeTemplate.backgroundUrl || "";
    setBgUrl(raw ? toAbs(raw) : "");
  }, [activeTemplate]);

  const updateField = (key, v) => setValues((s) => ({ ...s, [key]: v }));

  // Paper derived dimensions
  const paperSize = useMemo(() => {
    const base =
      settings.paperPreset === "Custom"
        ? { w: settings.customW, h: settings.customH }
        : PAPER_SIZES[settings.paperPreset];
    const sized = base || { w: settings.customW, h: settings.customH };
    return settings.orientation === "landscape" ? { w: sized.h, h: sized.w } : sized;
  }, [settings.paperPreset, settings.customW, settings.customH, settings.orientation]);

  // Layout (how many fit per page)
  const layout = useMemo(
    () =>
      computeLayout({
        paperW: paperSize.w,
        paperH: paperSize.h,
        margin: settings.margin,
        labelW: settings.labelW,
        labelH: settings.labelH,
        gapX: settings.gapX,
        gapY: settings.gapY,
      }),
    [paperSize.w, paperSize.h, settings.margin, settings.labelW, settings.labelH, settings.gapX, settings.gapY]
  );

  // ------------------------- LabelView (screen preview uses original DOM/CSS) -------------------------
  const LabelView = ({ index, widthMm, heightMm }) => {
    const t = activeTemplate;

    const targetW = widthMm ?? t.labelWidthMm;
    const targetH = heightMm ?? t.labelHeightMm;

    const sx = targetW / t.labelWidthMm;
    const sy = targetH / t.labelHeightMm;

    const fontFamily =
      'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"';

    return (
      <div
        className="relative"
        style={{
          width: `${targetW}mm`,
          height: `${targetH}mm`,
          boxSizing: "border-box",
          border: showOutlines ? "1px solid rgba(0,0,0,0.6)" : "none",
          overflow: "hidden",
        }}
      >
        {bgUrl && (
          <img
            src={asset(bgUrl)}
            alt=""
            referrerPolicy="no-referrer"
            style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "fill", userSelect: "none", pointerEvents: "none" }}
          />
        )}
        {t.fields.map((f) => {
          const val = values[f.key] || "";
          return (
            <div
              key={f.key}
              style={{
                position: "absolute",
                left: `${(f.x ?? 0) * sx}mm`,
                top: `${(f.y ?? 0) * sy}mm`,
                width: f.width != null ? `${f.width * sx}mm` : undefined,
                transform: "translateY(-50%)",
                textAlign: f.align || "left",
                fontSize: `${(f.fontSizeMm ?? 3) * sy}mm`,
                letterSpacing: f.letterSpacing != null ? f.letterSpacing : 0,
                fontWeight: f.fontWeight ?? 600,
                fontFamily,
                whiteSpace: "nowrap",
              }}
            >
              {f.uppercase ? val.toUpperCase() : val}
            </div>
          );
        })}
        {typeof index === "number" && (
          <div style={{ position: "absolute", right: 2, bottom: 2, fontSize: 10, opacity: 0.35 }}>#{index + 1}</div>
        )}
      </div>
    );
  };

// ------------------------- SVG state & regeneration -------------------------
  const [pageSvgs, setPageSvgs] = useState([]); // array of full-page SVG strings
  const [exportDpi, setExportDpi] = useState(300);
    
  // Build a single-label SVG (at template native size)
  useEffect(() => {
    // Single label preview SVG
    // Full pages SVG array
    const svgs = [];
    for (let p = 0; p < settings.pages; p++) {
      const ps = buildPageSVG({
        paperW: paperSize.w,
        paperH: paperSize.h,
        margin: settings.margin,
        labelW: settings.labelW,
        labelH: settings.labelH,
        gapX: settings.gapX,
        gapY: settings.gapY,
        layout,
        template: activeTemplate,
        values,
        bgUrl,
        showOutlines,
        pageIndex: p,
        offsetX: PRINT_OFFSET.x,
        offsetY: PRINT_OFFSET.y,
        contentOffsetX: PRINT_TEXT_OFFSET.x,
        contentOffsetY: PRINT_TEXT_OFFSET.y,
      });
      svgs.push(ps);
    }
    setPageSvgs(svgs);
  }, [
    paperSize.w, paperSize.h,
    settings.margin, settings.labelW, settings.labelH, settings.gapX, settings.gapY, settings.pages,
    layout.cols, layout.rows, layout.perPage,
    activeTemplate, values.lot, values.exp, values.pro, values.nie, bgUrl, showOutlines
  ]);

  // ------------------------- Printing -------------------------
  // Print the generated SVG pages in an isolated window so the browser prints the
  // exact same artifacts as the exported SVG (no interference from app CSS/DOM).
  async function printFromSVGPages() {
    const htmlStart = `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <title>Print</title>
      <style>
        @page { size: ${paperSize.w}mm ${paperSize.h}mm; margin: 0; }
        html, body { margin: 0; padding: 0; }
        .page { width: ${paperSize.w}mm; height: ${paperSize.h}mm; page-break-after: always; }
        svg { width: ${paperSize.w}mm; height: ${paperSize.h}mm; display: block; }
      </style>
    </head><body>`;
    const htmlEnd = `</body></html>`;

    const w = window.open("", "_blank");
    if (!w) { alert("Popup blocked. Please allow popups to print."); return; }

    w.document.open();
    w.document.write(htmlStart);
    for (let i = 0; i < pageSvgs.length; i++) {
      // each page is inline SVG wrapped in a .page div
      w.document.write(`<div class="page">${pageSvgs[i]}</div>`);
    }
    w.document.write(htmlEnd);
    w.document.close();

    try { if (w.document.fonts && w.document.fonts.ready) { await w.document.fonts.ready; } } catch {}
    w.focus();
    w.print();
  }

useEffect(() => {
    if (!printing) return;
    const style = document.createElement("style");
    style.id = "print-style";
    style.textContent = `
      @page { size: ${paperSize.w}mm ${paperSize.h}mm; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body * { visibility: hidden !important; }
        #print-area, #print-area * { visibility: visible !important; }
        #print-area { position: absolute; left: 0; top: 0; }
        .break-after-page { break-after: page; }
      }
    `;
    document.head.appendChild(style);
    const timer = setTimeout(async () => {
      try { if (document.fonts?.ready) { await document.fonts.ready; } } catch {}
      window.print();
      setTimeout(() => {
        setPrinting(false);
        if (style.parentNode) style.parentNode.removeChild(style);
      }, 100);
    }, 150);
    return () => {
      clearTimeout(timer);
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [printing, paperSize.w, paperSize.h]);

  const openSetup = () => setShowSetup(true);
  const confirmPrint = async () => { setShowSetup(false); await printFromSVGPages(); };

  // Screen-visible stylesheet to ensure correct @page and toggle regions on print
  const pageStyle = `
    @page { size: ${mm(paperSize.w)} ${mm(paperSize.h)}; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      /* hide everything except #print-area to guarantee SVG-only printing */
      body * { visibility: hidden !important; }
      #print-area, #print-area * { visibility: visible !important; }
      #print-area { position: absolute; left: 0; top: 0; }
    }
  `;

  const onUpload = (file) => {
    const reader = new FileReader();
    reader.onload = () => setBgUrl(reader.result); // data URL → CORS-safe
    reader.readAsDataURL(file);
  };

  const saveTemplate = () => {
    const updated = templates.map((t) =>
      t.code === activeTemplate.code ? { ...t, backgroundUrl: bgUrl, fields: [...activeTemplate.fields] } : t
    );
    setTemplates(updated);
    alert("Template settings saved for " + activeTemplate.code);
  };

  const total = layout.perPage * settings.pages;

  // ------------------------- UI -------------------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <style>{pageStyle}</style>

      <div id="controls" className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Marking Label Print</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left controls */}
          <LeftCard className="shadow-sm">
            <CardSetting className="p-4 space-y-4">
              <Label>Type</Label>
              <NativeSelect
                value={activeCode ?? ''}                // controlled
                onChange={(v) => setActiveCode(v)}
                placeholder="Choose type"
                options={templates.map(t => ({ value: t.code, label: t.code }))}
                className="mb-2"
              />
              <div className="field">
                <Label>Lot</Label>
                <Input value={values.lot} onChange={(e) => updateField("lot", e.target.value)} placeholder="e.g. 123ABC" />
              </div>

              <div className="grid-3">
                <div className="field">
                  <Label>Exp</Label>
                  <Input type="month" value={mmYYYYToMonth(values.exp)} onChange={(e) => updateField("exp", monthToMMYYYY(e.target.value))} placeholder="e.g. 2027-12" />
                </div>
                <div className="field">
                   <Label>Pro</Label>
                   <Input type="month" value={mmYYYYToMonth(values.pro)} onChange={(e) => updateField("pro", monthToMMYYYY(e.target.value))} placeholder="e.g. 2025-02"/>
                </div>
                <div className="field">
                  <Label>NIE</Label>
                  <Input value={values.nie} onChange={(e) => updateField("nie", e.target.value)} placeholder="e.g. 2234567890123" />
                </div>
              </div>

              <Tabs defaultValue="print">
                <TabsList>
                  {/*<TabsTrigger value="print">Print Setup</TabsTrigger>
                  <TabsTrigger value="designer">Template Designer</TabsTrigger>*/}
                  <Button onClick={openSetup}>Print ({total})</Button>
                </TabsList>

                {/*<TabsContent value="print">
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="col-span-2 flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={showOutlines} onCheckedChange={setShowOutlines} />
                        <span className="text-sm">Show outlines</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={() => {
                          pageSvgs.forEach((svg, i) => downloadBlob(`labels-page-${i + 1}.svg`, new Blob([svg], { type: "image/svg+xml;charset=utf-8" })));
                        }}>Export SVG</Button>
                        <div className="flex items-center gap-1">
                          <Input type="number" className="w-20" value={exportDpi} onChange={(e) => setExportDpi(Math.max(72, Number(e.target.value) || 300))} />
                          <span className="text-xs opacity-70">DPI</span>
                        </div>
                        <Button variant="secondary" onClick={async () => {
                          for (let i = 0; i < pageSvgs.length; i++) {
                            const svg = pageSvgs[i];
                            const wPx = mmToPx(paperSize.w, exportDpi);
                            const hPx = mmToPx(paperSize.h, exportDpi);
                            try {
                              const pngUrl = await svgToPngDataUrl(svg, wPx, hPx);
                              const res = await fetch(pngUrl);
                              const blob = await res.blob();
                              downloadBlob(`labels-page-${i + 1}-${exportDpi}dpi.png`, blob);
                            } catch (e) {
                              console.error("PNG export failed (CORS?)", e);
                              alert("PNG export failed. If you used an external image, try uploading it so it becomes a data: URL.");
                              break;
                            }
                          }
                        }}>Export PNG</Button>}
                        <Button onClick={openSetup}>Print ({total})</Button>
                      </div>
                      <Button onClick={openSetup}>Print ({total})</Button>
                    </div>
                  </div>
                </TabsContent>
                */}

                <TabsContent value="designer">
                  <div className="space-y-4">
                    {/*<div className="grid grid-cols-2 gap-3 items-center">
                      <Label>Background URL</Label>
                      <Input value={bgUrl} onChange={(e) => setBgUrl(toAbs(e.target.value))} placeholder="Paste template image URL (PNG/SVG)" />
                      <Label>or Upload</Label>
                      <Input type="file" accept="image/*" onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                      <Label>Label width (mm)</Label>
                      <Input type="number" value={activeTemplate.labelWidthMm} onChange={(e) => { activeTemplate.labelWidthMm = parseFloat(e.target.value || "0"); setTemplates([...templates]); }} />
                      <Label>Label height (mm)</Label>
                      <Input type="number" value={activeTemplate.labelHeightMm} onChange={(e) => { activeTemplate.labelHeightMm = parseFloat(e.target.value || "0"); setTemplates([...templates]); }} />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Switch checked={designerMode} onCheckedChange={setDesignerMode} />
                      <span className="text-sm">Enable fine-tune controls</span>
                    </div>

                    {designerMode && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeTemplate.fields.map((f, idx) => (
                          <LeftCard key={idx} className="border-dashed">
                            <CardContent className="p-3 grid grid-cols-2 gap-2 items-center">
                              <div className="col-span-2 font-medium">{f.label} ({f.key.toUpperCase()})</div>
                              <Label>X (mm)</Label>
                              <Input type="number" step={0.1} value={f.x} onChange={(e) => { f.x = parseFloat(e.target.value || "0"); setTemplates([...templates]); }} />
                              <Label>Y (mm)</Label>
                              <Input type="number" step={0.1} value={f.y} onChange={(e) => { f.y = parseFloat(e.target.value || "0"); setTemplates([...templates]); }} />
                              <Label>Width (mm)</Label>
                              <Input type="number" value={f.width ?? 0} onChange={(e) => { f.width = parseFloat(e.target.value || "0"); setTemplates([...templates]); }} />
                              <Label>Font (mm)</Label>
                              <Input type="number" value={f.fontSizeMm ?? 3} onChange={(e) => { f.fontSizeMm = parseFloat(e.target.value || "0"); setTemplates([...templates]); }} />
                              <Label>Align</Label>
                              <Select value={f.align || "left"} onValueChange={(v) => { f.align = v; setTemplates([...templates]); }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="center">Center</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </CardContent>
                          </LeftCard>
                        ))}
                      </div>
                    )}*/}

                    {/*<div className="flex gap-2">
                      <Button variant="secondary" onClick={saveTemplate}>Save template</Button>
                    </div>*/}
                  </div>
                </TabsContent>
              </Tabs>
            </CardSetting>
          </LeftCard>

          {/* Right: preview — now driven by SVG */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-70">Preview</div>
                <div className="flex items-center gap-2 w-44">
                  <Slider value={[zoom]} onValueChange={(v) => setZoom(v[0])} min={60} max={200} step={5} />
                  <div className="w-12 text-right text-sm">{zoom}%</div>
                </div>
              </div>

              <div className="relative rounded-xl bg-white" style={{ minHeight: 420, maxHeight: '60vh', overflow: 'auto', display: 'grid', placeItems: 'center' }}>
                <div
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center',
                    width: mm(activeTemplate.labelWidthMm),
                    height: mm(activeTemplate.labelHeightMm),
                  }}
                  >
                  <LabelView />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SETUP + PREVIEW MODAL */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold">Print setup &amp; preview</h2>
              <button type="button" className="text-neutral-500 hover:text-black" onClick={() => setShowSetup(false)} aria-label="Close">✕</button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Controls (left column) */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="preset" className="block text-sm font-medium mb-1">Paper preset</label>
                  <select id="preset" className="w-full rounded-lg border px-3 py-2" value={settings.paperPreset} onChange={(e) => setSettings({ ...settings, paperPreset: e.target.value })}>
                    {Object.keys(PAPER_SIZES).map((p) => (<option key={p} value={p}>{p}</option>))}
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                {settings.paperPreset === "Custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="cw" className="block text-sm font-medium mb-1">Custom width (mm)</label>
                      <input id="cw" type="number" className="w-full rounded-lg border px-3 py-2" value={settings.customW} onChange={(e) => setSettings({ ...settings, customW: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label htmlFor="ch" className="block text-sm font-medium mb-1">Custom height (mm)</label>
                      <input id="ch" type="number" className="w-full rounded-lg border px-3 py-2" value={settings.customH} onChange={(e) => setSettings({ ...settings, customH: Number(e.target.value) })} />
                    </div>
                  </div>
                )}

                <div>
                  <span className="block text-sm font-medium mb-1">Orientation</span>
                  <div className="flex gap-2">
                    {["portrait", "landscape"].map((o) => (
                      <button key={o} type="button" onClick={() => setSettings({ ...settings, orientation: o })} className={`px-3 py-2 rounded-lg border ${settings.orientation === o ? "bg-black text-white" : "bg-white"}`}>{o}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="margin" className="block text-sm font-medium mb-1">Page margin (mm)</label>
                  <input id="margin" type="number" className="w-full rounded-lg border px-3 py-2" value={settings.margin} onChange={(e) => setSettings({ ...settings, margin: Number(e.target.value) })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="lw" className="block text-sm font-medium mb-1">Label width (mm)</label>
                    <input id="lw" type="number" className="w-full rounded-lg border px-3 py-2" value={settings.labelW} onChange={(e) => setSettings({ ...settings, labelW: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label htmlFor="lh" className="block text-sm font-medium mb-1">Label height (mm)</label>
                    <input id="lh" type="number" className="w-full rounded-lg border px-3 py-2" value={settings.labelH} onChange={(e) => setSettings({ ...settings, labelH: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gx" className="block text-sm font-medium mb-1">Horizontal gap (mm)</label>
                    <input id="gx" type="number" className="w-full rounded-lg border px-3 py-2" value={settings.gapX} onChange={(e) => setSettings({ ...settings, gapX: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label htmlFor="gy" className="block text-sm font-medium mb-1">Vertical gap (mm)</label>
                    <input id="gy" type="number" className="w-full rounded-lg border px-3 py-2" value={settings.gapY} onChange={(e) => setSettings({ ...settings, gapY: Number(e.target.value) })} />
                  </div>
                </div>

                <div>
                  <label htmlFor="pages" className="block text-sm font-medium mb-1">Pages</label>
                  <input id="pages" type="number" min={1} className="w-full rounded-lg border px-3 py-2" value={settings.pages} onChange={(e) => setSettings({ ...settings, pages: Math.max(1, Number(e.target.value)) })} />
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border">
                  <div className="text-sm text-neutral-600">Fit on page:</div>
                  <div className="mt-1 font-medium">{layout.cols} columns × {layout.rows} rows</div>
                  <div className="text-sm text-neutral-600">= {layout.perPage} labels / page</div>
                </div>
              </div>

              {/* Live print PREVIEW (SVG page @ 35% scale) — right column */}
              <div className="overflow-auto">
                <div className="relative origin-top-left border border-neutral-300 shadow-sm mx-auto" style={{ width: mm(paperSize.w * 0.35), height: mm(paperSize.h * 0.35), overflow: "hidden" }}>
                  <div style={{ transform: "scale(0.35)", transformOrigin: "top left", width: mm(paperSize.w), height: mm(paperSize.h) }} dangerouslySetInnerHTML={{ __html: pageSvgs[0] || "" }} />
                </div>
                <div className="text-xs text-neutral-600 mt-2">This is a preview of the generated SVG page that will be sent to print.</div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-sm text-neutral-600">In your browser's print dialog, use the same paper size and 100% scale for exact mm sizing.</div>
              <div className="flex gap-2">
                <button type="button" className="px-4 py-2 rounded-xl border" onClick={() => setShowSetup(false)}>Cancel</button>
                <button type="button" className="px-4 py-2 rounded-xl bg-black text-white" onClick={confirmPrint}>Print</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY AREA: use the generated SVG pages */}
      <div id="print-area" style={{ display: "none" }}>
        {pageSvgs.map((svg, i) => (
          <div key={i} className="break-after-page">
            <div style={{ width: mm(paperSize.w), height: mm(paperSize.h) }}
                 dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        ))}
      </div>
    </div>
  );
}
