import { XY, XYWH } from "./util"

export type Key = number
export type Progress = number
export type RuleProgress = (tiles: Tiles) => Record<Key, Progress>

export type Rule = {
    name: string,
    icon: string,
    color: string,
    progress: RuleProgress
}

export type Tiles = Tile[]
export type Rules = Rule[]

export type Grid = {
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
    rules.push(rule2)

    return {
        tiles,
        rules
    }
}


export function init_level2(): Grid {

    let tiles: Tiles = []

    for (let j = 0; j < 22; j += 2) {
        tiles[ij_to_key(j, 4)] = Green
    }

    let rules: Rules = []
    rules.push(rule3)

    return {
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

    rules.push(rule1)

    return {
        tiles,
        rules
    }
}


const rule1: Rule = {
    name: 'Right',
    icon: '',
    color: 'yellow',
    progress(tiles: Tiles) {
        let positive: Tiles = [],
        negative: Tiles = [],
        all: Tiles = []
        
        for (let i = width - 1; i >= 0; i--) {
            for (let j = 0; j < height; j++) {
                let key = ij_to_key(i, j)
                if (tiles[key] === Yellow) {
                }
            }
        }

        return [positive, negative, all]
    }
}

const rule2: Rule = {
    name: 'Left',
    icon: '',
    color: 'blue',
    progress(tiles: Tiles) {

        let blocks = tiles_to_blocks(tiles)


        let blues = blocks.filter(_ => _[2] === Blue)


        if (blues.length === 0) {
            return undefined
        }

        return - blues.filter(_ => _[1] === 0).length / blues.length
    }
}

const rule3: Rule = {
    name: 'Gap',
    icon: '',
    color: 'green',
    progress(tiles: Tiles) {

        let blocks = tiles_to_blocks(tiles)


        let greens = blocks.filter(_ => _[2] === Green)


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
}

function tiles_to_blocks(tiles: Tiles) {
    let res: XYWH[] = []
    let skip_tiles: XY[] = []
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

            skip_tiles.push(...poss)
            res.push([...poss[0], tile, 0])
        }
    }
    return res
}

