import { BackgroundRemovalPipeline, pipeline } from "@huggingface/transformers"
import { setView } from "./body"
import portraitSample from "../assets/samples/portrait.jpg"
import dogSample from "../assets/samples/dog.jpg"
import catSample from "../assets/samples/cat.jpg"

const SAMPLES: { name: string, src: string }[] = [
    { name: "portrait.jpg", src: portraitSample },
    { name: "dog.jpg", src: dogSample },
    { name: "cat.jpg", src: catSample },
]

type ResultItem = {
    name: string,
    url: string,
    state: "processing" | "done" | "failed",
    card?: HTMLDivElement
}

const images: ResultItem[] = []
let pending = 0
let modelReady = false

let statusText: HTMLDivElement | undefined
let progressWrap: HTMLDivElement | undefined
let progressBar: HTMLDivElement | undefined

export const showBackgroundRemover = () => {
    const container = document.createElement("div")
    container.className = "container col-md-8 h-100 d-flex flex-column"
    const resultContainer = document.createElement("div")
    resultContainer.className = "flex-grow-1 d-flex flex-row flex-wrap align-content-start"
    const addItem = (name: string, url: string) => {
        const item: ResultItem = { name, url, state: "processing" }
        images.push(item)
        addImage(item, resultContainer)
        processItem(item)
    }
    const addFiles = (files: FileList | null | undefined) => {
        Array.from(files ?? [])
            .filter(file => file.type.startsWith("image/"))
            .forEach(file => addItem(file.name, URL.createObjectURL(file)))
    }

    const header = document.createElement("div")
    header.className = "mx-3 mt-3"
    header.innerHTML =
        `<h4 class="mb-1">Background remover</h4>
        <p class="text-body-secondary mb-2">
            Cut the subject out of a photo and download it as a transparent PNG.
            The AI model runs locally in your browser, so your images are never uploaded anywhere.
        </p>
        <div class="d-flex flex-wrap gap-1">
            <span class="badge text-bg-success">Runs locally</span>
            <span class="badge text-bg-secondary">No uploads</span>
            <span class="badge text-bg-secondary">WebGPU / WASM</span>
            <span class="badge text-bg-secondary">BEN2 model</span>
        </div>
        <p class="small text-body-secondary mt-2 mb-0">
            The first run downloads the model once. After that it's cached and loads quickly.
        </p>`

    const inputEl = document.createElement("input")
    inputEl.type = "file"
    inputEl.accept = "image/*"
    inputEl.className = "d-none"
    inputEl.setAttribute("multiple", "")
    inputEl.onchange = () => {
        addFiles(inputEl.files)
        inputEl.value = ""
    }

    const dropZone = document.createElement("div")
    dropZone.className = "drop-zone m-3 p-4 rounded-3 d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2 text-center"
    const dropText = document.createElement("span")
    dropText.className = "text-body-secondary"
    dropText.textContent = "Drop images here or"
    const chooseButton = document.createElement("button")
    chooseButton.className = "btn btn-success"
    chooseButton.type = "button"
    chooseButton.innerText = "Choose images"
    chooseButton.onclick = () => inputEl.click()
    dropZone.appendChild(dropText)
    dropZone.appendChild(chooseButton)
    dropZone.appendChild(inputEl)
    dropZone.ondragover = e => {
        e.preventDefault()
        dropZone.classList.add("drag-over")
    }
    dropZone.ondragleave = () => dropZone.classList.remove("drag-over")
    dropZone.ondrop = e => {
        e.preventDefault()
        dropZone.classList.remove("drag-over")
        addFiles(e.dataTransfer?.files)
    }

    const samples = document.createElement("div")
    samples.className = "mx-3 mb-3"
    const samplesLabel = document.createElement("div")
    samplesLabel.className = "small text-body-secondary mb-1"
    samplesLabel.textContent = "No image handy? Try a sample:"
    const sampleRow = document.createElement("div")
    sampleRow.className = "d-flex flex-wrap gap-2"
    SAMPLES.forEach(sample => {
        const button = document.createElement("button")
        button.type = "button"
        button.className = "sample-thumb btn p-0 border rounded overflow-hidden"
        button.title = `Remove background from ${sample.name}`
        const thumb = new Image()
        thumb.src = sample.src
        thumb.alt = sample.name
        button.appendChild(thumb)
        button.onclick = () => addItem(sample.name, sample.src)
        sampleRow.appendChild(button)
    })
    const credit = document.createElement("div")
    credit.className = "small text-body-secondary mt-1"
    credit.innerHTML = `Sample photos from <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>`
    samples.appendChild(samplesLabel)
    samples.appendChild(sampleRow)
    samples.appendChild(credit)

    const statusArea = document.createElement("div")
    statusArea.className = "mx-3 mb-2"
    statusText = document.createElement("div")
    statusText.className = "small text-body-secondary mb-1"
    progressWrap = document.createElement("div")
    progressWrap.className = "progress d-none"
    progressWrap.setAttribute("role", "progressbar")
    progressBar = document.createElement("div")
    progressBar.className = "progress-bar progress-bar-striped progress-bar-animated"
    progressBar.style.width = "0%"
    progressWrap.appendChild(progressBar)
    statusArea.appendChild(statusText)
    statusArea.appendChild(progressWrap)
    updateStatus()

    images.forEach(item => addImage(item, resultContainer))

    container.appendChild(header)
    container.appendChild(dropZone)
    container.appendChild(samples)
    container.appendChild(statusArea)
    container.appendChild(resultContainer)
    setView(container)
}

const processItem = async (item: ResultItem) => {
    pending++
    updateStatus()
    try {
        const remover = await getRemover()
        const output = await remover(item.url)
        const resultUrl = URL.createObjectURL(await output[0].toBlob())
        if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url)
        item.url = resultUrl
        item.state = "done"
    } catch (err) {
        console.error(err)
        item.state = "failed"
        setStatusText(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
        pending--
        if (item.card) renderCard(item, item.card)
        if (item.state !== "failed") updateStatus()
    }
}

const setStatusText = (text: string) => {
    if (statusText) statusText.textContent = text
}

const setProgress = (percent: number | undefined) => {
    if (!progressWrap || !progressBar) return
    progressWrap.classList.toggle("d-none", percent === undefined)
    progressBar.style.width = `${percent ?? 0}%`
}

const downloadProgress = new Map<string, { loaded: number, total: number }>()

const updateStatus = () => {
    if (pending === 0) {
        setStatusText("")
        setProgress(undefined)
    } else if (!modelReady) {
        let loaded = 0, total = 0
        downloadProgress.forEach(p => { loaded += p.loaded; total += p.total })
        const percent = total > 0 ? Math.round(loaded / total * 100) : 0
        setStatusText(`Downloading model… ${percent}% (first run only)`)
        setProgress(percent)
    } else {
        setStatusText(`Removing background… (${pending} left)`)
        setProgress(undefined)
    }
}

const addImage = (item: ResultItem, container: HTMLDivElement) => {
    const imageCard = document.createElement("div")
    imageCard.className = "card m-1 h-fit-content result-card"
    renderCard(item, imageCard)
    container.appendChild(imageCard)
}

const renderCard = (item: ResultItem, imageCard: HTMLDivElement) => {
    item.card = imageCard
    imageCard.replaceChildren()

    const imageWrap = document.createElement("div")
    imageWrap.className = "position-relative"
    const image = new Image()
    image.className = "card-img-top image-card"
    image.src = item.url
    image.alt = item.name
    if (item.state === "done") {
        const fullSize = document.createElement("a")
        fullSize.href = item.url
        fullSize.target = "_blank"
        fullSize.rel = "noopener"
        fullSize.appendChild(image)
        imageWrap.appendChild(fullSize)
    } else {
        imageWrap.appendChild(image)
    }
    if (item.state === "processing") {
        image.classList.add("opacity-50")
        const overlay = document.createElement("div")
        overlay.className = "position-absolute top-50 start-50 translate-middle"
        overlay.innerHTML = `<div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Processing…</span></div>`
        imageWrap.appendChild(overlay)
    }

    const cardFooter = document.createElement("div")
    cardFooter.className = "card-footer"
    const name = document.createElement("div")
    name.className = "small text-truncate"
    name.title = item.name
    name.textContent = item.name
    cardFooter.appendChild(name)

    if (item.state === "processing") {
        const label = document.createElement("small")
        label.className = "text-body-secondary"
        label.textContent = "Processing…"
        cardFooter.appendChild(label)
    } else if (item.state === "failed") {
        const label = document.createElement("small")
        label.className = "text-danger"
        label.textContent = "Failed"
        cardFooter.appendChild(label)
    } else {
        const actions = document.createElement("div")
        actions.className = "d-flex gap-1 mt-1"
        const download = document.createElement("a")
        download.className = "btn btn-sm btn-outline-primary"
        download.href = item.url
        download.download = `${item.name.replace(/\.[^.]+$/, "")}-no-bg.png`
        download.textContent = "Download"
        const fullSize = document.createElement("a")
        fullSize.className = "btn btn-sm btn-outline-secondary"
        fullSize.href = item.url
        fullSize.target = "_blank"
        fullSize.rel = "noopener"
        fullSize.textContent = "Full size"
        actions.appendChild(download)
        actions.appendChild(fullSize)
        cardFooter.appendChild(actions)
    }

    imageCard.appendChild(imageWrap)
    imageCard.appendChild(cardFooter)
}

let removerPromise: Promise<BackgroundRemovalPipeline> | undefined

const getRemover = () => {
    removerPromise ??= (async () => {
        //@ts-ignore
        const remover: BackgroundRemovalPipeline = await pipeline("background-removal", "onnx-community/BEN2-ONNX", {
            device: "auto",
            dtype: "auto",
            progress_callback: (event: unknown) => {
                const payload = event as Record<string, unknown>
                if (payload.status === "progress" && typeof payload.file === "string"
                    && typeof payload.loaded === "number" && typeof payload.total === "number") {
                    downloadProgress.set(payload.file, { loaded: payload.loaded, total: payload.total })
                    updateStatus()
                }
            },
        })
        modelReady = true
        updateStatus()
        return remover
    })().catch(err => {
        removerPromise = undefined
        throw err
    })
    return removerPromise
}
