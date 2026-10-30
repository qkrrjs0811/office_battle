import { describe, expect, it } from 'vitest'
import { project } from '../core/iso'
import { DESK_SET } from './furniture'
import { AISLES, FURNITURE, SCREEN, TILE, ZONES, buildFloorCells, floorKindAt, type Rect } from './office'

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d

// 장식처럼 납작한 양탄자 위에는 가구를 올려도 된다
const solid = FURNITURE.filter((item) => item.name !== '양탄자')

describe('사무실 배치', () => {
  it('모든 가구가 땅 위에 있다', () => {
    for (const item of FURNITURE) {
      for (const [x, y] of [
        [item.x, item.y],
        [item.x + item.w - 0.01, item.y],
        [item.x, item.y + item.d - 0.01],
        [item.x + item.w - 0.01, item.y + item.d - 0.01],
      ]) {
        expect(floorKindAt(Math.floor(x), Math.floor(y)), `${item.name} (${x}, ${y})`).not.toBeNull()
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
    for (const item of FURNITURE) {
      for (const aisle of AISLES) {
        expect(overlaps(item, aisle), `${item.name}(${item.x},${item.y})`).toBe(false)
      }
    }
  })

  it('복도가 업무 구역부터 임원실까지 끊기지 않고 이어진다', () => {
    const isAisle = (x: number, y: number) => AISLES.some((r) => overlaps({ x, y, w: 1, d: 1 }, r))
    const start = ZONES[0]
    const last = ZONES.find((z) => z.id === 'executive')!
    const seen = new Set<string>()
    const queue: [number, number][] = [[start.x, AISLES[0].y]]
    while (queue.length > 0) {
      const [x, y] = queue.pop()!
      const key = `${x},${y}`
      if (seen.has(key) || !isAisle(x, y)) continue
      seen.add(key)
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    expect(seen.has(`${last.x + last.w - 1},${AISLES[2].y}`)).toBe(true)
  })

  it('회사 구역 다섯 곳이 모두 있고 서로 겹치지 않는다', () => {
    expect(ZONES.map((z) => z.id)).toEqual(['work', 'meeting', 'lounge', 'executive', 'archive'])
    ZONES.forEach((a, i) => ZONES.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)))
  })

  it('맵이 화면보다 크고 세로로 이어진다', () => {
    const points = buildFloorCells().map((c) => project({ x: c.x, y: c.y, z: 0 }, TILE))
    const width = Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x))
    const height = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y))
    expect(width).toBeGreaterThan(SCREEN.width)
    expect(height).toBeGreaterThan(SCREEN.height)
  })

  it('책상 한 세트가 화면 폭의 1/4 이상으로 보인다', () => {
    expect((DESK_SET.w + DESK_SET.d) * TILE.halfWidth).toBeGreaterThanOrEqual(SCREEN.width / 4)
  })

  it('바닥은 사무실 구역뿐이고 잔디 같은 바깥 땅이 없다', () => {
    const inZone = (x: number, y: number) => ZONES.some((z) => overlaps({ x, y, w: 1, d: 1 }, z))
    for (const cell of buildFloorCells()) {
      expect(inZone(cell.x, cell.y), `(${cell.x}, ${cell.y}) ${cell.kind}`).toBe(true)
      expect(['wood', 'darkWood', 'tile']).toContain(cell.kind)
    }
  })

  it('나무, 벤치, 울타리 같은 바깥 물건이 없다', () => {
    const names = FURNITURE.map((item) => item.name)
    for (const outdoor of ['나무', '벤치', '울타리']) expect(names).not.toContain(outdoor)
  })

  it('층 가장자리는 복도 끝 출입구만 빼고 벽으로 막혀 있다', () => {
    const walls = FURNITURE.filter((item) => ['창문 벽', '유리 칸막이', '낮은 벽'].includes(item.name))
    const walled = (x: number, y: number) => walls.some((w) => x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.d)
    const isAisle = (x: number, y: number) => AISLES.some((r) => overlaps({ x, y, w: 1, d: 1 }, r))
    const inset = 0.15
    for (const { x, y } of buildFloorCells()) {
      if (isAisle(x, y)) continue
      const edges: [number, number, number, number][] = [
        [x - 1, y, x + inset, y + 0.5],
        [x + 1, y, x + 1 - inset, y + 0.5],
        [x, y - 1, x + 0.5, y + inset],
        [x, y + 1, x + 0.5, y + 1 - inset],
      ]
      for (const [nx, ny, px, py] of edges) {
        if (floorKindAt(nx, ny)) continue
        expect(walled(px, py), `칸 (${x}, ${y})에서 (${nx}, ${ny}) 쪽`).toBe(true)
      }
    }
  })

  it('층 전체가 끊기지 않은 한 덩어리다', () => {
    const cells = buildFloorCells()
    const all = new Set(cells.map((c) => `${c.x},${c.y}`))
    const seen = new Set<string>()
    const queue: [number, number][] = [[cells[0].x, cells[0].y]]
    while (queue.length > 0) {
      const [x, y] = queue.pop()!
      const key = `${x},${y}`
      if (seen.has(key) || !all.has(key)) continue
      seen.add(key)
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    expect(seen.size).toBe(all.size)
  })

  it('같은 재질 안에서도 칸마다 색이 조금씩 다르다', () => {
    const wood = buildFloorCells().filter((c) => c.kind === 'wood')
    expect(new Set(wood.map((c) => c.color)).size).toBeGreaterThan(5)
  })
})
