// 포탈로 오가는 맵 다섯 곳의 배치. 맵마다 바닥, 바탕색, 가구가 달라 한눈에 구별된다.
// 포탈은 고리처럼 이어진다: 업무 구역 → 회의실 → 임원실 → 자료실 → 휴게실 → 업무 구역.
import {
  cabinet,
  coffeeMachine,
  deskSet,
  execDesk,
  lowTable,
  lowWall,
  meetingTable,
  pingPong,
  plant,
  portalGate,
  rug,
  sofa,
  vendingMachine,
  waterCooler,
  whiteboard,
  windowWall,
  type Furniture,
} from './furniture'
import type { GameMap, MapId, Portal } from './office'

// 포탈의 빛깔은 도착할 맵의 색이다.
const ACCENTS: Record<MapId, number> = {
  work: 0x4f8fd1,
  meeting: 0xe2803a,
  lounge: 0x3fbf7f,
  archive: 0x9a7bd8,
  executive: 0xe6b93c,
}

// 뒤쪽 두 면은 창문 벽, 앞쪽 두 면은 안이 보이는 낮은 벽이다.
const roomWalls = (w: number, d: number): Furniture[] => [
  windowWall(0, 0, w, true),
  windowWall(0, 0.3, d - 0.3, false),
  lowWall(w - 0.3, 0.3, d - 0.61, false), // 소수점 오차로 앞 벽과 겹치지 않게 살짝 짧다
  lowWall(0.3, d - 0.3, w - 0.3, true),
]

type MapPlan = Omit<GameMap, 'accent' | 'furniture'> & { props: Furniture[] }

const build = ({ props, ...plan }: MapPlan): GameMap => ({
  ...plan,
  accent: ACCENTS[plan.id],
  furniture: [
    ...roomWalls(plan.width, plan.depth),
    ...props,
    ...plan.portals.map((p) => portalGate(p.x, p.y, p.alongX, ACCENTS[p.to])),
  ],
})

// 뒤 벽(y쪽)에 붙이는 포탈과 왼쪽 벽(x쪽)에 붙이는 포탈.
const onBackWall = (to: MapId, x: number): Portal => ({ to, x, y: 0.3, alongX: true })
const onLeftWall = (to: MapId, y: number): Portal => ({ to, x: 0.3, y, alongX: false })

const grid = (xs: number[], ys: number[], make: (x: number, y: number) => Furniture) =>
  ys.flatMap((y) => xs.map((x) => make(x, y)))

export const MAPS: GameMap[] = [
  // 업무 구역: 차가운 카펫 위에 책상이 빽빽하다
  build({
    id: 'work',
    name: '업무 구역',
    storey: 1,
    width: 16,
    depth: 16,
    floor: 'carpet',
    aisleFloor: 'tile',
    background: 0xdfe6ec,
    aisles: [{ x: 1, y: 3, w: 14, d: 2 }],
    portals: [onBackWall('meeting', 6.7), onLeftWall('lounge', 6.7)],
    props: [
      ...grid([3.2, 6.6, 10], [5.6, 8.6, 11.6], (x, y) => deskSet(x, y, 0.2 + ((x + y) % 7) / 10)),
      cabinet(11.8, 0.6),
      cabinet(13.5, 0.6),
      plant(1, 0.8),
      plant(1, 14.6),
      plant(14.6, 14.6),
    ],
  }),
  // 회의실: 따뜻한 나무 바닥, 긴 테이블, 화이트보드가 끝없이 있다
  build({
    id: 'meeting',
    name: '회의실',
    storey: 1,
    width: 18,
    depth: 14,
    floor: 'wood',
    aisleFloor: 'tile',
    background: 0xf0e6d4,
    aisles: [{ x: 1, y: 3, w: 16, d: 2 }],
    portals: [onBackWall('executive', 10), onLeftWall('work', 5.5)],
    props: [
      meetingTable(3.5, 5, 11),
      meetingTable(3.5, 9.5, 11),
      whiteboard(2, 0.4),
      whiteboard(5, 0.4),
      whiteboard(13.5, 0.4),
      cabinet(15.2, 5.5),
      cabinet(15.2, 7.5),
      plant(1, 12.6),
      plant(16.6, 12.6),
    ],
  }),
  // 휴게실: 민트색 바닥에 탁구대와 자판기. 유일하게 숨 쉬는 곳이다
  build({
    id: 'lounge',
    name: '휴게실',
    storey: 1,
    width: 14,
    depth: 18,
    floor: 'mint',
    aisleFloor: 'wood',
    background: 0xf7e3b0,
    aisles: [{ x: 1, y: 4, w: 12, d: 2 }],
    portals: [onBackWall('archive', 5.5), onLeftWall('work', 8)],
    props: [
      vendingMachine(1, 0.5),
      waterCooler(2.4, 0.5),
      coffeeMachine(3.5, 0.5),
      pingPong(8.3, 1.2),
      plant(12.6, 0.6),
      sofa(3.5, 7),
      lowTable(3.9, 8.6),
      sofa(7.5, 7),
      lowTable(8, 8.6),
      vendingMachine(12, 7),
      pingPong(4, 11.5),
      sofa(9.5, 11.5),
      lowTable(10, 13),
      coffeeMachine(1, 14),
      lowTable(5.6, 14.2),
      sofa(5, 15.5),
      plant(1, 16.8),
      plant(12.6, 16.8),
    ],
  }),
  // 자료실: 어두운 콘크리트 바닥에 캐비닛 숲. 아무도 오지 않는 곳이다
  build({
    id: 'archive',
    name: '자료실',
    storey: 1,
    width: 16,
    depth: 16,
    floor: 'concrete',
    aisleFloor: 'tile',
    background: 0x4a4f57,
    aisles: [{ x: 1, y: 2, w: 14, d: 2 }],
    portals: [onBackWall('executive', 7), onLeftWall('lounge', 5.5)],
    props: [
      cabinet(2, 0.4),
      cabinet(3.6, 0.4),
      cabinet(10.5, 0.4),
      cabinet(12.1, 0.4),
      ...grid([3, 4.6, 6.2, 9, 10.6, 12.2], [4.5, 6.5, 8.5, 10.5], cabinet),
      deskSet(3, 12.8, 0.9),
      deskSet(10, 12.8, 0.9),
      plant(1, 14.7),
      plant(14.6, 14.7),
    ],
  }),
  // 임원실: 어두운 원목과 붉은 양탄자. 넓은데 사람은 한 명이다
  build({
    id: 'executive',
    name: '임원실',
    storey: 1,
    width: 18,
    depth: 16,
    floor: 'darkWood',
    aisleFloor: 'wood',
    background: 0x2c2f4a,
    aisles: [{ x: 1, y: 2, w: 16, d: 2 }],
    portals: [onBackWall('archive', 8), onLeftWall('meeting', 6)],
    props: [
      rug(5, 5, 8, 6),
      execDesk(7, 6),
      cabinet(2, 0.4),
      cabinet(3.6, 0.4),
      cabinet(12, 0.4),
      cabinet(13.6, 0.4),
      plant(16.4, 0.6),
      sofa(13, 5),
      lowTable(13.6, 6.6),
      sofa(13, 10),
      sofa(5, 13),
      lowTable(8.1, 13.2),
      sofa(10, 13),
      plant(1, 14.6),
      plant(16.6, 14.6),
    ],
  }),
]

export const START_MAP: MapId = 'work'
