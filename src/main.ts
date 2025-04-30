import { g } from './webgl/gl_init'
import { Loop } from './loop_input'
import './style.css'
import { _init, _render, _update } from './ur.ts'
import Content from './content'

function app(el: HTMLElement) {

  let canvas = g.canvas

  Promise.all([
    Content.load()
  ]).then(() => {
    g.load_sheet(Content.spritesheet)
    _init()

    Loop(_update, _render)
  })

  canvas.classList.add('pixelated')


  let content = document.createElement('div')
  content.classList.add('content')

  content.appendChild(canvas)
  el.appendChild(content)
}


app(document.querySelector('#app')!)