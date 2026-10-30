import type { Fight, FightEvent } from '../core/combat'
import { advanceLive, fightGauges, isSwipe, queueAction, startLive, type FightGauges, type LiveFight } from '../core/liveFight'
import { rewardText, type FightSummary } from '../core/menus'
import type { Gauge } from '../core/profile'
import type { Opponent } from '../core/run'
import { FIGHT_TEXT } from '../data/fightText'
import { onPress } from './press'

export type FightRound = {
  opponent: Opponent
  fight: Fight
  onFrame: (events: FightEvent[], gauges: FightGauges) => void
  // 전투가 끝나면 결과를 회사 생활에 반영하고 요약을 돌려준다
  onEnd: (result: 'won' | 'lost') => FightSummary
  onClose: () => void
}

const element = (tag: string, className: string, testId?: string) => {
  const node = document.createElement(tag)
  node.className = className
  if (testId) node.dataset.testid = testId
  return node
}

function hpBar(testId: string) {
  const bar = element('div', 'gauge fight-hp', testId)
  const fill = element('div', 'gauge-fill')
  const text = element('span', 'gauge-text')
  bar.append(fill, text)
  return {
    bar,
    show({ current, max }: Gauge) {
      fill.style.width = `${(current / max) * 100}%`
      text.textContent = `${FIGHT_TEXT.hp} ${current}/${max}`
    },
  }
}

function skillChip(testId: string, how: string, name: string, tag = 'div') {
  const chip = element(tag, 'fight-skill', testId)
  const fill = element('div', 'fight-skill-fill')
  const text = element('div', 'fight-skill-text')
  text.append(element('div', 'fight-skill-how'), element('div', 'fight-skill-name'))
  text.children[0].textContent = how
  text.children[1].textContent = name
  chip.append(fill, text)
  return {
    chip,
    show(charge: number) {
      fill.style.width = `${charge * 100}%`
      chip.classList.toggle('ready', charge >= 1)
    },
  }
}

const resultLines = (summary: FightSummary): string[] =>
  [
    summary.ruling ? FIGHT_TEXT.ruling : null,
    summary.promotedTo ? FIGHT_TEXT.promoted(summary.promotedTo) : null,
    rewardText(summary),
    summary.levelsGained > 0 ? FIGHT_TEXT.levelUp(summary.levelsGained) : null,
    summary.equipmentName ? FIGHT_TEXT.equipment(summary.equipmentName) : null,
    summary.won ? null : FIGHT_TEXT.lostNote,
  ].filter((line): line is string => line !== null)

// 전투 화면의 글자와 입력. 누르면 서류 던지기, 밀면 칼퇴 돌진이다. 그림은 FightScene이 맡는다.
export function mountFight(parent: HTMLElement, timeScale = 1) {
  const root = element('div', 'fight', 'fight')
  root.hidden = true

  const stage = element('div', 'fight-stage', 'fight-stage')

  const kindLabel = element('span', 'fight-kind', 'fight-kind')
  const enemyName = element('span', 'fight-enemy-name', 'fight-enemy-name')
  const enemyHeading = element('div', 'fight-heading')
  enemyHeading.append(kindLabel, enemyName)
  const enemyHp = hpBar('fight-enemy-hp')
  const top = element('div', 'fight-top')
  top.append(enemyHeading, enemyHp.bar)

  const warning = element('div', 'fight-warning', 'fight-warning')
  warning.textContent = FIGHT_TEXT.warning

  const playerHp = hpBar('fight-player-hp')
  const throwChip = skillChip('fight-throw', FIGHT_TEXT.throw.how, FIGHT_TEXT.throw.name)
  const dashChip = skillChip('fight-dash', FIGHT_TEXT.dash.how, FIGHT_TEXT.dash.name)
  const overtimeChip = skillChip('fight-overtime', FIGHT_TEXT.overtime.how, FIGHT_TEXT.overtime.name, 'button')
  const skills = element('div', 'fight-skills')
  skills.append(throwChip.chip, dashChip.chip, overtimeChip.chip)
  const bottom = element('div', 'fight-bottom')
  bottom.append(playerHp.bar, skills)

  const resultTitle = element('div', 'fight-result-title', 'fight-result-title')
  const resultBody = element('div', 'fight-result-lines', 'fight-result-lines')
  const resultClose = element('button', 'fight-result-close', 'fight-result-close') as HTMLButtonElement
  resultClose.textContent = FIGHT_TEXT.close
  const resultPanel = element('div', 'fight-result-panel')
  resultPanel.append(resultTitle, resultBody, resultClose)
  const result = element('div', 'fight-result', 'fight-result')
  result.append(resultPanel)
  result.hidden = true

  root.append(stage, top, warning, bottom, result)
  parent.append(root)

  let live: LiveFight | undefined
  let round: FightRound | undefined
  let dodged = 0

  const queue = (action: Parameters<typeof queueAction>[1]) => {
    if (live && live.fight.result === 'ongoing') live = queueAction(live, action)
  }

  // 밀기는 거리를 넘는 순간 바로 쓴다. 준비 동작을 보고 피하려면 손을 떼기를 기다릴 수 없다.
  let press: { id: number; x: number; y: number; swiped: boolean } | undefined
  stage.addEventListener('pointerdown', (event) => {
    if (press) return
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, swiped: false }
    stage.setPointerCapture(event.pointerId)
  })
  stage.addEventListener('pointermove', (event) => {
    if (!press || press.id !== event.pointerId || press.swiped) return
    if (!isSwipe(event.clientX - press.x, event.clientY - press.y)) return
    press.swiped = true
    queue('dash')
  })
  stage.addEventListener('pointerup', (event) => {
    if (!press || press.id !== event.pointerId) return
    if (!press.swiped) queue('throw')
    press = undefined
  })
  stage.addEventListener('pointercancel', () => {
    press = undefined
  })
  onPress(overtimeChip.chip as HTMLButtonElement, () => queue('overtime'))
  onPress(resultClose, () => {
    root.hidden = true
    round?.onClose()
  })

  const showGauges = (gauges: FightGauges) => {
    enemyHp.show(gauges.enemyHp)
    playerHp.show(gauges.playerHp)
    throwChip.show(gauges.throwCharge)
    dashChip.show(gauges.dashCharge)
    overtimeChip.show(gauges.overtimeCharge)
    overtimeChip.chip.classList.toggle('active', gauges.overtimeActive)
    warning.hidden = !gauges.windup
    root.dataset.windup = String(gauges.windup)
    root.dataset.hitIn = String(gauges.hitInMs ?? '')
  }

  const finish = (outcome: 'won' | 'lost') => {
    const summary = round!.onEnd(outcome)
    root.dataset.result = outcome
    warning.hidden = true
    resultTitle.textContent = summary.won ? FIGHT_TEXT.won : FIGHT_TEXT.lost
    resultBody.replaceChildren(
      ...resultLines(summary).map((line) => {
        const row = element('div', 'fight-result-line')
        row.textContent = line
        return row
      }),
    )
    result.hidden = false
  }

  let lastAt = 0
  const frame = (now: number) => {
    if (!live) return
    const { live: next, events } = advanceLive(live, (now - lastAt) * timeScale)
    lastAt = now
    live = next
    dodged += events.filter(({ type }) => type === 'player-dodged').length
    root.dataset.dodged = String(dodged)
    const gauges = fightGauges(live.fight)
    showGauges(gauges)
    round!.onFrame(events, gauges)
    const { result: outcome } = live.fight
    if (outcome === 'ongoing') requestAnimationFrame(frame)
    else finish(outcome)
  }

  return {
    start(next: FightRound) {
      round = next
      live = startLive(next.fight)
      dodged = 0
      press = undefined
      kindLabel.textContent = FIGHT_TEXT.kind[next.opponent.kind]
      kindLabel.classList.toggle('boss', next.opponent.kind === 'boss')
      enemyName.textContent = next.opponent.name
      root.dataset.result = 'ongoing'
      root.dataset.kind = next.opponent.kind
      result.hidden = true
      root.hidden = false
      showGauges(fightGauges(next.fight))
      lastAt = performance.now()
      requestAnimationFrame(frame)
    },
  }
}
