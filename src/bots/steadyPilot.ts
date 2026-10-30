import { questBoard } from '../core/quests'
import type { Pilot } from '../core/run'
import { SHOP_ITEMS } from '../data/growth'
import { TRAIN_GAIN, type StatName } from '../data/ranks'

const STAT_NAMES: StatName[] = ['attack', 'hp', 'defense']

// 맞기 이만큼 전에 돌진한다
const DASH_BEFORE_HIT_MS = 300

// 터미널 한 판을 돌리는 기본 조작. 때릴 수 있으면 때리고 맞기 직전에 피하며, 능력치는 고르게 키우고, 살 수 있는 장비는 사며, 퀘스트의 맵에 들르고 깬 보상을 받는다.
export const steadyPilot: Pilot = {
  act: (fight) => {
    const { player, enemy, elapsedMs: now } = fight
    if (enemy.phase === 'windup' && enemy.nextAt - now <= DASH_BEFORE_HIT_MS && now >= player.dashReadyAt) return 'dash'
    if (now >= player.overtimeReadyAt) return 'overtime'
    return 'throw'
  },
  train: ({ stats }) =>
    STAT_NAMES.reduce((lowest, name) =>
      stats[name] / TRAIN_GAIN[name] < stats[lowest] / TRAIN_GAIN[lowest] ? name : lowest,
    ),
  buy: ({ equipmentIds, money }) =>
    SHOP_ITEMS.find((item) => !equipmentIds.includes(item.id) && money >= item.price)?.id ?? null,
  visit: (career) => {
    for (const { quest, status } of questBoard(career)) {
      if (status === 'active' && quest.goal.kind === 'visit') return quest.goal.mapId
    }
    return null
  },
  claim: (career) => questBoard(career).find(({ status }) => status === 'done')?.quest.id ?? null,
}
