async function load_font(font_family: string, url: string, props = {
    style: 'normal',
    weight: '400'
}) {
    const font = new FontFace(font_family, `url(${url})`, props )
    await font.load()
    document.fonts.add(font)
}


function load_image(image: HTMLImageElement, src: string) {

    return new Promise(resolve => {
        image.onload = resolve
        image.src = src
    })
}
function Content() {


    let spritesheet = new Image()

    async function load() {
        await Promise.all([
            load_image(spritesheet, './sprite.png'),
        ])

        await load_font('HDLoreFont', './PTSerif-Regular.ttf')
    }

    return {
        load,
        spritesheet,
    }
}

export default Content()