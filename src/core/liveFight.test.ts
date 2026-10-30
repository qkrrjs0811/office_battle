import { describe, expect, it } from 'vitest'
import { COMBAT, LEAVE_DASH, OVERTIME, PAPER_THROW, SWIPE } from '../data/combat'
import type { EnemyStats, Stats } from '../data/ranks'
import { createFight } from './combat'
import { advanceLive, fightGauges, isSwipe, queueAction, startLive, type LiveFight } from './liveFight'

const player: Stats = { hp: 100, attack: 10, defense: 2 }
const enemy: EnemyStats = { hp: 30, attack: 8, defense: 0, attackIntervalMs: 2000, windupMs: 700 }
const live = (): LiveFight => startLive(createFight(player, enemy, 1))

describe('실시간으로 전투 진행', () => {
  it('지난 시간만큼 칸을 진행하고 남은 시간은 다음으로 넘긴다', () => {
    const { live: next } = advanceLive(live(), COMBAT.tickMs * 2 + 30)
    expect(next.fight.elapsedMs).toBe(COMBAT.tickMs * 2)
    expect(next.carryMs).toBe(30)
    const { live: after } = advanceLive(next, COMBAT.tickMs - 30)
    expect(after.fight.elapsedMs).toBe(COMBAT.tickMs * 3)
    expect(after.carryMs).toBe(0)
  })

  it('칸이 되기 전에 들어온 입력은 기다렸다가 한 번만 쓴다', () => {
    const queued = queueAction(live(), 'throw')
    const { live: waiting, events: none } = advanceLive(queued, COMBAT.tickMs / 2)
    expect(none).toEqual([])
    const { live: thrown, events } = advanceLive(waiting, COMBAT.tickMs * 2)
    expect(events).toEqual([{ type: 'enemy-hit', damage: 10 }])
    expect(thrown.fight.enemy.hp).toBe(20)
    expect(thrown.fight.player.throwReadyAt).toBe(PAPER_THROW.cooldownMs)
    expect(thrown.pending).toBeNull()
  })

  it('화면이 오래 멈췄다 돌아와도 한 번에 정해진 시간까지만 진행해 억울하게 지지 않는다', () => {
    const { live: next } = advanceLive(live(), 60_000)
    expect(next.fight.elapsedMs).toBe(COMBAT.maxFrameMs)
    expect(next.carryMs).toBe(0)
  })

  it('전투가 끝나면 더 진행하지 않고 그 뒤 시간은 무시한다', () => {
    const weak = startLive(createFight(player, { ...enemy, hp: 1 }, 1))
    const { live: next, events } = advanceLive(queueAction(weak, 'throw'), COMBAT.maxFrameMs)
    expect(next.fight.result).toBe('won')
    expect(next.fight.elapsedMs).toBe(0)
    expect(events).toEqual([{ type: 'enemy-hit', damage: 10 }])
    expect(advanceLive(next, COMBAT.tickMs)).toEqual({ live: next, events: [] })
  })

  it('한 프레임에 여러 칸이 지나가도 일어난 일을 모두 돌려준다', () => {
    let current = live()
    const seen: string[] = []
    while (current.fight.result === 'ongoing' && current.fight.elapsedMs < 4000) {
      const { live: next, events } = advanceLive(current, COMBAT.maxFrameMs)
      seen.push(...events.map(({ type }) => type))
      current = next
    }
    expect(seen).toContain('enemy-windup')
    expect(seen).toContain('player-hit')
  })
})

describe('밀기 판단', () => {
  it('정해진 거리를 움직이면 어느 방향이든 밀기다', () => {
    expect(isSwipe(SWIPE.distancePx, 0)).toBe(true)
    expect(isSwipe(0, -SWIPE.distancePx)).toBe(true)
    expect(isSwipe(-SWIPE.distancePx, 0)).toBe(true)
  })

  it('조금 흔들린 것은 밀기가 아니다', () => {
    expect(isSwipe(SWIPE.distancePx - 1, 0)).toBe(false)
    expect(isSwipe(3, 3)).toBe(false)
  })
})

describe('전투 화면에 보여 줄 값', () => {
  it('처음에는 체력이 가득 차고 모두 쓸 수 있다', () => {
    expect(fightGauges(live().fight)).toEqual({
      playerHp: { current: 100, max: 100 },
      enemyHp: { current: 30, max: 30 },
      throwCharge: 1,
      dashCharge: 1,
      overtimeCharge: 1,
      dashing: false,
      overtimeActive: false,
      windup: false,
      hitInMs: null,
    })
  })

  it('쓴 기술은 다시 쓸 때까지 차오르는 비율로 보인다', () => {
    let current = queueAction(live(), 'throw')
    while (current.fight.elapsedMs < PAPER_THROW.cooldownMs / 2) current = advanceLive(current, COMBAT.tickMs).live
    expect(fightGauges(current.fight).throwCharge).toBeCloseTo(0.5)
    expect(fightGauges(current.fight).enemyHp.current).toBe(20)

    current = advanceLive(queueAction(live(), 'dash'), COMBAT.tickMs).live
    expect(fightGauges(current.fight).dashing).toBe(true)
    expect(fightGauges(current.fight).dashCharge).toBeCloseTo(COMBAT.tickMs / LEAVE_DASH.cooldownMs)

    current = advanceLive(queueAction(live(), 'overtime'), COMBAT.tickMs).live
    expect(fightGauges(current.fight).overtimeActive).toBe(true)
    expect(fightGauges(current.fight).overtimeCharge).toBeCloseTo(COMBAT.tickMs / OVERTIME.cooldownMs)
  })

  it('적이 준비 동작을 하는 동안 windup이 켜진다', () => {
    let current = live()
    while (current.fight.enemy.phase !== 'windup') current = advanceLive(current, COMBAT.tickMs).live
    expect(fightGauges(current.fight).windup).toBe(true)
    expect(fightGauges(current.fight).hitInMs).toBe(enemy.windupMs)
    current = advanceLive(current, COMBAT.tickMs).live
    expect(fightGauges(current.fight).hitInMs).toBe(enemy.windupMs - COMBAT.tickMs)
  })
})
