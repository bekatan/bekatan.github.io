# bekatan.github.io

Personal site of Bekatan Satyev: who I am, selected work, and a few tools that run ML models in the browser.

Live: https://bekatan.github.io

## Demos

| Route | Tool | Built on |
| --- | --- | --- |
| `/background-remover` | Background remover | [BEN2](https://huggingface.co/onnx-community/BEN2-ONNX) via [Transformers.js](https://github.com/huggingface/transformers.js); WebGPU with WASM fallback. Phones use the smaller quantized [RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) on WASM. |
| `/tts` | Text to speech | [Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) (8-bit ONNX) via [kokoro-js](https://www.npmjs.com/package/kokoro-js), on WASM or WebGPU; the browser's Web Speech API as a second engine. |
| `/pdf-editor` | PDF editor | A thin wrapper around [EmbedPDF](https://www.npmjs.com/package/@embedpdf/snippet), which runs PDFium as WebAssembly in a Web Worker. |

Models and engines run on the visitor's device. Images, text and PDFs are not uploaded.

## Architecture

- Vanilla TypeScript single-page app built with Vite. Bootstrap 5 is loaded from a CDN.
- `src/index.ts` is a small History API router. The intro, selected work, nav and footer are static HTML in `index.html`, so crawlers and link previews see them.
- GitHub Pages has no SPA fallback. The build copies `index.html` to `404.html` (see `vite.config.js`), so a direct hit on `/tts` loads the app and the router takes over.
- Each tool lives in its own module (`src/backgroundRemover.ts`, `src/tts.ts`, `src/pdfEditor.ts`). Model files are downloaded on first use and cached by the browser.
- Files in `public/` (the og:image) are served at the site root. Screenshots dropped into `assets/sled/` appear under the Sled entry on the home page.

## Run

```bash
npm install
npm run dev       # http://localhost:5173/
npm run build     # production build in dist/
npm run preview   # serve dist/ locally
npm run deploy    # build, then publish dist/ to the gh-pages branch
```

## How it was built

Recent iterations were built with [Claude Code](https://claude.com/claude-code).
