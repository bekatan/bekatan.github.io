import { BackgroundRemovalPipeline, pipeline } from "@huggingface/transformers"
import { setView } from "./body"


const images: string[] = []
export const showBackgroundRemover = () => {
    const container = document.createElement("div")
    container.className = "container col-md-8 h-100 d-flex flex-column"
    const resultContainer = document.createElement("div")
    resultContainer.className = "flex-grow-1 d-flex flex-row flex-wrap"
    const inputForm = document.createElement("div")
    inputForm.className = "m-3 input-group"
    const inputEl = document.createElement("input")
    inputEl.className = "form-control"
    inputEl.type = "file"
    inputEl.accept = "image/*"
    inputEl.setAttribute("multiple", "")
    inputEl.onchange = () => {
        if (inputEl.files?.length === 0) {
            return
        }

        for(let i = 0; i < inputEl.files!.length; i++) {
            const file = inputEl.files!.item(i)!
            const url = URL.createObjectURL(file)
            images.push(url)
            const img = addImage(url, resultContainer)
            removeBackground(url).then(async res => {
                const resultUrl = URL.createObjectURL(await res.toBlob())
                img.src = resultUrl;
                images.splice(images.indexOf(url), 1, resultUrl)
                URL.revokeObjectURL(url)
            })        
        }
    }

    const submitButton = document.createElement("button")
    submitButton.className = "btn btn-outline-secondary"
    submitButton.type = "button"
    submitButton.innerText = "Remove background"
    submitButton.onclick

    images.forEach(src => addImage(src, resultContainer))
    
    inputForm.appendChild(inputEl)
    inputForm.appendChild(submitButton)
    container.appendChild(inputForm)
    container.appendChild(resultContainer)
    setView(container)
}

const addImage = (src: string, container: HTMLDivElement) => {
    const imageCard = document.createElement("div")
    imageCard.className = "card m-1 h-fit-content"
    const image = new Image()
    image.className = "card-img-top image-card"
    image.src = src
    const cardFooter = document.createElement("div")
    cardFooter.className = "card-footer"
    cardFooter.innerHTML = `<small class="text-body-secondary">Last updated 3 mins ago</small>`
    imageCard.appendChild(image)
    imageCard.appendChild(cardFooter)
    container.appendChild(imageCard)
    return image
}

let remover: BackgroundRemovalPipeline | undefined;

const removeBackground = async (src: string, download?: boolean) => {
    //@ts-ignore
    if (!remover) remover = await pipeline("background-removal", "onnx-community/BEN2-ONNX", {device: "auto", dtype: "auto"})
    const output = await remover(src)
    if (download) output[0].save(`background_removed.png`)
    return output[0]
}