import { add_anim, Anim, render_animations, tag_anim, update_animations, xy_anim } from './anim'
import { DragHandler } from './drag'
import { box_intersect, XY, XYWH } from './util'
import { g } from './webgl/gl_init'

type Cursor = XY
let cursor: Cursor
let drag: DragHandler

type Block = {
    anim: Anim
    pos: XY
    is_hovering: boolean
}

let blocks: Block[]

let drag_block: [Block, XY] | undefined

let t: number

function push_block(x: number, y: number) {

    let anim = add_anim(88, 0, 32, 32, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    tag_anim(anim, 'idle')
    blocks.push({
        anim,
        pos: [x, y],
        is_hovering: false
    })
}

export function _init() {
    t = 0
    cursor = [0, 0]
    drag = DragHandler(g.canvas)

    blocks = []

    drag_block = undefined

    for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 5; j++) {
        if (i === 0 || j === 0 || i === 7 || j === 4) {

        push_block(10 + i * 32, 10 + j * 32)
        }
    }
    }
}

function block_box(block: Block): XYWH {
    return [block.pos[0], block.pos[1], 32, 32]
}

function cursor_box(cursor: Cursor): XYWH {
    return [cursor[0], cursor[1], 10, 10]
}

function update_block(block: Block) {

    xy_anim(block.anim, ...block.pos, false)
    if (drag_block?.[0] === block) {
        tag_anim(block.anim, 'drag')
    } else if (block.is_hovering) {
        tag_anim(block.anim, 'hover')
    } else {
        tag_anim(block.anim, 'idle')
    }
}

function cursor_hit_decay(block: XYWH, is_down: XY) {
    if (box_intersect(block, [...is_down, 10, 10])) {
        return [is_down[0], is_down[1], block[0] - is_down[0], block[1] - is_down[1]]
    }
}

export function _update(delta: number) {

    t += delta

    if (drag.is_hovering) {
        cursor = drag.is_hovering

        if (drag_block) {

            drag_block[0].pos[0] = cursor[0] + drag_block[1][0]
            drag_block[0].pos[1] = cursor[1] + drag_block[1][1]

        } else {
            blocks.forEach(block => {
                block.is_hovering = false
                if (box_intersect(cursor_box(cursor), block_box(block))) {
                    block.is_hovering = true
                }
            })
        }
    }

    if (drag.is_down) {
        let is_down = drag.is_down
        if (drag_block === undefined) {
            blocks.forEach(block => {
                let decay = cursor_hit_decay(block_box(block), is_down)

                if (decay) {
                    drag_block = [block, [decay[2], decay[3]]]
                }
            })
        }
    } else {
        if (drag_block) {
            drag_block = undefined
        }
    }

    blocks.forEach(update_block)

    update_animations(delta)

    drag.update(delta)
}

export function _render() {

    g.clear()

    render_block_background_stencil()

    g.begin_render()

    //render_background_in_stencil()

    render_animations(g)

    render_cursor()


    g.end_render()
}


function render_block_background_stencil() {
    g.begin_stencil()

    g.begin_render()
    blocks.forEach(block => {
        let x = block.pos[0] + 8
        let y = block.pos[1] + 8
        let w = 32 - 16
        let h = 32 - 16
        g.draw(x, y, w, h, 0, 0, false)
    })
    g.end_render()

    g.begin_stencil_bg()


    g.begin_render()


    render_background_in_stencil()

    g.end_render()


    g.end_stencil()

}

function render_background_in_stencil() {

    let gap = 50
    let offset = t * 0.015

    let patternSize = gap * 2
    let patternOffset = offset % patternSize

    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
                        // Diagonal movement: x and y increase together
            let x = (i * gap) + patternOffset;
            let y = (j * gap) - patternOffset;
            
            // Apply checkerboard offset for every other row
            if (j % 2 === 1) {
                x += gap / 2;
            }
            
            // Wrap coordinates around to create seamless loop
            x = x % (10 * gap);
            y = y % (10 * gap);
            
            g.draw(x - gap, y - gap, 64, 64, 216, 0, false);
        }
    }

}

function render_cursor() {

    g.draw(...cursor, 20, 20, 0, 0, false)
}

