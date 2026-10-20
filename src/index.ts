import { showBackgroundRemover } from "./backgroundRemover"
import { showTTS } from "./tts"
import { showPdfEditor } from "./pdfEditor"
import { showHome } from "./body"
// Import visual assets so Vite treats them as module assets and copies/hashes them into the build
import chatVisual from "../assets/chat-visual.png"
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
    const brandLink = document.getElementById("brand")
    const goHome = () => {
        pushState('/')
        showProjectCards()
    }
    brandLink?.addEventListener("click", goHome)
    brandLink?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") goHome()
    })
    initRouter()
}

const createCard = (project: ProjectDemo) => {
    const { title, summary, detail, tags, imageSrc, route, launch } = project
    const card = document.createElement("div")
    card.className = "card m-2"
    card.innerHTML =
        `<div class="row g-0">
            <div class="col-md-4">
                <img src="${imageSrc}" class="img-fluid rounded-start" alt="...">
            </div>
            <div class="col-md-8">
                <div class="card-body">
                    <h3 class="card-title h5">${title}</h3>
                    <p class="card-text mb-1">${summary}</p>
                    <p class="card-text small text-body-secondary mb-2">${detail}</p>
                    <div class="d-flex flex-wrap gap-1">
                        ${tags.map(tag => `<span class="badge rounded-pill text-bg-light border">${tag}</span>`).join("")}
                    </div>
                </div>
            </div>
        </div>`
    card.addEventListener("click", () => {
        pushState(route)
        launch()
    })
    return card
}

const projects: ProjectDemo[] = [
    // {
    //     title: "Local chatbot",
    //     description: "Local LLM Chatbot — private, fast, and fully yours. This on-device assistant keeps every message on your machine for privacy by default, stronger security, and true data ownership. It responds with low‑latency, works offline, avoids API limits and fees, and is fully customizable to your workflows. Wrapped in a clean, user‑friendly UI with modern UX—responsive layout, keyboard shortcuts, and accessible controls—it feels intuitive and delightful to use.",
    //     imageSrc: chatVisual,
    //     route: "chat",
    //     launch: () => console.log("implement chatbot launch")
    // },
    {
        title: "Background remover",
        summary: "Cuts the subject out of a photo and returns a transparent PNG.",
        detail: "BEN2 via Transformers.js, on WebGPU with a WASM fallback. Phones get the smaller quantized RMBG-1.4, and images run one at a time to cap memory.",
        tags: ["Transformers.js", "ONNX Runtime Web", "WebGPU", "WASM", "BEN2"],
        imageSrc: bgrndVisual,
        route: "background-remover",
        launch: () => showBackgroundRemover()
    },
    {
        title: "Text to speech",
        summary: "Turns text into speech you can play back or download as WAV.",
        detail: "Kokoro-82M (8-bit ONNX) via kokoro-js, on WASM or opt-in WebGPU. The browser's Web Speech API is the second engine.",
        tags: ["Kokoro-82M", "kokoro-js", "WebGPU", "WASM", "Web Speech API"],
        imageSrc: ttsVisual,
        route: "tts",
        launch: () => showTTS()
    },
    {
        title: "PDF editor",
        summary: "Annotate, sign, fill in forms, redact and rotate pages, then download the PDF.",
        detail: "A thin wrapper around EmbedPDF, which runs PDFium compiled to WebAssembly in a Web Worker. The PDFium binary is self-hosted and the editor loads only on this route.",
        tags: ["EmbedPDF", "PDFium", "WebAssembly", "Web Worker"],
        imageSrc: pdfVisual,
        route: "pdf-editor",
        launch: () => showPdfEditor()
    },
]

document.addEventListener("DOMContentLoaded", main)