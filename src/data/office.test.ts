import { describe, expect, it } from 'vitest'
import { project } from '../core/iso'
import { findBrokenLinks, findUnreachable } from '../core/travel'
import { DESK_SET, PORTAL_SIZE, type Furniture } from './furniture'
import { MAPS, START_MAP } from './maps'
import { FLOOR_COLORS, MIN_MAP_SIDE, SCREEN, TILE, buildFloorCells, fitMap, floorKindAt, mapTitle, type Rect } from './office'

// 가장 큰 맵을 맞춘 화면에서 책상 한 세트가 차지하는 폭의 아래 한계(px)
// 세로 폭 390에 20칸 넘는 맵 전체를 넣으면 90px은 불가능하다. 지금 크기보다 더 작아지지 않게만 막는다
const MIN_DESK_ON_SCREEN = 36
import { RANKS } from './ranks'

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d

// 장식처럼 납작한 양탄자 위에는 가구를 올려도 된다
const solidOf = (furniture: Furniture[]) => furniture.filter((item) => item.name !== '양탄자')

describe('맵 사이의 연결', () => {
  it('회사 맵 일곱 곳이 모두 있다', () => {
    expect(MAPS.map((m) => m.id).sort()).toEqual(['archive', 'executive', 'gate', 'lounge', 'meeting', 'restroom', 'work'])
  })

  it('포탈이 모두 양방향이고 시작 맵에서 어디든 갈 수 있다', () => {
    expect(findBrokenLinks(MAPS)).toEqual([])
    expect(findUnreachable(MAPS, START_MAP)).toEqual([])
  })

  it('맵마다 나갈 포탈이 둘 이상 있고, 같은 곳으로 가는 포탈이 겹치지 않는다', () => {
    for (const map of MAPS) {
      const targets = map.portals.map((p) => p.to)
      expect(targets.length, map.id).toBeGreaterThanOrEqual(2)
      expect(new Set(targets).size, map.id).toBe(targets.length)
    }
  })
})

describe('맵 이름', () => {
  it('"1층 회사 정문"처럼 층과 맵 이름으로 쓴다', () => {
    expect(mapTitle({ storey: 1, name: '회사 정문' })).toBe('1층 회사 정문')
  })

  it('1층에 회사 정문과 화장실이 있다', () => {
    const titles = MAPS.map(mapTitle)
    expect(titles).toContain('1층 회사 정문')
    expect(titles).toContain('1층 화장실')
  })

  // 임원실은 장소 이름이라 '임원'이 들어가도 된다. 직급 자체를 맵 이름으로 쓰지 않으면 된다.
  it('직급을 맵 이름으로 쓰지 않는다', () => {
    const rankNames = RANKS.map((rank) => rank.name)
    for (const map of MAPS) expect(rankNames, map.id).not.toContain(map.name)
  })
})

describe('맵마다 다른 특색', () => {
  it('바닥과 바탕색이 맵마다 다르다', () => {
    expect(new Set(MAPS.map((m) => m.floor)).size).toBe(MAPS.length)
    expect(new Set(MAPS.map((m) => m.background)).size).toBe(MAPS.length)
    expect(new Set(MAPS.map((m) => m.accent)).size).toBe(MAPS.length)
    expect(new Set(MAPS.map((m) => FLOOR_COLORS[m.floor])).size).toBe(MAPS.length)
  })

  it('맵마다 그곳에서만 보이거나 가장 많은 대표 가구가 있다', () => {
    const count = (id: string, name: string) =>
      MAPS.find((m) => m.id === id)!.furniture.filter((item) => item.name === name).length
    const signature: [string, string][] = [
      ['work', '책상'],
      ['meeting', '회의 테이블'],
      ['lounge', '탁구대'],
      ['archive', '캐비닛'],
      ['executive', '임원 책상'],
      ['gate', '출입 게이트'],
      ['restroom', '세면대'],
    ]
    for (const [id, name] of signature) {
      const others = MAPS.filter((m) => m.id !== id).map((m) => count(m.id, name))
      expect(count(id, name), `${id} ${name}`).toBeGreaterThan(Math.max(...others))
    }
  })
})

describe.each(MAPS)('$name 배치', (map) => {
  const solid = solidOf(map.furniture)

  it('모든 가구가 바닥 위에 있다', () => {
    for (const item of map.furniture) {
      for (const [x, y] of [
        [item.x, item.y],
        [item.x + item.w - 0.01, item.y],
        [item.x, item.y + item.d - 0.01],
        [item.x + item.w - 0.01, item.y + item.d - 0.01],
      ]) {
        expect(floorKindAt(map, Math.floor(x), Math.floor(y)), `${item.name} (${x}, ${y})`).not.toBeNull()
      }
    }
  })

  it('가구끼리 겹치지 않는다', () => {
    solid.forEach((a, i) => {
      solid.slice(i + 1).forEach((b) => {
        expect(overlaps(a, b), `${a.name}(${a.x},${a.y}) / ${b.name}(${b.x},${b.y})`).toBe(false)
      })
    })
  })

  it('전투가 벌어질 복도에는 가구가 없다', () => {
    expect(map.aisles.length).toBeGreaterThan(0)
    for (const item of map.furniture) {
      for (const aisle of map.aisles) {
        expect(overlaps(item, aisle), `${item.name}(${item.x},${item.y})`).toBe(false)
      }
    }
  })

  it('포탈 앞이 비어 있어 가로막히지 않는다', () => {
    const { span, depth } = PORTAL_SIZE
    for (const p of map.portals) {
      const front: Rect = p.alongX
        ? { x: p.x, y: p.y + depth, w: span, d: 1.5 }
        : { x: p.x + depth, y: p.y, w: 1.5, d: span }
      for (const item of solid) {
        expect(overlaps(item, front), `${p.to} 포탈 앞 ${item.name}(${item.x},${item.y})`).toBe(false)
      }
    }
  })

  // 사용자가 좁다고 했을 때의 맵은 가장 넓은 곳이 288칸이었다
  it('맵이 좁지 않다', () => {
    expect(Math.min(map.width, map.depth)).toBeGreaterThanOrEqual(MIN_MAP_SIDE)
    expect(map.width * map.depth).toBeGreaterThan(288)
  })

  it('맵 전체가 끌지 않아도 화면 안에 들어온다', () => {
    const { place } = fitMap(map)
    const points = [
      ...buildFloorCells(map).map((c) => project({ x: c.x, y: c.y, z: 0 }, TILE)),
      ...map.furniture.flatMap((item) => item.blocks).map((b) => project({ x: b.x, y: b.y, z: b.z + b.h }, TILE)),
    ].map(place)
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(SCREEN.width)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(SCREEN.height)
    }
  })

  it('맵 전체를 맞춰도 책상 한 세트가 알아볼 크기로 보인다', () => {
    expect((DESK_SET.w + DESK_SET.d) * TILE.halfWidth * fitMap(map).scale).toBeGreaterThanOrEqual(MIN_DESK_ON_SCREEN)
  })

  it('바닥은 사무실 재질뿐이고 잔디 같은 바깥 땅이 없다', () => {
    for (const cell of buildFloorCells(map)) {
      expect(['carpet', 'wood', 'darkWood', 'tile', 'mint', 'concrete', 'marble', 'bathTile']).toContain(cell.kind)
    }
  })

  it('나무, 벤치, 울타리 같은 바깥 물건이 없다', () => {
    const names = map.furniture.map((item) => item.name)
    for (const outdoor of ['나무', '벤치', '울타리']) expect(names).not.toContain(outdoor)
  })

  // 이제 드나드는 길은 포탈뿐이므로 복도 끝도 포함해 가장자리 전체가 막혀 있어야 한다
  it('층 가장자리가 빈틈없이 벽으로 막혀 있다', () => {
    const walls = map.furniture.filter((item) => ['창문 벽', '유리 칸막이', '낮은 벽'].includes(item.name))
    const walled = (x: number, y: number) => walls.some((w) => x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.d)
    const inset = 0.15
    for (const { x, y } of buildFloorCells(map)) {
      const edges: [number, number, number, number][] = [
        [x - 1, y, x + inset, y + 0.5],
        [x + 1, y, x + 1 - inset, y + 0.5],
        [x, y - 1, x + 0.5, y + inset],
        [x, y + 1, x + 0.5, y + 1 - inset],
      ]
      for (const [nx, ny, px, py] of edges) {
        if (floorKindAt(map, nx, ny)) continue
        expect(walled(px, py), `칸 (${x}, ${y})에서 (${nx}, ${ny}) 쪽`).toBe(true)
      }
    }
  })

  it('같은 재질 안에서도 칸마다 색이 조금씩 다르다', () => {
    const cells = buildFloorCells(map).filter((c) => c.kind === map.floor)
    expect(new Set(cells.map((c) => c.color)).size).toBeGreaterThan(5)
  })
})
