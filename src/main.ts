import { g } from './webgl/gl_init'
import { Loop } from './loop_input'
import './style.css'
import { _init, _render, _update } from './ur2.ts'
import Content from './content'
import a from './audio'
import { f } from './canvas.ts'

function app(el: HTMLElement) {

  let canvas = g.canvas

  Promise.all([
    a.load(),
    Content.load()
  ]).then(() => {
    g.load_sheet(Content.spritesheet)
    g.load_bg(Content.bg)
    _init()

    Loop(_update, _render)
  })

  canvas.classList.add('pixelated')


  let content = document.createElement('div')
  content.classList.add('content')

  content.appendChild(canvas)
  content.appendChild(f.canvas)
  el.appendChild(content)
}


app(document.querySelector('#app')!)