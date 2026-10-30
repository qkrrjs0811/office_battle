import { createCareer } from './core/career'
import { buildProfile } from './core/profile'
import { createGame } from './game/createGame'
import { mountHud } from './ui/hud'

const app = document.querySelector<HTMLDivElement>('#app')!
app.dataset.testid = 'app'
const hud = mountHud(app, buildProfile(createCareer()), (to) => game.travelTo(to))
const game = createGame(app, {
  onMapShown: (map, signs) => {
    delete app.dataset.map
    hud.showMap(map, signs)
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
