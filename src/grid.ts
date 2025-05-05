import { XY } from "./util"

export type RuleProgress = (tiles: Tiles) => number

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

export function ij_to_key(i: number, j: number) {
    return i + j * width
}
export function key_to_ij(key: number): XY {
    return [key % width, Math.floor(key / width)]
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
    rules.push(rule1)

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
        for (let i = width - 1; i >= 0; i--) {
            for (let j = 0; j < height; j++) {
                let key = ij_to_key(i, j)
                if (tiles[key] === Yellow) {
                    return i / (width - 1)
                }
            }
        }
        return -1
    }
}