import { add_anim, Anim, remove_anim, render_animations, tag_anim, update_animations, xy_anim } from './anim'
import { DragHandler } from './drag'
import { appr, box_intersect, XY, XYWH } from './util'
import { g } from './webgl/gl_init'
import a from './audio'
import { f } from './canvas'
import { block_tiles, Blue, Green, ij2key, key2ij, Level, levels, Red, Yellow } from './ground'

function init_level(l: Level) {
    level = l

    blocks.forEach(_ => remove_anim(_.anim))

    blocks = []
    grid = []

    is_update_progress = true


    for (let block of level.ground.blocks) {
        let tile = block.tile
        let [i, j] = block.xy
        if (tile === Yellow) {
            push_block(i, j, 1, 1)
        }
        if (tile === Green) {
            push_block(i, j, 1, 2)
        }
        if (tile === Blue) {
            push_block(i, j, 2, 1)
        }
        if (tile === Red) {
            push_block(i, j, 2, 2)
        }
    }

    rule_blocks.forEach(_ => {
        remove_anim(_.icon)
    })
    rule_blocks = []


    level.rules.forEach((rule, i) => {

        let icon0 = add_anim(0, 232, 32, 32, { 
            zero: '0.0-0',
            right: '0.1-1',  corners: '0.2-2',  no_top: '0.3-3',  no_center: '1.0-0',  
            on_the_floor: '1.1-1',  '4x4': '1.2-2',  
            one_group: '1.3-3',
            no_group: '1.4-4'
        })


        let [x, y] = [i % 2, Math.floor(i / 2)]
        x = rules_box[0] + x * 40 - 2
        y = rules_box[1] + y * 40 - 2
        xy_anim(icon0, x, y, false)

        tag_anim(icon0, rule.icon)

        rule_blocks.push({
            xy: [x, y],
            icon: icon0,
            t_reveal: 0,
            revealed: false,
            i_progress: 0
        })
    })


    world = level.world
    name = level.name
}


let level: Level

type RuleBlock = {
    xy: XY,
    icon: Anim
    t_reveal: number
    revealed: boolean
    i_progress: number
}

let rule_blocks: RuleBlock[]

let rules_box: XYWH = [404, 20, 0, 0]


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

let _grid_bounds: XYWH = [40, 32, 22, 14]

function pos_to_ij(x: number, y: number, _w: number, _h: number): XY {
    return [Math.floor((x - _grid_bounds[0]) / 16), Math.floor((y - _grid_bounds[1]) / 16)]
}

function ij_to_pos(i: number, j: number): XY {
    return [_grid_bounds[0] + i * 16, _grid_bounds[1] + j * 16]
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

    let [x, y] = ij_to_pos(i, j)

    let block: Block = {
        anim,
        pos: [x, y, 0, 0],
        wh: [w, h],
        vel: [0, 0],
        is_hovering: false
    }

    blocks.push(block)


    let gps = block_tiles(i, j, [w, h])

    gps.forEach(_ => grid[ij2key(_[0], _[1])] = block)
}

let world: XY
let name: string

let i_level: number
let level_completed: boolean

let is_update_progress: boolean

function next_level() {

    level_completed = false

    drag_block = undefined

    let l1 = levels[i_level++]()

    init_level(l1)

}

export function _init() {
    i_level = 0
    t = 0
    cursor = [0, 0]
    drag = DragHandler(g.canvas)

    blocks = []
    rule_blocks = []

    next_level()

    music_anim = add_anim(0, 112, 32, 32, { idle: '0.0-0', hover: '0.1-1', off: '0.2-2', off_hover: '0.3-3' })
    tag_anim(music_anim, 'idle')
    xy_anim(music_anim, _music_box[0], _music_box[1], false)
}
let music_anim: Anim

function block_drag_box(block: Block): XYWH {
    return [block.pos[0] + 1, block.pos[1] + 1, 30 * block.wh[0], 30 * block.wh[1]]
}

function block_collide_box(block: Block): XYWH {
    return [block.pos[0] + 4, block.pos[1] + 4, block.wh[0] * 32 - 8, block.wh[1] * 32 - 8]
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
        let block_target_pos = ij_to_pos(...key2ij(grid.indexOf(block)))
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

    rule_blocks.forEach((block, i) => update_rule_block(block, i, delta))

    is_update_progress = false

    if (drag.is_up) {
        if (!level_completed && rule_blocks.every(_ => _.i_progress === 1 || Object.is(-0, _.i_progress))) {
            level_completed = true
        }
    }

    if (level_completed) {
        next_level()
    }

    blocks.forEach(update_block)

    update_animations(delta)

    drag.update(delta)
}


function update_rule_block(block: RuleBlock, i: number, delta: number) {
    let rule = level.rules[i]

    if (is_update_progress) {
        block.i_progress = rule.progress(level.ground)
    }

    if (block.t_reveal === 0 && !block.revealed) {

        if (block.i_progress > 0.5) {
            block.t_reveal = 200
        }
        if (block.i_progress < 0 && block.i_progress > -0.5) {
            block.t_reveal = 200
        }
    }

    if (block.t_reveal > 0) {
        block.t_reveal = appr(block.t_reveal, 0, delta)

        if (block.t_reveal === 0) {
            block.revealed = true
        }
    }


    if (block.revealed) {
        tag_anim(block.icon, rule.icon)
    } else {
        tag_anim(block.icon, 'zero')
    }
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
            let g = grid[ij2key(i, j)]
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

        let c = grid_collide(block_collide_box(block))
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

        let c = grid_collide(block_collide_box(block))
        if (c === 'edge' || !(c.length === 0 || (c.length === 1 && c[0] === block))) {
            block.pos[1] -= step
            break
        }
    }

    let key = grid.indexOf(block)
    let [new_i, new_j] = pos_to_ij(...block_box(block))

    let new_key = ij2key(new_i, new_j)
    if (key !== new_key) {

        let old_poss = block_tiles(...key2ij(key), block.wh)
        let new_poss = block_tiles(new_i, new_j, block.wh)


        old_poss.forEach(_ => grid[ij2key(..._)] = undefined)
        new_poss.forEach(_ => grid[ij2key(..._)] = block)


        level.ground.key_new_key(key, new_key)
        is_update_progress = true
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

    rule_blocks.forEach(block => render_rule_block(block))


    render_cursor()


    g.end_render()

    f.clear()

    let white = '#dff6f5'
    let yellow = '#f4b41b'
    f.text(`${world[0]}-${world[1]}.`, _grid_bounds[0] * 4 + _grid_bounds[2] * 8 * 4, 32, 64, yellow, 'right')
    f.text(name, 10 + _grid_bounds[0] * 4 + _grid_bounds[2] * 8 * 4, 32, 64, white, 'left')
}

function render_rule_block(block: RuleBlock) {

    let [x, y] = block.xy
    if (Object.is(block.i_progress, -0)) {
        for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 5; i++) {
                let o_sx = 4
                let o_sy = 4
                g.draw(x + i * 3 + 4, j * 5 + y + 30, 2, 2, 328 + o_sx, 64 + o_sy, false)
            }
        }
    }else if (block.i_progress < 0) {
        for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 5; i++) {
                let o_sx = (i + j * 5) < -block.i_progress * 16 ? 4: 0
                let o_sy = (i + j * 5) < -block.i_progress * 16 ? 0: 4
                g.draw(x + i * 4 + 7, j * 4 + y + 30, 3, 3, 328 + o_sx, 64 + o_sy, false)
            }
        }
    } else {
        for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 5; i++) {
                let o_sx = (i + j * 5) < block.i_progress * 16 ? 4: 0
                let o_sy = (i + j * 5) < block.i_progress * 16 ? 4: 0
                g.draw(x + i * 4 + 7, j * 4 + y + 30, 3, 3, 328 + o_sx, 64 + o_sy, false)
            }
        }
    }

    if (Object.is(block.i_progress, -0) || block.i_progress === 1) {
        g.draw(x + 4, y + 28, 24, 18, 416, 239,  false)
    }
}

function render_edges() {

    g.draw(_grid_bounds[0] - 8, _grid_bounds[1] - 8, 11, 11, 272, 64, false)
    for (let i = 0; i < _grid_bounds[2] * 16 / 11; i++) {
        g.draw(_grid_bounds[0] + i * 11, _grid_bounds[1] - 8, 11, 11, 272 + 11, 64, false)
    }

    g.draw(_grid_bounds[0] + _grid_bounds[2] * 16, _grid_bounds[1]- 8, 11, 11, 272 + 11 + 11, 64, false)
    for (let i = 0; i < _grid_bounds[3] * 16 / 11; i++) {
        g.draw(_grid_bounds[0] - 8 , _grid_bounds[1] + i * 11, 11, 11, 272, 64 + 11, false)
    }
    for (let i = 0; i < _grid_bounds[3] * 16 / 11; i++) {
        g.draw(_grid_bounds[0] + _grid_bounds[2] * 16, _grid_bounds[1] + i * 11, 11, 11, 272 + 11 + 11, 64 + 11, false)
    }
    for (let i = 0; i < _grid_bounds[2] * 16 / 11; i++) {
        g.draw(_grid_bounds[0] + i * 11, _grid_bounds[1] + _grid_bounds[3] * 16, 11, 11, 272 + 11, 64 + 11 + 11, false)
    }

    //bottom left
    g.draw(_grid_bounds[0] + _grid_bounds[2] * 16, _grid_bounds[1] + _grid_bounds[3] * 16, 11, 11, 272 + 11 + 11, 64 + 11 + 11, false)
    g.draw(_grid_bounds[0] - 8, _grid_bounds[1] + _grid_bounds[3] * 16, 11, 11, 272, 64 + 11 + 11, false)



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
            //g.draw(...block_collide_box(block), 296, 0, false)
        }
    })


    g.draw(...cursor, 20, 20, 0, 0, false)
}


