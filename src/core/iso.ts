// 쿼터뷰 블록의 좌표 계산과 그리는 순서. 화면 없이 테스트한다.
export type Tile = { halfWidth: number; halfHeight: number; zUnit: number }
export type Point3 = { x: number; y: number; z: number }
export type Point2 = { x: number; y: number }

// x·y는 바닥 칸, z는 높이. w는 x 방향, d는 y 방향, h는 높이 방향 크기다.
export type Block = Point3 & { w: number; d: number; h: number; color: number; alpha?: number }

// 모든 점이 여백 안쪽에 들어오도록 줄이거나 늘려 화면 가운데에 놓는다.
export function fitInto(points: Point2[], screen: { width: number; height: number }, margin: number) {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  const width = Math.max(...xs) - left
  const height = Math.max(...ys) - top
  const scale = Math.min((screen.width - margin * 2) / width, (screen.height - margin * 2) / height)
  const startX = (screen.width - width * scale) / 2
  const startY = (screen.height - height * scale) / 2
  return {
    scale,
    place: (p: Point2): Point2 => ({ x: startX + (p.x - left) * scale, y: startY + (p.y - top) * scale }),
  }
}

const LEFT_SHADE = 0.8
const RIGHT_SHADE = 0.62

export function project({ x, y, z }: Point3, tile: Tile): Point2 {
  return { x: (x - y) * tile.halfWidth, y: (x + y) * tile.halfHeight - z * tile.zUnit }
}

export function blockFaces(block: Block, tile: Tile) {
  const { x, y, z, w, d, h } = block
  const at = (px: number, py: number, pz: number) => project({ x: px, y: py, z: pz }, tile)
  return {
    top: [at(x, y, z + h), at(x + w, y, z + h), at(x + w, y + d, z + h), at(x, y + d, z + h)],
    left: [at(x, y + d, z + h), at(x + w, y + d, z + h), at(x + w, y + d, z), at(x, y + d, z)],
    right: [at(x + w, y + d, z + h), at(x + w, y, z + h), at(x + w, y, z), at(x + w, y + d, z)],
  }
}

export function shade(color: number, factor: number) {
  const channel = (shift: number) => Math.min(255, Math.round(((color >> shift) & 0xff) * factor))
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}

export function faceColors(color: number) {
  return { top: color, left: shade(color, LEFT_SHADE), right: shade(color, RIGHT_SHADE) }
}

const EPSILON = 1e-6

// 화면에서 겹칠 수 있는 두 블록만 앞뒤를 따진다. 겹치지 않는 쌍까지 따지면 순서가 꼬인다.
function overlapOnScreen(a: Block, b: Block, tile: Tile) {
  const separated = (minA: number, maxA: number, minB: number, maxB: number) =>
    maxA <= minB + EPSILON || maxB <= minA + EPSILON
  if (separated(a.x - a.y - a.d, a.x + a.w - a.y, b.x - b.y - b.d, b.x + b.w - b.y)) return false
  const span = (block: Block) => {
    const top = project({ x: block.x, y: block.y, z: block.z + block.h }, tile).y
    const bottom = project({ x: block.x + block.w, y: block.y + block.d, z: block.z }, tile).y
    return [top, bottom]
  }
  const [minA, maxA] = span(a)
  const [minB, maxB] = span(b)
  return !separated(minA, maxA, minB, maxB)
}

function isBehind(a: Block, b: Block) {
  return a.x + a.w <= b.x + EPSILON || a.y + a.d <= b.y + EPSILON || a.z + a.h <= b.z + EPSILON
}

// 위상 정렬로 뒤에서 앞으로 줄을 세운다. 앞뒤가 빙 도는 경우에는 가장 뒤쪽 블록부터 풀어 준다.
export function sortBlocks<T extends Block>(blocks: T[], tile: Tile): T[] {
  const depth = (block: T) => block.x + block.y + block.z
  const pending = new Array<number>(blocks.length).fill(0)
  const fronts: number[][] = blocks.map(() => [])
  blocks.forEach((a, i) => {
    for (let j = i + 1; j < blocks.length; j++) {
      const b = blocks[j]
      if (!overlapOnScreen(a, b, tile)) continue
      const aFirst = isBehind(a, b)
      const bFirst = isBehind(b, a)
      if (aFirst === bFirst) continue
      const [from, to] = aFirst ? [i, j] : [j, i]
      fronts[from].push(to)
      pending[to]++
    }
  })

  const remaining = new Set(blocks.map((_, i) => i))
  const sorted: T[] = []
  while (remaining.size > 0) {
    let next = -1
    let stuck = -1
    for (const i of remaining) {
      if (pending[i] === 0 && (next < 0 || depth(blocks[i]) < depth(blocks[next]))) next = i
      if (stuck < 0 || depth(blocks[i]) < depth(blocks[stuck])) stuck = i
    }
    const chosen = next >= 0 ? next : stuck
    remaining.delete(chosen)
    sorted.push(blocks[chosen])
    for (const front of fronts[chosen]) pending[front]--
  }
  return sorted
}
