import Phaser from 'phaser'
import { COLORS, DESKS, DOOR, PLANTS, SCREEN, WALL_HEIGHT, WINDOWS, type Box } from '../data/office'

// 사람이 없는 사무실 층. 그림만 그리고 규칙은 넣지 않는다.
export class OfficeScene extends Phaser.Scene {
  private readonly onReady: () => void

  constructor(onReady: () => void) {
    super('office')
    this.onReady = onReady
  }

  create() {
    const g = this.add.graphics()
    this.drawCarpet(g)
    this.drawWall(g)
    WINDOWS.forEach((box) => this.drawWindow(g, box))
    this.drawDoor(g, DOOR)
    DESKS.forEach((box) => this.drawDesk(g, box))
    PLANTS.forEach((box) => this.drawPlant(g, box))
    this.onReady()
  }

  private drawCarpet(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(COLORS.carpet)
    g.fillRect(0, WALL_HEIGHT, SCREEN.width, SCREEN.height - WALL_HEIGHT)
    g.fillStyle(COLORS.carpetLine)
    for (let y = WALL_HEIGHT + 40; y < SCREEN.height; y += 40) g.fillRect(0, y, SCREEN.width, 2)
    for (let x = 39; x < SCREEN.width; x += 40) g.fillRect(x, WALL_HEIGHT, 2, SCREEN.height - WALL_HEIGHT)
  }

  private drawWall(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(COLORS.wall)
    g.fillRect(0, 0, SCREEN.width, WALL_HEIGHT)
    g.fillStyle(COLORS.wallTrim)
    g.fillRect(0, WALL_HEIGHT - 6, SCREEN.width, 6)
  }

  private drawWindow(g: Phaser.GameObjects.Graphics, { x, y, width, height }: Box) {
    g.fillStyle(COLORS.windowFrame)
    g.fillRect(x, y, width, height)
    g.fillStyle(COLORS.sky)
    g.fillRect(x + 5, y + 5, width - 10, height - 10)
    g.fillStyle(COLORS.windowFrame)
    g.fillRect(x + width / 2 - 2, y, 4, height)
    g.fillRect(x, y + height / 2 - 2, width, 4)
  }

  private drawDoor(g: Phaser.GameObjects.Graphics, { x, y, width, height }: Box) {
    g.fillStyle(COLORS.door)
    g.fillRect(x, y, width, height)
    g.fillStyle(COLORS.doorKnob)
    g.fillCircle(x + width - 12, y + height / 2, 5)
  }

  private drawDesk(g: Phaser.GameObjects.Graphics, { x, y, width, height }: Box) {
    g.fillStyle(COLORS.deskEdge)
    g.fillRect(x, y + 8, width, height - 8)
    g.fillStyle(COLORS.desk)
    g.fillRect(x, y, width, height - 10)
    g.fillStyle(COLORS.monitor)
    g.fillRect(x + 12, y + 4, 42, 30)
    g.fillStyle(COLORS.screen)
    g.fillRect(x + 15, y + 7, 36, 24)
    g.fillStyle(COLORS.paper)
    g.fillRect(x + 64, y + 10, 22, 28)
    g.fillStyle(COLORS.coffee)
    g.fillCircle(x + 98, y + 28, 7)
  }

  private drawPlant(g: Phaser.GameObjects.Graphics, { x, y, width, height }: Box) {
    g.fillStyle(COLORS.leaf)
    g.fillCircle(x + width / 2, y + 16, 16)
    g.fillCircle(x + width / 2 - 11, y + 24, 11)
    g.fillCircle(x + width / 2 + 11, y + 24, 11)
    g.fillStyle(COLORS.pot)
    g.fillRect(x + 8, y + height - 22, width - 16, 22)
  }
}
