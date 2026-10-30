import { buyItem, claimQuest, createCareer, trainStat, visitMap, type Career } from './core/career'
import { buildProfile } from './core/profile'
import { createGame } from './game/createGame'
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
})
menu.show(career)

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
