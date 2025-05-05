import { add_anim, Anim, render_animations, tag_anim, update_animations, xy_anim } from './anim'
import { DragHandler } from './drag'
import { appr, box_intersect, XY, XYWH } from './util'
import { g } from './webgl/gl_init'
import a from './audio'
import { f } from './canvas'

let playing_music: (() => void) | undefined

let _music_box: XYWH = [4, 4, 32, 32]

type Cursor = XY
let cursor: Cursor
let drag: DragHandler

type Block = {
    anim: Anim
    pos: XYWH
    wh: XY
    is_hovering: boolean
    vel: XY
}

let blocks: Block[]

let drag_block: [Block, XY] | undefined

let grid: (Block | undefined)[]

let t: number

let _grid_bounds: XYWH = [40, 32, 11, 7]

function grid_ij_key(i: number, j: number) {
    return i + j * _grid_bounds[2]
}
function grid_key2ij(key: number): XY {
    return [key % _grid_bounds[2], Math.floor(key / _grid_bounds[2])]
}


function pos_to_ij(x: number, y: number, _w: number, _h: number): XY {
    return [Math.floor((x - _grid_bounds[0]) / 32), Math.floor((y - _grid_bounds[1]) / 32)]
}

function ij_to_pos(i: number, j: number): XY {
    return [_grid_bounds[0] + i * 32, _grid_bounds[1] + j * 32]
}

function push_block(i: number, j: number, w: number, h: number) {

    let anim: Anim
    
    if (w === 1 && h === 1) {
        anim = add_anim(88, 0, 32, 32, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    } else if (w === 1 && h === 2) {
        anim = add_anim(144, 104, 32, 64, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    } else if (w === 2 && h === 1) {
        anim = add_anim(0, 64, 64, 32, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    } else if (w === 2 && h === 2) {
        anim = add_anim(0, 168, 64, 64, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    } else {
        anim = add_anim(0, 64, 64, 32, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    }

    tag_anim(anim, 'idle')

    let x = _grid_bounds[0] + i * 32
    let y = _grid_bounds[1] + j * 32

    let block: Block = {
        anim,
        pos: [x, y, 0, 0],
        wh: [w, h],
        vel: [0, 0],
        is_hovering: false
    }

    blocks.push(block)

    grid[grid_ij_key(i, j)] = block
    if (w === 2 && h === 1) {
        grid[grid_ij_key(i + 1, j)] = block
    }

    if (w === 1 && h === 2) {
        grid[grid_ij_key(i, j + 1)] = block
    }

    if (w === 2 && h === 2) {
        grid[grid_ij_key(i + 1, j)] = block
        grid[grid_ij_key(i, j + 1)] = block
        grid[grid_ij_key(i + 1, j + 1)] = block
    }
}

export function _init() {
    t = 0
    cursor = [0, 0]
    drag = DragHandler(g.canvas)

    blocks = []

    drag_block = undefined

    grid = []

    for (let k = 0; k < 10; k++) {
        push_block(k, 0, 1, 1)
    }
    for (let j = 0; j < 9; j+=2) {
        push_block(j, 1, 2, 1)
    }
    for (let j = 0; j < 9; j += 2) {
        push_block(j, 2, 1, 2)
    }
     for (let j = 0; j < 9; j += 2) {
        push_block(j, 4, 2, 2)
    }
    

    music_anim = add_anim(0, 112, 32, 32, { idle: '0.0-0', hover: '0.1-1', off: '0.2-2', off_hover: '0.3-3' })
    tag_anim(music_anim, 'idle')
    xy_anim(music_anim, _music_box[0], _music_box[1], false)
}
let music_anim: Anim

function block_drag_box(block: Block): XYWH {
    return [block.pos[0] + 1, block.pos[1] + 1, 30 * block.wh[0], 30 * block.wh[1]]
}

function block_box(block: Block): XYWH {
    let off_y = 0
    let off_x = 4
    let edge_w = 25
    let edge_h = 20
    if (block.wh[0] === 1) {
        off_x = 8
        edge_w = 16
    } 
    if (block.wh[1] === 2) {
        edge_h = 25
    }
    if (block.wh[1] === 2 && block.wh[0] === 2) {

        off_y = 4
        off_x = 8
        edge_w = 24
        edge_h = 22
    }
    return [block.pos[0] + off_x, off_y + block.pos[1] + 6, edge_w * block.wh[0], edge_h * block.wh[1]]
}

function cursor_box(cursor: Cursor): XYWH {
    return [cursor[0], cursor[1], 10, 10]
}

function update_block(block: Block, _delta: number) {

    if (drag_block?.[0] === block) {
    } else {
        let block_target_pos = ij_to_pos(...grid_key2ij(grid.indexOf(block)))
        updateSpring(block.pos, block_target_pos)
    }

    xy_anim(block.anim, block.pos[0], block.pos[1], false)
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

let start_music_once = true

export function _update(delta: number) {

    if (drag.is_just_down) {

        if (box_intersect(cursor_box(drag.is_just_down), _music_box)) {
            if (playing_music) {
                playing_music()
                playing_music = undefined
            } else {
                playing_music = a.play('main_song', true, 0.5)
            }
        } else {
            if (start_music_once && playing_music === undefined) {
                start_music_once = false
                playing_music = a.play('main_song', true, 0.5)
            }
        }
 
    }

    t += delta

    if (drag.is_hovering) {
        cursor = drag.is_hovering

        if (drag_block) {
            let x = cursor[0] + drag_block[1][0]
            let y = cursor[1] + drag_block[1][1]

            block_pixel_perfect_lerp(drag_block[0], x, y, delta)
        } else {
            blocks.forEach(block => {
                block.is_hovering = false
                if (box_intersect(cursor_box(cursor), block_drag_box(block))) {
                    block.is_hovering = true
                }
            })
        }

        if (box_intersect(cursor_box(drag.is_hovering), _music_box)) {
            tag_anim(music_anim, playing_music === undefined ? 'off_hover' :'hover')
        } else {
            tag_anim(music_anim, playing_music === undefined ? 'off': 'idle')
        }
    }

    if (drag.is_down) {
        let is_down = drag.is_down
        if (drag_block === undefined) {
            blocks.forEach(block => {
                let decay = cursor_hit_decay(block_drag_box(block), is_down)

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

function updateSpring(position: XYWH, target: XY, stiffness = 0.2) {
  // Move part of the way toward the target (constraint resolution)
  position[0] += (target[0] - position[0]) * stiffness;
  position[1] += (target[1] - position[1]) * stiffness;
}

function grid_collide(xywh: XYWH) {

    let res: Block[] = []
    for (let x = 0; x <  xywh[2]; x++) {
        for (let y = 0; y < xywh[3]; y++) {
            let [i, j] = pos_to_ij(xywh[0] + x, xywh[1] + y, 0, 0)
            if (i < 0 || i >= _grid_bounds[2]) {
                return 'edge'
            }
            if (j < 0 || j >= _grid_bounds[3]) {
                return 'edge'
            }
            let g = grid[grid_ij_key(i, j)]
            if (g !== undefined && !res.includes(g)) {
                res.push(g)
            }
        }
    }
    return res
}

function block_pixel_perfect_lerp(block: Block, x: number, y: number, delta: number) {


    let dx = appr(block.pos[0] + block.pos[2], x, delta) - block.pos[0]

    dx *= 0.8

    let t = Math.abs(dx)
    let a = Math.floor(t)

    let step = Math.sign(dx) * Math.min(a, 2)

    block.pos[2] = t - a

    for (let i = 0; i < a; i+= Math.abs(step)) {
        block.pos[0] += step

        let c = grid_collide(block_box(block))
        if (c === 'edge' || !(c.length === 0 || (c.length === 1 && c[0] === block))) {
            block.pos[0] -= step
            break
        }
    }
    
    let dy = appr(block.pos[1] + block.pos[3], y, delta) - block.pos[1]
    dy *= 0.8

    t = Math.abs(dy)
    a = Math.floor(t)

    step = Math.sign(dy) * Math.min(a, 2)

    block.pos[3] = t - a

    for (let i = 0; i < a; i+= Math.abs(step)) {
        block.pos[1] += step

        let c = grid_collide(block_box(block))
        if (c === 'edge' || !(c.length === 0 || (c.length === 1 && c[0] === block))) {
            block.pos[1] -= step
            break
        }
    }

    let key = grid.indexOf(block)
    let [new_i, new_j] = pos_to_ij(...block_box(block))

    let new_key = grid_ij_key(new_i, new_j)
    console.log(new_i, new_j)
    if (key !== new_key) {
        grid[key] = undefined

        if (block.wh[0] === 2 && block.wh[1] === 1) {
            grid[key + 1] = undefined
        }


        if (block.wh[0] === 1 && block.wh[1] === 2) {
            grid[key + _grid_bounds[2]] = undefined
        }
        if (block.wh[0] === 2 && block.wh[1] === 2) {
            grid[key + _grid_bounds[2]] = undefined
            grid[key + 1] = undefined
            grid[key + _grid_bounds[2] + 1] = undefined
        }



        grid[new_key] = block

        if (block.wh[0] === 2 && block.wh[1] === 1) {
            grid[new_key + 1] = block
        }

        if (block.wh[0] === 1 && block.wh[1] === 2) {
            grid[new_key + _grid_bounds[2]] = block
        }

        if (block.wh[0] === 2 && block.wh[1] === 2) {
            grid[new_key + _grid_bounds[2]] = block
            grid[new_key + 1] = block
            grid[new_key + _grid_bounds[2] + 1] = block
        }


        console.log(grid)


    }
}


export function _render() {

    g.clear()

    let bo = blocks.filter(_ => _.wh[0] === 2 && _.wh[1] === 2)
    render_block_background_stencil(bo, 368, 0)


    let b0 = blocks.filter(_ => _.wh[0] === 1 && _.wh[1] === 2)
    render_block_background_stencil(b0, 448, 0)

    let b1 = blocks.filter(_ => _.wh[0] === 1 && _.wh[1] === 1)
    render_block_background_stencil(b1, 216, 0)

    let b2 = blocks.filter(_ => _.wh[0] === 2 && _.wh[1] === 1)
    render_block_background_stencil(b2, 296, 0)

    g.begin_render()

    //render_background_in_stencil()
    render_edges()

    render_animations(g)
    render_cursor()


    g.end_render()

    f.clear()

    f.text('1-1.', _grid_bounds[0] * 4 + _grid_bounds[2] * 16 * 4, 32, 64, '#dff6f5', 'right')
    f.text('Right', 10 + _grid_bounds[0] * 4 + _grid_bounds[2] * 16 * 4, 32, 64, '#f4b41b', 'left')
}

function render_edges() {

    g.draw(_grid_bounds[0] - 8, _grid_bounds[1] - 8, 11, 11, 272, 64, false)
    for (let i = 0; i < _grid_bounds[2] * 32 / 11; i++) {
        g.draw(_grid_bounds[0] + i * 11, _grid_bounds[1] - 8, 11, 11, 272 + 11, 64, false)
    }

    g.draw(_grid_bounds[0] + _grid_bounds[2] * 32, _grid_bounds[1]- 8, 11, 11, 272 + 11 + 11, 64, false)
    for (let i = 0; i < _grid_bounds[3] * 32 / 11; i++) {
        g.draw(_grid_bounds[0] - 8 , _grid_bounds[1] + i * 11, 11, 11, 272, 64 + 11, false)
    }
    for (let i = 0; i < _grid_bounds[3] * 32 / 11; i++) {
        g.draw(_grid_bounds[0] + _grid_bounds[2] * 32, _grid_bounds[1] + i * 11, 11, 11, 272 + 11 + 11, 64 + 11, false)
    }
    for (let i = 0; i < _grid_bounds[2] * 32 / 11; i++) {
        g.draw(_grid_bounds[0] + i * 11, _grid_bounds[1] + _grid_bounds[3] * 32, 11, 11, 272 + 11, 64 + 11 + 11, false)
    }

    //bottom left
    g.draw(_grid_bounds[0] + _grid_bounds[2] * 32, _grid_bounds[1] + _grid_bounds[3] * 32, 11, 11, 272 + 11 + 11, 64 + 11 + 11, false)
    g.draw(_grid_bounds[0] - 8, _grid_bounds[1] + _grid_bounds[3] * 32, 11, 11, 272, 64 + 11 + 11, false)



}

function render_block_background_stencil(blocks: Block[], sx: number, sy: number) {
    g.begin_stencil()

    g.begin_render()
    blocks.forEach(block => {
        let [x, y, w, h] = block_box(block)
        g.draw(x, y, w, h, 0, 0, false)
    })
    g.end_render()

    g.begin_stencil_bg()


    g.begin_render()

    render_background_in_stencil(sx, sy)

    g.end_render()


    g.end_stencil()

}

function render_background_in_stencil(sx: number, sy: number) {

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
            
            g.draw(x - gap, y - gap, 64, 64, sx, sy, false);
        }
    }

}

function render_cursor() {


    blocks.forEach(block => {
        if (block.is_hovering) {
            //g.draw(...block_drag_box(block), 296, 0, false)
        }
    })


    g.draw(...cursor, 20, 20, 0, 0, false)
}

