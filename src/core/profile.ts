import { LEVEL } from '../data/growth'
import type { Stats } from '../data/ranks'
import { currentRank, effectiveStats, type Career } from './career'
import { maxMp, xpToNextLevel } from './growth'

export type Gauge = { current: number; max: number }

export type Profile = {
  rankName: string
  level: number
  hp: Gauge
  mp: Gauge
  xp: Gauge
  money: number
  performance: number
  stats: Stats
}

// 프로필에 보여 줄 값. 싸움마다 체력이 가득 찬 채로 시작하므로 맵에서는 언제나 가득 차 있다.
// MP는 쓰는 규칙이 아직 없어 역시 언제나 가득 차 있다. 최고 레벨은 경험치를 쌓지 않으니 가득 찬 칸으로 보인다.
export const buildProfile = (career: Career): Profile => {
  const stats = effectiveStats(career)
  const mp = maxMp(career.level)
  const xpMax = xpToNextLevel(career.level)
  return {
    rankName: currentRank(career).name,
    level: career.level,
    hp: { current: stats.hp, max: stats.hp },
    mp: { current: mp, max: mp },
    xp: { current: career.level === LEVEL.max ? xpMax : career.xp, max: xpMax },
    money: career.money,
    performance: career.performance,
    stats,
  }
}
