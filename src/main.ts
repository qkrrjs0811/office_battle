import { createGame } from './game/createGame'
import { mountHud } from './ui/hud'

const app = document.querySelector<HTMLDivElement>('#app')!
app.dataset.testid = 'app'
createGame(
  app,
  () => {
    app.dataset.scene = 'office'
  },
  (x, y) => {
    app.dataset.camera = `${Math.round(x)},${Math.round(y)}`
  },
)
mountHud(app)
