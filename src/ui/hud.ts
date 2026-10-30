import type { Gauge, Profile } from '../core/profile'
import { mapTitle, type GameMap, type MapId } from '../data/office'
import type { PortalSign } from '../game/OfficeScene'
import { createPortrait } from './portrait'
import { onPress } from './press'

const toCssColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`

function portalButton(sign: PortalSign, onTravel: (to: MapId) => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'portal-sign'
  button.dataset.testid = `portal-${sign.to}`
  button.textContent = `→ ${sign.label}`
  button.style.borderColor = toCssColor(sign.accent)
  onPress(button, () => onTravel(sign.to))
  return button
}

function gaugeBar(kind: 'hp' | 'mp' | 'xp', title: string, gauge: Gauge) {
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
  details.append(
    heading,
    gaugeBar('hp', 'HP', profile.hp),
    gaugeBar('mp', 'MP', profile.mp),
    gaugeBar('xp', 'XP', profile.xp),
  )

  panel.append(createPortrait(), details)
  return panel
}

function walletChip(testId: string, text: string) {
  const chip = document.createElement('span')
  chip.className = 'wallet-chip'
  chip.dataset.testid = testId
  chip.textContent = text
  return chip
}

export function mountHud(parent: HTMLElement, profile: Profile, onTravel: (to: MapId) => void) {
  const mapName = document.createElement('div')
  mapName.className = 'map-name'
  mapName.dataset.testid = 'map-name'

  const wallet = document.createElement('div')
  wallet.className = 'wallet'
  wallet.dataset.testid = 'wallet'

  const corner = document.createElement('div')
  corner.className = 'corner'
  corner.append(mapName, wallet)

  let panel = profilePanel(profile)
  const showProfile = (next: Profile) => {
    const nextPanel = profilePanel(next)
    panel.replaceWith(nextPanel)
    panel = nextPanel
    wallet.replaceChildren(walletChip('wallet-money', `월급 ${next.money}`), walletChip('wallet-performance', `실적 ${next.performance}`))
  }

  const signLayer = document.createElement('div')
  signLayer.className = 'portal-layer'
  parent.append(signLayer, panel, corner)
  showProfile(profile)

  return {
    showProfile,
    showMap(map: GameMap, signs: PortalSign[]) {
      mapName.textContent = mapTitle(map)
      signLayer.replaceChildren(
        ...signs.map((sign) => {
          const button = portalButton(sign, onTravel)
          button.style.left = `${sign.x}px`
          button.style.top = `${sign.y}px`
          return button
        }),
      )
    },
  }
}
