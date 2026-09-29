import { KokoroTTS } from "kokoro-js"
import { setView } from "./body"

type EngineType = "web-speech" | "kokoro"

type HistoryItem = {
    id: number
    text: string
    engine: EngineType
    voice: string
    createdAt: Date
    pitch?: number
    speed: number
    volume?: number
    audioUrl?: string
}

const KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX"

const KOKORO_VOICE_GROUPS: Record<string, string[]> = {
    "American Female": [
        "af_heart",
        "af_alloy",
        "af_aoede",
        "af_bella",
        "af_jessica",
        "af_kore",
        "af_nicole",
        "af_nova",
        "af_river",
        "af_sarah",
        "af_sky",
    ],
    "American Male": [
        "am_adam",
        "am_echo",
        "am_eric",
        "am_fenrir",
        "am_liam",
        "am_michael",
        "am_onyx",
        "am_puck",
        "am_santa",
    ],
    "British Female": ["bf_alice", "bf_emma", "bf_isabella", "bf_lily"],
    "British Male": ["bm_daniel", "bm_fable", "bm_george", "bm_lewis"],
}

let kokoro: KokoroTTS | null = null
const ttsObjectUrls: string[] = []
let historyCounter = 0

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const humanTime = (value: Date) => value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

const clearTtsObjectUrls = () => {
    while (ttsObjectUrls.length > 0) {
        const url = ttsObjectUrls.pop()
        if (url) {
            URL.revokeObjectURL(url)
        }
    }
}

const setText = (el: HTMLElement, value: string) => {
    el.textContent = value
}

const populateSpeechVoices = (
    selectEl: HTMLSelectElement,
    voices: SpeechSynthesisVoice[],
    preferred = ""
) => {
    const sortedVoices = [...voices].sort((a, b) => a.name.localeCompare(b.name))
    selectEl.innerHTML = ""

    if (sortedVoices.length === 0) {
        const opt = document.createElement("option")
        opt.value = ""
        opt.text = "No browser voices available"
        selectEl.appendChild(opt)
        selectEl.disabled = true
        return
    }

    selectEl.disabled = false
    sortedVoices.forEach((voice) => {
        const option = document.createElement("option")
        option.value = voice.voiceURI
        option.text = `${voice.name} (${voice.lang})`
        selectEl.appendChild(option)
    })

    const defaultVoice =
        sortedVoices.find((voice) => voice.default) ||
        sortedVoices.find((voice) => voice.lang.startsWith("en")) ||
        sortedVoices[0]

    selectEl.value = preferred || defaultVoice.voiceURI
}

const populateKokoroVoices = (selectEl: HTMLSelectElement, preferred = "af_heart") => {
    selectEl.innerHTML = ""
    Object.entries(KOKORO_VOICE_GROUPS).forEach(([groupName, voices]) => {
        const group = document.createElement("optgroup")
        group.label = groupName

        voices.forEach((voice) => {
            const option = document.createElement("option")
            option.value = voice
            option.text = voice
            group.appendChild(option)
        })

        selectEl.appendChild(group)
    })

    selectEl.disabled = false
    selectEl.value = preferred
}

const ensureKokoro = async (
    onProgress: (msg: string) => void,
    device: "wasm" | "webgpu"
): Promise<KokoroTTS> => {
    if (kokoro) {
        return kokoro
    }

    onProgress("Loading Kokoro model (first run may take a while)...")
    kokoro = await KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
        dtype: "q8",
        device,
        progress_callback: (event: unknown) => {
            const payload = event as Record<string, unknown>
            const status = typeof payload.status === "string" ? payload.status : "loading"
            const file = typeof payload.file === "string" ? payload.file : ""
            const progress = typeof payload.progress === "number" ? `${Math.round(payload.progress)}%` : ""
            const detail = [status, progress, file].filter(Boolean).join(" ")
            onProgress(detail)
        },
    })

    return kokoro
}

export const showTTS = () => {
    clearTtsObjectUrls()

    let speechVoices = window.speechSynthesis.getVoices()
    const historyItems: HistoryItem[] = []

    const container = document.createElement("div")
    container.className = "container col-md-8 h-100 d-flex flex-column"

    const controlsCard = document.createElement("div")
    controlsCard.className = "card m-2 p-3"

    const title = document.createElement("h4")
    setText(title, "Text to speech")

    const subtitle = document.createElement("p")
    subtitle.className = "text-body-secondary mb-3"
    setText(subtitle, "Generate audio with either browser voices or Kokoro AI.")

    const engineGroup = document.createElement("div")
    engineGroup.className = "mb-3"

    const engineLabel = document.createElement("label")
    engineLabel.className = "form-label"
    setText(engineLabel, "Engine")

    const engineOptions = document.createElement("div")
    engineOptions.className = "d-flex gap-3 flex-wrap"

    const webEngineInput = document.createElement("input")
    webEngineInput.type = "radio"
    webEngineInput.className = "form-check-input"
    webEngineInput.name = "tts-engine"
    webEngineInput.id = "tts-engine-web"
    webEngineInput.checked = true
    webEngineInput.value = "web-speech"

    const webEngineLabel = document.createElement("label")
    webEngineLabel.className = "form-check-label"
    webEngineLabel.htmlFor = webEngineInput.id
    setText(webEngineLabel, "Browser Speech API")

    const webEngineWrap = document.createElement("div")
    webEngineWrap.className = "form-check"
    webEngineWrap.appendChild(webEngineInput)
    webEngineWrap.appendChild(webEngineLabel)

    const kokoroEngineInput = document.createElement("input")
    kokoroEngineInput.type = "radio"
    kokoroEngineInput.className = "form-check-input"
    kokoroEngineInput.name = "tts-engine"
    kokoroEngineInput.id = "tts-engine-kokoro"
    kokoroEngineInput.value = "kokoro"

    const kokoroEngineLabel = document.createElement("label")
    kokoroEngineLabel.className = "form-check-label"
    kokoroEngineLabel.htmlFor = kokoroEngineInput.id
    setText(kokoroEngineLabel, "Kokoro (Transformers.js)")

    const kokoroEngineWrap = document.createElement("div")
    kokoroEngineWrap.className = "form-check"
    kokoroEngineWrap.appendChild(kokoroEngineInput)
    kokoroEngineWrap.appendChild(kokoroEngineLabel)

    engineOptions.appendChild(webEngineWrap)
    engineOptions.appendChild(kokoroEngineWrap)
    engineGroup.appendChild(engineLabel)
    engineGroup.appendChild(engineOptions)

    const textLabel = document.createElement("label")
    textLabel.className = "form-label"
    textLabel.htmlFor = "tts-text"
    setText(textLabel, "Text")

    const textInput = document.createElement("textarea")
    textInput.className = "form-control mb-3"
    textInput.id = "tts-text"
    textInput.rows = 5
    textInput.placeholder = "Type text to synthesize into audio..."

    const voiceLabel = document.createElement("label")
    voiceLabel.className = "form-label"
    voiceLabel.htmlFor = "tts-voice"
    setText(voiceLabel, "Voice")

    const voiceSelect = document.createElement("select")
    voiceSelect.className = "form-select mb-3"
    voiceSelect.id = "tts-voice"

    const slidersRow = document.createElement("div")
    slidersRow.className = "row g-2"

    const pitchWrap = document.createElement("div")
    pitchWrap.className = "col-md-4"

    const pitchLabel = document.createElement("label")
    pitchLabel.className = "form-label d-flex justify-content-between"
    pitchLabel.htmlFor = "tts-pitch"
    pitchLabel.innerHTML = `<span>Pitch</span><span id="tts-pitch-value">1.00</span>`

    const pitchInput = document.createElement("input")
    pitchInput.type = "range"
    pitchInput.className = "form-range"
    pitchInput.id = "tts-pitch"
    pitchInput.min = "0"
    pitchInput.max = "2"
    pitchInput.step = "0.05"
    pitchInput.value = "1"

    pitchWrap.appendChild(pitchLabel)
    pitchWrap.appendChild(pitchInput)

    const speedWrap = document.createElement("div")
    speedWrap.className = "col-md-4"

    const speedLabel = document.createElement("label")
    speedLabel.className = "form-label d-flex justify-content-between"
    speedLabel.htmlFor = "tts-speed"
    speedLabel.innerHTML = `<span id="tts-speed-label">Rate</span><span id="tts-speed-value">1.00</span>`

    const speedInput = document.createElement("input")
    speedInput.type = "range"
    speedInput.className = "form-range"
    speedInput.id = "tts-speed"
    speedInput.min = "0.5"
    speedInput.max = "2"
    speedInput.step = "0.05"
    speedInput.value = "1"

    speedWrap.appendChild(speedLabel)
    speedWrap.appendChild(speedInput)

    const volumeWrap = document.createElement("div")
    volumeWrap.className = "col-md-4"

    const volumeLabel = document.createElement("label")
    volumeLabel.className = "form-label d-flex justify-content-between"
    volumeLabel.htmlFor = "tts-volume"
    volumeLabel.innerHTML = `<span>Volume</span><span id="tts-volume-value">1.00</span>`

    const volumeInput = document.createElement("input")
    volumeInput.type = "range"
    volumeInput.className = "form-range"
    volumeInput.id = "tts-volume"
    volumeInput.min = "0"
    volumeInput.max = "1"
    volumeInput.step = "0.05"
    volumeInput.value = "1"

    volumeWrap.appendChild(volumeLabel)
    volumeWrap.appendChild(volumeInput)

    slidersRow.appendChild(pitchWrap)
    slidersRow.appendChild(speedWrap)
    slidersRow.appendChild(volumeWrap)

    const actionRow = document.createElement("div")
    actionRow.className = "d-flex align-items-center gap-2 mt-3 flex-wrap"

    const generateBtn = document.createElement("button")
    generateBtn.className = "btn btn-outline-secondary"
    generateBtn.type = "button"
    setText(generateBtn, "Generate audio")

    const stopBtn = document.createElement("button")
    stopBtn.className = "btn btn-outline-danger"
    stopBtn.type = "button"
    setText(stopBtn, "Stop")

    const webgpuToggleWrap = document.createElement("div")
    webgpuToggleWrap.className = "form-check ms-auto"

    const webgpuInput = document.createElement("input")
    webgpuInput.type = "checkbox"
    webgpuInput.className = "form-check-input"
    webgpuInput.id = "tts-webgpu"
    webgpuInput.disabled = !("gpu" in navigator)

    const webgpuLabel = document.createElement("label")
    webgpuLabel.className = "form-check-label"
    webgpuLabel.htmlFor = webgpuInput.id
    setText(webgpuLabel, "Use WebGPU when available")

    webgpuToggleWrap.appendChild(webgpuInput)
    webgpuToggleWrap.appendChild(webgpuLabel)

    actionRow.appendChild(generateBtn)
    actionRow.appendChild(stopBtn)
    actionRow.appendChild(webgpuToggleWrap)

    const status = document.createElement("div")
    status.className = "small text-body-secondary mt-2"
    setText(status, "Ready")

    controlsCard.appendChild(title)
    controlsCard.appendChild(subtitle)
    controlsCard.appendChild(engineGroup)
    controlsCard.appendChild(textLabel)
    controlsCard.appendChild(textInput)
    controlsCard.appendChild(voiceLabel)
    controlsCard.appendChild(voiceSelect)
    controlsCard.appendChild(slidersRow)
    controlsCard.appendChild(actionRow)
    controlsCard.appendChild(status)

    const previewCard = document.createElement("div")
    previewCard.className = "card m-2 p-3"

    const previewTitle = document.createElement("h5")
    setText(previewTitle, "Latest clip")

    const previewHint = document.createElement("p")
    previewHint.className = "small text-body-secondary"
    setText(previewHint, "Kokoro outputs appear here as downloadable audio.")

    const previewAudio = document.createElement("audio")
    previewAudio.controls = true
    previewAudio.className = "w-100"

    const previewEmpty = document.createElement("div")
    previewEmpty.className = "small text-body-secondary"
    setText(previewEmpty, "No generated audio yet.")

    previewCard.appendChild(previewTitle)
    previewCard.appendChild(previewHint)
    previewCard.appendChild(previewAudio)
    previewCard.appendChild(previewEmpty)

    const historyCard = document.createElement("div")
    historyCard.className = "card m-2 p-3 flex-grow-1 d-flex flex-column overflow-hidden"

    const historyTitle = document.createElement("h5")
    setText(historyTitle, "History")

    const historyList = document.createElement("div")
    historyList.className = "tts-history-list flex-grow-1 d-flex flex-column gap-2"

    const historyEmpty = document.createElement("div")
    historyEmpty.className = "small text-body-secondary"
    setText(historyEmpty, "Your generated clips will show up here.")

    historyList.appendChild(historyEmpty)
    historyCard.appendChild(historyTitle)
    historyCard.appendChild(historyList)

    container.appendChild(controlsCard)
    container.appendChild(previewCard)
    container.appendChild(historyCard)
    setView(container)

    const setGenerating = (isGenerating: boolean) => {
        generateBtn.disabled = isGenerating
        stopBtn.disabled = !isGenerating
        textInput.disabled = isGenerating
        voiceSelect.disabled = isGenerating
        speedInput.disabled = isGenerating
        pitchInput.disabled = isGenerating || selectedEngine() !== "web-speech"
        volumeInput.disabled = isGenerating || selectedEngine() !== "web-speech"
        webEngineInput.disabled = isGenerating
        kokoroEngineInput.disabled = isGenerating
        webgpuInput.disabled = isGenerating || !("gpu" in navigator)
    }

    const selectedEngine = (): EngineType => (webEngineInput.checked ? "web-speech" : "kokoro")

    const setStatus = (message: string) => {
        setText(status, message)
    }

    const updateSliderValues = () => {
        const pitchValue = document.getElementById("tts-pitch-value")
        const speedValue = document.getElementById("tts-speed-value")
        const volumeValue = document.getElementById("tts-volume-value")
        pitchValue && setText(pitchValue, Number(pitchInput.value).toFixed(2))
        speedValue && setText(speedValue, Number(speedInput.value).toFixed(2))
        volumeValue && setText(volumeValue, Number(volumeInput.value).toFixed(2))
    }

    const speakWithWebSpeech = (entry: HistoryItem) => {
        const text = entry.text
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.pitch = clamp(entry.pitch ?? 1, 0, 2)
        utterance.rate = clamp(entry.speed, 0.1, 10)
        utterance.volume = clamp(entry.volume ?? 1, 0, 1)
        const voice = speechVoices.find((item) => item.voiceURI === entry.voice)
        if (voice) {
            utterance.voice = voice
        }

        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
    }

    const addHistoryItem = (item: HistoryItem) => {
        historyItems.unshift(item)
        historyList.innerHTML = ""

        historyItems.forEach((entry) => {
            const card = document.createElement("div")
            card.className = "card p-2"

            const titleRow = document.createElement("div")
            titleRow.className = "d-flex justify-content-between align-items-center gap-2"

            const engineBadge = document.createElement("span")
            engineBadge.className = "badge text-bg-secondary"
            setText(engineBadge, entry.engine === "web-speech" ? "Browser" : "Kokoro")

            const voiceText = document.createElement("span")
            voiceText.className = "small text-body-secondary"
            setText(voiceText, `${entry.voice} • ${humanTime(entry.createdAt)}`)

            titleRow.appendChild(engineBadge)
            titleRow.appendChild(voiceText)

            const textPreview = document.createElement("p")
            textPreview.className = "mb-2 mt-2 tts-history-text"
            setText(textPreview, entry.text)

            const actions = document.createElement("div")
            actions.className = "d-flex gap-2 flex-wrap"

            const playBtn = document.createElement("button")
            playBtn.className = "btn btn-sm btn-outline-secondary"
            playBtn.type = "button"
            setText(playBtn, "Play")

            playBtn.onclick = () => {
                if (entry.engine === "web-speech") {
                    speakWithWebSpeech(entry)
                    setStatus("Replaying browser speech...")
                    return
                }

                if (entry.audioUrl) {
                    previewAudio.src = entry.audioUrl
                    previewAudio.play().catch(() => undefined)
                    previewEmpty.classList.add("d-none")
                    previewAudio.classList.remove("d-none")
                    setStatus("Playing Kokoro audio from history")
                }
            }

            actions.appendChild(playBtn)

            const downloadBtn = document.createElement("a")
            downloadBtn.className = "btn btn-sm btn-outline-primary"
            setText(downloadBtn, "Download WAV")

            if (entry.audioUrl) {
                downloadBtn.href = entry.audioUrl
                downloadBtn.download = `tts-${entry.id}.wav`
            } else {
                downloadBtn.classList.add("disabled")
                downloadBtn.setAttribute(
                    "title",
                    "Browser Speech API cannot be exported as an audio file in the browser"
                )
            }

            actions.appendChild(downloadBtn)

            card.appendChild(titleRow)
            card.appendChild(textPreview)
            card.appendChild(actions)
            historyList.appendChild(card)
        })
    }

    const refreshControlsForEngine = () => {
        const engine = selectedEngine()
        const speedLabelText = document.getElementById("tts-speed-label")

        if (engine === "web-speech") {
            pitchWrap.classList.remove("d-none")
            volumeWrap.classList.remove("d-none")
            speedInput.min = "0.1"
            speedInput.max = "2"
            speedInput.step = "0.05"
            speedLabelText && setText(speedLabelText, "Rate")
            populateSpeechVoices(voiceSelect, speechVoices, voiceSelect.value)
        } else {
            pitchWrap.classList.add("d-none")
            volumeWrap.classList.add("d-none")
            speedInput.min = "0.5"
            speedInput.max = "2"
            speedInput.step = "0.05"
            speedLabelText && setText(speedLabelText, "Speed")
            populateKokoroVoices(voiceSelect, voiceSelect.value || "af_heart")
        }

        updateSliderValues()
    }

    stopBtn.onclick = () => {
        window.speechSynthesis.cancel()
        previewAudio.pause()
        setGenerating(false)
        setStatus("Stopped")
    }

    generateBtn.onclick = async () => {
        const text = textInput.value.trim()
        if (!text) {
            setStatus("Add text before generating")
            return
        }

        const engine = selectedEngine()
        const speed = Number(speedInput.value)

        setGenerating(true)
        setStatus("Generating...")

        try {
            if (engine === "web-speech") {
                const pitch = Number(pitchInput.value)
                const volume = Number(volumeInput.value)

                const entry: HistoryItem = {
                    id: ++historyCounter,
                    text,
                    engine,
                    voice: voiceSelect.value,
                    pitch,
                    speed,
                    volume,
                    createdAt: new Date(),
                }

                speakWithWebSpeech(entry)
                addHistoryItem(entry)

                previewAudio.classList.add("d-none")
                previewEmpty.classList.remove("d-none")
                setText(previewEmpty, "Browser engine plays audio directly and cannot export WAV.")
                setStatus("Speaking with browser engine")
                return
            }

            const device: "wasm" | "webgpu" = webgpuInput.checked && "gpu" in navigator ? "webgpu" : "wasm"
            const model = await ensureKokoro(setStatus, device)
            const voice = voiceSelect.value || "af_heart"
            const result = await model.generate(text, {
                voice: voice as keyof typeof model.voices,
                speed,
            })
            const audioUrl = URL.createObjectURL(result.toBlob())
            ttsObjectUrls.push(audioUrl)

            previewAudio.src = audioUrl
            previewAudio.classList.remove("d-none")
            previewEmpty.classList.add("d-none")
            await previewAudio.play().catch(() => undefined)

            const entry: HistoryItem = {
                id: ++historyCounter,
                text,
                engine,
                voice: String(voice),
                speed,
                createdAt: new Date(),
                audioUrl,
            }

            addHistoryItem(entry)
            setStatus("Kokoro audio generated")
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error"
            setStatus(`Generation failed: ${message}`)
        } finally {
            setGenerating(false)
        }
    }

    const updateVoicesFromBrowser = () => {
        speechVoices = window.speechSynthesis.getVoices()
        if (selectedEngine() === "web-speech") {
            populateSpeechVoices(voiceSelect, speechVoices, voiceSelect.value)
        }
    }

    webEngineInput.onchange = refreshControlsForEngine
    kokoroEngineInput.onchange = refreshControlsForEngine
    pitchInput.oninput = updateSliderValues
    speedInput.oninput = updateSliderValues
    volumeInput.oninput = updateSliderValues

    window.speechSynthesis.onvoiceschanged = updateVoicesFromBrowser

    populateSpeechVoices(voiceSelect, speechVoices)
    updateSliderValues()
    setGenerating(false)
    refreshControlsForEngine()
}
