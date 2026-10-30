import { describe, expect, it } from 'vitest'
import { PROFILE_START } from '../data/profile'
import { RANKS, STARTING_STATS } from '../data/ranks'
import { createCareer, winAgainstBoss, winAgainstEmployee } from './career'
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
      level: PROFILE_START.level,
      hp: { current: STARTING_STATS.hp, max: STARTING_STATS.hp },
      mp: { current: PROFILE_START.mp, max: PROFILE_START.mp },
    })
  })

  it('승진하면 직급이 바뀌고, 승진 보너스와 장비가 체력에 더해진다', () => {
    const profile = buildProfile(promoted())
    const { promotionBonus, bossDrop } = RANKS[0]
    const max = STARTING_STATS.hp + (promotionBonus.hp ?? 0) + (bossDrop.bonus.hp ?? 0)
    expect(profile.rankName).toBe(RANKS[1].name)
    expect(profile.hp).toEqual({ current: max, max })
  })
})
