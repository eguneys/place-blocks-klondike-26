import { GL } from "./webgl/gl_init"

type AnimTag = string

// 0.1-1 
// 0.2-8
type RawAnimDefinition = `${number}.${number}-${number}` | `${number}ms${number}.${number}-${number}`

type AnimDefinition = RawAnimDefinition
    | `${RawAnimDefinition},${RawAnimDefinition}`
    | `${RawAnimDefinition},${RawAnimDefinition},${RawAnimDefinition}`
    | `${RawAnimDefinition},${RawAnimDefinition},${RawAnimDefinition},${RawAnimDefinition}`

type AnimLoopDefinition = AnimDefinition | `${AnimDefinition}_${number}`

export type Anim = {
    x: number
    y: number
    sx: number
    sy: number
    w: number
    h: number
    tag?: AnimTag
    y_frames: Record<AnimTag, Frames>,
    t: number
    i_frame: number
    flip_x: boolean
    theta: number
    options: AnimOptions
}

type Frames = {
    frames: Frame[],
    loop: number
}

type Frame = {
    frame: [number, number],
    duration: number
}

function parse_anim_definition(def_loop: AnimLoopDefinition) {

    let [def, loop] = def_loop.split('_')

    let res: RawAnimDefinition[] = def.split(',') as RawAnimDefinition[]

    function parse_frames(def: RawAnimDefinition) {
        let duration = '100'
        if (def.includes('ms')) {
            [duration, def] = def.split('ms') as [string, RawAnimDefinition]
        }
        let [row, col] = def.split('.')

        let y = parseInt(row)
        let [x_begin, x_end] = col.split('-')

        let frames: Frame[] = []

        for (let x = parseInt(x_begin); x <= parseInt(x_end); x++) {
            frames.push({
                frame: [x, y],
                duration: parseInt(duration)
            })
        }
        return frames
    }

    let frames = res.flatMap(parse_frames)

    return {
        frames,
        loop: loop ? parseInt(loop) : -1
    }

}

type AnimOptions = {
}

export function make_anim(sx: number, sy: number, w: number, h: number, y_frame_defs: Record<AnimTag, AnimLoopDefinition>, options: AnimOptions = {}) {

    let y_frames: Record<AnimTag, Frames> = {}

    for (let tag in y_frame_defs) {
        y_frames[tag] = parse_anim_definition(y_frame_defs[tag])
    }

    let res: Anim = {
        x: 0,
        y: 0,
        sx, sy, w, h,
        y_frames,
        t: 0,
        i_frame: 0,
        flip_x: false,
        theta: 0,
        options
    }
    return res
}

export type AnimManager = {
    add_anim(sx: number, sy: number, w: number, h: number, y_frame_defs: Record<AnimTag, AnimLoopDefinition>, options?: AnimOptions): Anim
    tag_anim(res: Anim, tag: AnimTag): void
    xy_anim(res: Anim, x: number, y: number, flip_x: boolean): void
    remove_anim(anim: Anim): void
    update_animations(delta: number): void
    render_animations(gl: GL): void
}

export function anim_manager(): AnimManager {

    let animations: Anim[] = []

    function add_anim(sx: number, sy: number, w: number, h: number, y_frame_defs: Record<AnimTag, AnimLoopDefinition>, options: AnimOptions = {}) {
        let res = make_anim(sx, sy, w, h, y_frame_defs, options)
        animations.push(res)
        return res
    }

    function tag_anim(res: Anim, tag: AnimTag) {
        if (res.tag === tag) {
            return
        }
        res.tag = tag
        res.i_frame = 0
        res.t = 0
    }

    function xy_anim(res: Anim, x: number, y: number, flip_x: boolean) {
        res.x = x
        res.y = y
        res.flip_x = flip_x
    }

    function remove_anim(anim: Anim) {
        let i = animations.indexOf(anim)
        animations.splice(i, 1)
    }

    function update_animation(anim: Anim, delta: number) {
        if (anim.tag === undefined) {
            return
        }

        let y_frames = anim.y_frames[anim.tag]
        let { frames } = y_frames
        anim.t += delta
        let frame = frames[anim.i_frame]

        while (anim.t > frame.duration) {
            anim.t -= frame.duration
            anim.i_frame += 1

            if (anim.i_frame === frames.length) {

                if (y_frames.loop === 1) {
                    anim.i_frame = frames.length - 1
                } else {
                    y_frames.loop -= 1
                    anim.i_frame = 0
                }
            }
        }
    }

    function render_animation(gl: GL, anim: Anim) {
        if (!anim.tag) {
            return
        }

        let { frame } = anim.y_frames[anim.tag].frames[anim.i_frame]

        let sx = anim.sx + frame[0] * anim.w
        let sy = anim.sy + frame[1] * anim.h

        gl.draw(anim.x, anim.y, anim.w, anim.h, sx, sy, anim.flip_x, anim.theta)
    }

    function update_animations(delta: number) {
        animations.forEach(_ => update_animation(_, delta))
    }

    function render_animations(gl: GL) {
        animations.forEach(_ => render_animation(gl, _))
    }


    return {
        add_anim,
        remove_anim,
        tag_anim,
        xy_anim,
        update_animations,
        render_animations
    }
}