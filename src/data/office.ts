// 맵을 그리는 공통 수치와 바닥 계산. 게임 화면은 폰 세로 크기를 기준으로 그리고 창 크기에 맞춰 통째로 줄인다.
// 맵 하나하나의 배치는 maps.ts에 있다.
import { fitInto, project, type Tile } from '../core/iso'
import { PORTAL_SIZE, type Furniture } from './furniture'

export const SCREEN = { width: 390, height: 844 }

// 맵 전체를 화면에 맞출 때 가장자리에 남기는 여백
export const MAP_MARGIN = 30

export const TILE: Tile = { halfWidth: 22, halfHeight: 11, zUnit: 22 }

export type Rect = { x: number; y: number; w: number; d: number }
export type FloorKind = 'carpet' | 'wood' | 'darkWood' | 'tile' | 'mint' | 'concrete' | 'marble' | 'bathTile'
export type MapId = 'work' | 'meeting' | 'lounge' | 'archive' | 'executive' | 'gate' | 'restroom'

// 맵의 가로세로는 이 칸 수보다 짧지 않게 만든다.
export const MIN_MAP_SIDE = 20

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
  marble: 0xeeebe4,
  bathTile: 0xa6cfe2,
}

// 칸마다 밝기를 이만큼 흔든다.
export const FLOOR_VARIATION: Record<FloorKind, number> = {
  carpet: 0.04,
  wood: 0.05,
  darkWood: 0.05,
  tile: 0.025,
  mint: 0.03,
  concrete: 0.05,
  marble: 0.02,
  bathTile: 0.04,
}

// 층 옆면. 위에서 아래로 콘크리트, 어두운 콘크리트, 철골.
export const SIDE_LAYERS = [
  { height: 0.5, color: 0xb6b3aa },
  { height: 0.6, color: 0x8d8b85 },
  { height: 0.5, color: 0x5a5d62 },
]

// 포탈을 지나면 이 색으로 잠깐 번쩍이며 다음 맵이 나타난다.
export const TRAVEL_FADE = { ms: 180, red: 255, green: 255, blue: 255 }

// 포탈 이름표를 포탈 위 이 높이에 띄운다.
export const PORTAL_SIGN_Z = 6

export function portalCenter(portal: Portal, span: number, depth: number) {
  return portal.alongX
    ? { x: portal.x + span / 2, y: portal.y + depth / 2 }
    : { x: portal.x + depth / 2, y: portal.y + span / 2 }
}

// 바닥과 옆면, 층 그림자, 가구, 포탈 이름표가 모두 화면에 들어오는 배율과 위치
export function fitMap(map: GameMap) {
  const floorBottom = ISLAND_SHADOW.offsetY * 2
  const points = [
    ...buildFloorCells(map).flatMap((c) => {
      const front = project({ x: c.x + 1, y: c.y + 1, z: 0 }, TILE)
      return [
        project({ x: c.x, y: c.y, z: 0 }, TILE),
        project({ x: c.x + 1, y: c.y, z: 0 }, TILE),
        project({ x: c.x, y: c.y + 1, z: 0 }, TILE),
        { x: front.x, y: front.y + floorBottom },
      ]
    }),
    ...map.furniture.flatMap((item) => item.blocks).map((b) => project({ x: b.x, y: b.y, z: b.z + b.h }, TILE)),
    ...map.portals.map((p) => project({ ...portalCenter(p, PORTAL_SIZE.span, PORTAL_SIZE.depth), z: PORTAL_SIGN_Z }, TILE)),
  ]
  return fitInto(points, SCREEN, MAP_MARGIN)
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
