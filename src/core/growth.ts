import { FIGHT_REWARDS, LEVEL, LEVEL_GAIN, MP, REWARD_RANK_SCALE, type FightReward } from '../data/growth'
import type { Stats } from '../data/ranks'

export type LevelState = { level: number; xp: number }

export const xpToNextLevel = (level: number): number =>
  LEVEL.firstLevelXp + LEVEL.xpStepPerLevel * (level - LEVEL.start)

// 다 찬 만큼 레벨을 올리고 남은 경험치는 이어 간다. 최고 레벨에서는 경험치를 쌓지 않는다.
export const gainXp = ({ level, xp }: LevelState, gained: number): LevelState => {
  let nextLevel = level
  let nextXp = xp + gained
  while (nextLevel < LEVEL.max && nextXp >= xpToNextLevel(nextLevel)) {
    nextXp -= xpToNextLevel(nextLevel)
    nextLevel += 1
  }
  return { level: nextLevel, xp: nextLevel === LEVEL.max ? 0 : nextXp }
}

export const levelBonus = (level: number): Stats => {
  const gained = level - LEVEL.start
  return {
    hp: LEVEL_GAIN.hp * gained,
    attack: LEVEL_GAIN.attack * gained,
    defense: LEVEL_GAIN.defense * gained,
  }
}

export const maxMp = (level: number): number => MP.start + MP.perLevel * (level - LEVEL.start)

export const fightReward = (kind: keyof typeof FIGHT_REWARDS, rankIndex: number): FightReward => {
  const scale = 1 + REWARD_RANK_SCALE * rankIndex
  const { xp, money } = FIGHT_REWARDS[kind]
  return { xp: Math.round(xp * scale), money: Math.round(money * scale) }
}
