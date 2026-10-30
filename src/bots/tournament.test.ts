import { describe, expect, it } from 'vitest'
import { createCareer } from '../core/career'
import type { CareerRun, FightLog } from '../core/run'
import { SKILLED_BOT, SLOPPY_BOT } from '../data/bots'
import { RANKS } from '../data/ranks'
import { formatTables, playMany, summarize } from './tournament'

const fight = (rankName: string, result: FightLog['result'], elapsedMs = 60_000): FightLog => ({
  rankName,
  kind: 'employee',
  opponentName: '상대',
  result,
  elapsedMs,
  hpLeft: 0,
})

const ruled: CareerRun = {
  career: { ...createCareer(), rankIndex: RANKS.length - 1, ruling: true, level: 10 },
  log: [fight('인턴', 'won'), fight('인턴', 'lost'), fight('신입', 'lost')],
}

const stuck: CareerRun = {
  career: { ...createCareer(), rankIndex: 1, level: 4 },
  log: [fight('신입', 'lost')],
}

describe('결과 모으기', () => {
  it('지배한 판, 평균, 직급별 패배, 멈춘 직급을 센다', () => {
    const summary = summarize('시험 봇', [ruled, stuck])
    expect(summary).toMatchObject({
      name: '시험 봇',
      games: 2,
      ruled: 1,
      avgFights: 2,
      avgLosses: 1.5,
      avgMinutes: 2,
      avgLevel: 7,
    })
    expect(summary.avgLossesByRank[0]).toBe(0.5)
    expect(summary.avgLossesByRank[1]).toBe(1)
    expect(summary.stoppedByRank[1]).toBe(1)
    expect(summary.stoppedByRank[RANKS.length - 1]).toBe(0)
  })
})

describe('여러 판 돌리기', () => {
  it('요청한 수만큼 서로 다른 시드로 돌린다', () => {
    const runs = playMany(SLOPPY_BOT, 3, 5)
    expect(runs).toHaveLength(3)
    expect(new Set(runs.map((run) => JSON.stringify(run.log))).size).toBeGreaterThan(1)
  })

  it('한 판의 싸움은 상한을 넘지 않는다', () => {
    for (const run of playMany(SLOPPY_BOT, 3, 5)) expect(run.log.length).toBeLessThanOrEqual(5)
  })

  it('잘하는 봇은 수백 판을 모두 끝낸다', () => {
    const summary = summarize(SKILLED_BOT.name, playMany(SKILLED_BOT, 200))
    expect(summary.ruled).toBe(200)
  })
})

describe('결과 표', () => {
  it('봇 이름, 지배 판 수, 직급 이름이 찍힌다', () => {
    const text = formatTables([summarize('시험 봇', [ruled, stuck])])
    expect(text).toContain('| 시험 봇 | 2 | 1 (50%) |')
    for (const rank of RANKS) expect(text).toContain(rank.name)
  })
})
