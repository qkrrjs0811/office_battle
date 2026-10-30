import { describe, expect, it } from 'vitest'
import { steadyPilot } from '../bots/steadyPilot'
import { SHOP_ITEMS } from '../data/growth'
import { MAPS } from '../data/maps'
import { QUESTS, type Quest } from '../data/quests'
import { PERFORMANCE, RANKS } from '../data/ranks'
import {
  buyItem,
  claimQuest,
  createCareer,
  employeesLeft,
  loseFight,
  trainStat,
  visitMap,
  winAgainstBoss,
  winAgainstEmployee,
  type Career,
} from './career'
import { gainXp } from './growth'
import { questBoard, questEntry } from './quests'
import { runCareer } from './run'

const byId = (id: string): Quest => {
  const quest = QUESTS.find((candidate) => candidate.id === id)
  if (!quest) throw new Error(`퀘스트 없음: ${id}`)
  return quest
}

const clearFloor = (career: Career): Career => {
  let next = career
  while (employeesLeft(next) > 0) next = winAgainstEmployee(next)
  return next
}

const promote = (career: Career): Career => winAgainstBoss(clearFloor(career))

const statusOf = (career: Career, id: string) => questEntry(career, id).status

describe('퀘스트 데이터', () => {
  it('아이디가 겹치지 않고 모든 직급에 퀘스트가 있다', () => {
    expect(new Set(QUESTS.map((quest) => quest.id)).size).toBe(QUESTS.length)
    for (const rank of RANKS) expect(QUESTS.some((quest) => quest.rankId === rank.id)).toBe(true)
  })

  it('없는 직급이나 맵을 가리키지 않는다', () => {
    for (const quest of QUESTS) {
      expect(RANKS.some((rank) => rank.id === quest.rankId)).toBe(true)
      if (quest.goal.kind === 'visit') {
        const { mapId } = quest.goal
        expect(MAPS.some((map) => map.id === mapId)).toBe(true)
      }
    }
  })

  it('목표는 1번 이상이고 깨면 경험치와 월급을 준다', () => {
    for (const quest of QUESTS) {
      expect(quest.goal.count).toBeGreaterThan(0)
      expect(quest.reward.xp).toBeGreaterThan(0)
      expect(quest.reward.money).toBeGreaterThan(0)
      expect(quest.reward.performance).toBeGreaterThanOrEqual(0)
    }
  })

  it('매점 퀘스트는 살 물건이 떨어져 못 깨는 일이 없게 처음부터 받는다', () => {
    for (const quest of QUESTS.filter(({ goal }) => goal.kind === 'buy')) {
      expect(quest.rankId).toBe(RANKS[0].id)
      expect(quest.goal.count).toBeLessThanOrEqual(SHOP_ITEMS.length)
    }
  })
})

describe('퀘스트 받기', () => {
  it('지금 직급까지의 퀘스트만 보인다', () => {
    const board = questBoard(createCareer())
    expect(board.length).toBeGreaterThan(0)
    expect(board.every(({ quest }) => quest.rankId === RANKS[0].id)).toBe(true)
  })

  it('승진하면 새 직급의 퀘스트가 더해지고 이전 퀘스트도 남는다', () => {
    const before = questBoard(createCareer()).length
    const board = questBoard(promote(createCareer()))
    expect(board.length).toBeGreaterThan(before)
    expect(board.some(({ quest }) => quest.rankId === RANKS[1].id)).toBe(true)
    expect(board.some(({ quest }) => quest.rankId === RANKS[0].id)).toBe(true)
  })

  it('처음에는 모두 진행 중이고 진행도가 0이다', () => {
    for (const entry of questBoard(createCareer())) {
      expect(entry.status).toBe('active')
      expect(entry.progress).toBe(0)
    }
  })
})

describe('진행도 세기', () => {
  it('직원을 이기면 직원 퀘스트가 오른다', () => {
    const career = winAgainstEmployee(createCareer())
    expect(questEntry(career, 'copy-machine-war').progress).toBe(1)
    expect(statusOf(career, 'copy-machine-war')).toBe('active')
  })

  it('목표를 채우면 받을 수 있는 상태가 되고 진행도는 목표를 넘지 않는다', () => {
    const career = clearFloor(createCareer())
    const entry = questEntry(career, 'copy-machine-war')
    expect(entry.status).toBe('done')
    expect(entry.progress).toBe(byId('copy-machine-war').goal.count)
  })

  it('보스를 이기면 승진 전 직급의 보스 퀘스트가 찬다', () => {
    expect(statusOf(promote(createCareer()), 'beat-mentor')).toBe('done')
  })

  it('지는 것도 퀘스트가 되고 져도 쌓은 진행도는 줄지 않는다', () => {
    let career = winAgainstEmployee(createCareer())
    career = loseFight(career)
    expect(career.employeesBeaten).toBe(0)
    expect(questEntry(career, 'copy-machine-war').progress).toBe(1)
    expect(questEntry(career, 'learn-by-losing').progress).toBe(1)
  })

  it('훈련과 구매를 센다', () => {
    const rich: Career = { ...createCareer(), money: SHOP_ITEMS[0].price }
    expect(statusOf(buyItem(rich, SHOP_ITEMS[0].id), 'first-flex')).toBe('done')

    const trainer: Career = { ...promote(createCareer()), performance: PERFORMANCE.trainCost }
    expect(questEntry(trainStat(trainer, 'hp'), 'self-study').progress).toBe(1)
  })

  it('목표로 정한 맵에 들르면 찬다. 다른 맵은 세지 않는다', () => {
    const career = createCareer()
    expect(questEntry(visitMap(career, 'restroom'), 'first-commute').progress).toBe(0)
    expect(statusOf(visitMap(career, 'gate'), 'first-commute')).toBe('done')
  })

  it('받기 전에 한 일은 세지 않는다', () => {
    const visited = visitMap(createCareer(), 'restroom')
    expect(questEntry(promote(visited), 'toilet-break').progress).toBe(0)
  })

  it('직급이 올라도 이전 직급 퀘스트는 계속 센다', () => {
    const career = visitMap(promote(createCareer()), 'gate')
    expect(statusOf(career, 'first-commute')).toBe('done')
  })
})

describe('보상 받기', () => {
  it('경험치, 월급, 실적을 받고 받은 퀘스트로 표시된다', () => {
    const start = visitMap({ ...createCareer(), money: 7, performance: 2 }, 'gate')
    const { xp, money, performance } = byId('first-commute').reward
    const career = claimQuest(start, 'first-commute')
    expect(career).toMatchObject({
      ...gainXp(start, xp),
      money: 7 + money,
      performance: 2 + performance,
    })
    expect(statusOf(career, 'first-commute')).toBe('claimed')
  })

  it('경험치가 차면 레벨이 오른다', () => {
    const start: Career = { ...visitMap(createCareer(), 'gate'), xp: 19 }
    expect(claimQuest(start, 'first-commute').level).toBeGreaterThan(start.level)
  })

  it('목표를 못 채웠거나 이미 받았거나 없거나 아직 못 받은 퀘스트는 받을 수 없다', () => {
    const career = createCareer()
    expect(() => claimQuest(career, 'first-commute')).toThrow()
    expect(() => claimQuest(career, 'no-such-quest')).toThrow()
    const claimed = claimQuest(visitMap(career, 'gate'), 'first-commute')
    expect(() => claimQuest(claimed, 'first-commute')).toThrow()
    expect(() => claimQuest(career, 'toilet-break')).toThrow()
  })

  it('받은 퀘스트는 더 세지 않는다', () => {
    const claimed = claimQuest(visitMap(createCareer(), 'gate'), 'first-commute')
    expect(visitMap(claimed, 'gate').questProgress).toEqual(claimed.questProgress)
  })

  it('회사를 지배한 뒤에도 마지막 보스 퀘스트 보상을 받는다', () => {
    let career = createCareer()
    while (!career.ruling) career = promote(career)
    expect(statusOf(career, 'take-the-seal')).toBe('done')
    expect(claimQuest(career, 'take-the-seal').money).toBeGreaterThan(career.money)
  })

  it('받지 않아도 사라지지 않고 승진 뒤에 받을 수 있다', () => {
    const career = promote(createCareer())
    expect(statusOf(career, 'copy-machine-war')).toBe('done')
    expect(statusOf(claimQuest(career, 'copy-machine-war'), 'copy-machine-war')).toBe('claimed')
  })
})

describe('한 판에서', () => {
  it('봇이 지지 않으면 지는 퀘스트 말고 모두 깨고 보상을 받는다. 못 깨는 퀘스트가 없다', () => {
    const { career } = runCareer(steadyPilot, 1)
    const unclaimed = questBoard(career).filter(({ status }) => status !== 'claimed')
    expect(career.ruling).toBe(true)
    expect(questBoard(career)).toHaveLength(QUESTS.length)
    expect(unclaimed.map(({ quest }) => quest.goal.kind)).toEqual(['loss'])
  })

  it('지는 퀘스트도 진 만큼 차서 받을 수 있다', () => {
    let career = createCareer()
    for (let i = 0; i < byId('learn-by-losing').goal.count; i += 1) career = loseFight(career)
    expect(statusOf(career, 'learn-by-losing')).toBe('done')
  })
})
