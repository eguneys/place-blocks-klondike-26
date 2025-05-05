type Canvas = {
  canvas: HTMLCanvasElement
  rect(x: number, y: number, w: number, h: number, color: Color): void
  line(path: Path2D, color: Color): void
  clear(): void
  set_transform(x: number, y: number): void
  reset_transform(): void
  image(x: number, y: number, w: number, h: number, sx: number, sy: number): void
  load_sheet(src: string): Promise<void>
  text(text: string, x: number, y: number, size: number, color: Color, align?: CanvasTextAlign): number
}

type Color = string

function Canvas(width: number, height: number): Canvas {

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    function line(path: Path2D, color: Color) {
        ctx.strokeStyle = color
        ctx.stroke(path)
    }

    function rect(x: number, y: number, width: number, height: number, color: Color) {
        x = Math.floor(x)
        y = Math.floor(y)
        ctx.fillStyle = color
        ctx.fillRect(x, y, width, height)
    }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    function set_transform(x: number, y: number) {
        x = Math.floor(x)
        y = Math.floor(y)
        ctx.setTransform(1, 0, 0, 1, x, y)
    }

    function reset_transform() {
        ctx.resetTransform()
    }

    let sheet = new Image()

    function load_sheet(src: string) {
        sheet.src = src
        return new Promise<void>(resolve => {
            sheet.onload = () => resolve()
        })
    }

    function image(x: number, y: number, w: number, h: number, sx: number, sy: number) {
        x = Math.floor(x)
        y = Math.floor(y)
        ctx.drawImage(sheet, sx, sy, w, h, x, y, w, h)
    }

    function text(text: string, x: number, y: number, size: number, color: Color, align: CanvasTextAlign = 'center') {
        ctx.fillStyle = color
        ctx.font = `${size}px 'HDLoreFont'`
        ctx.textBaseline = 'top'
        ctx.textAlign = align

        ctx.shadowColor = 'black'
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 4

        ctx.fillText(text, x, y)

        return ctx.measureText(text).width
    }

    return {
      canvas,
      clear,
      rect,
      line,
      image,
      set_transform,
      reset_transform,
      load_sheet,
      text
    }
}

export let c: Canvas = Canvas(320, 180)
export let f: Canvas = Canvas(1920, 1080)