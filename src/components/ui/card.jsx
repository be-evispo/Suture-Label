import React from "react";

export function RightCard({ className = "", children }) {
  return <section class="panel"><div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>{children}</div></section>;
}

export function LeftCard({ className = "", children }) {
  return <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>{children}</div>;
}

export function CardContent({ className = "", children }) {
  return <section class="preview-box"> <div className={className}>{children}</div></section>;
}

export function CardSetting({ className = "", children }) {
  return  <div className={className}>{children}</div>;
}

export function Preview({ className = "", children }) {
  return  <section class ="modal"><div className={className}>{children}</div></section>;
}
