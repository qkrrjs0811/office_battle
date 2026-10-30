import { describe, expect, it } from 'vitest'
import { findBrokenLinks, findUnreachable, travel } from './travel'

const ring = [
  { id: 'a', portals: [{ to: 'b' }, { to: 'c' }] },
  { id: 'b', portals: [{ to: 'c' }, { to: 'a' }] },
  { id: 'c', portals: [{ to: 'a' }, { to: 'b' }] },
]

describe('포탈 이동', () => {
  it('포탈로 이어진 맵으로 가고, 돌아오는 포탈 앞에 도착한다', () => {
    const { map, arrival } = travel(ring, 'a', 'b')
    expect(map.id).toBe('b')
    expect(arrival.to).toBe('a')
  })

  it('포탈이 없는 맵으로는 갈 수 없다', () => {
    const lonely = [
      { id: 'a', portals: [] },
      { id: 'b', portals: [] },
    ]
    expect(() => travel(lonely, 'a', 'b')).toThrow()
  })

  it('없는 맵에서 출발하거나 없는 맵으로 갈 수 없다', () => {
    expect(() => travel(ring, 'x', 'a')).toThrow()
    expect(() => travel([{ id: 'a', portals: [{ to: 'x' }] }], 'a', 'x')).toThrow()
  })

  it('돌아오는 포탈이 없는 일방통행은 막는다', () => {
    const oneWay = [
      { id: 'a', portals: [{ to: 'b' }] },
      { id: 'b', portals: [] },
    ]
    expect(() => travel(oneWay, 'a', 'b')).toThrow()
  })
})

describe('포탈 연결 검사', () => {
  it('제대로 이어진 맵에서는 아무것도 찾지 않는다', () => {
    expect(findBrokenLinks(ring)).toEqual([])
    expect(findUnreachable(ring, 'a')).toEqual([])
  })

  it('없는 맵으로 가는 포탈과 일방통행 포탈을 찾아낸다', () => {
    const broken = [
      { id: 'a', portals: [{ to: 'b' }, { to: 'x' }] },
      { id: 'b', portals: [] },
    ]
    expect(findBrokenLinks(broken)).toEqual(['a→b', 'a→x'])
  })

  it('포탈로 닿지 않는 맵을 찾아낸다', () => {
    const split = [
      { id: 'a', portals: [{ to: 'b' }] },
      { id: 'b', portals: [{ to: 'a' }] },
      { id: 'c', portals: [] },
    ]
    expect(findUnreachable(split, 'a')).toEqual(['c'])
  })
})
