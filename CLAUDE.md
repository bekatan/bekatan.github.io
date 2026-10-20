# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173/
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
npm run deploy    # Build then push dist/ to GitHub Pages
```

No linting or test scripts are configured. TypeScript strict mode catches type errors — run `npx tsc --noEmit` to type-check without building.

## Architecture

Single-page personal site built with **Vite + TypeScript**: intro, selected work, and three in-browser tools. Bootstrap 5 is loaded from CDN (no npm install needed for styles/JS).

### Navigation & Entry

`src/index.ts` owns the router. It uses the History API (`pushState`/`popstate`) to switch between the home view and individual tool views.

The home view is static markup in `index.html` (`#home`: intro, selected work, and a `#demo-cards` slot). Demo cards are generated from the `projects` array in `src/index.ts` as real `<a href="/route">` links; plain left-clicks are intercepted for client-side routing, modified/middle clicks fall through. Nav and footer are static too.

Routes:
- `/` — home
- `/background-remover` — Background Remover
- `/tts` — Text-to-Speech
- `/pdf-editor` — PDF editor

`src/body.ts`: `setView(el)` hides `#home` and puts a tool view in `#body`; `showHome()` unhides `#home` and clears `#body`.

### Features

**Background Remover** (`src/backgroundRemover.ts`)  
Uses `@huggingface/transformers` with `onnx-community/BEN2-ONNX` (`device: "auto"`: WebGPU with WASM fallback); mobile uses quantized `briaai/RMBG-1.4` on WASM. Inference is queued one image at a time.

**Text-to-Speech** (`src/tts.ts`)  
Dual-engine: **Kokoro** (`onnx-community/Kokoro-82M-v1.0-ONNX`, q8, via `kokoro-js`; WASM or opt-in WebGPU) and the **Web Speech API**. Voice/pitch/speed/volume controls, history, WAV download for Kokoro.

**PDF editor** (`src/pdfEditor.ts`)  
Thin wrapper around `@embedpdf/snippet` (PDFium WASM in a worker). The wasm is self-hosted and the bundle is dynamically imported on this route.

**Sled media** — files in `assets/sled/` are picked up with `import.meta.glob` and shown under the Sled entry; an empty folder renders nothing.

### Asset pipeline

Static images live in `assets/` and are imported from TS or referenced in HTML. `public/` (og-image.png) is copied as-is to the site root. `src/assets.d.ts` adds TypeScript declarations for imported image files. Vite handles bundling and hashing on build.

### Deployment

`npm run deploy` runs `gh-pages -d dist`, publishing the built output to the `gh-pages` branch for GitHub Pages hosting.
