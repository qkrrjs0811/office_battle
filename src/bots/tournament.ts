import { runCareer, type CareerRun } from '../core/run'
import { BOT_MAX_FIGHTS, type BotProfile } from '../data/bots'
import { RANKS } from '../data/ranks'
import { createBot } from './pilots'

export type BotSummary = {
  name: string
  games: number
  ruled: number
  avgFights: number
  avgLosses: number
  avgMinutes: number
  avgLevel: number
  // RANKS 순서로 직급마다 한 판 평균 패배 수
  avgLossesByRank: number[]
  // RANKS 순서로 직급마다 상한까지 못 끝내고 멈춘 판 수
  stoppedByRank: number[]
}

export const playMany = (profile: BotProfile, games: number, maxFights = BOT_MAX_FIGHTS): CareerRun[] =>
  Array.from({ length: games }, (_, index) => runCareer(createBot(profile, index + 1), index + 1, maxFights))

export const summarize = (name: string, runs: CareerRun[]): BotSummary => {
  const average = (valueOf: (run: CareerRun) => number) =>
    runs.reduce((sum, run) => sum + valueOf(run), 0) / runs.length
  const lossesAt = (run: CareerRun, rankName?: string) =>
    run.log.filter((fight) => fight.result === 'lost' && (rankName === undefined || fight.rankName === rankName)).length
  return {
    name,
    games: runs.length,
    ruled: runs.filter((run) => run.career.ruling).length,
    avgFights: average((run) => run.log.length),
    avgLosses: average((run) => lossesAt(run)),
    avgMinutes: average((run) => run.log.reduce((sum, fight) => sum + fight.elapsedMs, 0)) / 60_000,
    avgLevel: average((run) => run.career.level),
    avgLossesByRank: RANKS.map((rank) => average((run) => lossesAt(run, rank.name))),
    stoppedByRank: RANKS.map(
      (_, index) => runs.filter((run) => !run.career.ruling && run.career.rankIndex === index).length,
    ),
  }
}

const row = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`

const table = (header: string[], rows: (string | number)[][]) =>
  [row(header), row(header.map(() => '---')), ...rows.map(row)].join('\n')

export const formatTables = (summaries: BotSummary[]): string => {
  const rankNames = RANKS.map((rank) => rank.name)
  const byRank = (valuesOf: (summary: BotSummary) => (string | number)[]) =>
    table(['봇', ...rankNames], summaries.map((summary) => [summary.name, ...valuesOf(summary)]))
  return [
    table(
      ['봇', '판', '지배한 판', '평균 싸움', '평균 패배', '평균 전투 시간(분)', '평균 레벨'],
      summaries.map((summary) => [
        summary.name,
        summary.games,
        `${summary.ruled} (${Math.round((summary.ruled / summary.games) * 100)}%)`,
        summary.avgFights.toFixed(1),
        summary.avgLosses.toFixed(1),
        summary.avgMinutes.toFixed(1),
        summary.avgLevel.toFixed(1),
      ]),
    ),
    '',
    '직급별 한 판 평균 패배',
    '',
    byRank((summary) => summary.avgLossesByRank.map((losses) => losses.toFixed(1))),
    '',
    '직급별 멈춘 판(상한까지 못 끝냄)',
    '',
    byRank((summary) => summary.stoppedByRank),
  ].join('\n')
}
