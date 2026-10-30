import { QUESTS, type Quest } from '../data/quests'
import { RANKS } from '../data/ranks'
import type { Career } from './career'

export type QuestEvent =
  | { kind: 'employeeWin' | 'bossWin' | 'loss' | 'train' | 'buy' }
  | { kind: 'visit'; mapId: string }

export type QuestStatus = 'active' | 'done' | 'claimed'

export type QuestEntry = { quest: Quest; progress: number; status: QuestStatus }

type QuestCareer = Pick<Career, 'rankIndex' | 'questProgress' | 'claimedQuestIds'>

const isUnlocked = (quest: Quest, rankIndex: number): boolean =>
  RANKS.findIndex((rank) => rank.id === quest.rankId) <= rankIndex

const matches = ({ goal }: Quest, event: QuestEvent): boolean => {
  if (goal.kind !== event.kind) return false
  return goal.kind !== 'visit' || (event.kind === 'visit' && goal.mapId === event.mapId)
}

const toEntry = (career: QuestCareer, quest: Quest): QuestEntry => {
  const progress = career.questProgress[quest.id] ?? 0
  if (career.claimedQuestIds.includes(quest.id)) return { quest, progress, status: 'claimed' }
  return { quest, progress, status: progress >= quest.goal.count ? 'done' : 'active' }
}

export const questEntry = (career: QuestCareer, questId: string): QuestEntry => {
  const quest = QUESTS.find((candidate) => candidate.id === questId)
  if (!quest) throw new Error('없는 퀘스트다')
  return toEntry(career, quest)
}

// 지금 직급까지 받은 퀘스트 전부. 받은 보상도 지우지 않고 보여 준다.
export const questBoard = (career: QuestCareer): QuestEntry[] =>
  QUESTS.filter((quest) => isUnlocked(quest, career.rankIndex)).map((quest) => toEntry(career, quest))

// 받은 퀘스트 가운데 이 일에 맞는 것의 진행도를 올린다. 목표를 넘겨 세지 않는다.
export const advanceQuests = <C extends QuestCareer>(career: C, event: QuestEvent): C => {
  const questProgress = { ...career.questProgress }
  for (const quest of QUESTS) {
    if (!isUnlocked(quest, career.rankIndex) || !matches(quest, event)) continue
    questProgress[quest.id] = Math.min((questProgress[quest.id] ?? 0) + 1, quest.goal.count)
  }
  return { ...career, questProgress }
}
