import { showBackgroundRemover } from "./backgroundRemover"
import { showTTS } from "./tts"
import { setView } from "./body"
// Import visual assets so Vite treats them as module assets and copies/hashes them into the build
import chatVisual from "../assets/chat-visual.png"
import bgrndVisual from "../assets/bgrndrm-visual.png"
import ttsVisual from "../assets/tts-visual.png"

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
        const route = e.state.route
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
    const container = document.createElement("div")
    container.className = "container col-md-8"
    const cards = projects.map(createCard)
    cards.forEach(child => container.appendChild(child))
    setView(container)
}

const main = () => {
    const brandLink = document.getElementById("brand")
    brandLink?.addEventListener("click", () => {
        pushState('/')
        showProjectCards()
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
        description: "Local Background Remover — private, fast, and on‑device. Cut clean subjects from photos and product shots using a local AI model, so your images never leave your computer. Enjoy offline, low‑latency results with no upload limits or fees, GPU‑accelerated performance, and full control over quality.",
        imageSrc: bgrndVisual,
        route: "background-remover",
        launch: () => showBackgroundRemover()
    },
    {
        title: "Text to speech converter",
        description: "Local Text‑to‑Speech — private, fast, fully offline. Turn scripts into natural audio with on‑device models so your words never leave your machine. Enjoy instant previews, no usage caps or API fees, and full control over voice, speed, and style—wrapped in a clean, user‑friendly UI with modern UX.",
        imageSrc: ttsVisual,
        route: "tts",
        launch: () => showTTS()
    },
]

document.addEventListener("DOMContentLoaded", main)