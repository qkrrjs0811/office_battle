import { currentRank, effectiveStats } from '../core/career'
import { questBoard } from '../core/quests'
import type { CareerRun, FightLog } from '../core/run'
import { QUESTS } from '../data/quests'

const RESULT_LABEL = { won: '승', lost: '패' }
const KIND_LABEL = { employee: '직원', boss: '보스' }

const formatFight = (fight: FightLog, index: number): string => {
  const seconds = (fight.elapsedMs / 1000).toFixed(1)
  return `${index + 1}. [${fight.rankName}] ${KIND_LABEL[fight.kind]} ${fight.opponentName}: ${RESULT_LABEL[fight.result]} (${seconds}초, 남은 체력 ${fight.hpLeft})`
}

export const formatRun = ({ career, log }: CareerRun): string => {
  const stats = effectiveStats(career)
  const losses = log.filter((fight) => fight.result === 'lost').length
  const ending = career.ruling ? '회사를 지배했다!' : `${currentRank(career).name}에서 멈췄다`
  const totalSeconds = log.reduce((sum, fight) => sum + fight.elapsedMs, 0) / 1000
  const claimed = questBoard(career).filter(({ status }) => status === 'claimed').length
  return [
    ...log.map(formatFight),
    '',
    `결과: ${ending}`,
    `싸움 ${log.length}번, 패배 ${losses}번, 전투 시간 ${totalSeconds.toFixed(0)}초`,
    `레벨 ${career.level}, 남은 월급 ${career.money}, 남은 실적 ${career.performance}, 보상 받은 퀘스트 ${claimed}/${QUESTS.length}개`,
    `능력치: 체력 ${stats.hp}, 공격 ${stats.attack}, 방어 ${stats.defense}, 장비 ${career.equipmentIds.length}개`,
  ].join('\n')
}
