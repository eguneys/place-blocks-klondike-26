import { XY } from "./util"

let debug = false

export const Yellow = 1
export const Blue = 2
export const Green = 3
export const Red = 4

export type Tile = typeof Yellow | typeof Blue | typeof Green | typeof Red

export const Width = 22
export const Height = 14

export function ij2key(i: number, j: number) {
    return i + j * Width
}
export function key2ij(key: number): XY {
    return [key % Width, Math.floor(key / Width)]
}

export type Block = {
    tile: Tile
    xy: XY
    wh: XY
}

export function yellow_block(x: number, y: number): Block {
   return {
       xy: [x, y],
        wh: [1, 1],
        tile: Yellow
    }
}
export function blue_block(x: number, y: number): Block {
    return {
       xy: [x, y],
        wh: [2, 1],
        tile: Blue
    }
}

export function green_block(x: number, y: number): Block {
    return {
       xy: [x, y],
        wh: [1, 2],
        tile: Green
    }
}

export function red_block(x: number, y: number): Block {
    return {
       xy: [x, y],
        wh: [2, 2],
        tile: Red
    }
}

export function neighbor_tiles(x: number, y: number, wh: XY): XY[] {
    let res: XY[] = []
    function push_xy(x: number, y: number) {
        res.push([x, y])
    }
    /*
     o
    o.
    */
    push_xy(x - 1, y)
    push_xy(x, y - 1)
    push_xy(x - 1, y + 1)
    push_xy(x + 1, y - 1)

    if (wh[0] === 1 &&  wh[1] === 1) {
        /*
        x
       x.o
        o
        */
        push_xy(x + 2, y)
        push_xy(x + 2, y + 1)
        push_xy(x, y + 2)
        push_xy(x + 1, y + 2)
    }

    if (wh[0] === 2 && wh[1] === 1) {
        /*
        xo
       x..o
        oo

       */
        push_xy(x, y + 2)
        push_xy(x + 1, y + 2)
        push_xy(x + 4, y)
        push_xy(x + 4, y + 1)
        push_xy(x + 2, y - 1)
        push_xy(x + 3, y - 1)
        push_xy(x + 2, y + 2)
        push_xy(x + 3, y + 2)
    }
    if (wh[0] === 1 && wh[1] === 2) {
        /*
        x
       x.o
       o.o
        o
        */
        push_xy(x + 2, y)
        push_xy(x + 2, y + 1)
        push_xy(x + 2, y + 2)
        push_xy(x + 2, y + 3)
        push_xy(x - 1, y + 2)
        push_xy(x - 1, y + 3)
        push_xy(x, y + 4)
        push_xy(x + 1, y + 4)
    }
    if (wh[0] === 2 && wh[1] === 2) {
        /*
         xo
        x..o
        o..o
         oo
        */
        push_xy(x + 4, y)
        push_xy(x + 4, y + 1)
        push_xy(x + 4, y + 2)
        push_xy(x + 4, y + 3)
        push_xy(x + 2, y + 4)
        push_xy(x + 3, y + 4)
        push_xy(x, y + 4)
        push_xy(x + 1, y + 4)
        push_xy(x - 1, y + 2)
        push_xy(x - 1, y + 3)

        push_xy(x + 2, y - 1)
        push_xy(x + 3, y - 1)
    }
    return res
}

export function block_tiles(x: number, y: number, wh: XY): XY[] {
    let res: XY[] = []
    function push_xy(x: number, y: number) {
        res.push([x, y])
        res.push([x + 1, y])
        res.push([x, y + 1])
        res.push([x + 1, y + 1])
    }
    push_xy(x, y)
    if (wh[0] === 2 && wh[1] === 1) {
        push_xy(x + 2, y)
    }
    if (wh[0] === 1 && wh[1] === 2) {
        push_xy(x, y + 2)
    }
    if (wh[0] === 2 && wh[1] === 2) {
        push_xy(x + 2, y)
        push_xy(x, y + 2)
        push_xy(x + 2, y + 2)
    }
    return res
}

export class Ground {

    tiles: (Block | undefined)[]
    blocks: Block[]

    constructor() {
        this.blocks = []
        this.tiles = []
    }

    add_block(tile: Tile, x: number, y: number) {
        let block = tile === Red ? red_block(x, y) :
            tile === Yellow ? yellow_block(x, y) :
                tile === Green ? green_block(x, y) :
                    blue_block(x, y)
        this.blocks.push(block)
        block_tiles(x, y, block.wh).map(_ => ij2key(..._)).forEach(key => 
            this.tiles[key] = block
        )
    }

    move_block(block: Block, x: number, y: number) {
        block_tiles(...block.xy, block.wh).map(_ => ij2key(..._)).forEach(key =>
            this.tiles[key] = undefined
        )
        block_tiles(x, y, block.wh).map(_ => ij2key(..._)).forEach(key =>
            this.tiles[key] = block
        )
        block.xy = [x, y]
    }

    key_new_key(key: number, new_key: number) {
        this.move_block(this.tiles[key]!, ...key2ij(new_key))
    }

    get_blocks(xys: XY[]) {
        return [...new Set(xys.map(_ => this.tiles[ij2key(..._)]))]
    }
    get_block(xy: XY) {
        return this.tiles[ij2key(...xy)]
    }

}



export type RuleProgress = (ground: Ground) => number

export type Rule = {
    icon: string,
    color?: Tile,
    progress: RuleProgress
}

export type Level = {
    world: XY
    name: string
    ground: Ground
    rules: Rule[]
}


export let levels: (() => Level)[] = [


    init_level1,
    init_level2,
    init_level3,
    init_level4,
    init_level5,
    init_level6,
    init_level7,
    init_level_b1,
    init_level_b2,

    init_level_c1,
    init_level_c2,
    init_level_c3,

    init_level_d1,
    init_level_d2,
    init_level_d3,
    init_level_d4,


    init_level_d5,
    init_level_d6,
    init_level_d7,
]


export function init_level_d6(): Level {

    let ground = new Ground()

    ground.add_block(Red, 0, 8)
    ground.add_block(Red, 10, 8)
    ground.add_block(Red, 16, 8)
    ground.add_block(Red, 6, 2)
    ground.add_block(Green, 10, 2)
    ground.add_block(Green, 12, 2)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 2, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 6, 0)

    ground.add_block(Green, 0, 2)
    ground.add_block(Green, 2, 2)
    ground.add_block(Green, 4, 2)

    ground.add_block(Green, 4, 8)
    ground.add_block(Green, 6, 8)
    ground.add_block(Green, 8, 8)

    ground.add_block(Green, 14, 2)
    ground.add_block(Green, 16, 2)


    ground.add_block(Green, 18, 2)

    ground.add_block(Blue, 0, 12)
    ground.add_block(Blue, 18, 12)
    ground.add_block(Blue, 18, 0)


    ground.add_block(Blue, 0, 6)
    ground.add_block(Blue, 4, 6)
    ground.add_block(Blue, 8, 6)
    ground.add_block(Blue, 12, 6)
    ground.add_block(Blue, 16, 6)

    ground.add_block(Yellow, 4, 12)
    ground.add_block(Yellow, 6, 12)
    ground.add_block(Yellow, 8, 12)
    ground.add_block(Yellow, 10, 12)
    ground.add_block(Yellow, 12, 12)

    ground.add_block(Green, 14, 8)
    ground.add_block(Green, 20, 8)

    ground.add_block(Yellow, 12, 0)
    ground.add_block(Yellow, 14, 0)
    ground.add_block(Yellow, 16, 0)


    ground.add_block(Yellow, 20, 2)
    ground.add_block(Yellow, 20, 4)
    ground.add_block(Yellow, 20, 6)


    let rules: Rule[] = [{
        icon: 'on_the_floor',
        color: Green,
        progress: RULE_on_floor(Green)
    }]

    rules.push({
        icon: 'corners',
        color: Green,
        progress: RULE_corners4(Green)
    })

    if (debug) {
        rules = []
    }

    return {
        name: 'Floor Corners',
        world: [3, 5],
        ground,
        rules
    }

}



export function init_level_d7(): Level {

    let ground = new Ground()

    ground.add_block(Red, 0, 8)
    ground.add_block(Red, 10, 8)
    ground.add_block(Red, 16, 8)
    ground.add_block(Red, 6, 2)
    ground.add_block(Green, 10, 2)
    ground.add_block(Green, 12, 2)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 2, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 6, 0)

    ground.add_block(Green, 0, 2)
    ground.add_block(Green, 2, 2)
    ground.add_block(Green, 4, 2)

    ground.add_block(Green, 4, 8)
    ground.add_block(Green, 6, 8)
    ground.add_block(Green, 8, 8)

    ground.add_block(Green, 14, 2)
    ground.add_block(Green, 16, 2)


    ground.add_block(Green, 18, 2)

    ground.add_block(Blue, 0, 12)
    ground.add_block(Blue, 18, 12)
    ground.add_block(Blue, 18, 0)


    ground.add_block(Blue, 0, 6)
    ground.add_block(Blue, 4, 6)
    ground.add_block(Blue, 8, 6)
    ground.add_block(Blue, 12, 6)
    ground.add_block(Blue, 16, 6)

    ground.add_block(Yellow, 4, 12)
    ground.add_block(Yellow, 6, 12)
    ground.add_block(Yellow, 8, 12)
    ground.add_block(Yellow, 10, 12)
    ground.add_block(Yellow, 12, 12)

    ground.add_block(Green, 14, 8)
    ground.add_block(Green, 20, 8)

    ground.add_block(Yellow, 12, 0)
    ground.add_block(Yellow, 14, 0)
    ground.add_block(Yellow, 16, 0)


    ground.add_block(Yellow, 20, 2)
    ground.add_block(Yellow, 20, 4)
    ground.add_block(Yellow, 20, 6)


    let rules: Rule[] = [{
        icon: 'square',
        color: Red,
        progress: RULE_square(Red)
    }]

    rules.push({
        icon: 'corners',
        color: Yellow,
        progress: RULE_corners4(Yellow)
    })

    if (debug) {
        rules = []
    }

    return {
        name: 'Corners Square',
        world: [3, 6],
        ground,
        rules
    }

}



export function init_level_d5(): Level {

    let ground = new Ground()

    ground.add_block(Red, 0, 8)
    ground.add_block(Red, 10, 8)
    ground.add_block(Red, 16, 8)
    ground.add_block(Red, 6, 2)
    ground.add_block(Red, 10, 2)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 2, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 6, 0)

    ground.add_block(Green, 0, 2)
    ground.add_block(Green, 2, 2)
    ground.add_block(Green, 4, 2)

    ground.add_block(Green, 4, 8)
    ground.add_block(Green, 6, 8)
    ground.add_block(Green, 8, 8)

    ground.add_block(Blue, 14, 2)
    ground.add_block(Blue, 14, 4)


    ground.add_block(Blue, 18, 2)
    ground.add_block(Blue, 18, 4)

    ground.add_block(Blue, 0, 12)
    ground.add_block(Blue, 18, 12)
    ground.add_block(Blue, 18, 0)


    ground.add_block(Blue, 0, 6)
    ground.add_block(Blue, 4, 6)
    ground.add_block(Blue, 8, 6)
    ground.add_block(Blue, 12, 6)
    ground.add_block(Blue, 16, 6)

    ground.add_block(Yellow, 4, 12)
    ground.add_block(Yellow, 6, 12)
    ground.add_block(Yellow, 8, 12)
    ground.add_block(Yellow, 10, 12)
    ground.add_block(Yellow, 12, 12)


    ground.add_block(Yellow, 14, 10)
    ground.add_block(Yellow, 20, 8)
    ground.add_block(Yellow, 20, 10)

    ground.add_block(Yellow, 10, 0)
    ground.add_block(Yellow, 12, 0)
    ground.add_block(Yellow, 14, 0)
    ground.add_block(Yellow, 16, 0)




    let rules: Rule[] = [{
        icon: 'square',
        color: Yellow,
        progress: RULE_square(Yellow)
    }]

    if (debug) {
        rules = []
    }

    return {
        name: 'Square',
        world: [3, 4],
        ground,
        rules
    }
}


export function init_level_d4(): Level {

    let ground = new Ground()

    ground.add_block(Red, 0, 8)
    ground.add_block(Red, 10, 8)
    ground.add_block(Red, 16, 8)
    ground.add_block(Red, 6, 2)
    ground.add_block(Red, 10, 2)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 2, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 6, 0)

    ground.add_block(Green, 0, 2)
    ground.add_block(Green, 2, 2)
    ground.add_block(Green, 4, 2)

    ground.add_block(Green, 4, 8)
    ground.add_block(Green, 6, 8)
    ground.add_block(Green, 8, 8)

    ground.add_block(Blue, 14, 2)
    ground.add_block(Blue, 14, 4)


    ground.add_block(Blue, 18, 2)
    ground.add_block(Blue, 18, 4)

    ground.add_block(Blue, 0, 12)
    ground.add_block(Blue, 18, 12)
    ground.add_block(Blue, 18, 0)


    ground.add_block(Blue, 0, 6)
    ground.add_block(Blue, 4, 6)
    ground.add_block(Blue, 8, 6)
    ground.add_block(Blue, 12, 6)
    ground.add_block(Blue, 16, 6)

    ground.add_block(Blue, 4, 12)
    ground.add_block(Blue, 8, 12)
    ground.add_block(Blue, 12, 12)

    ground.add_block(Yellow, 14, 8)
    ground.add_block(Yellow, 14, 10)
    ground.add_block(Yellow, 20, 8)
    ground.add_block(Yellow, 20, 10)


    let rules: Rule[] = [{
        icon: 'no_group',
        color: Green,
        progress: RULE_no_group(Green)
    }]

    if (debug) {
        rules = []
    }

    return {
        name: 'Green',
        world: [3, 3],
        ground,
        rules
    }
}


export function init_level_d3(): Level {

    let ground = new Ground()

    ground.add_block(Red, 0, 8)
    ground.add_block(Red, 10, 8)
    ground.add_block(Red, 16, 8)
    ground.add_block(Red, 6, 2)
    ground.add_block(Red, 10, 2)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 2, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 6, 0)

    ground.add_block(Green, 0, 2)
    ground.add_block(Green, 2, 2)
    ground.add_block(Green, 4, 2)

    ground.add_block(Green, 4, 8)
    ground.add_block(Green, 6, 8)
    ground.add_block(Green, 8, 8)

    ground.add_block(Blue, 14, 2)
    ground.add_block(Blue, 14, 4)


    ground.add_block(Blue, 18, 2)
    ground.add_block(Blue, 18, 4)

    ground.add_block(Blue, 0, 12)
    ground.add_block(Blue, 18, 12)
    ground.add_block(Blue, 18, 0)


    ground.add_block(Blue, 0, 6)
    ground.add_block(Blue, 4, 6)
    ground.add_block(Blue, 8, 6)
    ground.add_block(Blue, 12, 6)
    ground.add_block(Blue, 16, 6)

    ground.add_block(Blue, 4, 12)
    ground.add_block(Blue, 8, 12)
    ground.add_block(Blue, 12, 12)

    ground.add_block(Yellow, 14, 8)
    ground.add_block(Yellow, 14, 10)
    ground.add_block(Yellow, 20, 8)
    ground.add_block(Yellow, 20, 10)


    let rules: Rule[] = [{
        icon: 'one_group',
        color: Red,
        progress: RULE_one_group(Red)
    }]

    if (debug) {
        rules = []
    }

    return {
        name: 'Group',
        world: [3, 2],
        ground,
        rules
    }
}




export function init_level_d2(): Level {

    let ground = new Ground()

    ground.add_block(Red, 0, 8)
    ground.add_block(Red, 10, 8)
    ground.add_block(Red, 16, 8)
    ground.add_block(Red, 6, 2)
    ground.add_block(Red, 10, 2)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 2, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 6, 0)

    ground.add_block(Green, 0, 2)
    ground.add_block(Green, 2, 2)
    ground.add_block(Green, 4, 2)

    ground.add_block(Green, 4, 8)
    ground.add_block(Green, 6, 8)
    ground.add_block(Green, 8, 8)

    ground.add_block(Blue, 14, 2)
    ground.add_block(Blue, 14, 4)


    ground.add_block(Blue, 18, 2)
    ground.add_block(Blue, 18, 4)

    ground.add_block(Blue, 0, 12)
    ground.add_block(Blue, 18, 12)
    ground.add_block(Blue, 18, 0)



    let rules: Rule[] = [{
        icon: 'corners',
        color: Yellow,
        progress: RULE_corners4(Yellow)
    }]

    rules.push({
        icon: 'one_group',
        color: Red,
        progress: RULE_one_group(Red)
    })

    rules.push({
        icon: 'one_group',
        color: Blue,
        progress: RULE_one_group(Blue)
    })

    rules.push({
        icon: 'one_group',
        color: Green,
        progress: RULE_one_group(Green)
    })



    if (debug) {
        rules = []
    }





    return {
        name: 'Yellow and Groups',
        world: [3, 1],
        ground,
        rules
    }
}



export function init_level_d1(): Level {

    let ground = new Ground()

    ground.add_block(Red, 0, 8)
    ground.add_block(Red, 10, 8)
    ground.add_block(Red, 16, 8)
    ground.add_block(Red, 6, 2)
    ground.add_block(Red, 10, 2)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 2, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 6, 0)

    ground.add_block(Green, 0, 2)
    ground.add_block(Green, 2, 2)
    ground.add_block(Green, 4, 2)

    ground.add_block(Green, 4, 8)
    ground.add_block(Green, 6, 8)
    ground.add_block(Green, 8, 8)

    ground.add_block(Blue, 14, 2)
    ground.add_block(Blue, 14, 4)


    ground.add_block(Blue, 18, 2)
    ground.add_block(Blue, 18, 4)

    ground.add_block(Blue, 0, 12)
    ground.add_block(Blue, 18, 12)
    ground.add_block(Blue, 18, 0)



    let rules: Rule[] = [{
        icon: 'corners',
        color: Yellow,
        progress: RULE_corners4(Yellow)
    }]

    return {
        name: 'Yellow',
        world: [2, 5],
        ground,
        rules
    }
}

export function init_level_c3(): Level {


    let ground = new Ground()

    ground.add_block(Red, 0, 8)
    ground.add_block(Red, 10, 8)
    ground.add_block(Red, 16, 8)
    ground.add_block(Red, 5, 2)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 2, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 6, 0)
    ground.add_block(Yellow, 8, 0)
    ground.add_block(Yellow, 10, 0)
    ground.add_block(Yellow, 12, 0)
    ground.add_block(Yellow, 14, 0)
    ground.add_block(Yellow, 16,0)
    ground.add_block(Yellow, 18,0)
    ground.add_block(Yellow, 20,0)



    let rules: Rule[] = [{
        icon: 'on_the_floor',
        progress: RULE_on_floor(undefined)
    }]


    rules.push({
        icon: 'no_group',
        color: Yellow,
        progress: RULE_no_group(Yellow)
    })

    rules.push({
        icon: 'no_group',
        color: Red,
        progress: RULE_no_group(Red)
    })



    return {
        name: 'Group 1 0',
        world: [2, 3],
        ground,
        rules
    }
}




export function init_level_c2(): Level {


    let ground = new Ground()

    ground.add_block(Red, 0, 0)
    ground.add_block(Red, 9, 0)
    ground.add_block(Red, 16, 0)

    ground.add_block(Blue, 0, 12)
    ground.add_block(Blue, 4, 12)
    ground.add_block(Blue, 8, 12)
    ground.add_block(Blue, 12, 12)
    ground.add_block(Blue, 16,12)



    let rules: Rule[] = [{
        icon: 'one_group',
        color: Red,
        progress: RULE_one_group(Red)
    }]


    rules.push({
        icon: 'no_group',
        color: Blue,
        progress: RULE_no_group(Blue)
    })

    return {
        name: 'Group 1 0',
        world: [2, 1],
        ground,
        rules
    }
}



export function init_level_c1(): Level {


    let ground = new Ground()

    ground.add_block(Red, 7, 2)
    ground.add_block(Red, 7, 6)
    ground.add_block(Red, 11, 4)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 4, 0)
    ground.add_block(Yellow, 8, 0)
    ground.add_block(Yellow, 12, 0)
    ground.add_block(Yellow, 16,0)



    let rules: Rule[] = [{
        icon: 'no_center',
        color: Red,
        progress: RULE_not_center(Red)
    }]

    rules.push({
        icon: 'no_top',
        color: Yellow,
        progress: RULE_n_top(Yellow)
    })



    return {
        name: 'Top Center',
        world: [2, 4],
        ground,
        rules
    }
}



export function init_level_b1(): Level {


    let ground = new Ground()

    for (let i = 1; i < 21; i+=3) {

        for (let j = 1; j < 12; j += 3) {
            ground.add_block(Yellow, i, j + (i % 2 === 0 ? 1 : 0))
        }
    }

    let rules: Rule[] = [{
        icon: 'one_group',
        color: Yellow,
        progress: RULE_one_group(Yellow)
    }]



    return {
        name: 'One Group',
        world: [1, 8],
        ground,
        rules
    }
}

export function init_level_b2(): Level {


    let ground = new Ground()

    ground.add_block(Blue, 2, 2)
    ground.add_block(Blue, 7, 2)
    ground.add_block(Blue, 4, 4)

    ground.add_block(Blue, 12, 9)
    ground.add_block(Blue, 16, 9)
    ground.add_block(Blue, 14, 11)

    ground.add_block(Blue, 2, 9)
    ground.add_block(Blue, 7, 9)
    ground.add_block(Blue, 4, 11)

    ground.add_block(Blue, 12, 2)
    ground.add_block(Blue, 16, 2)
    ground.add_block(Blue, 14, 4)




    let rules: Rule[] = [{
        icon: 'no_group',
        color: Blue,
        progress: RULE_no_group(Blue)
    }]



    return {
        name: 'No Group',
        world: [2, 2],
        ground,
        rules
    }
}




function init_level1(): Level {

    let ground = new Ground()

    ground.add_block(Yellow, 2, 4)
    ground.add_block(Red, 0, 0)
    ground.add_block(Blue, 5, 3)
    ground.add_block(Green, 9, 3)



    let rules: Rule[] = [{
        icon: 'right',
        color: Yellow,
        progress: RULE_right(Yellow)
    }]

    return {
        world: [1, 1],
        name: 'Right',
        ground,
        rules
    }
}


export function init_level2(): Level {

    let ground = new Ground()

    ground.add_block(Red, 2, 2)
    ground.add_block(Yellow, 18, 10)
    ground.add_block(Green, 18, 2)
    ground.add_block(Blue, 2, 10)


    let rules: Rule[] = [{
        icon: 'corners',
        progress: RULE_corners4()
    }]


    return {
        world: [1, 2],
        name: 'Corners',
        ground,
        rules
    }
}

export function init_level3(): Level {

    let ground = new Ground()

    ground.add_block(Red, 5, 2)
    ground.add_block(Red, 10, 6)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 20, 0)
    ground.add_block(Yellow, 20, 12)

    let rules: Rule[] = [{
        icon: 'no_top',
        color: Yellow,
        progress: RULE_n_top(Yellow)
    }]

    return {
        name: 'No Top',
        world: [1, 3],
        ground,
        rules
    }
}


export function init_level4(): Level {

    let ground = new Ground()

    ground.add_block(Red, 9, 0)
    ground.add_block(Red, 17, 5)
    ground.add_block(Red, 1, 5)
    ground.add_block(Red, 9, 10)

    ground.add_block(Yellow, 0, 0)
    ground.add_block(Yellow, 20, 0)
    ground.add_block(Yellow, 20, 12)
    ground.add_block(Yellow, 0, 12)


    let rules: Rule[] = [{
        icon: 'corners',
        color: Red,
        progress: RULE_corners4(Red)
    }]

    return {
        name: 'Swap',
        world: [1, 4],
        ground,
        rules
    }
}


export function init_level5(): Level {
    
    let ground = new Ground()

    ground.add_block(Blue, 9, 4)
    ground.add_block(Blue, 11, 6)
    ground.add_block(Green, 7, 4)
    ground.add_block(Yellow, 9, 6)

    let rules: Rule[] = [{
        icon: 'no_center',
        color: Blue,
        progress: RULE_not_center()
    }]

    return {
        name: 'No Center',
        world: [1, 5],
        ground,
        rules
    }
}


export function init_level6(): Level {

    let ground = new Ground()

    ground.add_block(Blue, 15, 4)
    ground.add_block(Blue, 13, 6)
    ground.add_block(Blue, 8,  4)
    ground.add_block(Yellow, 9, 6)
    ground.add_block(Red, 0, 0)
    ground.add_block(Red, 4, 4)

    let rules: Rule[] = [{
        icon: 'on_the_floor',
        color: Blue,
        progress: RULE_on_floor(undefined)
    }]

    return {
        name: 'On floor',
        world: [1, 6],
        ground,
        rules
    }
}

export function init_level7(): Level {

    let ground = new Ground()


    ground.add_block(Red, 12, 6)
    ground.add_block(Red, 6, 6)
    ground.add_block(Red, 1, 6)
    ground.add_block(Yellow, 17, 6)
    ground.add_block(Yellow, 17 + 2, 6)
    ground.add_block(Yellow, 17, 6 + 2)
    ground.add_block(Yellow, 17 + 2, 6 + 2)

    let rules: Rule[] = [{
        icon: '4x4',
        color: Blue,
        progress: RULE_square(undefined)
    }]

    return {
        name: '4x4',
        world: [1, 7],
        ground,
        rules
    }
}




const RULE_right = (tile: Tile) => (ground: Ground) => {
    for (let i = Width - 1; i >= 0; i--) {
        for (let j = 0; j < Height; j++) {
            let block = ground.get_block([i, j])
            if (block && block.tile === tile) {
                return i / (Width - 1)
            }
        }
    }

    return -1
}


const RULE_corners4 = (tile?: Tile) => (ground: Ground) => {
    ground.blocks


    let greens = tile ? ground.blocks.filter(_ => _?.tile === tile) : ground.blocks

    let corners = [[0, 0], [Width - 1, 0], [0, Height - 1], [Width - 1, Height - 1]]

    let found = greens.filter(_ => {
        if (!_) {
            return false
        }

        let tiles = block_tiles(..._.xy, _.wh)
        return tiles.filter(_ =>
            corners.find(c => c[0] === _[0] && c[1] === _[1])
        ).length > 0
    })

    return found.length / 4

}


const RULE_n_top = (tile: Tile) => (ground: Ground) => {

        let blues = ground.blocks.filter(_ => _.tile === tile)

        return - blues.filter(_ => block_tiles(..._.xy, _.wh).find(_ => _[1] === 0)).length / blues.length
    }


const RULE_not_center = (tile?: Tile) => (ground: Ground) => {

    let greens = tile ? ground.blocks.filter(_ => _?.tile === tile) : ground.blocks

    let hw = Math.floor(Width / 2) - 2
    let hh = Math.floor(Height / 2) - 2
    let center = block_tiles(hw, hh, [2, 2])

    let found = greens.filter(_ =>
        block_tiles(..._.xy, _.wh).find(_ =>
            center.find(c => c[0] === _[0] && c[1] === _[1])
        )
    )

    return -found.length / center.length

}


const RULE_on_floor = (tile?: Tile) => (ground: Ground) => {

    let greens = tile ? ground.blocks.filter(_ => _?.tile === tile) : ground.blocks

    let found = greens.flatMap(_ => {
        let tiles = block_tiles(..._.xy, _.wh)
        return tiles.filter(_ => _[1] === Height -1)
    })

    return found.length / Width

}


const RULE_square = (tile?: Tile) => (ground: Ground) => {

    let greens = tile ? ground.blocks.filter(_ => _?.tile === tile) : ground.blocks


    let centers = greens.map(_ => [
        ...block_tiles(_.xy[0], _.xy[1], [2, 2]),
        ...block_tiles(_.xy[0] + 4, _.xy[1], [2, 2]),
        ...block_tiles(_.xy[0], _.xy[1] + 4, [2, 2]),
        ...block_tiles(_.xy[0] + 4, _.xy[1] + 4, [2, 2]),
    ])

    let tt = centers.map(center => {

        let mm = greens.flatMap(_ => {
            let tiles = block_tiles(..._.xy, _.wh)
            return tiles.filter(_ => center.find(c => c[0] === _[0] && c[1] === _[1]))
        })


        return mm.length / center.length
    })

    return Math.max(...tt)
}


const RULE_one_group = (tile?: Tile) => (ground: Ground) => {

    let greens = tile ? ground.blocks.filter(_ => _?.tile === tile) : ground.blocks

    let tiles = greens.map(_ => block_tiles(..._.xy, _.wh))

    function gather_neighbor_blocks(block: Block, acc: Block[]) {
        let ns = neighbor_tiles(...block.xy, block.wh)

        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i].some(_ => ns.find(n => n[0] === _[0] && n[1] === _[1]))) {
                if (!acc.includes(greens[i])) {
                    acc.push(greens[i])
                    gather_neighbor_blocks(greens[i], acc)
                }
            }
        }
    }

    let res: Block[][] = []
    for (let i = 0; i < greens.length; i++) {
        let block = greens[i]

        if (res.some(_ => _.includes(block))) {
            continue
        }
        let acc: Block[] = [block]
        res.push(acc)

        gather_neighbor_blocks(block, acc)
    }

    return 1 - (res.length - 1) / greens.length
}


const RULE_no_group = (tile?: Tile) => (ground: Ground) => {

    let greens = tile ? ground.blocks.filter(_ => _?.tile === tile) : ground.blocks

    let tiles = greens.map(_ => block_tiles(..._.xy, _.wh))

    function gather_neighbor_blocks(block: Block, acc: Block[]) {
        let ns = neighbor_tiles(...block.xy, block.wh)

        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i].some(_ => ns.find(n => n[0] === _[0] && n[1] === _[1]))) {
                if (!acc.includes(greens[i])) {
                    acc.push(greens[i])
                    gather_neighbor_blocks(greens[i], acc)
                }
            }
        }
    }

    let res: Block[][] = []
    for (let i = 0; i < greens.length; i++) {
        let block = greens[i]

        if (res.some(_ => _.includes(block))) {
            continue
        }
        let acc: Block[] = [block]
        res.push(acc)

        gather_neighbor_blocks(block, acc)
    }

    return res.length / greens.length
}

