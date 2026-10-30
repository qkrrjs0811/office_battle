// 한 층의 방 배치와 내 위치를 구조도로 만드는 규칙. 포탈로 이어진 방은 벽이 맞닿아 문으로 그린다.
import type { LinkedMap } from './travel'

export type PlanRoom = { id: string; x: number; y: number; w: number; h: number }
export type PlanDoor = { x: number; y: number; alongX: boolean }

// 두 구간이 길이 있게 겹치면 그 가운데를 돌려준다. 끝점만 닿으면 겹친 것이 아니다.
const sharedMiddle = (startA: number, endA: number, startB: number, endB: number) => {
  const start = Math.max(startA, startB)
  const end = Math.min(endA, endB)
  return end > start ? (start + end) / 2 : null
}

export function findDoor(a: PlanRoom, b: PlanRoom): PlanDoor | null {
  if (a.x + a.w === b.x || b.x + b.w === a.x) {
    const y = sharedMiddle(a.y, a.y + a.h, b.y, b.y + b.h)
    if (y !== null) return { x: a.x + a.w === b.x ? b.x : a.x, y, alongX: false }
  }
  if (a.y + a.h === b.y || b.y + b.h === a.y) {
    const x = sharedMiddle(a.x, a.x + a.w, b.x, b.x + b.w)
    if (x !== null) return { x, y: a.y + a.h === b.y ? b.y : a.y, alongX: true }
  }
  return null
}

export function buildFloorPlan<R extends PlanRoom>(rooms: R[], maps: LinkedMap[], hereId: string) {
  const roomOf = (id: string) => {
    const room = rooms.find((r) => r.id === id)
    if (!room) throw new Error(`구조도에 없는 맵이다: ${id}`)
    return room
  }
  roomOf(hereId)

  const doors: PlanDoor[] = []
  const linked = new Set<string>()
  for (const map of maps) {
    for (const { to } of map.portals) {
      const pair = [map.id, to].sort().join('|')
      if (linked.has(pair)) continue
      linked.add(pair)
      const door = findDoor(roomOf(map.id), roomOf(to))
      if (!door) throw new Error(`포탈로 이어졌는데 벽이 맞닿지 않는다: ${map.id}, ${to}`)
      doors.push(door)
    }
  }

  const nextIds = maps.find((m) => m.id === hereId)?.portals.map((p) => p.to) ?? []
  return {
    width: Math.max(...rooms.map((r) => r.x + r.w)),
    height: Math.max(...rooms.map((r) => r.y + r.h)),
    rooms: rooms.map((room) => ({ ...room, here: room.id === hereId, next: nextIds.includes(room.id) })),
    doors,
  }
}

// 겹친 방을 'a×b'로 돌려준다.
export function findOverlaps(rooms: PlanRoom[]): string[] {
  return rooms.flatMap((a, i) =>
    rooms
      .slice(i + 1)
      .filter((b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
      .map((b) => `${a.id}×${b.id}`),
  )
}
