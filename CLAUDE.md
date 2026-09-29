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

Single-page portfolio app built with **Vite + TypeScript**, showcasing three local AI/ML features. Bootstrap 5 is loaded from CDN (no npm install needed for styles/JS).

### Navigation & Entry

`src/index.ts` owns the router. It uses the History API (`pushState`/`popstate`) to switch between a home view (project cards) and individual project views. Each project card is created programmatically; clicking one navigates to the corresponding route.

Three routes:
- `/` — home, shows project cards
- `/bgrmvr` — Background Remover
- `/tts` — Text-to-Speech Converter
- `/chat` — Chat (stub, not implemented)

`src/body.ts` provides `setView(id)` / `cleanView()` helpers that show/hide `<section>` elements by ID.

### Features

**Background Remover** (`src/backgroundRemover.ts`)  
Uses `@huggingface/transformers` with the `onnx-community/BEN2-ONNX` model. Accepts multiple file inputs, runs background removal client-side (GPU via WebGPU/WASM), and renders result cards with before/after images.

**Text-to-Speech** (`src/tts.ts`)  
Dual-engine: **Kokoro** (local ONNX model `onnx-community/Kokoro-82M-v1.0-ONNX` via `kokoro-js`) and **Web Speech API** (browser-native fallback). Supports American/British voices, pitch/speed/volume controls, playback history with timestamps, and audio download.

**Chat** (`src/chat.ts`)  
Incomplete stub — message tracking structure exists but no UI or model integration.

### Asset pipeline

Static images live in `assets/` and are referenced directly in HTML. `src/assets.d.ts` adds TypeScript declarations for imported image files. Vite handles bundling and hashing on build.

### Deployment

`npm run deploy` runs `gh-pages -d dist`, publishing the built output to the `gh-pages` branch for GitHub Pages hosting.
