# Label Printing App (Vite + React + Tailwind)

This bundle includes your app split into HTML, CSS, and JS, plus tiny UI components so it runs without shadcn/ui.

## Quick start
```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Notes
- The `@page` size is injected dynamically from React state for accurate printing.
- Minimal UI components live in `src/components/ui/*`. If you already use shadcn/ui in your project, you can delete these files and switch the imports to your own components.
- Tailwind is set up via `src/styles.css`, `tailwind.config.js`, and `postcss.config.js`.
