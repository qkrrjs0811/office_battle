import { describe, expect, it } from 'vitest'
import { buildFloorPlan, findDoor, findOverlaps } from './floorPlan'

const rooms = [
  { id: 'a', x: 0, y: 0, w: 2, h: 2 },
  { id: 'b', x: 2, y: 0, w: 2, h: 2 },
  { id: 'c', x: 0, y: 2, w: 4, h: 1 },
  { id: 'd', x: 4, y: 2, w: 1, h: 1 },
]
const maps = [
  { id: 'a', portals: [{ to: 'b' }, { to: 'c' }] },
  { id: 'b', portals: [{ to: 'a' }] },
  { id: 'c', portals: [{ to: 'a' }, { to: 'd' }] },
  { id: 'd', portals: [{ to: 'c' }] },
]

describe('두 방 사이의 문', () => {
  it('맞닿은 벽의 가운데에 놓인다', () => {
    expect(findDoor(rooms[0], rooms[1])).toEqual({ x: 2, y: 1, alongX: false })
    expect(findDoor(rooms[0], rooms[2])).toEqual({ x: 1, y: 2, alongX: true })
  })

  it('벽이 일부만 맞닿아도 겹치는 구간의 가운데다', () => {
    expect(findDoor(rooms[1], rooms[2])).toEqual({ x: 3, y: 2, alongX: true })
  })

  it('떨어져 있거나 모서리만 닿으면 문을 낼 수 없다', () => {
    expect(findDoor(rooms[0], rooms[3])).toBeNull()
    expect(findDoor(rooms[1], rooms[3])).toBeNull()
  })
})

describe('층 구조도', () => {
  it('지금 있는 방 하나와 포탈로 바로 갈 수 있는 방을 표시한다', () => {
    const plan = buildFloorPlan(rooms, maps, 'c')
    const stateOf = (id: string) => plan.rooms.find((r) => r.id === id)!
    expect(plan.rooms.filter((r) => r.here).map((r) => r.id)).toEqual(['c'])
    expect(plan.rooms.filter((r) => r.next).map((r) => r.id)).toEqual(['a', 'd'])
    expect(stateOf('c').next).toBe(false)
    expect(stateOf('b').here).toBe(false)
  })

  it('전체 크기는 가장 먼 방 끝까지다', () => {
    const plan = buildFloorPlan(rooms, maps, 'a')
    expect(plan.width).toBe(5)
    expect(plan.height).toBe(3)
  })

  it('포탈로 이어진 방마다 문이 하나씩 있다', () => {
    const plan = buildFloorPlan(rooms, maps, 'a')
    expect(plan.doors).toEqual([
      { x: 2, y: 1, alongX: false },
      { x: 1, y: 2, alongX: true },
      { x: 4, y: 2.5, alongX: false },
    ])
  })

  it('포탈로 이어졌는데 벽이 맞닿지 않으면 잘못된 구조도다', () => {
    const apart = [{ id: 'a', portals: [{ to: 'd' }] }, { id: 'd', portals: [{ to: 'a' }] }]
    expect(() => buildFloorPlan(rooms, apart, 'a')).toThrow()
  })

  it('구조도에 없는 맵에 있으면 잘못된 구조도다', () => {
    expect(() => buildFloorPlan(rooms, maps, 'x')).toThrow()
  })
})

describe('방 겹침 검사', () => {
  it('맞닿은 방은 겹친 것이 아니다', () => {
    expect(findOverlaps(rooms)).toEqual([])
  })

  it('겹친 방을 찾아낸다', () => {
    expect(findOverlaps([rooms[0], { id: 'z', x: 1, y: 1, w: 2, h: 2 }])).toEqual(['a×z'])
  })
})
