import { buyItem, claimQuest, createCareer, effectiveStats, settleFight, trainStat, visitMap, type Career } from './core/career'
import { createFight } from './core/combat'
import { fightSummary } from './core/menus'
import { buildProfile } from './core/profile'
import { nextOpponent } from './core/run'
import { createGame } from './game/createGame'
import { mountFight } from './ui/fight'
import { mountHud } from './ui/hud'
import { mountMenu } from './ui/menu'

const app = document.querySelector<HTMLDivElement>('#app')!
app.dataset.testid = 'app'

// e2e가 돈이 있는 상태에서 시작할 때만 쓴다. 저장 기능이 생기면 저장값으로 대신한다.
const seed = (window as unknown as { __careerSeed?: Partial<Career> }).__careerSeed
let career: Career = { ...createCareer(), ...seed }

const setCareer = (next: Career) => {
  career = next
  hud.showProfile(buildProfile(career))
  menu.show(career)
}

const hud = mountHud(app, buildProfile(career), (to) => game.travelTo(to))
const menu = mountMenu(app, {
  claim: (questId) => setCareer(claimQuest(career, questId)),
  buy: (itemId) => setCareer(buyItem(career, itemId)),
  train: (stat) => setCareer(trainStat(career, stat)),
  fight: () => startFight(),
})
menu.show(career)
// e2e가 컴퓨터 부하와 상관없이 제때 조작하도록 전투를 느리게 돌릴 때만 쓴다.
const fightScreen = mountFight(app, (window as unknown as { __fightTimeScale?: number }).__fightTimeScale)

const startFight = () => {
  const before = career
  const opponent = nextOpponent(before)
  app.dataset.mode = 'fight'
  game.startFight(opponent.kind)
  fightScreen.start({
    opponent,
    fight: createFight(effectiveStats(before), opponent.stats, Math.floor(Math.random() * 0x7fffffff)),
    onFrame: (events, { dashing, overtimeActive }) => game.playFight(events, { dashing, overtimeActive }),
    onEnd: (result) => {
      setCareer(settleFight(before, opponent.kind, result))
      return fightSummary(before, career, opponent.kind, result)
    },
    onClose: () => {
      delete app.dataset.mode
      game.endFight()
    },
  })
}

// 처음 뜬 맵은 들른 것으로 치지 않는다. 포탈로 움직여야 들른 것이다.
let arrived = false
const game = createGame(app, {
  onMapShown: (map, signs) => {
    delete app.dataset.map
    hud.showMap(map, signs)
    if (arrived) setCareer(visitMap(career, map.id))
    arrived = true
  },
  onMapReady: (map) => {
    app.dataset.scene = 'office'
    app.dataset.map = map.id
  },
  onCameraMove: (x, y) => {
    app.dataset.camera = `${Math.round(x)},${Math.round(y)}`
    hud.moveCamera(x, y)
  },
})
