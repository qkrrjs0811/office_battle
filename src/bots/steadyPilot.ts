import type { Pilot } from '../core/run'
import { TRAIN_GAIN, type StatName } from '../data/ranks'

const STAT_NAMES: StatName[] = ['attack', 'hp', 'defense']

// 맞기 이만큼 전에 돌진한다
const DASH_BEFORE_HIT_MS = 300

// 터미널 한 판을 돌리는 기본 조작. 때릴 수 있으면 때리고 맞기 직전에 피하며, 능력치는 고르게 키운다.
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
}
