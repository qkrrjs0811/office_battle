// 맵을 그리는 공통 수치와 바닥 계산. 게임 화면은 폰 세로 크기를 기준으로 그린다.
// 맵 하나하나의 배치는 maps.ts에 있다.
import type { Tile } from '../core/iso'
import type { Furniture } from './furniture'

export const SCREEN = { width: 390, height: 844 }

export const TILE: Tile = { halfWidth: 22, halfHeight: 11, zUnit: 22 }

export type Rect = { x: number; y: number; w: number; d: number }
export type FloorKind = 'carpet' | 'wood' | 'darkWood' | 'tile' | 'mint' | 'concrete'
export type MapId = 'work' | 'meeting' | 'lounge' | 'archive' | 'executive'

export type Portal = { to: MapId; x: number; y: number; alongX: boolean }

export type GameMap = {
  id: MapId
  name: string
  storey: number
  width: number
  depth: number
  floor: FloorKind
  aisleFloor: FloorKind
  background: number
  accent: number
  aisles: Rect[]
  portals: Portal[]
  furniture: Furniture[]
}

export const mapTitle = (map: Pick<GameMap, 'storey' | 'name'>) => `${map.storey}층 ${map.name}`

export const ISLAND_SHADOW = { color: 0x1d2a24, alpha: 0.16, offsetY: 34 }
export const OBJECT_SHADOW = { color: 0x2a2018, alpha: 0.13, spread: 0.18 }

export const FLOOR_COLORS: Record<FloorKind, number> = {
  carpet: 0x93a0ad,
  wood: 0xc59a6b,
  darkWood: 0x7d5238,
  tile: 0xd6d3cb,
  mint: 0xa9dcc4,
  concrete: 0x8f9194,
}

// 칸마다 밝기를 이만큼 흔든다.
export const FLOOR_VARIATION: Record<FloorKind, number> = {
  carpet: 0.04,
  wood: 0.05,
  darkWood: 0.05,
  tile: 0.025,
  mint: 0.03,
  concrete: 0.05,
}

// 층 옆면. 위에서 아래로 콘크리트, 어두운 콘크리트, 철골.
export const SIDE_LAYERS = [
  { height: 0.5, color: 0xb6b3aa },
  { height: 0.6, color: 0x8d8b85 },
  { height: 0.5, color: 0x5a5d62 },
]

// 포탈을 지나면 이 색으로 잠깐 번쩍이며 다음 맵이 나타난다.
export const TRAVEL_FADE = { ms: 180, red: 255, green: 255, blue: 255 }

// 도착했을 때 포탈이 화면 안에 들어오면서 방도 보이도록, 카메라를 포탈에서 방 가운데 쪽으로 이만큼 옮긴다.
export const ARRIVAL_ROOM_PULL = 0.35

// 포탈 이름표를 포탈 위 이 높이에 띄운다.
export const PORTAL_SIGN_Z = 3.5

export function portalCenter(portal: Portal, span: number, depth: number) {
  return portal.alongX
    ? { x: portal.x + span / 2, y: portal.y + depth / 2 }
    : { x: portal.x + depth / 2, y: portal.y + span / 2 }
}

export type FloorCell = { x: number; y: number; kind: FloorKind; color: number; sideJitter: number }

// 시드 없는 고정 난수. 같은 칸은 언제나 같은 색이다.
function hash(x: number, y: number) {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return v - Math.floor(v)
}

function tint(color: number, amount: number) {
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((color >> shift) & 0xff) * (1 + amount))))
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}

const inRect = (x: number, y: number, r: Rect) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.d

export function floorKindAt(map: GameMap, x: number, y: number): FloorKind | null {
  if (x < 0 || y < 0 || x >= map.width || y >= map.depth) return null
  return map.aisles.some((r) => inRect(x, y, r)) ? map.aisleFloor : map.floor
}

export function buildFloorCells(map: GameMap): FloorCell[] {
  const cells: FloorCell[] = []
  for (let y = 0; y < map.depth; y++) {
    for (let x = 0; x < map.width; x++) {
      const kind = floorKindAt(map, x, y)!
      const amount = (hash(y + 3.3, x + 7.7) * 2 - 1) * FLOOR_VARIATION[kind]
      cells.push({ x, y, kind, color: tint(FLOOR_COLORS[kind], amount), sideJitter: hash(x + 11.1, y + 5.5) * 0.3 })
    }
  }
  return cells
}
