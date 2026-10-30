import { createGame } from './game/createGame'
import { mountHud } from './ui/hud'

const app = document.querySelector<HTMLDivElement>('#app')!
app.dataset.testid = 'app'
createGame(app, () => {
  app.dataset.scene = 'office'
})
mountHud(app)
