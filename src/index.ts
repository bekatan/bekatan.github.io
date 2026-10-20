import { showBackgroundRemover } from "./backgroundRemover"
import { showTTS } from "./tts"
import { showPdfEditor } from "./pdfEditor"
import { showHome } from "./body"
// Import visual assets so Vite treats them as module assets and copies/hashes them into the build
import bgrndVisual from "../assets/bgrndrm-visual.png"
import ttsVisual from "../assets/tts-visual.png"
import pdfVisual from "../assets/pdf-visual.svg"

type ProjectDemo = {
    title: string,
    // What the tool does, then how it's built: the card is written for an engineer reading the portfolio
    summary: string,
    detail: string,
    tags: string[],
    imageSrc: string,
    imageAlt: string,
    route: string,
    launch: () => void
}

let currentUrl: URL

function openMainPage() {
    currentUrl.pathname = '/'
    history.replaceState({ route: '/' }, '', currentUrl)
    showProjectCards()
}

const initRouter = () => {
    window.addEventListener("popstate", (e) => {
        // Entries opened by direct URL have no state, so fall back to the path
        const route = e.state?.route ?? location.pathname.substring(1)
        const launch = projects.find(proj => proj.route === route)?.launch
        launch ? launch() : openMainPage()
    })
    currentUrl = new URL(location.href)
    const route = currentUrl.pathname[0] === '/' ? currentUrl.pathname.substring(1) : currentUrl.pathname
    const launch = projects.find(proj => proj.route === route)?.launch
    if (launch) {
        launch() 
    }
    else {
        openMainPage()
    }
}

const pushState = (route: string) => {
    currentUrl.pathname = route
    history.pushState({ route }, '', currentUrl)
}

const showProjectCards = () => {
    const cardSlot = document.getElementById("demo-cards")
    if (cardSlot && cardSlot.childElementCount === 0) {
        projects.map(createCard).forEach(card => cardSlot.appendChild(card))
    }
    showHome()
}

// Screenshots or a GIF dropped into assets/sled/ show up under the Sled entry; an empty folder renders nothing
const sledMedia = import.meta.glob<string>("../assets/sled/*.{png,jpg,jpeg,gif,webp}", { eager: true, query: "?url", import: "default" })

const showSledMedia = () => {
    const slot = document.getElementById("sled-media")
    Object.keys(sledMedia).sort().forEach((path, i) => {
        const image = new Image()
        image.src = sledMedia[path]
        image.alt = `Sled screenshot ${i + 1}`
        image.loading = "lazy"
        slot?.appendChild(image)
    })
}

const main = () => {
    showSledMedia()
    document.getElementById("brand")?.addEventListener("click", (e) => {
        if (!isPlainClick(e)) return
        e.preventDefault()
        pushState('/')
        showProjectCards()
    })
    initRouter()
}

// Let ctrl/cmd/shift/middle clicks reach the browser so links open in new tabs and windows
const isPlainClick = (e: MouseEvent) =>
    e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

const createCard = (project: ProjectDemo) => {
    const { title, summary, detail, tags, imageSrc, imageAlt, route, launch } = project
    // A real link, so new-tab opens work: GitHub Pages serves the deep link through 404.html
    const card = document.createElement("a")
    card.className = "card demo-card m-2"
    card.href = `/${route}`
    card.innerHTML =
        `<div class="row g-0">
            <div class="col-md-4">
                <img src="${imageSrc}" class="img-fluid rounded-start" alt="${imageAlt}">
            </div>
            <div class="col-md-8">
                <div class="card-body">
                    <h3 class="card-title h5">${title}</h3>
                    <p class="card-text mb-1">${summary}</p>
                    <p class="card-text small text-body-secondary mb-2">${detail}</p>
                    <div class="d-flex flex-wrap gap-1 mb-2">
                        ${tags.map(tag => `<span class="badge rounded-pill text-bg-light border">${tag}</span>`).join("")}
                    </div>
                    <span class="demo-card-cta">Try it <span aria-hidden="true">→</span></span>
                </div>
            </div>
        </div>`
    card.addEventListener("click", (e) => {
        if (!isPlainClick(e)) return
        e.preventDefault()
        pushState(route)
        launch()
    })
    return card
}

const projects: ProjectDemo[] = [
    {
        title: "Background remover",
        summary: "Cuts the subject out of a photo and returns a transparent PNG.",
        detail: "BEN2 via Transformers.js, on WebGPU with a WASM fallback. Phones get the smaller quantized RMBG-1.4, and images run one at a time to cap memory.",
        tags: ["Transformers.js", "ONNX Runtime Web", "WebGPU", "WASM", "BEN2"],
        imageSrc: bgrndVisual,
        imageAlt: "Illustration: a person's silhouette cut out over a transparent checkerboard, with a magic wand",
        route: "background-remover",
        launch: () => showBackgroundRemover()
    },
    {
        title: "Text to speech",
        summary: "Turns text into speech you can play back or download as WAV.",
        detail: "Kokoro-82M (8-bit ONNX) via kokoro-js, on WASM or opt-in WebGPU. The browser's Web Speech API is the second engine.",
        tags: ["Kokoro-82M", "kokoro-js", "WebGPU", "WASM", "Web Speech API"],
        imageSrc: ttsVisual,
        imageAlt: "Illustration: a text document turning into sound waves from a speaker",
        route: "tts",
        launch: () => showTTS()
    },
    {
        title: "PDF editor",
        summary: "Annotate, sign, fill in forms, redact and rotate pages, then download the PDF.",
        detail: "A thin wrapper around EmbedPDF, which runs PDFium compiled to WebAssembly in a Web Worker. The PDFium binary is self-hosted and the editor loads only on this route.",
        tags: ["EmbedPDF", "PDFium", "WebAssembly", "Web Worker"],
        imageSrc: pdfVisual,
        imageAlt: "Illustration: a PDF page with a highlighted line, a signature and a pen",
        route: "pdf-editor",
        launch: () => showPdfEditor()
    },
]

document.addEventListener("DOMContentLoaded", main)