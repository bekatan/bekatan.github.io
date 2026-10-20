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
    description: string,
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

const main = () => {
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
    const {title, description, imageSrc, route, launch } = project
    const card = document.createElement("div")
    card.classList.add("card", "mb-3")
    card.className = "card m-2"
    card.innerHTML = 
        `<div class="row g-0">
            <div class="col-md-4">
                <img src="${imageSrc}" class="img-fluid rounded-start" alt="...">
            </div>
            <div class="col-md-8">
                <div class="card-body">
                    <h5 class="card-title">${title}</h5>
                    <p class="card-text">${description}</p>
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
        description: "Cut the subject out of a photo and download it as a transparent PNG. The AI model runs locally in your browser, so your images are never uploaded anywhere.",
        imageSrc: bgrndVisual,
        route: "background-remover",
        launch: () => showBackgroundRemover()
    },
    {
        title: "Text to speech converter",
        description: "Type text and play it back as speech, then download the audio. Choose between the Kokoro model, which runs locally in your browser, and your browser's built-in voices. Voice, speed, pitch and volume are adjustable.",
        imageSrc: ttsVisual,
        route: "tts",
        launch: () => showTTS()
    },
    {
        title: "PDF editor",
        description: "Open a PDF to annotate, highlight, sign, fill in forms, redact and rotate pages, then download the edited copy. Everything runs in your browser, so your documents never leave your device.",
        imageSrc: pdfVisual,
        route: "pdf-editor",
        launch: () => showPdfEditor()
    },
]

document.addEventListener("DOMContentLoaded", main)