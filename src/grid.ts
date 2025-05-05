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
export const width = 11
export const height = 7

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

    for (let k = 0; k < 10; k++) {
        tiles[ij_to_key(k, 0)] = Yellow
    }
    for (let j = 0; j < 9; j += 2) {
        tiles[ij_to_key(j, 1)] = Blue
    }
    for (let j = 0; j < 9; j += 2) {
        tiles[ij_to_key(j, 2)] = Green
    }
    for (let j = 0; j < 9; j += 2) {
        tiles[ij_to_key(j, 4)] = Red
    }

    let rules: Rules = []

    return {
        tiles,
        rules
    }
}

export function init_level1(): Grid {

    let tiles: Tiles = []

    tiles[ij_to_key(5, 3)] = Yellow

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
        for (let i = 10; i >= 0; i--) {
            for (let j = 0; j < 5; j++) {
                let key = ij_to_key(i, j)
                if (tiles[key] === Yellow) {
                    return i / 10
                }
            }
        }
        return -1
    }
}