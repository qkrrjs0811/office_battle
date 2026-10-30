import {
  PERFORMANCE,
  RANKS,
  STARTING_STATS,
  TRAIN_GAIN,
  type Rank,
  type StatName,
  type Stats,
} from '../data/ranks'

// 한 플레이어의 회사 생활. 저장하기 쉽게 그대로 JSON이 되는 값만 둔다.
export type Career = {
  rankIndex: number
  stats: Stats
  equipmentIds: string[]
  performance: number
  employeesBeaten: number
  ruling: boolean
}

const STAT_NAMES: StatName[] = ['hp', 'attack', 'defense']

const addStats = (stats: Stats, bonus: Partial<Stats>): Stats => {
  const next = { ...stats }
  for (const name of STAT_NAMES) next[name] += bonus[name] ?? 0
  return next
}

const assertPlaying = (career: Career) => {
  if (career.ruling) throw new Error('이미 회사를 지배해 판이 끝났다')
}

export const createCareer = (): Career => ({
  rankIndex: 0,
  stats: { ...STARTING_STATS },
  equipmentIds: [],
  performance: 0,
  employeesBeaten: 0,
  ruling: false,
})

export const currentRank = (career: Career): Rank => RANKS[career.rankIndex]

export const effectiveStats = (career: Career): Stats => {
  const owned = RANKS.map((rank) => rank.bossDrop).filter((item) =>
    career.equipmentIds.includes(item.id),
  )
  return owned.reduce((stats, item) => addStats(stats, item.bonus), { ...career.stats })
}

export const employeesLeft = (career: Career): number =>
  career.ruling ? 0 : currentRank(career).employeeCount - career.employeesBeaten

export const canChallengeBoss = (career: Career): boolean =>
  !career.ruling && employeesLeft(career) === 0

export const winAgainstEmployee = (career: Career): Career => {
  assertPlaying(career)
  if (employeesLeft(career) === 0) throw new Error('이 층에 남은 직원이 없다')
  return {
    ...career,
    employeesBeaten: career.employeesBeaten + 1,
    performance: career.performance + PERFORMANCE.perEmployeeWin,
  }
}

// 보스를 이기면 승진한다. 마지막 층의 보스를 이기면 회사를 지배한다.
export const winAgainstBoss = (career: Career): Career => {
  assertPlaying(career)
  if (!canChallengeBoss(career)) throw new Error('직원을 다 이겨야 보스와 싸울 수 있다')
  const rank = currentRank(career)
  const isLastFloor = career.rankIndex === RANKS.length - 1
  return {
    ...career,
    rankIndex: isLastFloor ? career.rankIndex : career.rankIndex + 1,
    stats: addStats(career.stats, rank.promotionBonus),
    equipmentIds: [...career.equipmentIds, rank.bossDrop.id],
    performance: career.performance + PERFORMANCE.perBossWin,
    employeesBeaten: 0,
    ruling: isLastFloor,
  }
}

// 지면 층의 처음으로 돌아갈 뿐, 키운 것은 모두 남는다.
export const loseFight = (career: Career): Career => {
  assertPlaying(career)
  return {
    ...career,
    employeesBeaten: 0,
    performance: career.performance + PERFORMANCE.perLoss,
  }
}

export const trainStat = (career: Career, stat: StatName): Career => {
  assertPlaying(career)
  if (career.performance < PERFORMANCE.trainCost) throw new Error('실적이 모자란다')
  return {
    ...career,
    stats: { ...career.stats, [stat]: career.stats[stat] + TRAIN_GAIN[stat] },
    performance: career.performance - PERFORMANCE.trainCost,
  }
}
