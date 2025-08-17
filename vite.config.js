import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: '/Suture-Label/', // <-- your repo name for GitHub Pages
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),   // <-- makes "@/..." point to /src
    },
  },
})


