import { describe, expect, it } from 'vitest'
import { RANKS } from '../data/ranks'
import { createCareer, currentRank, effectiveStats, employeesLeft, winAgainstEmployee } from './career'
import type { FightAction } from './combat'
import { fightNext, nextOpponent, runCareer, type Pilot } from './run'

const idle: Pilot = { act: () => null, train: () => null }

const mash: Pilot = {
  act: (fight): FightAction => {
    if (fight.enemy.phase === 'windup' && fight.enemy.nextAt - fight.elapsedMs <= 200) return 'dash'
    return 'throw'
  },
  train: () => 'attack',
}

describe('다음 상대', () => {
  it('직원이 남아 있으면 직원, 다 이기면 그 층의 보스다', () => {
    let career = createCareer()
    expect(nextOpponent(career)).toEqual({
      kind: 'employee',
      name: RANKS[0].employeeName,
      stats: RANKS[0].employee,
    })
    while (employeesLeft(career) > 0) career = winAgainstEmployee(career)
    expect(nextOpponent(career)).toEqual({ kind: 'boss', name: RANKS[0].bossName, stats: RANKS[0].boss })
  })
})

describe('싸움 한 번', () => {
  it('이기면 직원 수가 줄어든다', () => {
    const { career, log } = fightNext(createCareer(), mash, 1)
    expect(log.result).toBe('won')
    expect(log.rankName).toBe('인턴')
    expect(career.employeesBeaten).toBe(1)
  })

  it('지면 층의 처음으로 돌아가고 키운 것은 남는다', () => {
    let start = createCareer()
    start = winAgainstEmployee(start)
    const { career, log } = fightNext(start, idle, 1)
    expect(log.result).toBe('lost')
    expect(career.employeesBeaten).toBe(0)
    expect(career.rankIndex).toBe(0)
    expect(career.performance).toBeGreaterThan(start.performance)
    expect(effectiveStats(career)).toEqual(effectiveStats(start))
  })

  it('보스를 이기면 승진한다', () => {
    let start = createCareer()
    while (employeesLeft(start) > 0) start = winAgainstEmployee(start)
    const { career } = fightNext(start, mash, 1)
    expect(currentRank(career).name).toBe('신입')
  })
})

describe('한 판', () => {
  it('인턴부터 CEO까지 올라가 회사를 지배하며 끝난다', () => {
    const run = runCareer(mash, 1)
    expect(run.career.ruling).toBe(true)
    expect(currentRank(run.career).name).toBe('CEO')
    const bossWins = run.log.filter((fight) => fight.kind === 'boss' && fight.result === 'won')
    expect(bossWins.map((fight) => fight.rankName)).toEqual(RANKS.map((rank) => rank.name))
  })

  it('같은 시드면 결과가 똑같다', () => {
    expect(runCareer(mash, 42)).toEqual(runCareer(mash, 42))
  })

  it('아무것도 안 하면 싸움 횟수 상한에서 멈추고 승진하지 못한다', () => {
    const run = runCareer(idle, 1, 20)
    expect(run.log).toHaveLength(20)
    expect(run.career.rankIndex).toBe(0)
    expect(run.career.ruling).toBe(false)
  })

  it('훈련을 고르면 실적을 써서 능력치가 오른다', () => {
    const trainer: Pilot = { ...idle, train: () => 'hp' }
    const run = runCareer(trainer, 1, 20)
    expect(run.career.stats.hp).toBeGreaterThan(createCareer().stats.hp)
  })
})
