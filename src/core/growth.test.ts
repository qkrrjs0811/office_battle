import { describe, expect, it } from 'vitest'
import { FIGHT_REWARDS, LEVEL, LEVEL_GAIN, MP, REWARD_RANK_SCALE, SHOP_ITEMS } from '../data/growth'
import { PERFORMANCE, RANKS, STARTING_STATS } from '../data/ranks'
import {
  buyItem,
  createCareer,
  effectiveStats,
  employeesLeft,
  loseFight,
  trainStat,
  winAgainstBoss,
  winAgainstEmployee,
  type Career,
} from './career'
import { fightReward, gainXp, levelBonus, maxMp, xpToNextLevel } from './growth'

const withMoney = (money: number): Career => ({ ...createCareer(), money })

describe('경험치와 레벨', () => {
  it('레벨이 오를수록 다음 레벨까지 경험치가 더 든다', () => {
    expect(xpToNextLevel(LEVEL.start)).toBe(LEVEL.firstLevelXp)
    expect(xpToNextLevel(LEVEL.start + 1)).toBe(LEVEL.firstLevelXp + LEVEL.xpStepPerLevel)
  })

  it('모자라면 경험치만 쌓이고, 다 차면 레벨이 오르고 남은 것은 이어진다', () => {
    const start = { level: LEVEL.start, xp: 0 }
    const need = xpToNextLevel(LEVEL.start)
    expect(gainXp(start, need - 1)).toEqual({ level: LEVEL.start, xp: need - 1 })
    expect(gainXp(start, need + 3)).toEqual({ level: LEVEL.start + 1, xp: 3 })
  })

  it('경험치를 한꺼번에 많이 받으면 여러 레벨이 오른다', () => {
    const start = { level: LEVEL.start, xp: 0 }
    const twoLevels = xpToNextLevel(LEVEL.start) + xpToNextLevel(LEVEL.start + 1)
    expect(gainXp(start, twoLevels)).toEqual({ level: LEVEL.start + 2, xp: 0 })
  })

  it('최고 레벨에서는 더 오르지 않고 경험치도 쌓이지 않는다', () => {
    expect(gainXp({ level: LEVEL.max, xp: 0 }, 100_000)).toEqual({ level: LEVEL.max, xp: 0 })
    expect(gainXp({ level: LEVEL.max - 1, xp: 0 }, 100_000)).toEqual({ level: LEVEL.max, xp: 0 })
  })

  it('레벨이 오르면 능력치와 최대 MP가 오른다', () => {
    expect(levelBonus(LEVEL.start)).toEqual({ hp: 0, attack: 0, defense: 0 })
    expect(levelBonus(LEVEL.start + 2).hp).toBe(LEVEL_GAIN.hp * 2)
    expect(levelBonus(LEVEL.start + 2).attack).toBe(LEVEL_GAIN.attack * 2)
    expect(maxMp(LEVEL.start)).toBe(MP.start)
    expect(maxMp(LEVEL.start + 2)).toBe(MP.start + MP.perLevel * 2)
  })
})

describe('싸움 보상', () => {
  it('인턴 층에서는 기준 보상 그대로이고, 보스가 직원보다 많다', () => {
    expect(fightReward('employee', 0)).toEqual(FIGHT_REWARDS.employee)
    expect(fightReward('boss', 0).xp).toBeGreaterThan(fightReward('employee', 0).xp)
    expect(fightReward('boss', 0).money).toBeGreaterThan(fightReward('employee', 0).money)
  })

  it('직급이 오를수록 보상이 커진다', () => {
    expect(fightReward('employee', 2).xp).toBe(Math.round(FIGHT_REWARDS.employee.xp * (1 + REWARD_RANK_SCALE * 2)))
    expect(fightReward('boss', 7).money).toBeGreaterThan(fightReward('boss', 6).money)
  })

  it('직원을 이기면 경험치와 월급을 받는다', () => {
    const career = winAgainstEmployee(createCareer())
    expect(career.xp).toBe(FIGHT_REWARDS.employee.xp)
    expect(career.money).toBe(FIGHT_REWARDS.employee.money)
  })

  it('보스를 이기면 경험치와 월급을 받고, 레벨이 오를 수 있다', () => {
    let career = createCareer()
    while (employeesLeft(career) > 0) career = winAgainstEmployee(career)
    const before = career
    career = winAgainstBoss(career)
    expect(career.money).toBe(before.money + FIGHT_REWARDS.boss.money)
    expect(career.level).toBeGreaterThan(before.level)
  })

  it('져도 레벨, 경험치, 월급은 줄지 않고 경험치를 조금 번다', () => {
    const start: Career = { ...withMoney(70), level: 3, xp: 5 }
    const career = loseFight(start)
    expect(career.level).toBe(3)
    expect(career.xp).toBe(5 + FIGHT_REWARDS.loss.xp)
    expect(career.money).toBe(70)
  })

  it('월급과 실적은 따로 쌓이고 훈련은 월급을 쓰지 않는다', () => {
    const start: Career = { ...withMoney(70), performance: PERFORMANCE.trainCost }
    const career = trainStat(start, 'attack')
    expect(career.money).toBe(70)
    expect(career.performance).toBe(0)
  })
})

describe('능력치 합산', () => {
  it('처음에는 시작 능력치 그대로다', () => {
    expect(effectiveStats(createCareer())).toEqual(STARTING_STATS)
  })

  it('레벨 보너스가 더해지지만 직접 키운 능력치 값은 그대로다', () => {
    const career: Career = { ...createCareer(), level: LEVEL.start + 3 }
    expect(effectiveStats(career).hp).toBe(STARTING_STATS.hp + LEVEL_GAIN.hp * 3)
    expect(career.stats).toEqual(STARTING_STATS)
  })
})

describe('사내 매점', () => {
  const item = SHOP_ITEMS[0]

  it('장비 id가 보스 장비와 겹치지 않는다', () => {
    const ids = [...SHOP_ITEMS.map((shopItem) => shopItem.id), ...RANKS.map((rank) => rank.bossDrop.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('월급을 내고 사면 장비가 생기고 능력치에 더해진다', () => {
    const career = buyItem(withMoney(item.price + 5), item.id)
    expect(career.money).toBe(5)
    expect(career.equipmentIds).toContain(item.id)
    expect(effectiveStats(career).attack).toBe(STARTING_STATS.attack + (item.bonus.attack ?? 0))
  })

  it('월급이 모자라면 살 수 없다', () => {
    expect(() => buyItem(withMoney(item.price - 1), item.id)).toThrow()
  })

  it('이미 산 장비는 다시 살 수 없다', () => {
    const career = buyItem(withMoney(item.price * 2), item.id)
    expect(() => buyItem(career, item.id)).toThrow()
  })

  it('매점에 없는 물건은 살 수 없다', () => {
    expect(() => buyItem(withMoney(100_000), RANKS[0].bossDrop.id)).toThrow()
  })

  it('회사를 지배한 뒤에는 살 수 없다', () => {
    expect(() => buyItem({ ...withMoney(100_000), ruling: true }, item.id)).toThrow()
  })
})
