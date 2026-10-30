import { describe, expect, it } from 'vitest'
import { blockFaces, faceColors, project, sortBlocks, type Block, type Tile } from './iso'

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
