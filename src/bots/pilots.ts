import { nextRandom } from '../core/combat'
import { questBoard } from '../core/quests'
import type { Pilot } from '../core/run'
import { DASH_BEFORE_HIT_MS, type BotProfile } from '../data/bots'
import { SHOP_ITEMS } from '../data/growth'
import { TRAIN_GAIN, type StatName } from '../data/ranks'

const STAT_NAMES: StatName[] = ['attack', 'hp', 'defense']

// 전투의 난수와 겹치지 않게 시드를 섞는다
const BOT_SEED_MIX = 0x5bd1e995

const trainEvenly: Pilot['train'] = ({ stats }) =>
  STAT_NAMES.reduce((lowest, name) =>
    stats[name] / TRAIN_GAIN[name] < stats[lowest] / TRAIN_GAIN[lowest] ? name : lowest,
  )

const buyCheapest: Pilot['buy'] = ({ equipmentIds, money }) =>
  SHOP_ITEMS.find((item) => !equipmentIds.includes(item.id) && money >= item.price)?.id ?? null

const visitQuestMap: Pilot['visit'] = (career) => {
  for (const { quest, status } of questBoard(career)) {
    if (status === 'active' && quest.goal.kind === 'visit') return quest.goal.mapId
  }
  return null
}

const claimDone: Pilot['claim'] = (career) => questBoard(career).find(({ status }) => status === 'done')?.quest.id ?? null

// 봇 하나를 만든다. 실수는 시드로 정해져 같은 시드면 같은 판이 나온다.
export const createBot = (profile: BotProfile, seed: number): Pilot => {
  let rngState = seed ^ BOT_SEED_MIX
  const roll = (chance: number): boolean => {
    const { value, state } = nextRandom(rngState)
    rngState = state
    return value < chance
  }

  // 준비 동작 한 번에 피할지를 한 번만 정한다. 매 칸 다시 정하면 언젠가는 피하게 된다
  let decidedHitAt: number | null = null
  let willDodge = false
  const decideDodge = (hitAt: number): boolean => {
    if (decidedHitAt !== hitAt) {
      decidedHitAt = hitAt
      willDodge = roll(profile.dodgeChance)
    }
    return willDodge
  }

  return {
    act: ({ player, enemy, elapsedMs: now }) => {
      const hitIsNear = enemy.phase === 'windup' && enemy.nextAt - now <= DASH_BEFORE_HIT_MS
      if (hitIsNear && now >= player.dashReadyAt && decideDodge(enemy.nextAt)) return 'dash'
      if (profile.usesOvertime && now >= player.overtimeReadyAt) return 'overtime'
      return roll(profile.throwChance) ? 'throw' : null
    },
    train: profile.training === 'even' ? trainEvenly : () => 'attack',
    ...(profile.manages ? { buy: buyCheapest, visit: visitQuestMap, claim: claimDone } : {}),
  }
}
