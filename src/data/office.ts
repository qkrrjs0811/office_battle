// 사무실 층의 배치와 색. 게임 화면은 폰 세로 크기를 기준으로 그린다.
// 맵은 화면보다 크고, 구역이 화면 위에서 아래로 지그재그로 이어진다. 끌어서 둘러본다.
import type { Tile } from '../core/iso'
import {
  cabinet,
  coffeeMachine,
  deskSet,
  execDesk,
  glassPartition,
  lowTable,
  lowWall,
  meetingTable,
  pingPong,
  plant,
  rug,
  sofa,
  vendingMachine,
  waterCooler,
  whiteboard,
  windowWall,
  type Furniture,
} from './furniture'

export const SCREEN = { width: 390, height: 844 }

export const FLOOR_LABEL = '1층 · 인턴'

export const TILE: Tile = { halfWidth: 22, halfHeight: 11, zUnit: 22 }

export type Rect = { x: number; y: number; w: number; d: number }
export type ZoneId = 'work' | 'meeting' | 'lounge' | 'executive' | 'archive'
export type Zone = Rect & { id: ZoneId; floor: FloorKind }
export type FloorKind = 'wood' | 'darkWood' | 'tile'

export const ZONES: Zone[] = [
  { id: 'work', x: 0, y: 0, w: 12, d: 12, floor: 'wood' },
  { id: 'meeting', x: 12, y: 4, w: 12, d: 12, floor: 'wood' },
  { id: 'lounge', x: 14, y: 16, w: 12, d: 12, floor: 'wood' },
  { id: 'executive', x: 26, y: 20, w: 12, d: 12, floor: 'darkWood' },
  { id: 'archive', x: 26, y: 32, w: 12, d: 9, floor: 'wood' },
]

// 복도: 구역을 잇는 타일 바닥. 전투가 벌어질 곳이라 가구를 두지 않는다.
export const AISLES: Rect[] = [
  { x: 0, y: 8, w: 20, d: 3 },
  { x: 17, y: 11, w: 3, d: 14 },
  { x: 20, y: 22, w: 18, d: 3 },
]

export const BACKGROUND_COLOR = 0xe3ece6
export const ISLAND_SHADOW = { color: 0x5d6f66, alpha: 0.16, offsetY: 34 }
export const OBJECT_SHADOW = { color: 0x2a2018, alpha: 0.13, spread: 0.18 }

export const FLOOR_COLORS: Record<FloorKind, number> = {
  wood: 0xc59a6b,
  darkWood: 0x9c6f49,
  tile: 0xd6d3cb,
}

// 칸마다 밝기를 이만큼 흔든다.
export const FLOOR_VARIATION: Record<FloorKind, number> = { wood: 0.05, darkWood: 0.05, tile: 0.025 }

// 층 옆면. 위에서 아래로 콘크리트, 어두운 콘크리트, 철골.
export const SIDE_LAYERS = [
  { height: 0.5, color: 0xb6b3aa },
  { height: 0.6, color: 0x8d8b85 },
  { height: 0.5, color: 0x5a5d62 },
]

const WALLS: Furniture[] = [
  // 업무 구역
  windowWall(0, 0, 12, true),
  windowWall(0, 0.3, 7.7, false), // 복도 끝 y 8~11은 층 입구로 비워 둔다
  lowWall(0, 11, 1, false),
  lowWall(11.7, 0.3, 3.7, false),
  glassPartition(11.85, 4, 4, false),
  glassPartition(11.85, 11, 1, false),
  lowWall(0.3, 11.7, 11.5, true),
  // 회의실
  windowWall(12.15, 4, 11.85, true),
  lowWall(12, 12, 3.7, false),
  lowWall(23.7, 4.3, 11.7, false),
  lowWall(12.15, 15.7, 1.85, true),
  // 휴게실
  glassPartition(14, 15.85, 3, true),
  glassPartition(20, 15.85, 3.7, true),
  lowWall(23.7, 16, 2, true),
  windowWall(14, 16.15, 11.85, false),
  lowWall(14.3, 27.7, 11.7, true),
  lowWall(25.7, 16.15, 3.85, false),
  // 임원실
  windowWall(26, 20, 12, true),
  glassPartition(25.85, 20.3, 1.7, false),
  glassPartition(25.85, 25, 2.7, false),
  windowWall(26, 27.7, 4.3, false),
  lowWall(26.3, 31.7, 4.7, true), // x 31~33은 자료실로 가는 문이다
  lowWall(33, 31.7, 5, true),
  lowWall(37.7, 20.3, 1.7, false),
  lowWall(37.7, 25, 6.7, false),
  // 자료실
  windowWall(26, 32, 9, false),
  lowWall(37.7, 32, 8.7, false),
  lowWall(26.3, 40.7, 11.7, true),
]

const INDOOR: Furniture[] = [
  // 업무 구역: 책상을 두 줄로 세운다
  deskSet(0.8, 0.8, 0.5),
  deskSet(4.5, 0.8, 0.25),
  deskSet(8.2, 0.8, 0.7),
  deskSet(0.8, 4.6, 0.3),
  deskSet(4.5, 4.6, 0.9),
  deskSet(8.2, 4.6, 0.2),
  // 회의실
  meetingTable(14, 4.5, 8.4),
  whiteboard(13, 11.4),
  cabinet(15.5, 11.4),
  plant(12.6, 14.6),
  sofa(13.2, 13.2),
  plant(22.6, 12),
  cabinet(21, 11.4),
  // 휴게실
  vendingMachine(14.8, 16.6),
  waterCooler(14.8, 18.2),
  coffeeMachine(14.8, 19.6),
  pingPong(21, 17.4),
  plant(25, 16.5),
  sofa(15, 25.1),
  lowTable(15.6, 26.6),
  sofa(20.4, 25.7),
  plant(25, 26.8),
  // 임원실
  cabinet(27, 20.5),
  cabinet(29, 20.5),
  plant(36.8, 20.6),
  rug(28.8, 25.6, 7, 5.5),
  execDesk(30.2, 26),
  sofa(26.6, 29.8),
  plant(36.6, 30.6),
  // 자료실: 문 앞을 비우고 캐비닛을 양쪽에 세운다
  cabinet(27.5, 33),
  cabinet(29.1, 33),
  cabinet(33.5, 33),
  cabinet(35.1, 33),
  cabinet(27.5, 36),
  cabinet(29.1, 36),
  cabinet(33.5, 36),
  cabinet(35.1, 36),
  deskSet(30.5, 37.6, 0.9),
  plant(27, 39.6),
  plant(36.6, 39.6),
]

export const FURNITURE: Furniture[] = [...WALLS, ...INDOOR]

// 처음 화면의 가운데에 올 맵 위치(격자 좌표). 업무 구역과 회의실 입구가 함께 보인다.
export const START_VIEW = { x: 11, y: 10 }

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

export function floorKindAt(x: number, y: number): FloorKind | null {
  if (AISLES.some((r) => inRect(x, y, r))) return 'tile'
  return ZONES.find((r) => inRect(x, y, r))?.floor ?? null
}

export function buildFloorCells(): FloorCell[] {
  const cells: FloorCell[] = []
  const minX = Math.min(...ZONES.map((r) => r.x))
  const minY = Math.min(...ZONES.map((r) => r.y))
  const maxX = Math.max(...ZONES.map((r) => r.x + r.w))
  const maxY = Math.max(...ZONES.map((r) => r.y + r.d))
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const kind = floorKindAt(x, y)
      if (!kind) continue
      const amount = (hash(y + 3.3, x + 7.7) * 2 - 1) * FLOOR_VARIATION[kind]
      cells.push({ x, y, kind, color: tint(FLOOR_COLORS[kind], amount), sideJitter: hash(x + 11.1, y + 5.5) * 0.3 })
    }
  }
  return cells
}
