import { describe, expect, it } from 'vitest'
import { createFight, stepFight, type Fight } from '../core/combat'
import { runCareer } from '../core/run'
import { BOT_PROFILES, DILIGENT_BOT, SKILLED_BOT, SLOPPY_BOT } from '../data/bots'
import { RANKS, STARTING_STATS } from '../data/ranks'
import { createBot } from './pilots'

const enemy = RANKS[0].boss

const windupFight = (): Fight => {
  const fight = createFight({ ...STARTING_STATS, hp: 100_000 }, { ...enemy, hp: 100_000 }, 1)
  return { ...fight, enemy: { ...fight.enemy, phase: 'windup', nextAt: 200 } }
}

const totalMs = (seed: number, profile = SLOPPY_BOT) =>
  runCareer(createBot(profile, seed), seed, 20).log.reduce((sum, fight) => sum + fight.elapsedMs, 0)

const actionsOver = (profile: typeof SKILLED_BOT, seed: number, ticks: number) => {
  const pilot = createBot(profile, seed)
  let fight = createFight({ ...STARTING_STATS, hp: 100_000 }, { ...enemy, hp: 100_000 }, seed)
  const actions: (string | null)[] = []
  for (let tick = 0; tick < ticks; tick += 1) {
    const action = pilot.act(fight)
    actions.push(action)
    fight = stepFight(fight, action)
  }
  return actions
}

describe('봇 3종', () => {
  it('열심히 하는 봇, 잘하는 봇, 대충 하는 봇이 있다', () => {
    expect(BOT_PROFILES.map((profile) => profile.name)).toEqual(['열심히 하는 봇', '잘하는 봇', '대충 하는 봇'])
  })

  it('같은 시드면 어느 봇이든 결과가 똑같다', () => {
    for (const profile of BOT_PROFILES) {
      expect(runCareer(createBot(profile, 7), 7, 30)).toEqual(runCareer(createBot(profile, 7), 7, 30))
    }
  })

  it('시드가 다르면 실수하는 봇의 결과가 달라진다', () => {
    expect(runCareer(createBot(SLOPPY_BOT, 1), 1, 30)).not.toEqual(runCareer(createBot(SLOPPY_BOT, 2), 2, 30))
  })

  it('잘하는 봇은 언제나 CEO까지 간다', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(runCareer(createBot(SKILLED_BOT, seed), seed).career.ruling).toBe(true)
    }
  })

  it('잘하는 봇은 적이 준비 동작을 보이면 맞기 직전에 반드시 피한다', () => {
    expect(createBot(SKILLED_BOT, 1).act(windupFight())).toBe('dash')
  })

  it('실수하는 봇은 한 번의 준비 동작에 피할지를 한 번만 정한다', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const pilot = createBot(DILIGENT_BOT, seed)
      const fight = windupFight()
      const choices = new Set(Array.from({ length: 30 }, () => pilot.act(fight) === 'dash'))
      expect(choices.size).toBe(1)
    }
  })

  it('열심히 하는 봇은 때때로 피하고 때때로 놓친다', () => {
    const dodged = Array.from({ length: 100 }, (_, seed) => createBot(DILIGENT_BOT, seed).act(windupFight()) === 'dash')
    expect(dodged).toContain(true)
    expect(dodged).toContain(false)
  })

  it('대충 하는 봇은 야근 버프를 쓰지 않고 잘하는 봇보다 덜 누른다', () => {
    const sloppy = actionsOver(SLOPPY_BOT, 1, 300)
    const skilled = actionsOver(SKILLED_BOT, 1, 300)
    expect(sloppy).not.toContain('overtime')
    expect(skilled).toContain('overtime')
    expect(sloppy.filter((action) => action === null).length).toBeGreaterThan(100)
    expect(skilled).not.toContain(null)
  })

  it('대충 하는 봇은 매점과 퀘스트 보상을 쓰지 않고 공격만 훈련한다', () => {
    const { career } = runCareer(createBot(SLOPPY_BOT, 1), 1, 40)
    expect(career.claimedQuestIds).toEqual([])
    expect(career.equipmentIds.filter((id) => !RANKS.some((rank) => rank.bossDrop.id === id))).toEqual([])
    expect(career.stats.defense).toBe(STARTING_STATS.defense + RANKS.slice(0, career.rankIndex).reduce((sum, rank) => sum + (rank.promotionBonus.defense ?? 0), 0))
  })

  it('열심히 하는 봇은 매점과 퀘스트 보상을 쓴다', () => {
    const { career } = runCareer(createBot(DILIGENT_BOT, 1), 1, 60)
    expect(career.claimedQuestIds.length).toBeGreaterThan(0)
    expect(career.equipmentIds.some((id) => !RANKS.some((rank) => rank.bossDrop.id === id))).toBe(true)
  })

  it('대충 하는 봇의 싸움은 같은 횟수에서 잘하는 봇보다 오래 걸린다', () => {
    expect(totalMs(1, SLOPPY_BOT)).toBeGreaterThan(totalMs(1, SKILLED_BOT))
  })
})
