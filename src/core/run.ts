import { PERFORMANCE, type EnemyStats, type StatName } from '../data/ranks'
import {
  buyItem,
  canChallengeBoss,
  createCareer,
  currentRank,
  effectiveStats,
  loseFight,
  trainStat,
  winAgainstBoss,
  winAgainstEmployee,
  type Career,
} from './career'
import { createFight, stepFight, type Fight, type FightAction, type FightResult } from './combat'

// 플레이어 대신 조작하는 쪽. 사람의 입력이 들어올 자리를 봇이 채운다.
export type Pilot = {
  act: (fight: Fight) => FightAction | null
  // 실적이 있을 때 키울 능력치. null이면 훈련하지 않는다
  train: (career: Career) => StatName | null
  // 월급으로 살 매점 물건. 없거나 null이면 사지 않는다
  buy?: (career: Career) => string | null
}

export type Opponent = { kind: 'employee' | 'boss'; name: string; stats: EnemyStats }

export type FightLog = {
  rankName: string
  kind: Opponent['kind']
  opponentName: string
  result: Exclude<FightResult, 'ongoing'>
  elapsedMs: number
  hpLeft: number
}

export type CareerRun = { career: Career; log: FightLog[] }

// 터미널·봇이 무한히 돌지 않게 막는 기본 상한
export const DEFAULT_MAX_FIGHTS = 5000

export const nextOpponent = (career: Career): Opponent => {
  const rank = currentRank(career)
  return canChallengeBoss(career)
    ? { kind: 'boss', name: rank.bossName, stats: rank.boss }
    : { kind: 'employee', name: rank.employeeName, stats: rank.employee }
}

const buyAll = (career: Career, pilot: Pilot): Career => {
  let next = career
  for (let itemId = pilot.buy?.(next); itemId; itemId = pilot.buy?.(next)) next = buyItem(next, itemId)
  return next
}

const trainAll = (career: Career, pilot: Pilot): Career => {
  let next = career
  while (next.performance >= PERFORMANCE.trainCost) {
    const stat = pilot.train(next)
    if (stat === null) break
    next = trainStat(next, stat)
  }
  return next
}

export const fightNext = (career: Career, pilot: Pilot, seed: number): { career: Career; log: FightLog } => {
  const opponent = nextOpponent(career)
  let fight = createFight(effectiveStats(career), opponent.stats, seed)
  while (fight.result === 'ongoing') fight = stepFight(fight, pilot.act(fight))
  const won = fight.result === 'won'
  const afterWin = opponent.kind === 'boss' ? winAgainstBoss : winAgainstEmployee
  return {
    career: won ? afterWin(career) : loseFight(career),
    log: {
      rankName: currentRank(career).name,
      kind: opponent.kind,
      opponentName: opponent.name,
      result: won ? 'won' : 'lost',
      elapsedMs: fight.elapsedMs,
      hpLeft: fight.player.hp,
    },
  }
}

// 인턴부터 회사를 지배할 때까지(또는 싸움 횟수 상한까지) 한 판을 끝까지 돌린다.
export const runCareer = (pilot: Pilot, seed: number, maxFights = DEFAULT_MAX_FIGHTS): CareerRun => {
  let career = createCareer()
  const log: FightLog[] = []
  while (!career.ruling && log.length < maxFights) {
    const result = fightNext(buyAll(trainAll(career, pilot), pilot), pilot, seed + log.length)
    career = result.career
    log.push(result.log)
  }
  return { career, log }
}
