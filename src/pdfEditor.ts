import { setView } from "./body"
// Self-host the PDFium engine and sample so the editor never talks to a CDN about your document
import pdfiumWasm from "@embedpdf/snippet/dist/pdfium.wasm?url"
import samplePdf from "@embedpdf/snippet/dist/demo.pdf?url"

export const showPdfEditor = () => {
    const container = document.createElement("div")
    container.className = "container col-md-8 h-100 d-flex flex-column"

    const header = document.createElement("div")
    header.className = "mx-3 mt-3"
    header.innerHTML =
        `<h4 class="mb-1">PDF editor</h4>
        <p class="text-body-secondary mb-2">
            Annotate, highlight, sign, fill in forms, redact and rotate pages, then download the edited copy.
            Your PDF is opened and edited inside your browser, so it's never uploaded anywhere.
        </p>
        <div class="d-flex flex-wrap gap-1">
            <span class="badge text-bg-success">Runs locally</span>
            <span class="badge text-bg-secondary">No uploads</span>
            <span class="badge text-bg-secondary">WebAssembly / PDFium</span>
        </div>
        <p class="small text-body-secondary mt-2 mb-0">
            Only static assets like fonts are fetched from the web. Your document's contents never leave this device.
        </p>`

    const inputEl = document.createElement("input")
    inputEl.type = "file"
    inputEl.accept = "application/pdf,.pdf"
    inputEl.className = "d-none"
    inputEl.setAttribute("multiple", "")

    const dropZone = document.createElement("div")
    dropZone.className = "drop-zone m-3 p-3 rounded-3 d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2 text-center"
    const dropText = document.createElement("span")
    dropText.className = "text-body-secondary"
    dropText.textContent = "Drop PDFs here or"
    const chooseButton = document.createElement("button")
    chooseButton.className = "btn btn-success"
    chooseButton.type = "button"
    chooseButton.innerText = "Choose PDF"
    chooseButton.onclick = () => inputEl.click()
    const sampleButton = document.createElement("button")
    sampleButton.className = "btn btn-outline-secondary"
    sampleButton.type = "button"
    sampleButton.innerText = "Try a sample"
    dropZone.appendChild(dropText)
    dropZone.appendChild(chooseButton)
    dropZone.appendChild(sampleButton)
    dropZone.appendChild(inputEl)

    const viewerHost = document.createElement("div")
    viewerHost.className = "pdf-editor-host mx-3 mb-3 border rounded overflow-hidden"
    viewerHost.textContent = "Loading editor…"

    container.appendChild(header)
    container.appendChild(dropZone)
    container.appendChild(viewerHost)
    setView(container)

    // Load the viewer bundle only when this route is opened
    const documentsReady = import("@embedpdf/snippet").then(async ({ default: EmbedPDF, DocumentManagerPlugin }) => {
        viewerHost.textContent = ""
        const viewer = EmbedPDF.init({
            type: "container",
            target: viewerHost,
            // The engine runs in a blob: worker, which cannot resolve relative URLs
            wasmUrl: new URL(pdfiumWasm, location.href).href,
            theme: { preference: "light" },
            tabBar: "multiple",
        })
        const registry = await viewer!.registry
        return registry.getPlugin<InstanceType<typeof DocumentManagerPlugin>>(DocumentManagerPlugin.id)!.provides()
    })
    documentsReady.catch(err => {
        console.error(err)
        viewerHost.textContent = `The editor failed to load: ${err instanceof Error ? err.message : String(err)}`
    })

    const openFiles = async (files: FileList | null | undefined) => {
        const pdfs = Array.from(files ?? []).filter(file => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
        if (pdfs.length === 0) return
        const documents = await documentsReady
        for (const file of pdfs) {
            documents.openDocumentBuffer({ buffer: await file.arrayBuffer(), name: file.name })
        }
    }

    inputEl.onchange = () => {
        openFiles(inputEl.files)
        inputEl.value = ""
    }
    sampleButton.onclick = async () => {
        const documents = await documentsReady
        documents.openDocumentUrl({ url: new URL(samplePdf, location.href).href, name: "sample.pdf" })
    }
    dropZone.ondragover = e => {
        e.preventDefault()
        dropZone.classList.add("drag-over")
    }
    dropZone.ondragleave = () => dropZone.classList.remove("drag-over")
    dropZone.ondrop = e => {
        e.preventDefault()
        dropZone.classList.remove("drag-over")
        openFiles(e.dataTransfer?.files)
    }
}
