import { SHOP_ITEMS, type ShopItem } from '../data/growth'
import type { QuestReward } from '../data/quests'
import { PERFORMANCE, STAT_LABELS, TRAIN_GAIN, type StatName, type Stats } from '../data/ranks'
import type { Career } from './career'
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
