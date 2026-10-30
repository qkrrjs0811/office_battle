import { describe, expect, it } from 'vitest'
import { blockFaces, faceColors, fitInto, project, sortBlocks, type Block, type Tile } from './iso'

describe('화면에 맞추기', () => {
  const screen = { width: 1000, height: 500 }

  it('가장 먼 점들이 여백 안쪽에 들어오고 가운데에 놓인다', () => {
    const points = [{ x: -100, y: 0 }, { x: 300, y: 100 }]
    const fit = fitInto(points, screen, 10)
    const a = fit.place(points[0])
    const b = fit.place(points[1])
    expect(fit.scale).toBeCloseTo(980 / 400)
    expect(a.x).toBeCloseTo(10)
    expect(b.x).toBeCloseTo(990)
    expect((a.y + b.y) / 2).toBeCloseTo(250)
  })

  it('세로가 더 빠듯하면 세로에 맞춘다', () => {
    const points = [{ x: 0, y: 0 }, { x: 100, y: 960 }]
    const fit = fitInto(points, screen, 10)
    expect(fit.scale).toBeCloseTo(480 / 960)
    expect(fit.place(points[1]).y).toBeCloseTo(490)
    expect((fit.place(points[0]).x + fit.place(points[1]).x) / 2).toBeCloseTo(500)
  })

  it('맵이 화면보다 작으면 크게 늘린다', () => {
    expect(fitInto([{ x: 0, y: 0 }, { x: 99.8, y: 40 }], screen, 1).scale).toBeCloseTo(10)
  })
})

const tile: Tile = { halfWidth: 20, halfHeight: 10, zUnit: 20 }
const box = (x: number, y: number, z = 0, w = 1, d = 1, h = 1): Block => ({ x, y, z, w, d, h, color: 0x808080 })

describe('쿼터뷰 좌표', () => {
  it('x가 늘면 오른쪽 아래로, y가 늘면 왼쪽 아래로, 높이가 늘면 위로 간다', () => {
    expect(project({ x: 0, y: 0, z: 0 }, tile)).toEqual({ x: 0, y: 0 })
    expect(project({ x: 1, y: 0, z: 0 }, tile)).toEqual({ x: 20, y: 10 })
    expect(project({ x: 0, y: 1, z: 0 }, tile)).toEqual({ x: -20, y: 10 })
    expect(project({ x: 0, y: 0, z: 1 }, tile)).toEqual({ x: 0, y: -20 })
  })

  it('블록의 윗면·왼쪽 면·오른쪽 면이 맞는 자리에 나온다', () => {
    const faces = blockFaces(box(0, 0), tile)
    expect(faces.top).toEqual([
      { x: 0, y: -20 },
      { x: 20, y: -10 },
      { x: 0, y: 0 },
      { x: -20, y: -10 },
    ])
    expect(Math.min(...faces.left.map((p) => p.x))).toBe(-20)
    expect(Math.max(...faces.left.map((p) => p.x))).toBe(0)
    expect(Math.min(...faces.right.map((p) => p.x))).toBe(0)
    expect(Math.max(...faces.right.map((p) => p.x))).toBe(20)
    expect(Math.max(...faces.left.map((p) => p.y))).toBe(20)
  })

  it('윗면이 가장 밝고 오른쪽 면이 가장 어둡다', () => {
    const { top, left, right } = faceColors(0x808080)
    expect(top).toBe(0x808080)
    expect(left).toBeLessThan(top)
    expect(right).toBeLessThan(left)
  })
})

describe('그리는 순서', () => {
  const orderOf = (blocks: Block[]) => {
    const sorted = sortBlocks(blocks, tile)
    return (block: Block) => sorted.indexOf(block)
  }

  it('뒤에 있는 블록을 먼저 그린다', () => {
    const back = box(0, 0)
    const frontX = box(1, 0)
    const frontY = box(0, 1)
    const order = orderOf([frontX, frontY, back])
    expect(order(back)).toBeLessThan(order(frontX))
    expect(order(back)).toBeLessThan(order(frontY))
  })

  it('아래 블록을 위 블록보다 먼저 그린다', () => {
    const lower = box(0, 0, 0)
    const upper = box(0, 0, 1)
    const order = orderOf([upper, lower])
    expect(order(lower)).toBeLessThan(order(upper))
  })

  it('긴 벽 앞의 작은 물건은 벽보다 나중에 그린다. 좌표 합만 비교하면 틀리는 경우다', () => {
    const wall = box(0, 0, 0, 20, 1, 2)
    const chair = box(1, 1, 0)
    const order = orderOf([chair, wall])
    expect(order(wall)).toBeLessThan(order(chair))
  })

  it('서로 가리는 블록이 빙 둘러 있어도 하나도 빠뜨리지 않는다', () => {
    const blocks = [box(0, 0, 0, 3, 1, 1), box(3, 0, 0, 1, 3, 1), box(1, 3, 0, 3, 1, 1), box(0, 1, 0, 1, 3, 1)]
    expect(sortBlocks(blocks, tile)).toHaveLength(4)
  })
})
