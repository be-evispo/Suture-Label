import React, { createContext, useContext, useMemo } from "react";

const SelectCtx = createContext(null);

export function Select({ value, onValueChange, children }) {
  // Collect options from <SelectItem> in subtree
  const items = [];
  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.type && node.type.displayName === "SelectContent") {
      walk(node.props.children);
    } else if (node.type && node.type.displayName === "SelectItem") {
      items.push({ value: node.props.value, label: node.props.children });
    } else if (node.props && node.props.children) {
      walk(node.props.children);
    }
  }
  walk(children);

  const ctx = useMemo(() => ({ value, onValueChange, items }), [value, onValueChange, items.length]);
  return <SelectCtx.Provider value={ctx}>{children}</SelectCtx.Provider>;
}

export function SelectTrigger({ children }) {
  // We replace trigger+content with a native select for simplicity
  const { value, onValueChange, items } = useContext(SelectCtx);
  return (
    <select
      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white"
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
    >
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {String(it.label)}
        </option>
      ))}
    </select>
  );
}
SelectTrigger.displayName = "SelectTrigger";

export function NativeSelect({
  value = '',
  onChange,              // (nextValue: string) => void
  options = [],          // [{ value: string, label: string }]
  placeholder = 'Choose…',
  className = '',
  disabled = false,
}) {
  return (
    <select
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      className={[
        'h-10 w-full rounded-md border px-3 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-black/10',
        className,
      ].join(' ')}
    >
      {/* Placeholder (shown when value is empty string) */}
      <option value="" disabled hidden>
        {placeholder}
      </option>

      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label ?? opt.value}
        </option>
      ))}
    </select>
  );
}
SelectValue.displayName = "SelectNative";


export function SelectValue({ placeholder }) {
  // Not used with native select; kept for compatibility
  return <span className="sr-only">{placeholder || ""}</span>;
}
SelectValue.displayName = "SelectValue";

export function SelectContent({ children }) {
  // No-op with native select; children are parsed by <Select/>
  return <>{children}</>;
}
SelectContent.displayName = "SelectContent";

export function SelectItem({ value, children }) {
  // No-op placeholder so we can parse options in <Select/>
  return <option value={value}>{children}</option>;
}
SelectItem.displayName = "SelectItem";
