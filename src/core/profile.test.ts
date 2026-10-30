import { describe, expect, it } from 'vitest'
import { LEVEL, LEVEL_GAIN, MP } from '../data/growth'
import { RANKS, STARTING_STATS } from '../data/ranks'
import { createCareer, effectiveStats, winAgainstBoss, winAgainstEmployee } from './career'
import { xpToNextLevel } from './growth'
import { buildProfile } from './profile'

const promoted = () => {
  let career = createCareer()
  for (let i = 0; i < RANKS[0].employeeCount; i++) career = winAgainstEmployee(career)
  return winAgainstBoss(career)
}

describe('프로필', () => {
  it('처음에는 인턴이고 체력과 MP가 가득 차 있다', () => {
    expect(buildProfile(createCareer())).toEqual({
      rankName: '인턴',
      level: LEVEL.start,
      hp: { current: STARTING_STATS.hp, max: STARTING_STATS.hp },
      mp: { current: MP.start, max: MP.start },
      xp: { current: 0, max: xpToNextLevel(LEVEL.start) },
      money: 0,
      performance: 0,
      stats: STARTING_STATS,
    })
  })

  it('최고 레벨에서는 경험치 칸이 가득 찬다', () => {
    const { xp } = buildProfile({ ...createCareer(), level: LEVEL.max })
    expect(xp.current).toBe(xp.max)
  })

  it('월급, 실적과 장비까지 더한 능력치를 보여 준다', () => {
    const career = { ...createCareer(), money: 7, performance: 4 }
    const profile = buildProfile(career)
    expect(profile.money).toBe(7)
    expect(profile.performance).toBe(4)
    expect(profile.stats).toEqual(effectiveStats(career))
  })

  it('승진하면 직급이 바뀌고, 승진 보너스와 장비와 레벨이 체력에 더해진다', () => {
    const career = promoted()
    const profile = buildProfile(career)
    const { promotionBonus, bossDrop } = RANKS[0]
    const levelsGained = career.level - LEVEL.start
    const max = STARTING_STATS.hp + (promotionBonus.hp ?? 0) + (bossDrop.bonus.hp ?? 0) + LEVEL_GAIN.hp * levelsGained
    expect(profile.rankName).toBe(RANKS[1].name)
    expect(profile.hp).toEqual({ current: max, max })
    expect(levelsGained).toBeGreaterThan(0)
    expect(profile.level).toBe(career.level)
    expect(profile.mp.max).toBe(MP.start + MP.perLevel * levelsGained)
  })
})
