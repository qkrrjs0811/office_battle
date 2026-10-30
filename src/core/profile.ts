import { currentRank, effectiveStats, type Career } from './career'
import { maxMp } from './growth'

export type Gauge = { current: number; max: number }

export type Profile = { rankName: string; level: number; hp: Gauge; mp: Gauge }

// 프로필에 보여 줄 값. 싸움마다 체력이 가득 찬 채로 시작하므로 맵에서는 언제나 가득 차 있다.
// MP는 쓰는 규칙이 아직 없어 역시 언제나 가득 차 있다.
export const buildProfile = (career: Career): Profile => {
  const { hp } = effectiveStats(career)
  const mp = maxMp(career.level)
  return {
    rankName: currentRank(career).name,
    level: career.level,
    hp: { current: hp, max: hp },
    mp: { current: mp, max: mp },
  }
}
