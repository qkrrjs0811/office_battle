import Phaser from 'phaser'
import { SCREEN } from '../data/office'
import { OfficeScene } from './OfficeScene'

export function createGame(parent: HTMLElement, onReady: () => void) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: SCREEN.width,
    height: SCREEN.height,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    banner: false,
    scene: new OfficeScene(onReady),
  })
}
