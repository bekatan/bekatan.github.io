export const getMainBody = () => document.getElementById("body")

export const cleanBody = () => {
    const mainBody = getMainBody()
    let child
    while (child = mainBody?.firstChild) mainBody.removeChild(child)
}

export const setView = (el: HTMLDivElement) => {
    const mainBody = getMainBody()
    let child
    while (child = mainBody?.firstChild) mainBody.removeChild(child)
    mainBody?.appendChild(el)
}