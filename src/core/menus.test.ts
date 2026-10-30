import { describe, expect, it } from 'vitest'
import { SHOP_ITEMS } from '../data/growth'
import { QUESTS } from '../data/quests'
import { PERFORMANCE, RANKS, TRAIN_GAIN } from '../data/ranks'
import { buyItem, claimQuest, createCareer, trainStat, visitMap, winAgainstBoss, type Career } from './career'
import { bonusText, claimableCount, questMenu, rewardText, shopMenu, trainMenu } from './menus'

const rich = (money: number, performance = 0): Career => ({ ...createCareer(), money, performance })

describe('퀘스트 메뉴', () => {
  it('처음에는 받을 보상이 없다', () => {
    expect(claimableCount(createCareer())).toBe(0)
  })

  it('깬 퀘스트가 맨 위, 받은 퀘스트가 맨 아래에 온다', () => {
    let career = visitMap(createCareer(), 'gate')
    expect(claimableCount(career)).toBe(1)
    expect(questMenu(career)[0].quest.id).toBe('first-commute')

    career = claimQuest(career, 'first-commute')
    expect(claimableCount(career)).toBe(0)
    const menu = questMenu(career)
    expect(menu[menu.length - 1].quest.id).toBe('first-commute')
    expect(menu[menu.length - 1].status).toBe('claimed')
  })

  it('받은 직급의 퀘스트만 빠짐없이 보인다', () => {
    const interns = QUESTS.filter((quest) => quest.rankId === RANKS[0].id)
    expect(questMenu(createCareer())).toHaveLength(interns.length)
  })

  it('승진하면 새 직급의 퀘스트가 더해진다', () => {
    const career = { ...createCareer(), employeesBeaten: RANKS[0].employeeCount }
    expect(questMenu(winAgainstBoss(career)).length).toBeGreaterThan(questMenu(career).length)
  })
})

describe('매점 메뉴', () => {
  it('월급으로 살 수 있는지와 모자란지를 나눈다', () => {
    const [first, second] = SHOP_ITEMS
    const menu = shopMenu(rich(first.price))
    expect(menu[0]).toEqual({ item: first, status: 'buyable' })
    expect(menu[1]).toEqual({ item: second, status: 'short' })
  })

  it('이미 산 물건은 산 것으로 보인다', () => {
    const career = buyItem(rich(SHOP_ITEMS[0].price), SHOP_ITEMS[0].id)
    expect(shopMenu(career)[0].status).toBe('owned')
  })

  it('회사를 지배한 뒤에는 살 수 없다', () => {
    const menu = shopMenu({ ...rich(100_000), ruling: true })
    expect(menu.every(({ status }) => status === 'closed')).toBe(true)
  })

  it('살 수 있다고 한 물건만 실제로 살 수 있다', () => {
    const career = rich(SHOP_ITEMS[0].price)
    for (const { item, status } of shopMenu(career)) {
      if (status === 'buyable') expect(() => buyItem(career, item.id)).not.toThrow()
      else expect(() => buyItem(career, item.id)).toThrow()
    }
  })
})

describe('훈련 메뉴', () => {
  it('능력치 세 가지를 비용, 오르는 값과 함께 보여 준다', () => {
    const menu = trainMenu(rich(0, PERFORMANCE.trainCost))
    expect(menu.map(({ stat }) => stat)).toEqual(['hp', 'attack', 'defense'])
    for (const row of menu) {
      expect(row.gain).toBe(TRAIN_GAIN[row.stat])
      expect(row.cost).toBe(PERFORMANCE.trainCost)
      expect(row.available).toBe(true)
    }
  })

  it('실적이 모자라거나 회사를 지배하면 훈련할 수 없다', () => {
    expect(trainMenu(rich(0, PERFORMANCE.trainCost - 1)).some((row) => row.available)).toBe(false)
    expect(trainMenu({ ...rich(0, 100), ruling: true }).some((row) => row.available)).toBe(false)
  })

  it('할 수 있다고 한 훈련은 실제로 할 수 있다', () => {
    const career = rich(0, PERFORMANCE.trainCost)
    for (const { stat } of trainMenu(career)) expect(() => trainStat(career, stat)).not.toThrow()
  })
})

describe('글로 나타내기', () => {
  it('장비 효과를 능력치 이름으로 쓴다', () => {
    expect(bonusText({ hp: 20, defense: 2 })).toBe('체력 +20, 방어 +2')
  })

  it('퀘스트 보상에서 0인 것은 뺀다', () => {
    expect(rewardText({ xp: 5, money: 10, performance: 0 })).toBe('경험치 +5, 월급 +10')
    expect(rewardText({ xp: 0, money: 0, performance: 2 })).toBe('실적 +2')
  })
})
