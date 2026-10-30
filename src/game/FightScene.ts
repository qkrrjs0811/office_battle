import Phaser from 'phaser'
import type { FightEvent } from '../core/combat'
import type { OpponentKind } from '../core/career'
import { blockFaces, faceColors, project, sortBlocks, type Block, type Point2 } from '../core/iso'
import {
  COFFEE_BLOCKS,
  ENEMY_BLOCKS,
  FIGHT_EFFECT,
  FIGHT_PROPS,
  FIGHT_STAGE,
  FIGHT_TILE,
  PAPER_BLOCK,
  PLAYER_BLOCKS,
} from '../data/fightStage'
import { FIGHT_TEXT } from '../data/fightText'
import { SCREEN } from '../data/office'

export type FightPose = { dashing: boolean; overtimeActive: boolean }

const FONT = '700 20px sans-serif'

const onFloor = (point: Point2): Point2 => {
  const { x, y } = project({ ...point, z: 0 }, FIGHT_TILE)
  return { x: FIGHT_STAGE.origin.x + x, y: FIGHT_STAGE.origin.y + y }
}

const drawBlock = (g: Phaser.GameObjects.Graphics, block: Block, at: Point2 = { x: 0, y: 0 }) => {
  const faces = blockFaces(block, FIGHT_TILE)
  const colors = faceColors(block.color)
  for (const side of ['left', 'right', 'top'] as const) {
    g.fillStyle(colors[side], 1)
    g.fillPoints(
      faces[side].map((p) => ({ x: p.x + at.x, y: p.y + at.y })),
      true,
    )
  }
}

// 전투를 그리기만 한다. 규칙은 넣지 않고, 일어난 일을 받아 연출한다.
export class FightScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Graphics
  private enemy!: Phaser.GameObjects.Graphics
  private glow!: Phaser.GameObjects.Ellipse
  private warning!: Phaser.GameObjects.Text
  private playerHome!: Point2
  private enemyHome!: Point2
  private enemyHeight = 0
  private dashing = false
  private ready = false

  constructor() {
    super('fight')
  }

  create({ kind }: { kind: OpponentKind }) {
    this.cameras.main.setBackgroundColor(FIGHT_STAGE.background)
    this.drawStage()

    this.playerHome = onFloor(FIGHT_STAGE.player)
    this.enemyHome = onFloor(FIGHT_STAGE.enemy)
    const { color, alpha, radiusX, radiusY } = FIGHT_EFFECT.overtimeGlow
    this.glow = this.add.ellipse(this.playerHome.x, this.playerHome.y, radiusX * 2, radiusY * 2, color, alpha).setVisible(false)

    const enemyBlocks = ENEMY_BLOCKS[kind]
    this.enemy = this.fighter(enemyBlocks, this.enemyHome)
    this.player = this.fighter(PLAYER_BLOCKS, this.playerHome)
    this.enemyHeight = Math.max(...enemyBlocks.map((b) => b.z + b.h)) * FIGHT_TILE.zUnit

    this.warning = this.add
      .text(this.enemyHome.x, this.enemyHome.y - this.enemyHeight - 26, '!', { font: '900 44px sans-serif', color: FIGHT_EFFECT.warningColor })
      .setOrigin(0.5)
      .setVisible(false)
    this.dashing = false
    this.ready = true
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.ready = false
    })
  }

  // 화면 프레임마다 그 사이 일어난 일과 지금 자세를 받는다.
  play(events: FightEvent[], pose: FightPose) {
    if (!this.ready) return
    for (const event of events) this.playEvent(event)
    this.glow.setVisible(pose.overtimeActive)
    if (pose.dashing !== this.dashing) {
      this.dashing = pose.dashing
      this.tweens.add({
        targets: this.player,
        x: this.playerHome.x + (pose.dashing ? FIGHT_STAGE.dashOffsetX : 0),
        duration: 90,
      })
    }
  }

  private playEvent(event: FightEvent) {
    if (event.type === 'enemy-windup') {
      this.warning.setVisible(true)
      this.tweens.add({ targets: this.enemy, scaleX: 1.12, scaleY: 0.9, yoyo: true, repeat: 2, duration: 110 })
    } else if (event.type === 'enemy-hit') {
      this.throwPaper(event.damage)
    } else if (event.type === 'player-hit') {
      this.warning.setVisible(false)
      this.throwCoffee(event.damage)
    } else {
      this.warning.setVisible(false)
      this.floatText(FIGHT_TEXT.dodged, this.playerHome, FIGHT_EFFECT.dodgeColor)
    }
  }

  private throwPaper(damage: number) {
    const paper = this.add.graphics({ x: this.player.x, y: this.player.y - FIGHT_TILE.zUnit })
    drawBlock(paper, PAPER_BLOCK)
    this.tweens.add({
      targets: paper,
      x: this.enemyHome.x,
      y: this.enemyHome.y - this.enemyHeight / 2,
      angle: 540,
      duration: FIGHT_EFFECT.throwMs,
      onComplete: () => {
        paper.destroy()
        this.floatText(`-${damage}`, { x: this.enemyHome.x, y: this.enemyHome.y - this.enemyHeight }, FIGHT_EFFECT.hitColor)
        this.tweens.add({ targets: this.enemy, x: this.enemyHome.x + 8, yoyo: true, duration: 50 })
      },
    })
  }

  private throwCoffee(damage: number) {
    const coffee = this.add.graphics({ x: this.enemyHome.x, y: this.enemyHome.y - this.enemyHeight / 2 })
    for (const block of COFFEE_BLOCKS) drawBlock(coffee, block)
    this.tweens.add({
      targets: coffee,
      x: this.playerHome.x,
      y: this.playerHome.y - FIGHT_TILE.zUnit,
      duration: FIGHT_EFFECT.coffeeMs,
      onComplete: () => {
        coffee.destroy()
        this.floatText(`-${damage}`, { x: this.playerHome.x, y: this.playerHome.y - FIGHT_TILE.zUnit * 2 }, FIGHT_EFFECT.hitColor)
        this.cameras.main.shake(FIGHT_EFFECT.shakeMs, FIGHT_EFFECT.shakeIntensity)
      },
    })
  }

  private floatText(text: string, at: Point2, color: string) {
    const label = this.add
      .text(at.x, at.y, text, { font: FONT, color, stroke: FIGHT_EFFECT.enemyHitColor, strokeThickness: 4 })
      .setOrigin(0.5)
    this.tweens.add({
      targets: label,
      y: at.y - 40,
      alpha: 0,
      duration: FIGHT_EFFECT.floatMs,
      onComplete: () => label.destroy(),
    })
  }

  private fighter(blocks: Block[], at: Point2) {
    const g = this.add.graphics({ x: at.x, y: at.y })
    for (const block of blocks) drawBlock(g, block)
    return g
  }

  private drawStage() {
    const { size, floorColors, sideColor, sideHeight } = FIGHT_STAGE
    const g = this.make.graphics({}, false)
    const origin = FIGHT_STAGE.origin
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const color = floorColors[(x + y) % floorColors.length]
        const front = x === size - 1 || y === size - 1
        drawBlock(g, { x, y, z: front ? -sideHeight : 0, w: 1, d: 1, h: front ? sideHeight : 0, color: front ? sideColor : color }, origin)
        if (front) drawBlock(g, { x, y, z: 0, w: 1, d: 1, h: 0, color }, origin)
      }
    }
    for (const block of sortBlocks(FIGHT_PROPS, FIGHT_TILE)) drawBlock(g, block, origin)
    // 프레임마다 다시 그리지 않도록 한 장으로 구워 둔다
    this.add.renderTexture(0, 0, SCREEN.width, SCREEN.height).setOrigin(0).draw(g)
    g.destroy()
  }
}
