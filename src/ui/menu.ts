import type { Career } from '../core/career'
import { bonusText, claimableCount, fightMenu, questMenu, rewardText, shopMenu, trainMenu, type ShopStatus } from '../core/menus'
import { buildProfile } from '../core/profile'
import type { QuestEntry } from '../core/quests'
import { FIGHT_TEXT } from '../data/fightText'
import type { ShopItem } from '../data/growth'
import { STAT_LABELS, type StatName } from '../data/ranks'
import { onPress } from './press'

export type MenuActions = {
  claim: (questId: string) => void
  buy: (itemId: string) => void
  train: (stat: StatName) => void
  fight: () => void
}

type Tab = 'quest' | 'shop' | 'train'

const TABS: { id: Tab; label: string }[] = [
  { id: 'quest', label: '퀘스트' },
  { id: 'shop', label: '매점' },
  { id: 'train', label: '훈련' },
]

const SHOP_BUTTON: Record<ShopStatus, (item: ShopItem) => string> = {
  owned: () => '보유 중',
  buyable: (item) => `월급 ${item.price}`,
  short: (item) => `월급 ${item.price}`,
  closed: () => '판 끝남',
}

const element = (tag: string, className: string, text = '') => {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

const actionButton = (testId: string, label: string, enabled: boolean, action: () => void) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'row-action'
  button.dataset.testid = testId
  button.textContent = label
  button.disabled = !enabled
  onPress(button, action)
  return button
}

const row = (testId: string, title: string, lines: string[], action: HTMLElement) => {
  const box = element('div', 'menu-row')
  box.dataset.testid = testId
  const text = element('div', 'row-text')
  text.append(element('div', 'row-title', title), ...lines.map((line) => element('div', 'row-line', line)))
  box.append(text, action)
  return box
}

const questRow = ({ quest, progress, status }: QuestEntry, actions: MenuActions) => {
  const lines = [quest.description, rewardText(quest.reward)]
  const testId = `quest-${quest.id}`
  let action: HTMLElement
  if (status === 'done') action = actionButton(`quest-claim-${quest.id}`, '보상 받기', true, () => actions.claim(quest.id))
  else action = element('span', 'row-state', status === 'claimed' ? '받음' : `${progress}/${quest.goal.count}`)
  const box = row(testId, quest.title, lines, action)
  box.classList.add(`quest-${status}`)
  return box
}

// 맵 아래쪽의 메뉴 버튼과, 누르면 올라오는 칸. 보여 줄 값은 모두 core에서 받는다.
export function mountMenu(parent: HTMLElement, actions: MenuActions) {
  let career: Career | undefined
  let tab: Tab | undefined

  const bar = element('div', 'menu-bar')
  const badge = element('span', 'menu-badge')
  badge.dataset.testid = 'quest-badge'
  const fightButton = document.createElement('button')
  fightButton.type = 'button'
  fightButton.className = 'menu-button menu-fight'
  fightButton.dataset.testid = 'menu-fight'
  const fightLabel = element('span', 'menu-fight-label', FIGHT_TEXT.fightButton)
  const fightNote = element('span', 'menu-fight-note')
  fightNote.dataset.testid = 'menu-fight-note'
  fightButton.append(fightLabel, fightNote)
  onPress(fightButton, () => actions.fight())
  bar.append(fightButton)
  for (const { id, label } of TABS) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'menu-button'
    button.dataset.testid = `menu-${id}`
    button.textContent = label
    if (id === 'quest') button.append(badge)
    onPress(button, () => open(id))
    bar.append(button)
  }

  const sheet = element('div', 'sheet')
  sheet.dataset.testid = 'sheet'
  const title = element('div', 'sheet-title')
  title.dataset.testid = 'sheet-title'
  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'sheet-close'
  close.dataset.testid = 'sheet-close'
  close.textContent = '닫기'
  onPress(close, () => open(undefined))
  const header = element('div', 'sheet-header')
  header.append(title, close)
  const summary = element('div', 'sheet-summary')
  summary.dataset.testid = 'sheet-summary'
  const list = element('div', 'sheet-list')
  list.dataset.testid = 'sheet-list'
  sheet.append(header, summary, list)
  sheet.hidden = true
  parent.append(bar, sheet)

  const rows = (current: Career): HTMLElement[] => {
    if (tab === 'quest') return questMenu(current).map((entry) => questRow(entry, actions))
    if (tab === 'shop') {
      return shopMenu(current).map(({ item, status }) =>
        row(
          `shop-${item.id}`,
          item.name,
          [bonusText(item.bonus)],
          actionButton(`shop-buy-${item.id}`, SHOP_BUTTON[status](item), status === 'buyable', () => actions.buy(item.id)),
        ),
      )
    }
    const { stats } = buildProfile(current)
    return trainMenu(current).map(({ stat, gain, cost, available }) =>
      row(
        `train-${stat}`,
        `${STAT_LABELS[stat]} ${stats[stat]}`,
        [`한 번에 +${gain}`],
        actionButton(`train-do-${stat}`, `실적 ${cost}`, available, () => actions.train(stat)),
      ),
    )
  }

  const render = () => {
    if (!career) return
    const claimable = claimableCount(career)
    badge.textContent = String(claimable)
    badge.hidden = claimable === 0
    const next = fightMenu(career)
    fightButton.disabled = !next.available
    fightNote.textContent = !next.available
      ? FIGHT_TEXT.fightClosed
      : next.kind === 'boss'
        ? FIGHT_TEXT.fightBoss
        : FIGHT_TEXT.fightProgress(next.beaten, next.total)
    sheet.hidden = !tab
    if (!tab) return
    const { stats, money, performance } = buildProfile(career)
    title.textContent = TABS.find(({ id }) => id === tab)!.label
    summary.textContent =
      `월급 ${money} · 실적 ${performance} · ` +
      (['hp', 'attack', 'defense'] as const).map((stat) => `${STAT_LABELS[stat]} ${stats[stat]}`).join(' · ')
    list.replaceChildren(...rows(career))
  }

  function open(next: Tab | undefined) {
    tab = next
    list.scrollTop = 0
    render()
  }

  return {
    show(next: Career) {
      career = next
      render()
    },
  }
}
