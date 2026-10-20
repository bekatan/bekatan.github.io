export const getMainBody = () => document.getElementById("body")

// Intro, selected work and demo cards are static markup in index.html, shown only on the home route
const getHome = () => document.getElementById("home")

export const cleanBody = () => {
    const mainBody = getMainBody()
    let child
    while (child = mainBody?.firstChild) mainBody.removeChild(child)
}

export const setView = (el: HTMLDivElement) => {
    const home = getHome()
    if (home) home.hidden = true
    cleanBody()
    const mainBody = getMainBody()
    if (mainBody) mainBody.hidden = false
    mainBody?.appendChild(el)
    // #main is the scroll container; a card clicked low on the home page shouldn't open the tool scrolled down
    document.getElementById("main")?.scrollTo(0, 0)
}

export const showHome = () => {
    const home = getHome()
    if (home) home.hidden = false
    cleanBody()
    // The empty tool area would otherwise stretch as a tinted band between the cards and the footer
    const mainBody = getMainBody()
    if (mainBody) mainBody.hidden = true
}
