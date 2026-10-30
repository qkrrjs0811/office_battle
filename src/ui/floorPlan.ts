import { buildFloorPlan } from '../core/floorPlan'
import { FLOOR_PLAN_ROOMS, FLOOR_PLAN_TEXT } from '../data/floorPlan'
import { MAPS } from '../data/maps'
import type { GameMap } from '../data/office'

const toCssColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`
const percent = (part: number, whole: number) => `${(part / whole) * 100}%`

const element = (className: string, text = '') => {
  const node = document.createElement('div')
  node.className = className
  node.textContent = text
  return node
}

// 맵 아래 빈 곳에 늘 떠 있는 층 구조도. 보기만 하고 누르는 곳은 없다.
export function mountFloorPlan(parent: HTMLElement) {
  const panel = element('floor-plan')
  panel.dataset.testid = 'floor-plan'
  parent.append(panel)

  return {
    show(map: GameMap) {
      const plan = buildFloorPlan(FLOOR_PLAN_ROOMS, MAPS, map.id)
      const place = (node: HTMLElement, x: number, y: number) => {
        node.style.left = percent(x, plan.width)
        node.style.top = percent(y, plan.height)
      }

      const rooms = plan.rooms.map((room) => {
        const { name, accent } = MAPS.find((m) => m.id === room.id)!
        const node = element(`plan-room${room.here ? ' here' : ''}${room.next ? ' next' : ''}`)
        node.dataset.testid = `plan-room-${room.id}`
        node.style.borderColor = toCssColor(accent)
        node.style.width = percent(room.w, plan.width)
        node.style.height = percent(room.h, plan.height)
        place(node, room.x, room.y)
        node.append(element('plan-room-name', room.next ? FLOOR_PLAN_TEXT.next(name) : name))
        if (room.here) {
          const tag = element('plan-here', FLOOR_PLAN_TEXT.here)
          tag.dataset.testid = 'plan-here'
          node.append(tag)
        }
        return node
      })

      const doors = plan.doors.map((door) => {
        const node = element(`plan-door ${door.alongX ? 'along-x' : 'along-y'}`)
        place(node, door.x, door.y)
        return node
      })

      // 방이 비운 가운데 칸에 층 이름을 쓴다
      const title = element('plan-title', FLOOR_PLAN_TEXT.title(map.storey))
      title.dataset.testid = 'plan-title'

      panel.replaceChildren(title, ...rooms, ...doors)
    },
  }
}
