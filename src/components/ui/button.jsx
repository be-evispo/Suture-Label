import React from "react";

export function Button({ children, className = "", variant = "default", ...props }) {
  const base = "px-3 py-2 rounded-2xl text-sm font-medium shadow-sm transition";
  const styles = variant === "secondary"
    ? "bg-gray-100 hover:bg-gray-200 text-gray-900"
    : "bg-black hover:bg-gray-800 text-white";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonSetUp({ children, className = "", variant = "default", ...props }) {
  const base = "px-3 py-2 rounded-2xl text-sm font-medium shadow-sm transition";
  const styles = variant === "secondary"
    ? "bg-gray-100 hover:bg-gray-200 text-gray-900"
    : "bg-black hover:bg-gray-800 text-white";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
