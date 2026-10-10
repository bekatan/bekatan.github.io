declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.webp'
declare module '*?url' {
    const src: string
    export default src
}
