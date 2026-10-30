import { describe, expect, it } from 'vitest'
import { PERFORMANCE, RANKS, STARTING_STATS, TRAIN_GAIN } from '../data/ranks'
import {
  canChallengeBoss,
  createCareer,
  currentRank,
  effectiveStats,
  employeesLeft,
  loseFight,
  trainStat,
  winAgainstBoss,
  winAgainstEmployee,
  type Career,
} from './career'

const clearFloor = (career: Career): Career => {
  let next = career
  while (employeesLeft(next) > 0) next = winAgainstEmployee(next)
  return next
}

const promote = (career: Career): Career => winAgainstBoss(clearFloor(career))

describe('직급 데이터', () => {
  it('인턴부터 CEO까지 8단계가 순서대로 있다', () => {
    expect(RANKS.map((rank) => rank.name)).toEqual([
      '인턴',
      '신입',
      '대리',
      '과장',
      '차장',
      '부장',
      '임원',
      'CEO',
    ])
  })

  it('층마다 직원이 있고 보스와 장비는 겹치지 않는다', () => {
    for (const rank of RANKS) expect(rank.employeeCount).toBeGreaterThan(0)
    expect(new Set(RANKS.map((rank) => rank.bossName)).size).toBe(RANKS.length)
    expect(new Set(RANKS.map((rank) => rank.bossDrop.id)).size).toBe(RANKS.length)
  })
})

describe('층 진행', () => {
  it('인턴 층의 처음에서 시작한다', () => {
    const career = createCareer()
    expect(currentRank(career).name).toBe('인턴')
    expect(career.stats).toEqual(STARTING_STATS)
    expect(employeesLeft(career)).toBe(RANKS[0].employeeCount)
    expect(career.ruling).toBe(false)
  })

  it('직원을 다 이기기 전에는 보스와 싸울 수 없다', () => {
    const career = createCareer()
    expect(canChallengeBoss(career)).toBe(false)
    expect(() => winAgainstBoss(career)).toThrow()
    expect(canChallengeBoss(clearFloor(career))).toBe(true)
  })

  it('남은 직원이 없으면 직원을 더 이길 수 없다', () => {
    expect(() => winAgainstEmployee(clearFloor(createCareer()))).toThrow()
  })

  it('직원을 이기면 실적을 번다', () => {
    expect(winAgainstEmployee(createCareer()).performance).toBe(PERFORMANCE.perEmployeeWin)
  })

  it('규칙 함수는 받은 상태를 바꾸지 않는다', () => {
    const career = createCareer()
    const before = structuredClone(career)
    winAgainstEmployee(career)
    loseFight(career)
    expect(career).toEqual(before)
  })
})

describe('승진', () => {
  it('보스를 이기면 다음 직급 층의 처음으로 간다', () => {
    const career = promote(createCareer())
    expect(currentRank(career).name).toBe('신입')
    expect(employeesLeft(career)).toBe(RANKS[1].employeeCount)
    expect(canChallengeBoss(career)).toBe(false)
  })

  it('승진하면 능력치가 오르고 보스 장비와 실적을 얻는다', () => {
    const cleared = clearFloor(createCareer())
    const career = winAgainstBoss(cleared)
    const { promotionBonus, bossDrop } = RANKS[0]
    expect(career.stats.hp).toBe(STARTING_STATS.hp + (promotionBonus.hp ?? 0))
    expect(career.stats.attack).toBe(STARTING_STATS.attack + (promotionBonus.attack ?? 0))
    expect(career.equipmentIds).toEqual([bossDrop.id])
    expect(career.performance).toBe(cleared.performance + PERFORMANCE.perBossWin)
  })

  it('장비 효과는 실제 능력치에 더해지고 기본 능력치에는 섞이지 않는다', () => {
    const career = promote(createCareer())
    const bonus = RANKS[0].bossDrop.bonus
    expect(effectiveStats(career).attack).toBe(career.stats.attack + (bonus.attack ?? 0))
    expect(effectiveStats(career).hp).toBe(career.stats.hp + (bonus.hp ?? 0))
    expect(effectiveStats(createCareer())).toEqual(STARTING_STATS)
  })

  it('임원 보스를 이기면 CEO가 되지만 아직 회사를 지배하지는 않는다', () => {
    let career = createCareer()
    for (let i = 0; i < RANKS.length - 1; i++) career = promote(career)
    expect(currentRank(career).name).toBe('CEO')
    expect(career.ruling).toBe(false)
  })

  it('CEO 층 보스를 이기면 회사를 지배하고 판이 끝난다', () => {
    let career = createCareer()
    for (let i = 0; i < RANKS.length; i++) career = promote(career)
    expect(currentRank(career).name).toBe('CEO')
    expect(career.ruling).toBe(true)
    expect(career.equipmentIds).toHaveLength(RANKS.length)
    expect(employeesLeft(career)).toBe(0)
    expect(canChallengeBoss(career)).toBe(false)
    expect(() => winAgainstBoss(career)).toThrow()
    expect(() => winAgainstEmployee(career)).toThrow()
    expect(() => loseFight(career)).toThrow()
  })
})

describe('패배', () => {
  it('지면 그 층의 처음으로 돌아간다', () => {
    const career = loseFight(clearFloor(promote(createCareer())))
    expect(currentRank(career).name).toBe('신입')
    expect(employeesLeft(career)).toBe(RANKS[1].employeeCount)
    expect(canChallengeBoss(career)).toBe(false)
  })

  it('져도 직급, 능력치, 장비, 실적이 남고 위로 실적을 받는다', () => {
    const before = trainStat(winAgainstEmployee(promote(createCareer())), 'attack')
    const after = loseFight(before)
    expect(after.rankIndex).toBe(before.rankIndex)
    expect(after.stats).toEqual(before.stats)
    expect(after.equipmentIds).toEqual(before.equipmentIds)
    expect(after.performance).toBe(before.performance + PERFORMANCE.perLoss)
  })

  it('같은 층을 다시 깨면서 실적을 또 벌 수 있다', () => {
    const first = clearFloor(createCareer())
    const second = clearFloor(loseFight(first))
    expect(second.performance).toBeGreaterThan(first.performance)
  })
})

describe('훈련', () => {
  it('실적을 써서 능력치를 올린다', () => {
    const before = clearFloor(createCareer())
    const after = trainStat(before, 'defense')
    expect(after.stats.defense).toBe(before.stats.defense + TRAIN_GAIN.defense)
    expect(after.performance).toBe(before.performance - PERFORMANCE.trainCost)
  })

  it('실적이 모자라면 훈련할 수 없다', () => {
    expect(() => trainStat(createCareer(), 'hp')).toThrow()
  })
})
