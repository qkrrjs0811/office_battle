// 1층 구조도의 방 배치. 맨 아래가 회사 정문이고 위로 갈수록 안쪽이다.
// 포탈로 이어진 방은 벽이 맞닿게 놓는다. 가운데 빈 칸에는 층 이름을 쓴다.
import type { PlanRoom } from '../core/floorPlan'
import type { MapId } from './office'

export const FLOOR_PLAN_ROOMS: (PlanRoom & { id: MapId })[] = [
  { id: 'meeting', x: 0, y: 0, w: 2, h: 2 },
  { id: 'executive', x: 2, y: 0, w: 2, h: 2 },
  { id: 'archive', x: 4, y: 0, w: 2, h: 2 },
  { id: 'work', x: 0, y: 2, w: 2, h: 2 },
  { id: 'lounge', x: 4, y: 2, w: 2, h: 2 },
  { id: 'gate', x: 0, y: 4, w: 3, h: 2 },
  { id: 'restroom', x: 3, y: 4, w: 3, h: 2 },
]

export const FLOOR_PLAN_TEXT = {
  title: (storey: number) => `${storey}층 구조도`,
  here: '내 위치',
  next: (name: string) => `→ ${name}`,
}
