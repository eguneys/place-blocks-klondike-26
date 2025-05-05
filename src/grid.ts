import { XY, XYWH } from "./util"

export type RuleProgress = (tiles: Tiles) => number | undefined

export type Rule = {
    icon: string,
    color: Tile,
    progress: RuleProgress
}

export type Tiles = Tile[]
export type Rules = Rule[]

export type Grid = {
    world: XY
    name: string
    tiles: Tiles
    rules: Rules
}
export const width = 22
export const height = 14

export const Yellow = 1
export const Blue = 2
export const Green = 3
export const Red = 4

export type Tile = 1 | 2 | 3 | 4

export function tile_wh(tile: Tile): XY {
    if (tile === Yellow) {
        return [1, 1]
    }
    if (tile === Blue) {
        return [2, 1]
    }

   if (tile === Green) {
        return [1, 2]
    }

   if (tile === Red) {
        return [2, 2]
    }
    return [0, 0]
}

export function ij_to_key(i: number, j: number) {
    return i + j * width
}
export function key_to_ij(key: number): XY {
    return [key % width, Math.floor(key / width)]
}

export function block_poss(i: number, j: number, wh: XY) {

    let res: XY[] = []
    function push_tile(i: number, j: number) {
        res.push([i, j])
        res.push([i + 1, j + 1])
        res.push([i + 1, j])
        res.push([i, j + 1])
    }


    push_tile(i, j)

    if (wh[0] === 2 && wh[1] === 1){
        push_tile(i + 2, j)
    }
    if (wh[0] === 1 && wh[1] === 2) {
        push_tile(i, j + 2)
    }
    if (wh[0] === 2 && wh[1] === 2) {
        push_tile(i + 2, j + 2)
        push_tile(i + 2, j)
        push_tile(i, j + 2)
    }

    return res
}


export const levels = [
    init_level2,
    init_level1,
    init_level2,
    init_level3,
    init_level4,
    init_level5,
    init_level6,
    init_level7,
    //init_level_last,
    init_demo_level
]


export function init_demo_level(): Grid {

    let tiles: Tiles = []

    for (let k = 0; k < 20; k+=2) {
        tiles[ij_to_key(k, 0)] = Yellow
    }
    for (let j = 0; j < 18; j += 4) {
        tiles[ij_to_key(j, 2)] = Blue
    }
    for (let j = 0; j < 18; j += 4) {
        tiles[ij_to_key(j, 4)] = Green
    }
    for (let j = 0; j < 18; j += 4) {
        tiles[ij_to_key(j, 8)] = Red
    }

    let rules: Rules = []
    rules.push({
        icon: 'right',
        color: Yellow,
        progress: RULE_right(Yellow)
    })

    return {
        name: 'demo',
        world: [-1, -1],
        tiles,
        rules
    }
}




export function init_level1(): Grid {

    let tiles: Tiles = []


    tiles[ij_to_key(0, 0)] = Red
    tiles[ij_to_key(2, 4)] = Yellow
    tiles[ij_to_key(5, 3)] = Blue
    tiles[ij_to_key(9, 3)] = Green

    let rules: Rules = []

    rules.push({
        icon: 'right',
        color: Yellow,
        progress: RULE_right(Yellow)
    })



    return {
        name: 'Right',
        world: [1, 1],
        tiles,
        rules
    }
}

export function init_level2(): Grid {

    let tiles: Tiles = []

    tiles[ij_to_key(2, 2)] = Red
    tiles[ij_to_key(18, 10)] = Yellow
    tiles[ij_to_key(18, 2)] = Green
    tiles[ij_to_key(2, 10)] = Blue

    let rules: Rules = []
    rules.push({
        icon: 'corners',
        color: Green,
        progress: RULE_corners4(undefined)
    })


    return {
        name: 'Corners',
        world: [1, 2],
        tiles,
        rules
    }
}



export function init_level3(): Grid {

    let tiles: Tiles = []


    tiles[ij_to_key(5, 2)] = Red
    tiles[ij_to_key(10, 6)] = Red


    tiles[ij_to_key(0, 0)] = Yellow
    tiles[ij_to_key(20, 0)] = Yellow
    tiles[ij_to_key(20, 12)] = Yellow

    let rules: Rules = []

    rules.push({
        icon: 'no_top',
        color: Yellow,
        progress: RULE_n_top(Yellow)
    })

    return {
        name: 'No Top',
        world: [1, 3],
        tiles,
        rules
    }
}

export function init_level4(): Grid {

    let tiles: Tiles = []


    tiles[ij_to_key(9, 0)] = Red
    tiles[ij_to_key(17, 5)] = Red
    tiles[ij_to_key(1, 5)] = Red
    tiles[ij_to_key(9, 10)] = Red


    tiles[ij_to_key(0, 0)] = Yellow
    tiles[ij_to_key(20, 0)] = Yellow
    tiles[ij_to_key(20, 12)] = Yellow
    tiles[ij_to_key(0, 12)] = Yellow

    let rules: Rules = []

    rules.push({
        icon: 'corners',
        color: Red,
        progress: RULE_corners4(Red)
    })

    return {
        name: 'Swap',
        world: [1, 4],
        tiles,
        rules
    }
}



export function init_level5(): Grid {

    let tiles: Tiles = []


    tiles[ij_to_key(9, 4)] = Blue
    tiles[ij_to_key(11, 6)] = Blue
    tiles[ij_to_key(7, 4)] = Green
    tiles[ij_to_key(9, 6)] = Yellow
    tiles[ij_to_key(9, 6)] = Yellow

    let rules: Rules = []

    rules.push({
        icon: 'no_center',
        color: Blue,
        progress: RULE_not_center
    })

    return {
        name: 'No Center',
        world: [1, 5],
        tiles,
        rules
    }
}

export function init_level6(): Grid {

    let tiles: Tiles = []


    tiles[ij_to_key(15, 4)] = Blue
    tiles[ij_to_key(13, 6)] = Blue
    tiles[ij_to_key(8, 4)] = Blue
    tiles[ij_to_key(9, 6)] = Yellow
    tiles[ij_to_key(9, 6)] = Yellow
    tiles[ij_to_key(0, 0)] = Red
    tiles[ij_to_key(4, 4)] = Red

    let rules: Rules = []

    rules.push({
        icon: 'on_the_floor',
        color: Blue,
        progress: RULE_on_floor
    })

    return {
        name: 'On floor',
        world: [1, 6],
        tiles,
        rules
    }
}


export function init_level7(): Grid {

    let tiles: Tiles = []


    tiles[ij_to_key(12, 6)] = Red
    tiles[ij_to_key(6, 6)] = Red
    tiles[ij_to_key(1, 6)] = Red
    tiles[ij_to_key(17, 6)] = Yellow
    tiles[ij_to_key(17 + 2, 6)] = Yellow
    tiles[ij_to_key(17, 6 + 2)] = Yellow
    tiles[ij_to_key(17 + 2, 6 + 2)] = Yellow

    let rules: Rules = []

    rules.push({
        icon: '4x4',
        color: Blue,
        progress: RULE_square
    })

    return {
        name: '4x4',
        world: [1, 7],
        tiles,
        rules
    }
}

export function init_level_last(): Grid {

    let tiles: Tiles = []


    tiles[ij_to_key(12, 6)] = Red
    tiles[ij_to_key(6, 6)] = Red
    tiles[ij_to_key(1, 6)] = Red
    tiles[ij_to_key(17, 6)] = Yellow
    tiles[ij_to_key(17 + 2, 6)] = Yellow
    tiles[ij_to_key(17, 6 + 2)] = Yellow
    tiles[ij_to_key(17 + 2, 6 + 2)] = Yellow

    let rules: Rules = []

    rules.push({
        icon: '4x4',
        color: Blue,
        progress: RULE_square
    })

    return {
        name: '4x4',
        world: [1, 6],
        tiles,
        rules
    }
}




const RULE_right = (color: Tile) => (tiles: Tiles) => {
    for (let i = width - 1; i >= 0; i--) {
        for (let j = 0; j < height; j++) {
            let key = ij_to_key(i, j)
            if (tiles[key] === color) {
                return i / (width - 1)
            }
        }
    }
    return undefined
}

const RULE_n_top = (color: Tile) => (tiles: Tiles) => {

        let blocks = tiles_to_blocks(tiles)[0]


        let blues = blocks.filter(_ => _[2] === color)


        if (blues.length === 0) {
            return undefined
        }

        return - blues.filter(_ => _[1] === 0).length / blues.length
    }

    /*
const RULE_gap = (color: Tile) => (tiles: Tiles) => {
    let blocks = tiles_to_blocks(tiles)[0]


    let greens = blocks.filter(_ => _[2] === color)


    if (greens.length === 0) {
        return undefined
    }

    let c = 0
    for (let i = 0; i < greens.length; i++) {
        let a = greens[i]

        for (let j = i + 1; j < greens.length; j++) {
            let b = greens[j]

            if (a[0] + 2 === b[0]) {
                c++
            }
        }
    }

    return - c / greens.length
}
    */


const RULE_corners4 = (color?: Tile) => (tiles: Tiles) => {
    let [_blocks, all] = tiles_to_blocks(tiles)


    let greens = color ? all.filter(_ => _[2] === color) : all


    if (greens.length < 4) {
        return undefined
    }

    let corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]

    let found = greens.filter(_ => corners.find(c => c[0] === _[0] && c[1] === _[1]))

    return found.length / 4

}

const RULE_not_center = (tiles: Tiles) => {
    let [_blocks, all] = tiles_to_blocks(tiles)


    let greens = all


    if (greens.length < 4) {
        return undefined
    }

    let hw = Math.floor(width / 2) - 2
    let hh = Math.floor(height / 2) - 2
    let center = block_poss(hw, hh, [2, 2])

    let found = greens.filter(_ => center.find(c => c[0] === _[0] && c[1] === _[1]))

    return -found.length / center.length

}



const RULE_on_floor = (tiles: Tiles) => {
    let [_blocks, all] = tiles_to_blocks(tiles)


    let greens = all


    if (greens.length < 20) {
        return undefined
    }

    let found = greens.filter(_ => _[1] === height -1)

    return found.length / width

}


const RULE_square = (tiles: Tiles) => {
    let [blocks, all] = tiles_to_blocks(tiles)


    let greens = all


    let centers = blocks.map(_ => [
        ...block_poss(_[0], _[1], [2, 2]),
        ...block_poss(_[0] + 4, _[1], [2, 2]),
        ...block_poss(_[0], _[1] + 4, [2, 2]),
        ...block_poss(_[0] + 4, _[1] + 4, [2, 2]),

        ])

    let tt = centers.map(center => {
        let mm = greens.filter(_ => center.find(c => c[0] === _[0] && c[1] === _[1]))


        return mm.length / center.length
    })

    return Math.max(...tt)
}




function tiles_to_blocks(tiles: Tiles) {
    let res: XYWH[] = []
    let skip_tiles: XYWH[] = []
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {

            if (skip_tiles.find(_ => _[0] === i && _[1] === j)) {
                continue
            }

            let key = ij_to_key(i, j)
            let tile = tiles[key]
            if (!tile) {
                continue
            }

            let wh = tile_wh(tile)
            let poss = block_poss(i, j, wh)

            skip_tiles.push(...poss.map(_ => [..._, tile, 0] as XYWH))
            res.push([...poss[0], tile, 0])
        }
    }
    return [res, skip_tiles]
}

