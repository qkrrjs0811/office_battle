import { PROFILE_START } from '../data/profile'
import { currentRank, effectiveStats, type Career } from './career'

export type Gauge = { current: number; max: number }

export type Profile = { rankName: string; level: number; hp: Gauge; mp: Gauge }

// 프로필에 보여 줄 값. 싸움마다 체력이 가득 찬 채로 시작하므로 맵에서는 언제나 가득 차 있다.
export const buildProfile = (career: Career): Profile => {
  const { hp } = effectiveStats(career)
  return {
    rankName: currentRank(career).name,
    level: PROFILE_START.level,
    hp: { current: hp, max: hp },
    mp: { current: PROFILE_START.mp, max: PROFILE_START.mp },
  }
}
