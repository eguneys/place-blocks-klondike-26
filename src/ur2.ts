import { DragHandler } from './drag'
import { appr, box_intersect, XY, XYWH } from './util'
import { g } from './webgl/gl_init'
import a from './audio'
import { f } from './canvas'
import { block_tiles, Blue, Green, ij2key, key2ij, Level, levels, Red, Yellow } from './ground'
import { Anim, anim_manager, AnimLoopDefinition, AnimManager } from './anim'
import { rnd_int } from './random'


type Flock = {
    xy: XY
    chill_target: XY
    anim: Anim
    facing: number
}

let flocks: Flock[]

function find_chill_target(): XY {
    let [x, y] = xy_levels[rnd_int(0, xy_levels.length - 1)]

    x += rnd_int(10, 40)
    y += rnd_int(10, 40)

    return [x, y]
}



function make_flock(y: number): Flock {

    let xy: XY = find_chill_target()
    let anim = m_anim.add_anim(464, 96, 16, 16, { flap: '100ms0.0-0,0.0-2,1.0-1', chill: '1.2-2'})

    let res =  {
        xy,
        chill_target: find_chill_target(),
        anim,
        facing: 1
    }

    m_anim.tag_anim(anim, 'flap')
    m_anim.xy_anim(anim, ...xy, false)

    return res
}


let i_transition_in: number
let i_transition_out: number
let t_transition: number

let t_anim: AnimManager


function init_transitions() {

    i_transition_in = 0
    i_transition_out = 0
    t_transition = 0

    transition_anims = []


    flocks = []
}

function begin_transition(transition_out: number, transition_in: number) {
    i_transition_in = transition_in
    i_transition_out = -transition_out
    t_transition = transition_duration * 8

    put_anims_transition_fade_in_out(false)
}

let transition_anims: Anim[]

let transition_duration = 100

function put_anims_transition_fade_in_out(is_fade_in: boolean) {

    transition_anims.forEach(_ => t_anim.remove_anim(_))
    transition_anims = []

    let phase = Math.random() * 12
    let d = transition_duration
    for (let i = 0; i < 40; i++) {
        for (let j = 0; j < 20; j++) {

            let delay = 100 + Math.floor(Math.abs(Math.sin((i + j + phase) * 50)) * 160)
            let fade_out: AnimLoopDefinition = `${delay}ms1.2-2,${d}ms0.0-2,${d}ms1.0-1_1`
            let fade_in: AnimLoopDefinition = `${d}ms1.1-1,${d}ms0.2-2,${d}ms0.1-1,${d}ms0.0-0,${d}ms1.2-2_1`
            let a = t_anim.add_anim(416, 448, 32, 32, { fade_out, fade_in })

            t_anim.tag_anim(a, is_fade_in ? 'fade_in' : 'fade_out')
            t_anim.xy_anim(a, i * 33, -24 + i % 2 * 8 + j * 33, false)
            transition_anims.push(a)
        }
    }
}


let l_anim: AnimManager
let m_anim: AnimManager

type SolveState = 'solved' | 'locked' | 'unlocked'

type LevelInMap = {
    state: SolveState
    xy: XY
    anim: Anim
}

let levels_in_map: LevelInMap[]

const xy_levels: XY[] = [
    [4, 232],
    [0, 176],
    [52, 228],
    [0, 126],
    [106, 220],
    [48, 138],
    [98, 174],
    [47, 180],


    [112, 44],
    [155, 46],
    [79, 0],
    [126, 0],
    [173, 0],
]

const unlocks = [
    [1, 2],
    [3],
    [4],
    [5],
    [6],
    [7],
    [7],

    [8],
    [9, 10],
    [12],
    [11]
]

function make_level_in_map(i: number, state: SolveState): LevelInMap {

    let xy: XY = xy_levels[i]

    let anim = m_anim.add_anim(336, 96, 32, 32, { locked: '0.0-0', unlocked: '600ms0.1-1,200ms0.2-2', solved: '0.3-3' })
    m_anim.tag_anim(anim, state)
    m_anim.xy_anim(anim, ...xy, false)

    return {
        state,
        xy,
        anim,
    }
}

let level_cursor: number
let cursor_anim: Anim

function init_map_levels() {

    let states: SolveState[] = [
        'unlocked',
        'locked',
        'locked',
        'locked',
        'locked',
        'locked',
        'locked',
        'locked',


        'locked',
        'locked',
        'locked',
        'locked',
        'locked',
        'locked',
    ]

    level_cursor = 0
    levels_in_map = []

    for (let i = 0; i < 7; i++) {
        levels_in_map.push(make_level_in_map(i, states[i]))
    }
    for (let i = 7; i < 13; i++) {
        levels_in_map.push(make_level_in_map(i, states[i]))
    }


    cursor_anim = m_anim.add_anim(336, 96, 32, 32, { idle: '200ms1.1-1,100ms1.2-2,1.3-3,100ms1.2-2', disabled: '1.0-0' })


    let selected_level = levels_in_map[level_cursor]
    m_anim.tag_anim(cursor_anim, 'idle')
    m_anim.xy_anim(cursor_anim, ...selected_level.xy, false)
}


function init_level(l: Level) {
    level = l

    blocks.forEach(_ => l_anim.remove_anim(_.anim))

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
        l_anim.remove_anim(_.icon)
    })
    rule_blocks = []


    level.rules.forEach((rule, i) => {

        let icon0 = l_anim.add_anim(0, 232, 32, 32, { 
            zero: '0.0-0',
            right: '0.1-1',  corners: '0.2-2',  no_top: '0.3-3',  no_center: '1.0-0',  
            on_the_floor: '1.1-1',  '4x4': '1.2-2',  
            one_group: '1.3-3',
            no_group: '1.4-4'
        })


        let [x, y] = [i % 2, Math.floor(i / 2)]
        x = rules_box[0] + x * 40 - 2
        y = rules_box[1] + y * 40 - 2
        l_anim.xy_anim(icon0, x, y, false)

        l_anim.tag_anim(icon0, rule.icon)

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

let map_anim: Anim

let _map_box: XYWH = [420, 220, 32, 32]


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
        anim = l_anim.add_anim(88, 0, 32, 32, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    } else if (w === 1 && h === 2) {
        anim = l_anim.add_anim(144, 104, 32, 64, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    } else if (w === 2 && h === 1) {
        anim = l_anim.add_anim(0, 64, 64, 32, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    } else if (w === 2 && h === 2) {
        anim = l_anim.add_anim(0, 168, 64, 64, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    } else {
        anim = l_anim.add_anim(0, 64, 64, 32, { idle: '0.0-0', hover: '500ms0.1-1,200ms0.0-0', drag: '200ms0.0-0,300ms0.2-3' })
    }

    l_anim.tag_anim(anim, 'idle')

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

    levels_in_map[level_cursor].state = 'solved'

    if (unlocks[level_cursor]) {
        unlocks[level_cursor].forEach(_ => {
            if (levels_in_map[_].state === 'locked') {
                levels_in_map[_].state = 'unlocked'
            }
        })
    }

    i_level = -1
    begin_transition(2, 1)
}

function select_level(i: number) {

    if (levels_in_map[i].state === 'locked') {
        return
    }

    i_level = i
    level_completed = false

    drag_block = undefined

    let l1 = levels[i_level]()

    init_level(l1)

    begin_transition(1, 2)
}

function goto_map() {
    i_level = -1
}

export function _init() {
    i_level = -1
    t = 0

    cursor = [0, 0]
    drag = DragHandler(g.canvas)


    l_anim = anim_manager()
    m_anim = anim_manager()

    t_anim = anim_manager()

    blocks = []
    rule_blocks = []

    init_map_levels()

    music_anim = l_anim.add_anim(0, 112, 32, 32, { idle: '0.0-0', hover: '0.1-1', off: '0.2-2', off_hover: '0.3-3' })
    l_anim.tag_anim(music_anim, 'idle')
    l_anim.xy_anim(music_anim, _music_box[0], _music_box[1], false)


    map_anim = l_anim.add_anim(272, 96, 32, 32, { idle: '0.0-0', hover: '0.1-1' })
    l_anim.tag_anim(map_anim, 'idle')
    l_anim.xy_anim(map_anim, _map_box[0], _map_box[1], false)


    init_transitions()
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

    l_anim.xy_anim(block.anim, block.pos[0], block.pos[1], false)
    if (drag_block?.[0] === block) {
        l_anim.tag_anim(block.anim, 'drag')
    } else if (block.is_hovering) {
        l_anim.tag_anim(block.anim, 'hover')
    } else {
        l_anim.tag_anim(block.anim, 'idle')
    }
}

function cursor_hit_decay(block: XYWH, is_down: XY) {
    if (box_intersect(block, [...is_down, 10, 10])) {
        return [is_down[0], is_down[1], block[0] - is_down[0], block[1] - is_down[1]]
    }
}

let start_music_once = true

export function _update(delta: number) {

    t += delta
    if (drag.is_hovering) {
        cursor = drag.is_hovering
    }

    if (i_transition_out !== 0) {
        update_transition(delta)

    } 
    
    if (i_level !== -1) {
        update_gameplay(delta)
    } else {
        update_map(delta)
    }

    drag.update(delta)
}

function update_transition(delta: number) {
    if (t_transition > 0) {

        t_transition = appr(t_transition, 0, delta)

        if (t_transition === 0) {
            if (i_transition_out < 0) {
                i_transition_out = i_transition_in
                put_anims_transition_fade_in_out(true)
                t_transition = 160 * 4
            } else {
                i_transition_out = 0
                i_transition_in = 0
            }
        }
    }

    t_anim.update_animations(delta)
}

function update_map(delta: number) {
    m_anim.update_animations(delta)

    levels_in_map.forEach(_ => update_level_in_map(_, delta))

    if (drag.is_hovering) {
        let hovering = levels_in_map.findIndex(_ => box_intersect(cursor_box(cursor), level_in_map_box(_)))

        if (hovering !== -1) {

        level_cursor = hovering
        }
    }
    if (drag.is_just_down) {
        let clicked = levels_in_map.findIndex(_ => box_intersect(cursor_box(cursor), level_in_map_box(_)))

        if (clicked !== -1) {
            select_level(clicked)
        }
    }

    let selected_level = levels_in_map[level_cursor]
    m_anim.xy_anim(cursor_anim, ...selected_level.xy, false)

    m_anim.tag_anim(cursor_anim, selected_level.state === 'locked' ? 'disabled': 'idle')


    flocks.forEach(_ => update_flock(_, delta))


    if (flocks.length < 20) {
        flocks.push(make_flock(100))
    }

    if (drag.is_hovering) {
        let flyes = flocks.filter(flock => flock.anim.tag === 'chill' && box_intersect(flock_box(flock), cursor_box(cursor)))

        flyes.forEach(_ => _.chill_target = find_chill_target())
    }
}

function flock_box(flock: Flock): XYWH {
    return [flock.xy[0] - 16, flock.xy[1] - 16, 32, 32]
}

function update_flock(flock: Flock, delta: number) {
    if (flock.xy[0] - flock.chill_target[0] === 0 && flock.xy[1] - flock.chill_target[1] === 0) {

        m_anim.tag_anim(flock.anim, 'chill')
    } else {
        m_anim.tag_anim(flock.anim, 'flap')
    }
    flock.xy[0] = appr(flock.xy[0], flock.chill_target[0], 60 * delta/ 1000)
    flock.xy[1] = appr(flock.xy[1], flock.chill_target[1], 60 * delta / 1000)

    if (flock.xy[0] < flock.chill_target[0]) {
        flock.facing = -1
    } else {
        flock.facing = 1
    }

    m_anim.xy_anim(flock.anim, ...flock.xy, flock.facing === 1)
}

function level_in_map_box(l: LevelInMap): XYWH {
    return [...l.xy, 32, 32]
}

function update_level_in_map(l: LevelInMap, _delta: number) {

    let [x, y] = l.xy
    let cos = Math.cos(t * 0.01) * 1
    let sin = Math.sin(t * 0.01) * 0
    m_anim.xy_anim(l.anim, x + cos, y + sin, false)


    if (l.state === 'unlocked') {
        if (l.anim.tag === 'locked') {
            m_anim.tag_anim(l.anim, 'unlocked')
        }
    }
    if (l.state === 'solved') {
        if (l.anim.tag === 'unlocked') {
            m_anim.tag_anim(l.anim, 'solved')
        }
    }
}

function update_music_box() {
    if (drag.is_just_down) {

        if (box_intersect(cursor_box(drag.is_just_down), _map_box)) {
            goto_map()
            begin_transition(2, 1)
        } else if (box_intersect(cursor_box(drag.is_just_down), _music_box)) {
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

    if (drag.is_hovering) {

        if (box_intersect(cursor_box(drag.is_hovering), _music_box)) {
            l_anim.tag_anim(music_anim, playing_music === undefined ? 'off_hover' : 'hover')
        } else {

            l_anim.tag_anim(music_anim, playing_music === undefined ? 'off' : 'idle')
        }

    }
}

function update_gameplay(delta: number) {

    update_music_box()


    if (drag.is_hovering) {

        if (box_intersect(cursor_box(drag.is_hovering), _map_box)) {
            l_anim.tag_anim(map_anim, 'hover')
        } else {
            l_anim.tag_anim(map_anim, 'idle')
        }



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

    l_anim.update_animations(delta)

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
        l_anim.tag_anim(block.icon, rule.icon)
    } else {
        l_anim.tag_anim(block.icon, 'zero')
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

    if (Math.abs(i_transition_out) === 1) {
        render_map()
        render_transition()
        return
    } else if (Math.abs(i_transition_out) === 2) {
        render_level()
        render_transition()
        return
    }

    if (i_level !== -1) {
        render_level()
    } else {
        render_map()
    }

}

function render_transition() {
    g.begin_render()
    t_anim.render_animations(g)
    g.end_render()
}

function render_map() {

    g.clear()

    g.begin_render_bg()

    g.draw(0, 0, 480, 270, 0, 0, false)

    g.end_render()

    g.begin_render()
    m_anim.render_animations(g)
    render_cursor()
    g.end_render()


    f.clear()


}

function render_level() {

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

    l_anim.render_animations(g)

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
        g.draw(x + 4, y + 28, 24, 18, 304, 64,  false)
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


