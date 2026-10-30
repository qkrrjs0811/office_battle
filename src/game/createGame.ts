import Phaser from 'phaser'
import { SCREEN, type MapId } from '../data/office'
import { OfficeScene, type SceneEvents } from './OfficeScene'

export function createGame(parent: HTMLElement, events: SceneEvents) {
  const scene = new OfficeScene(events)
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: SCREEN.width,
    height: SCREEN.height,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    banner: false,
    scene,
  })
  return { travelTo: (to: MapId) => scene.travelTo(to) }
}
