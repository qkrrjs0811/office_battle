import Phaser from 'phaser'
import { blockFaces, faceColors, project, sortBlocks, type Block, type Point2 } from '../core/iso'
import { travel } from '../core/travel'
import { PORTAL_SIZE } from '../data/furniture'
import { MAPS, START_MAP } from '../data/maps'
import {
  ARRIVAL_ROOM_PULL,
  ISLAND_SHADOW,
  OBJECT_SHADOW,
  PORTAL_SIGN_Z,
  SCREEN,
  SIDE_LAYERS,
  TILE,
  TRAVEL_FADE,
  buildFloorCells,
  floorKindAt,
  portalCenter,
  type GameMap,
  type MapId,
  type Portal,
} from '../data/office'

const MAP_PADDING = 70

export type PortalSign = { to: MapId; x: number; y: number; accent: number; label: string }

export type SceneEvents = {
  onMapShown: (map: GameMap, signs: PortalSign[]) => void
  onMapReady: (map: GameMap) => void
  onCameraMove: (x: number, y: number) => void
}

// 사람이 없는 사무실 맵 한 곳. 블록을 쌓아 한 장으로 구워 두고 카메라로 둘러본다. 규칙은 넣지 않는다.
export class OfficeScene extends Phaser.Scene {
  private readonly events_: SceneEvents
  private map!: GameMap
  private leaving = false

  constructor(events: SceneEvents) {
    super('office')
    this.events_ = events
  }

  create(data: { mapId?: MapId; arrival?: Portal }) {
    this.map = MAPS.find((m) => m.id === (data.mapId ?? START_MAP))!
    this.leaving = false
    const blocks = this.map.furniture.flatMap((item) => item.blocks)
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
    camera.setBackgroundColor(this.map.background)
    camera.setBounds(0, 0, bounds.width, bounds.height)
    const start = offset(project({ ...this.startView(data.arrival ?? this.map.portals[0]), z: 0 }, TILE))
    camera.centerOn(start.x, start.y)
    this.clampCamera()
    this.enableDrag()

    this.events_.onMapShown(this.map, this.portalSigns(offset))
    this.events_.onCameraMove(camera.scrollX, camera.scrollY)
    if (data.arrival) {
      const { ms, red, green, blue } = TRAVEL_FADE
      camera.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => this.events_.onMapReady(this.map))
      camera.fadeIn(ms, red, green, blue)
    } else {
      this.events_.onMapReady(this.map)
    }
  }

  travelTo(to: MapId) {
    if (this.leaving) return
    this.leaving = true
    const { map, arrival } = travel(MAPS, this.map.id, to)
    this.scene.restart({ mapId: map.id, arrival })
  }

  private startView(portal: Portal) {
    const center = portalCenter(portal, PORTAL_SIZE.span, PORTAL_SIZE.depth)
    return {
      x: center.x + (this.map.width / 2 - center.x) * ARRIVAL_ROOM_PULL,
      y: center.y + (this.map.depth / 2 - center.y) * ARRIVAL_ROOM_PULL,
    }
  }

  private portalSigns(offset: (p: Point2) => Point2): PortalSign[] {
    return this.map.portals.map((portal) => {
      const center = portalCenter(portal, PORTAL_SIZE.span, PORTAL_SIZE.depth)
      const target = MAPS.find((m) => m.id === portal.to)!
      return {
        to: portal.to,
        accent: target.accent,
        label: target.name,
        ...offset(project({ ...center, z: PORTAL_SIGN_Z }, TILE)),
      }
    })
  }

  // 카메라 경계는 그리기 직전에 적용되므로, 기록하는 값도 여기서 맞춰 둔다
  private clampCamera() {
    const camera = this.cameras.main
    camera.scrollX = Phaser.Math.Clamp(camera.scrollX, camera.getBounds().x, camera.getBounds().right - camera.width)
    camera.scrollY = Phaser.Math.Clamp(camera.scrollY, camera.getBounds().y, camera.getBounds().bottom - camera.height)
  }

  private enableDrag() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return
      const camera = this.cameras.main
      camera.scrollX -= pointer.position.x - pointer.prevPosition.x
      camera.scrollY -= pointer.position.y - pointer.prevPosition.y
      this.clampCamera()
      this.events_.onCameraMove(camera.scrollX, camera.scrollY)
    })
  }

  // 맵이 화면보다 작은 쪽은 위아래(좌우)로 여백을 붙여 화면 가운데에 놓는다.
  private measure(blocks: Block[]) {
    const points = [
      ...buildFloorCells(this.map).flatMap((c) => [
        project({ x: c.x, y: c.y, z: 0 }, TILE),
        project({ x: c.x + 1, y: c.y + 1, z: -2 }, TILE),
        project({ x: c.x + 1, y: c.y, z: 0 }, TILE),
        project({ x: c.x, y: c.y + 1, z: 0 }, TILE),
      ]),
      ...blocks.map((b) => project({ x: b.x, y: b.y, z: b.z + b.h }, TILE)),
      ...this.map.portals.map((p) => project({ ...portalCenter(p, PORTAL_SIZE.span, PORTAL_SIZE.depth), z: PORTAL_SIGN_Z }, TILE)),
    ]
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const left = Math.floor(Math.min(...xs)) - MAP_PADDING
    const top = Math.floor(Math.min(...ys)) - MAP_PADDING
    const contentWidth = Math.ceil(Math.max(...xs)) + MAP_PADDING - left
    const contentHeight = Math.ceil(Math.max(...ys)) + MAP_PADDING + ISLAND_SHADOW.offsetY - top
    const extraX = Math.max(0, SCREEN.width - contentWidth)
    const extraY = Math.max(0, SCREEN.height - contentHeight)
    return {
      x: left - Math.floor(extraX / 2),
      y: top - Math.floor(extraY / 2),
      width: contentWidth + extraX,
      height: contentHeight + extraY,
    }
  }

  private fillFace(g: Phaser.GameObjects.Graphics, face: Point2[], color: number, alpha: number, offset: (p: Point2) => Point2) {
    g.fillStyle(color, alpha)
    g.fillPoints(face.map(offset), true)
  }

  private drawIslandShadow(g: Phaser.GameObjects.Graphics, offset: (p: Point2) => Point2) {
    for (const cell of buildFloorCells(this.map)) {
      const { top } = blockFaces({ x: cell.x, y: cell.y, z: 0, w: 1, d: 1, h: 0, color: 0 }, TILE)
      const lowered = top.map((p) => ({ x: p.x, y: p.y + ISLAND_SHADOW.offsetY + 34 }))
      this.fillFace(g, lowered, ISLAND_SHADOW.color, ISLAND_SHADOW.alpha, offset)
    }
  }

  private drawFloor(g: Phaser.GameObjects.Graphics, offset: (p: Point2) => Point2) {
    const cells = [...buildFloorCells(this.map)].sort((a, b) => a.x + a.y - (b.x + b.y))
    for (const cell of cells) {
      let z = 0
      const hasFront = floorKindAt(this.map, cell.x, cell.y + 1)
      const hasRight = floorKindAt(this.map, cell.x + 1, cell.y)
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
    for (const item of this.map.furniture) {
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
