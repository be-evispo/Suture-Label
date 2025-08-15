import React, { useState, createContext, useContext } from "react";

const TabsCtx = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, children }) {
  const [internal, setInternal] = useState(defaultValue);
  const val = value ?? internal;
  const setVal = onValueChange ?? setInternal;
  return <TabsCtx.Provider value={{ val, setVal }}>{children}</TabsCtx.Provider>;
}

export function TabsList({ className = "", children }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, children }) {
  const { val, setVal } = useContext(TabsCtx);
  const active = val === value;
  return (
    <button
      className={`px-3 py-1.5 rounded-xl text-sm border ${active ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-200"}`}
      onClick={() => setVal(value)}
      type="button"
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  const { val } = useContext(TabsCtx);
  if (val !== value) return null;
  return <div className="mt-4">{children}</div>;
}
