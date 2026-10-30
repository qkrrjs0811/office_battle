import { SHOP_ITEMS, type ShopItem } from '../data/growth'
import type { QuestReward } from '../data/quests'
import { PERFORMANCE, RANKS, STAT_LABELS, TRAIN_GAIN, type StatName, type Stats } from '../data/ranks'
import { canChallengeBoss, currentRank, type Career, type OpponentKind } from './career'
import { fightReward } from './growth'
import { questBoard, type QuestEntry, type QuestStatus } from './quests'

// 메뉴에 보여 줄 값. 살 수 있다고 보여 준 것은 career의 규칙에서도 통과해야 한다.
const STATUS_ORDER: Record<QuestStatus, number> = { done: 0, active: 1, claimed: 2 }

export const questMenu = (career: Career): QuestEntry[] =>
  [...questBoard(career)].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

export const claimableCount = (career: Career): number =>
  questBoard(career).filter(({ status }) => status === 'done').length

export type ShopStatus = 'owned' | 'buyable' | 'short' | 'closed'

const shopStatus = (career: Career, item: ShopItem): ShopStatus => {
  if (career.equipmentIds.includes(item.id)) return 'owned'
  if (career.ruling) return 'closed'
  return career.money >= item.price ? 'buyable' : 'short'
}

export const shopMenu = (career: Career): { item: ShopItem; status: ShopStatus }[] =>
  SHOP_ITEMS.map((item) => ({ item, status: shopStatus(career, item) }))

export type TrainRow = { stat: StatName; gain: number; cost: number; available: boolean }

export const trainMenu = (career: Career): TrainRow[] =>
  (['hp', 'attack', 'defense'] as const).map((stat) => ({
    stat,
    gain: TRAIN_GAIN[stat],
    cost: PERFORMANCE.trainCost,
    available: !career.ruling && career.performance >= PERFORMANCE.trainCost,
  }))

export type FightMenu = { available: boolean; kind: OpponentKind; beaten: number; total: number }

export const fightMenu = (career: Career): FightMenu => ({
  available: !career.ruling,
  kind: canChallengeBoss(career) ? 'boss' : 'employee',
  beaten: career.employeesBeaten,
  total: currentRank(career).employeeCount,
})

export type FightSummary = {
  won: boolean
  xp: number
  money: number
  performance: number
  levelsGained: number
  // 승진해 오른 직급 이름. 마지막 보스를 이기면 승진 대신 ruling이 켜진다
  promotedTo: string | null
  ruling: boolean
  equipmentName: string | null
}

export const fightSummary = (before: Career, after: Career, kind: OpponentKind, result: 'won' | 'lost'): FightSummary => {
  const won = result === 'won'
  const bossWon = won && kind === 'boss'
  return {
    won,
    xp: fightReward(won ? kind : 'loss', before.rankIndex).xp,
    money: after.money - before.money,
    performance: after.performance - before.performance,
    levelsGained: after.level - before.level,
    promotedTo: after.rankIndex > before.rankIndex ? currentRank(after).name : null,
    ruling: after.ruling,
    equipmentName: bossWon ? RANKS[before.rankIndex].bossDrop.name : null,
  }
}

export const bonusText = (bonus: Partial<Stats>): string =>
  (['hp', 'attack', 'defense'] as const)
    .filter((stat) => bonus[stat])
    .map((stat) => `${STAT_LABELS[stat]} +${bonus[stat]}`)
    .join(', ')

export const rewardText = ({ xp, money, performance }: QuestReward): string =>
  [
    ['경험치', xp],
    ['월급', money],
    ['실적', performance],
  ]
    .filter(([, amount]) => amount)
    .map(([name, amount]) => `${name} +${amount}`)
    .join(', ')
