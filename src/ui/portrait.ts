import { blockFaces, faceColors, type Point2 } from '../core/iso'
import { PORTRAIT_BLOCKS, PORTRAIT_TILE } from '../data/profile'

const SVG_NS = 'http://www.w3.org/2000/svg'
const PADDING = 2

const toCssColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`

// 프로필 얼굴을 맵과 같은 블록 세 면으로 그린다.
export function createPortrait() {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.classList.add('profile-portrait')
  svg.dataset.testid = 'profile-portrait'
  const points: Point2[] = []
  for (const block of PORTRAIT_BLOCKS) {
    const faces = blockFaces(block, PORTRAIT_TILE)
    const colors = faceColors(block.color)
    for (const side of ['left', 'right', 'top'] as const) {
      const polygon = document.createElementNS(SVG_NS, 'polygon')
      polygon.setAttribute('points', faces[side].map((p) => `${p.x},${p.y}`).join(' '))
      polygon.setAttribute('fill', toCssColor(colors[side]))
      svg.append(polygon)
      points.push(...faces[side])
    }
  }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const left = Math.min(...xs) - PADDING
  const top = Math.min(...ys) - PADDING
  const width = Math.max(...xs) + PADDING - left
  const height = Math.max(...ys) + PADDING - top
  svg.setAttribute('viewBox', `${left} ${top} ${width} ${height}`)
  return svg
}
