import React from "react";

export function Input({ className = "", ...props }) {
  const base = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20";
  return <input className={`${base} ${className}`} {...props} />;
}

export function InputDate({ className = "", ...props }) {
  const base = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20";
  return <input type="month" id="start" name="start" min="2000-03" value="2500-05" className={`${base} ${className}`} {...props} />;
}

function MonthYearInput({
  value,                 // "YYYYMM" or "MMYYYY" depending on returnFormat
  onChange,              // (compact: string) => void
  returnFormat = "YYYYMM", // "YYYYMM" | "MMYYYY"
  min = "2000-01",
  max = "2100-12",
  id = "monthYear",
  ...props
}) {
  // Normalize incoming value (without dash) to input[type=month] format (YYYY-MM)
  const toAttr = (v) => {
    if (!v) return "";
    const isMMYYYY = returnFormat === "MMYYYY";
    const m = isMMYYYY ? v.slice(0, 2) : v.slice(4, 6);
    const y = isMMYYYY ? v.slice(2, 6) : v.slice(0, 4);
    return `${y}-${m}`;
  };

  // Convert input[type=month] value (YYYY-MM) to compact format (no dash)
  const toCompact = (yyyyDashMm) => {
    const [y, m] = yyyyDashMm.split("-");
    return returnFormat === "MMYYYY" ? `${m}${y}` : `${y}${m}`;
  };

  const handleChange = (e) => {
    const v = e.target.value;       // "YYYY-MM"
    if (!v) return onChange?.("");
    onChange?.(toCompact(v));       // "YYYYMM" or "MMYYYY"
  };

  return (
    <div>
      <label htmlFor={id} style={{ display: "block", marginBottom: 4 }}>Month & Year</label>
      <input
        type="month"
        id={id}
        value={toAttr(value)}
        onChange={handleChange}
        min={min}           // keep these as "YYYY-MM"
        max={max}
        {...props}
      />
    </div>
  );
}

export function Demo() {
  const [compact, setCompact] = useState(""); // will hold "YYYYMM"
  return (
    <div style={{ padding: 16 }}>
      <MonthYearInput value={compact} onChange={setCompact} returnFormat="YYYYMM" />
      <p>Compact value (no dash): <code>{compact || "—"}</code></p>
    </div>
  );
}