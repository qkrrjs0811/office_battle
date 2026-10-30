import { LEVEL, SHOP_ITEMS, type FightReward } from '../data/growth'
import {
  PERFORMANCE,
  RANKS,
  STARTING_STATS,
  TRAIN_GAIN,
  type Rank,
  type StatName,
  type Stats,
} from '../data/ranks'
import { fightReward, gainXp, levelBonus } from './growth'
import { advanceQuests, questEntry } from './quests'

// 한 플레이어의 회사 생활. 저장하기 쉽게 그대로 JSON이 되는 값만 둔다.
export type Career = {
  rankIndex: number
  stats: Stats
  equipmentIds: string[]
  performance: number
  level: number
  xp: number
  money: number
  employeesBeaten: number
  ruling: boolean
  // 퀘스트 아이디별 진행도. 지거나 승진해도 줄지 않는다
  questProgress: Record<string, number>
  claimedQuestIds: string[]
}

const STAT_NAMES: StatName[] = ['hp', 'attack', 'defense']

const addStats = (stats: Stats, bonus: Partial<Stats>): Stats => {
  const next = { ...stats }
  for (const name of STAT_NAMES) next[name] += bonus[name] ?? 0
  return next
}

const collectReward = (career: Career, { xp, money }: FightReward): Career => ({
  ...career,
  ...gainXp(career, xp),
  money: career.money + money,
})

const assertPlaying = (career: Career) => {
  if (career.ruling) throw new Error('이미 회사를 지배해 판이 끝났다')
}

export const createCareer = (): Career => ({
  rankIndex: 0,
  stats: { ...STARTING_STATS },
  equipmentIds: [],
  performance: 0,
  level: LEVEL.start,
  xp: 0,
  money: 0,
  employeesBeaten: 0,
  ruling: false,
  questProgress: {},
  claimedQuestIds: [],
})

export const currentRank = (career: Career): Rank => RANKS[career.rankIndex]

export const effectiveStats = (career: Career): Stats => {
  const owned = [...RANKS.map((rank) => rank.bossDrop), ...SHOP_ITEMS].filter((item) =>
    career.equipmentIds.includes(item.id),
  )
  return owned.reduce((stats, item) => addStats(stats, item.bonus), addStats(career.stats, levelBonus(career.level)))
}

export const employeesLeft = (career: Career): number =>
  career.ruling ? 0 : currentRank(career).employeeCount - career.employeesBeaten

export const canChallengeBoss = (career: Career): boolean =>
  !career.ruling && employeesLeft(career) === 0

export const winAgainstEmployee = (career: Career): Career => {
  assertPlaying(career)
  if (employeesLeft(career) === 0) throw new Error('이 층에 남은 직원이 없다')
  return collectReward(
    {
      ...advanceQuests(career, { kind: 'employeeWin' }),
      employeesBeaten: career.employeesBeaten + 1,
      performance: career.performance + PERFORMANCE.perEmployeeWin,
    },
    fightReward('employee', career.rankIndex),
  )
}

// 보스를 이기면 승진한다. 마지막 층의 보스를 이기면 회사를 지배한다.
export const winAgainstBoss = (career: Career): Career => {
  assertPlaying(career)
  if (!canChallengeBoss(career)) throw new Error('직원을 다 이겨야 보스와 싸울 수 있다')
  const rank = currentRank(career)
  const isLastFloor = career.rankIndex === RANKS.length - 1
  return collectReward(
    {
      ...advanceQuests(career, { kind: 'bossWin' }),
      rankIndex: isLastFloor ? career.rankIndex : career.rankIndex + 1,
      stats: addStats(career.stats, rank.promotionBonus),
      equipmentIds: [...career.equipmentIds, rank.bossDrop.id],
      performance: career.performance + PERFORMANCE.perBossWin,
      employeesBeaten: 0,
      ruling: isLastFloor,
    },
    fightReward('boss', career.rankIndex),
  )
}

// 지면 층의 처음으로 돌아갈 뿐, 키운 것은 모두 남는다.
export const loseFight = (career: Career): Career => {
  assertPlaying(career)
  return collectReward(
    {
      ...advanceQuests(career, { kind: 'loss' }),
      employeesBeaten: 0,
      performance: career.performance + PERFORMANCE.perLoss,
    },
    fightReward('loss', career.rankIndex),
  )
}

export const trainStat = (career: Career, stat: StatName): Career => {
  assertPlaying(career)
  if (career.performance < PERFORMANCE.trainCost) throw new Error('실적이 모자란다')
  return {
    ...advanceQuests(career, { kind: 'train' }),
    stats: { ...career.stats, [stat]: career.stats[stat] + TRAIN_GAIN[stat] },
    performance: career.performance - PERFORMANCE.trainCost,
  }
}

export const buyItem = (career: Career, itemId: string): Career => {
  assertPlaying(career)
  const item = SHOP_ITEMS.find((shopItem) => shopItem.id === itemId)
  if (!item) throw new Error('매점에 없는 물건이다')
  if (career.equipmentIds.includes(item.id)) throw new Error('이미 산 장비다')
  if (career.money < item.price) throw new Error('월급이 모자란다')
  return {
    ...advanceQuests(career, { kind: 'buy' }),
    equipmentIds: [...career.equipmentIds, item.id],
    money: career.money - item.price,
  }
}

// 맵에 들른 것을 퀘스트에 센다. 회사를 지배한 뒤에도 돌아다닐 수 있다.
export const visitMap = (career: Career, mapId: string): Career => advanceQuests(career, { kind: 'visit', mapId })

// 깬 퀘스트의 보상을 받는다. 마지막 보스 퀘스트는 지배한 뒤에 받으므로 판이 끝나도 받을 수 있다.
export const claimQuest = (career: Career, questId: string): Career => {
  const { quest, status } = questEntry(career, questId)
  if (status === 'claimed') throw new Error('이미 받은 보상이다')
  if (status !== 'done') throw new Error('아직 깨지 못한 퀘스트다')
  const { xp, money, performance } = quest.reward
  return collectReward(
    {
      ...career,
      performance: career.performance + performance,
      claimedQuestIds: [...career.claimedQuestIds, quest.id],
    },
    { xp, money },
  )
}
