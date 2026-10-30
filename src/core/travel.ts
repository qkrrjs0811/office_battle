// 포탈로 맵 사이를 오가는 규칙. 포탈은 언제나 양방향이다.
export type PortalLink = { to: string }
export type LinkedMap<P extends PortalLink = PortalLink> = { id: string; portals: P[] }

const findMap = <M extends LinkedMap>(maps: M[], id: string): M => {
  const map = maps.find((m) => m.id === id)
  if (!map) throw new Error(`없는 맵이다: ${id}`)
  return map
}

// 도착하면 방금 온 맵으로 돌아가는 포탈 앞에 선다.
export function travel<P extends PortalLink, M extends LinkedMap<P>>(maps: M[], fromId: string, toId: string) {
  const from = findMap(maps, fromId)
  if (!from.portals.some((p) => p.to === toId)) throw new Error(`${fromId}에서 ${toId}로 가는 포탈이 없다`)
  const map = findMap(maps, toId)
  const arrival = map.portals.find((p) => p.to === fromId)
  if (!arrival) throw new Error(`${toId}에서 ${fromId}로 돌아오는 포탈이 없다`)
  return { map, arrival }
}

// 없는 맵으로 가거나 돌아올 수 없는 포탈을 '출발→도착'으로 돌려준다.
export function findBrokenLinks(maps: LinkedMap[]): string[] {
  return maps.flatMap((map) =>
    map.portals
      .filter((p) => !maps.find((m) => m.id === p.to)?.portals.some((back) => back.to === map.id))
      .map((p) => `${map.id}→${p.to}`),
  )
}

export function findUnreachable(maps: LinkedMap[], startId: string): string[] {
  const seen = new Set<string>()
  const queue = [startId]
  while (queue.length > 0) {
    const id = queue.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    queue.push(...(maps.find((m) => m.id === id)?.portals.map((p) => p.to) ?? []))
  }
  return maps.map((m) => m.id).filter((id) => !seen.has(id))
}
