import type { Block } from '../core/iso'

// 블록으로 조립한 가구. 층이 달라져도 다시 쓴다.
// x·y·w·d는 바닥에서 차지하는 자리다. 겹침 검사와 그림자에 쓴다.
export type Furniture = { name: string; x: number; y: number; w: number; d: number; blocks: Block[] }

export const PALETTE = {
  deskTop: 0x4a4f58,
  deskLeg: 0x2e3238,
  monitor: 0x23262b,
  screen: 0x7cc7ea,
  chair: 0x34383f,
  paper: 0xf6f3ea,
  mug: 0xd9583f,
  table: 0xc9783f,
  tableLeg: 0x6e4526,
  cabinet: 0xa8743f,
  cabinetLine: 0x7d5329,
  board: 0xf4f6f7,
  boardFrame: 0x9aa3ad,
  boardInk: 0x4f8fd1,
  sofa: 0x3f6cb0,
  sofaCushion: 0x5484c9,
  pingPong: 0x3f9e62,
  white: 0xf2f2f2,
  vending: 0x6fbf3f,
  vendingFront: 0xcfe9f2,
  cooler: 0xe6e9ec,
  water: 0x63b4e6,
  machine: 0x8b9299,
  counter: 0xd9dcdf,
  pot: 0xb8694a,
  leaf: 0x6ea65f,
  leafLight: 0x83b873,
  trunk: 0x5b4331,
  bench: 0x8d5f3a,
  fence: 0x6d5a48,
  execDesk: 0x7a3f22,
  gold: 0xe6b93c,
  rug: 0xa23f3f,
  wall: 0xeee6d6,
  glass: 0xbfe3ee,
  frame: 0xf7f7f5,
  curb: 0xd8cdb8,
}

const b = (x: number, y: number, z: number, w: number, d: number, h: number, color: number, alpha?: number): Block => ({
  x,
  y,
  z,
  w,
  d,
  h,
  color,
  alpha,
})

const item = (name: string, x: number, y: number, w: number, d: number, blocks: Block[]): Furniture => ({
  name,
  x,
  y,
  w,
  d,
  blocks,
})

export const DESK_SET = { w: 3, d: 2.6 }

// 책상 한 세트: 어두운 책상, 모니터 2대, 의자, 서류 더미, 커피. 모니터가 뒤쪽, 의자가 앞쪽이다.
export function deskSet(x: number, y: number, paperHeight = 0.3): Furniture {
  const monitor = (mx: number) => [
    b(mx + 0.4, y + 0.3, 0.8, 0.2, 0.2, 0.15, PALETTE.monitor),
    b(mx, y + 0.2, 0.95, 1, 0.1, 0.6, PALETTE.monitor),
    b(mx + 0.06, y + 0.3, 1.0, 0.88, 0.03, 0.5, PALETTE.screen),
  ]
  return item('책상', x, y, DESK_SET.w, DESK_SET.d, [
    b(x + 0.05, y + 0.1, 0, 0.15, 1.1, 0.68, PALETTE.deskLeg),
    b(x + 2.8, y + 0.1, 0, 0.15, 1.1, 0.68, PALETTE.deskLeg),
    b(x, y, 0.68, 3, 1.3, 0.12, PALETTE.deskTop),
    ...monitor(x + 0.25),
    ...monitor(x + 1.4),
    b(x + 0.3, y + 0.7, 0.8, 0.5, 0.42, paperHeight, PALETTE.paper),
    b(x + 2.45, y + 0.8, 0.8, 0.26, 0.26, 0.26, PALETTE.mug),
    b(x + 1.32, y + 1.72, 0, 0.16, 0.16, 0.34, PALETTE.deskLeg),
    b(x + 1, y + 1.4, 0.34, 0.8, 0.8, 0.16, PALETTE.chair),
    b(x + 1, y + 2.2, 0.34, 0.8, 0.14, 0.72, PALETTE.chair),
  ])
}

function plainChair(x: number, y: number, backAtFront: boolean): Block[] {
  return [
    b(x + 0.2, y + 0.2, 0, 0.2, 0.2, 0.34, PALETTE.deskLeg),
    b(x, y, 0.34, 0.6, 0.6, 0.12, PALETTE.chair),
    b(x, backAtFront ? y + 0.5 : y, 0.46, 0.6, 0.1, 0.45, PALETTE.chair),
  ]
}

// 긴 나무 회의 테이블과 양쪽 의자.
export function meetingTable(x: number, y: number, w: number): Furniture {
  const chairs: Block[] = []
  for (let cx = x + 0.6; cx + 0.6 <= x + w - 0.3; cx += 1.6) {
    chairs.push(...plainChair(cx, y, false), ...plainChair(cx, y + 2.6, true))
  }
  return item('회의 테이블', x, y, w, 3.2, [
    ...chairs,
    b(x + 0.5, y + 1.1, 0, 0.3, 1, 0.68, PALETTE.tableLeg),
    b(x + w - 0.8, y + 1.1, 0, 0.3, 1, 0.68, PALETTE.tableLeg),
    b(x, y + 0.7, 0.68, w, 1.8, 0.14, PALETTE.table),
    b(x + 1.2, y + 1.2, 0.82, 0.6, 0.45, 0.2, PALETTE.paper),
    b(x + w - 2, y + 1.3, 0.82, 0.26, 0.26, 0.24, PALETTE.mug),
  ])
}

export function cabinet(x: number, y: number): Furniture {
  return item('캐비닛', x, y, 1.4, 0.7, [
    b(x, y, 0, 1.4, 0.7, 0.9, PALETTE.cabinet),
    b(x, y, 0.9, 1.4, 0.7, 0.05, PALETTE.cabinetLine),
    b(x, y, 0.95, 1.4, 0.7, 0.9, PALETTE.cabinet),
  ])
}

export function whiteboard(x: number, y: number): Furniture {
  return item('화이트보드', x, y, 2.4, 0.3, [
    b(x + 0.1, y + 0.1, 0, 0.1, 0.1, 0.6, PALETTE.boardFrame),
    b(x + 2.2, y + 0.1, 0, 0.1, 0.1, 0.6, PALETTE.boardFrame),
    b(x, y + 0.05, 0.6, 2.4, 0.12, 1.3, PALETTE.boardFrame),
    b(x + 0.08, y + 0.17, 0.68, 2.24, 0.03, 1.14, PALETTE.board),
    b(x + 0.35, y + 0.2, 1.4, 1.1, 0.02, 0.12, PALETTE.boardInk),
    b(x + 0.35, y + 0.2, 1.1, 1.6, 0.02, 0.12, PALETTE.mug),
  ])
}

export function sofa(x: number, y: number, w = 2.8): Furniture {
  return item('소파', x, y, w, 1.2, [
    b(x, y, 0, w, 0.35, 0.95, PALETTE.sofa),
    b(x, y + 0.35, 0, w, 0.85, 0.32, PALETTE.sofa),
    b(x, y + 0.35, 0.32, 0.3, 0.85, 0.28, PALETTE.sofa),
    b(x + 0.3, y + 0.35, 0.32, w - 0.6, 0.85, 0.12, PALETTE.sofaCushion),
    b(x + w - 0.3, y + 0.35, 0.32, 0.3, 0.85, 0.28, PALETTE.sofa),
  ])
}

export function lowTable(x: number, y: number): Furniture {
  return item('낮은 탁자', x, y, 1.6, 0.9, [
    b(x + 0.1, y + 0.1, 0, 1.4, 0.7, 0.26, PALETTE.deskLeg),
    b(x, y, 0.26, 1.6, 0.9, 0.08, PALETTE.table),
    b(x + 0.6, y + 0.25, 0.34, 0.26, 0.26, 0.22, PALETTE.mug),
  ])
}

export function pingPong(x: number, y: number): Furniture {
  return item('탁구대', x, y, 4.2, 2.4, [
    b(x + 0.4, y + 0.4, 0, 0.2, 1.6, 0.68, PALETTE.deskLeg),
    b(x + 3.6, y + 0.4, 0, 0.2, 1.6, 0.68, PALETTE.deskLeg),
    b(x, y, 0.68, 2.08, 2.4, 0.1, PALETTE.pingPong),
    b(x + 2.12, y, 0.68, 2.08, 2.4, 0.1, PALETTE.pingPong),
    b(x + 2.06, y - 0.06, 0.78, 0.08, 2.52, 0.2, PALETTE.white),
  ])
}

export function vendingMachine(x: number, y: number): Furniture {
  return item('자판기', x, y, 1.2, 1, [
    b(x, y, 0, 1.2, 1, 2.2, PALETTE.vending),
    b(x + 0.12, y + 1, 0.85, 0.96, 0.02, 1.15, PALETTE.vendingFront),
    b(x + 0.12, y + 1, 0.25, 0.96, 0.02, 0.35, PALETTE.monitor),
  ])
}

export function waterCooler(x: number, y: number): Furniture {
  return item('정수기', x, y, 0.8, 0.8, [
    b(x, y, 0, 0.8, 0.8, 1.15, PALETTE.cooler),
    b(x + 0.12, y + 0.12, 1.15, 0.56, 0.56, 0.75, PALETTE.water),
  ])
}

export function coffeeMachine(x: number, y: number): Furniture {
  return item('커피 머신', x, y, 1.4, 0.9, [
    b(x, y, 0, 1.4, 0.9, 0.8, PALETTE.counter),
    b(x + 0.2, y + 0.1, 0.8, 0.75, 0.6, 0.75, PALETTE.machine),
    b(x + 0.4, y + 0.7, 0.8, 0.35, 0.03, 0.4, PALETTE.monitor),
    b(x + 1.05, y + 0.4, 0.8, 0.22, 0.22, 0.2, PALETTE.mug),
  ])
}

export function plant(x: number, y: number): Furniture {
  return item('화분', x, y, 0.7, 0.7, [
    b(x + 0.08, y + 0.08, 0, 0.54, 0.54, 0.45, PALETTE.pot),
    b(x, y, 0.45, 0.7, 0.7, 0.5, PALETTE.leaf),
    b(x + 0.15, y + 0.15, 0.95, 0.4, 0.4, 0.35, PALETTE.leafLight),
  ])
}

export function execDesk(x: number, y: number): Furniture {
  return item('임원 책상', x, y, 4, 3, [
    b(x, y, 0, 0.3, 1.5, 0.8, PALETTE.execDesk),
    b(x + 3.7, y, 0, 0.3, 1.5, 0.8, PALETTE.execDesk),
    b(x, y + 0.1, 0, 4, 0.2, 0.8, PALETTE.execDesk),
    b(x, y, 0.8, 4, 1.5, 0.14, PALETTE.execDesk),
    b(x + 1.4, y + 0.3, 0.94, 1.2, 0.12, 0.7, PALETTE.monitor),
    b(x + 1.46, y + 0.42, 0.99, 1.08, 0.03, 0.6, PALETTE.screen),
    b(x + 0.4, y + 0.9, 0.94, 0.7, 0.3, 0.14, PALETTE.gold),
    b(x + 3, y + 0.8, 0.94, 0.28, 0.28, 0.26, PALETTE.mug),
    b(x + 1.5, y + 2, 0, 0.3, 0.3, 0.4, PALETTE.deskLeg),
    b(x + 1.2, y + 1.7, 0.4, 1.1, 1, 0.2, PALETTE.chair),
    b(x + 1.2, y + 2.7, 0.4, 1.1, 0.2, 1.2, PALETTE.chair),
  ])
}

export function rug(x: number, y: number, w: number, d: number): Furniture {
  return item('양탄자', x, y, w, d, [b(x, y, 0, w, d, 0.04, PALETTE.rug)])
}

export function tree(x: number, y: number, size = 1): Furniture {
  const s = size
  return item('나무', x, y, 1.6 * s, 1.6 * s, [
    b(x + 0.55 * s, y + 0.55 * s, 0, 0.5 * s, 0.5 * s, 1.2 * s, PALETTE.trunk),
    b(x, y, 1.2 * s, 1.6 * s, 1.6 * s, 1.1 * s, PALETTE.leaf),
    b(x + 0.3 * s, y + 0.3 * s, 2.3 * s, 1 * s, 1 * s, 0.9 * s, PALETTE.leafLight),
  ])
}

export function bench(x: number, y: number, alongX = true): Furniture {
  const [w, d] = alongX ? [2, 0.6] : [0.6, 2]
  const legs = alongX
    ? [b(x + 0.1, y + 0.1, 0, 0.15, 0.4, 0.3, PALETTE.deskLeg), b(x + 1.75, y + 0.1, 0, 0.15, 0.4, 0.3, PALETTE.deskLeg)]
    : [b(x + 0.1, y + 0.1, 0, 0.4, 0.15, 0.3, PALETTE.deskLeg), b(x + 0.1, y + 1.75, 0, 0.4, 0.15, 0.3, PALETTE.deskLeg)]
  return item('벤치', x, y, w, d, [...legs, b(x, y, 0.3, w, d, 0.1, PALETTE.bench)])
}

// 울타리: 기둥을 한 칸마다 세우고 가로대로 잇는다.
export function fence(x: number, y: number, length: number, alongX = true): Furniture {
  const blocks: Block[] = []
  for (let i = 0; i <= length; i++) {
    const [px, py] = alongX ? [x + i, y] : [x, y + i]
    blocks.push(b(px, py, 0, 0.16, 0.16, 0.7, PALETTE.fence))
  }
  blocks.push(
    alongX ? b(x, y + 0.04, 0.45, length, 0.08, 0.1, PALETTE.fence) : b(x + 0.04, y, 0.45, 0.08, length, 0.1, PALETTE.fence),
  )
  return item('울타리', x, y, alongX ? length + 0.16 : 0.16, alongX ? 0.16 : length + 0.16, blocks)
}

const WALL_THICKNESS = 0.3

const run = (x: number, y: number, length: number, alongX: boolean, z: number, h: number, color: number, alpha?: number) =>
  alongX
    ? b(x, y, z, length, WALL_THICKNESS, h, color, alpha)
    : b(x, y, z, WALL_THICKNESS, length, h, color, alpha)

const wallItem = (name: string, x: number, y: number, length: number, alongX: boolean, blocks: Block[]) =>
  item(name, x, y, alongX ? length : WALL_THICKNESS, alongX ? WALL_THICKNESS : length, blocks)

// 뒤쪽 바깥벽: 아래는 막고 위는 창문이다.
export function windowWall(x: number, y: number, length: number, alongX: boolean): Furniture {
  const blocks = [run(x, y, length, alongX, 0, 0.8, PALETTE.wall)]
  for (let i = 0; i < length; i += 3) {
    const [px, py] = alongX ? [x + i, y] : [x, y + i]
    const pane = Math.min(3, length - i)
    blocks.push(alongX ? b(px, py, 0.8, 0.25, WALL_THICKNESS, 1.3, PALETTE.wall) : b(px, py, 0.8, WALL_THICKNESS, 0.25, 1.3, PALETTE.wall))
    blocks.push(
      alongX
        ? b(px + 0.25, py + 0.1, 0.8, pane - 0.25, 0.1, 1.3, PALETTE.glass, 0.55)
        : b(px + 0.1, py + 0.25, 0.8, 0.1, pane - 0.25, 1.3, PALETTE.glass, 0.55),
    )
  }
  blocks.push(run(x, y, length, alongX, 2.1, 0.3, PALETTE.wall))
  return wallItem('창문 벽', x, y, length, alongX, blocks)
}

// 구역을 나누는 유리 칸막이. 안이 비쳐 보인다.
export function glassPartition(x: number, y: number, length: number, alongX: boolean): Furniture {
  const blocks = [run(x, y, length, alongX, 0, 0.25, PALETTE.frame)]
  for (let i = 0; i < length; i += 2) {
    const [px, py] = alongX ? [x + i, y] : [x, y + i]
    const pane = Math.min(2, length - i)
    blocks.push(alongX ? b(px, py, 0.25, 0.12, WALL_THICKNESS, 1.65, PALETTE.frame) : b(px, py, 0.25, WALL_THICKNESS, 0.12, 1.65, PALETTE.frame))
    blocks.push(
      alongX
        ? b(px + 0.12, py + 0.11, 0.25, pane - 0.12, 0.08, 1.65, PALETTE.glass, 0.42)
        : b(px + 0.11, py + 0.12, 0.25, 0.08, pane - 0.12, 1.65, PALETTE.glass, 0.42),
    )
  }
  blocks.push(run(x, y, length, alongX, 1.9, 0.14, PALETTE.frame))
  return wallItem('유리 칸막이', x, y, length, alongX, blocks)
}

// 앞쪽은 안이 보이도록 낮게 자른다.
export function lowWall(x: number, y: number, length: number, alongX: boolean): Furniture {
  return wallItem('낮은 벽', x, y, length, alongX, [run(x, y, length, alongX, 0, 0.32, PALETTE.curb)])
}
