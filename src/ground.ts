import { XY } from "./util"

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
    blocks: Set<Block>

    constructor() {
        this.blocks = new Set()
        this.tiles = []
    }

    add_block(tile: Tile, x: number, y: number) {
        let block = tile === Red ? red_block(x, y) :
            tile === Yellow ? yellow_block(x, y) :
                tile === Green ? green_block(x, y) :
                    blue_block(x, y)
        this.blocks.add(block)
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


export const levels: (() => Level)[] = [
    init_level1
]


function init_level1() {

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

    let world: XY = [1, 1]
    return {
        world,
        name: 'Right',
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