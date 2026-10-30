import type { Gauge, Profile } from '../core/profile'
import { SCREEN, mapTitle, type GameMap, type MapId } from '../data/office'
import type { PortalSign } from '../game/OfficeScene'
import { createPortrait } from './portrait'

const toCssColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`

// 끌다가 손을 뗀 것과 구분하려고, 같은 버튼 안에서 눌렀다 뗐을 때만 이동한다.
function portalButton(sign: PortalSign, onTravel: (to: MapId) => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'portal-sign'
  button.dataset.testid = `portal-${sign.to}`
  button.textContent = `→ ${sign.label}`
  button.style.borderColor = toCssColor(sign.accent)
  let armed = false
  button.addEventListener('pointerdown', (event) => {
    armed = true
    // 터치는 손가락을 따라 버튼에 묶인다. 풀어야 밖으로 나갔을 때 pointerleave가 온다.
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId)
  })
  button.addEventListener('pointerleave', () => {
    armed = false
  })
  button.addEventListener('pointercancel', () => {
    armed = false
  })
  button.addEventListener('pointerup', () => {
    if (armed) onTravel(sign.to)
    armed = false
  })
  return button
}

function gaugeBar(kind: 'hp' | 'mp', title: string, gauge: Gauge) {
  const bar = document.createElement('div')
  bar.className = `gauge gauge-${kind}`
  bar.dataset.testid = `profile-${kind}`
  const fill = document.createElement('div')
  fill.className = 'gauge-fill'
  fill.style.width = `${(gauge.current / gauge.max) * 100}%`
  const text = document.createElement('span')
  text.className = 'gauge-text'
  text.textContent = `${title} ${gauge.current}/${gauge.max}`
  bar.append(fill, text)
  return bar
}

function profilePanel(profile: Profile) {
  const panel = document.createElement('div')
  panel.className = 'profile'
  panel.dataset.testid = 'profile'

  const rank = document.createElement('span')
  rank.className = 'profile-rank'
  rank.dataset.testid = 'profile-rank'
  rank.textContent = profile.rankName
  const level = document.createElement('span')
  level.className = 'profile-level'
  level.dataset.testid = 'profile-level'
  level.textContent = `Lv.${profile.level}`
  const heading = document.createElement('div')
  heading.className = 'profile-heading'
  heading.append(rank, level)

  const details = document.createElement('div')
  details.className = 'profile-details'
  details.append(heading, gaugeBar('hp', 'HP', profile.hp), gaugeBar('mp', 'MP', profile.mp))

  panel.append(createPortrait(), details)
  return panel
}

export function mountHud(parent: HTMLElement, profile: Profile, onTravel: (to: MapId) => void) {
  const mapName = document.createElement('div')
  mapName.className = 'map-name'
  mapName.dataset.testid = 'map-name'

  const signLayer = document.createElement('div')
  signLayer.className = 'portal-layer'
  parent.append(signLayer, profilePanel(profile), mapName)

  let signs: { sign: PortalSign; button: HTMLButtonElement }[] = []
  let cameraX = 0
  let cameraY = 0

  // 이름표는 맵 위 지점을 따라다닌다. 캔버스가 줄어들면 위치도 같은 비율로 줄인다.
  const placeSigns = () => {
    const canvas = parent.querySelector('canvas')
    if (!canvas) return
    const box = canvas.getBoundingClientRect()
    const home = parent.getBoundingClientRect()
    const scale = box.width / SCREEN.width
    for (const { sign, button } of signs) {
      button.style.left = `${box.left - home.left + (sign.x - cameraX) * scale}px`
      button.style.top = `${box.top - home.top + (sign.y - cameraY) * scale}px`
    }
  }

  window.addEventListener('resize', placeSigns)

  return {
    showMap(map: GameMap, nextSigns: PortalSign[]) {
      mapName.textContent = mapTitle(map)
      signLayer.replaceChildren()
      signs = nextSigns.map((sign) => ({ sign, button: portalButton(sign, onTravel) }))
      signLayer.append(...signs.map((s) => s.button))
      placeSigns()
    },
    moveCamera(x: number, y: number) {
      cameraX = x
      cameraY = y
      placeSigns()
    },
  }
}
