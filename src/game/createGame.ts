import Phaser from 'phaser'
import type { OpponentKind } from '../core/career'
import type { FightEvent } from '../core/combat'
import { SCREEN, type MapId } from '../data/office'
import { FightScene, type FightPose } from './FightScene'
import { OfficeScene, type SceneEvents } from './OfficeScene'

export function createGame(parent: HTMLElement, events: SceneEvents) {
  const office = new OfficeScene(events)
  const fight = new FightScene()
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: SCREEN.width,
    height: SCREEN.height,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    banner: false,
    scene: [office, fight],
  })
  return {
    travelTo: (to: MapId) => office.travelTo(to),
    // 사무실은 재워 두어 보던 맵과 카메라가 그대로 남는다
    startFight: (kind: OpponentKind) => {
      game.scene.sleep('office')
      game.scene.run('fight', { kind })
    },
    playFight: (fightEvents: FightEvent[], pose: FightPose) => fight.play(fightEvents, pose),
    endFight: () => {
      game.scene.stop('fight')
      game.scene.wake('office')
    },
  }
}
