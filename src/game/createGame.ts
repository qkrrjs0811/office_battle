import Phaser from 'phaser'
import { SCREEN } from '../data/office'
import { OfficeScene } from './OfficeScene'

export function createGame(parent: HTMLElement, onReady: () => void, onCameraMove: (x: number, y: number) => void) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: SCREEN.width,
    height: SCREEN.height,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    banner: false,
    scene: new OfficeScene(onReady, onCameraMove),
  })
}
