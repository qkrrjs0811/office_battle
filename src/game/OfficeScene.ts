import Phaser from 'phaser'
import { blockFaces, faceColors, project, sortBlocks, type Block, type Point2 } from '../core/iso'
import {
  BACKGROUND_COLOR,
  FURNITURE,
  ISLAND_SHADOW,
  OBJECT_SHADOW,
  SIDE_LAYERS,
  START_VIEW,
  TILE,
  buildFloorCells,
  floorKindAt,
} from '../data/office'

const MAP_PADDING = 70

// 사람이 없는 사무실 층. 블록을 쌓아 한 장으로 구워 두고 카메라로 둘러본다. 규칙은 넣지 않는다.
export class OfficeScene extends Phaser.Scene {
  private readonly onReady: () => void
  private readonly onCameraMove: (x: number, y: number) => void

  constructor(onReady: () => void, onCameraMove: (x: number, y: number) => void) {
    super('office')
    this.onReady = onReady
    this.onCameraMove = onCameraMove
  }

  create() {
    const blocks = FURNITURE.flatMap((item) => item.blocks)
    const bounds = this.measure(blocks)
    const offset = (p: Point2) => ({ x: p.x - bounds.x, y: p.y - bounds.y })

    const g = this.make.graphics({}, false)
    this.drawIslandShadow(g, offset)
    this.drawFloor(g, offset)
    this.drawObjectShadows(g, offset)
    sortBlocks(blocks, TILE).forEach((block) => this.drawBlock(g, block, offset))

    this.add.renderTexture(0, 0, bounds.width, bounds.height).setOrigin(0).draw(g)
    g.destroy()

    const camera = this.cameras.main
    camera.setBackgroundColor(BACKGROUND_COLOR)
    camera.setBounds(0, 0, bounds.width, bounds.height)
    const start = offset(project({ ...START_VIEW, z: 0 }, TILE))
    camera.centerOn(start.x, start.y)
    this.enableDrag()
    this.onCameraMove(camera.scrollX, camera.scrollY)
    this.onReady()
  }

  private enableDrag() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return
      const camera = this.cameras.main
      camera.scrollX -= pointer.position.x - pointer.prevPosition.x
      camera.scrollY -= pointer.position.y - pointer.prevPosition.y
      // 카메라 경계는 그리기 직전에 적용되므로, 기록하는 값도 여기서 맞춰 둔다
      camera.scrollX = Phaser.Math.Clamp(camera.scrollX, camera.getBounds().x, camera.getBounds().right - camera.width)
      camera.scrollY = Phaser.Math.Clamp(camera.scrollY, camera.getBounds().y, camera.getBounds().bottom - camera.height)
      this.onCameraMove(camera.scrollX, camera.scrollY)
    })
  }

  private measure(blocks: Block[]) {
    const points = [
      ...buildFloorCells().flatMap((c) => [
        project({ x: c.x, y: c.y, z: 0 }, TILE),
        project({ x: c.x + 1, y: c.y + 1, z: -2 }, TILE),
        project({ x: c.x + 1, y: c.y, z: 0 }, TILE),
        project({ x: c.x, y: c.y + 1, z: 0 }, TILE),
      ]),
      ...blocks.map((b) => project({ x: b.x, y: b.y, z: b.z + b.h }, TILE)),
    ]
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const x = Math.floor(Math.min(...xs)) - MAP_PADDING
    const y = Math.floor(Math.min(...ys)) - MAP_PADDING
    return {
      x,
      y,
      width: Math.ceil(Math.max(...xs)) + MAP_PADDING - x,
      height: Math.ceil(Math.max(...ys)) + MAP_PADDING + ISLAND_SHADOW.offsetY - y,
    }
  }

  private fillFace(g: Phaser.GameObjects.Graphics, face: Point2[], color: number, alpha: number, offset: (p: Point2) => Point2) {
    g.fillStyle(color, alpha)
    g.fillPoints(face.map(offset), true)
  }

  private drawIslandShadow(g: Phaser.GameObjects.Graphics, offset: (p: Point2) => Point2) {
    for (const cell of buildFloorCells()) {
      const { top } = blockFaces({ x: cell.x, y: cell.y, z: 0, w: 1, d: 1, h: 0, color: 0 }, TILE)
      const lowered = top.map((p) => ({ x: p.x, y: p.y + ISLAND_SHADOW.offsetY + 34 }))
      this.fillFace(g, lowered, ISLAND_SHADOW.color, ISLAND_SHADOW.alpha, offset)
    }
  }

  private drawFloor(g: Phaser.GameObjects.Graphics, offset: (p: Point2) => Point2) {
    const cells = [...buildFloorCells()].sort((a, b) => a.x + a.y - (b.x + b.y))
    for (const cell of cells) {
      let z = 0
      const hasFront = floorKindAt(cell.x, cell.y + 1)
      const hasRight = floorKindAt(cell.x + 1, cell.y)
      for (const [i, layer] of SIDE_LAYERS.entries()) {
        const height = i === 1 ? layer.height + cell.sideJitter : layer.height
        const block = { x: cell.x, y: cell.y, z: z - height, w: 1, d: 1, h: height, color: layer.color }
        const faces = blockFaces(block, TILE)
        const colors = faceColors(layer.color)
        if (!hasFront) this.fillFace(g, faces.left, colors.left, 1, offset)
        if (!hasRight) this.fillFace(g, faces.right, colors.right, 1, offset)
        z -= height
      }
      const { top } = blockFaces({ x: cell.x, y: cell.y, z: 0, w: 1, d: 1, h: 0, color: cell.color }, TILE)
      this.fillFace(g, top, cell.color, 1, offset)
    }
  }

  // 부드럽게 보이도록 넓은 그림자 위에 좁은 그림자를 한 겹 더 깐다.
  private drawObjectShadows(g: Phaser.GameObjects.Graphics, offset: (p: Point2) => Point2) {
    for (const item of FURNITURE) {
      if (item.name === '양탄자' || item.name === '낮은 벽') continue
      for (const spread of [OBJECT_SHADOW.spread * 2, OBJECT_SHADOW.spread]) {
        const { top } = blockFaces(
          {
            x: item.x + 0.1 - spread,
            y: item.y + 0.1 - spread,
            z: 0,
            w: item.w + spread * 2,
            d: item.d + spread * 2,
            h: 0,
            color: 0,
          },
          TILE,
        )
        this.fillFace(g, top, OBJECT_SHADOW.color, OBJECT_SHADOW.alpha / 2, offset)
      }
    }
  }

  private drawBlock(g: Phaser.GameObjects.Graphics, block: Block, offset: (p: Point2) => Point2) {
    const faces = blockFaces(block, TILE)
    const colors = faceColors(block.color)
    const alpha = block.alpha ?? 1
    this.fillFace(g, faces.left, colors.left, alpha, offset)
    this.fillFace(g, faces.right, colors.right, alpha, offset)
    this.fillFace(g, faces.top, colors.top, alpha, offset)
  }
}
