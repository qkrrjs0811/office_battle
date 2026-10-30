import { describe, expect, it } from 'vitest'
import { DESKS, DOOR, PLANTS, SCREEN, WINDOWS, type Box } from './office'

const furniture: Box[] = [...WINDOWS, DOOR, ...DESKS, ...PLANTS]

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

describe('사무실 배치', () => {
  it('모든 가구가 화면 안에 있다', () => {
    for (const box of furniture) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(SCREEN.width)
      expect(box.y + box.height).toBeLessThanOrEqual(SCREEN.height)
    }
  })

  it('가구끼리 겹치지 않는다', () => {
    furniture.forEach((a, i) => {
      furniture.slice(i + 1).forEach((b) => {
        expect(overlaps(a, b), `${JSON.stringify(a)} / ${JSON.stringify(b)}`).toBe(false)
      })
    })
  })
})
