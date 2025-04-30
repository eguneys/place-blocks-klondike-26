import { g } from './webgl/gl_init'

export function _init() {
}


export function _update(_delta: number) {
}

export function _render() {

    g.clear()

    g.begin_render()



    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            g.draw(i * 64 + j % 2 * 25, j * 50, 100, 100, 216, 0, false)
        }
    }

    g.draw(10, 20, 32, 32, 0, 0, false)

    g.end_render()
}