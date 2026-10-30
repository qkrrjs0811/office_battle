import { describe, expect, it } from 'vitest'
import { COMBAT, LEAVE_DASH, OVERTIME, PAPER_THROW } from '../data/combat'
import type { EnemyStats, Stats } from '../data/ranks'
import { createFight, stepFight, type Fight, type FightAction } from './combat'

const PLAYER: Stats = { hp: 100, attack: 10, defense: 2 }
const ENEMY: EnemyStats = { hp: 50, attack: 12, defense: 1, attackIntervalMs: 2000, windupMs: 700 }

const wait = (fight: Fight, ms: number): Fight => {
  let next = fight
  for (let passed = 0; passed < ms && next.result === 'ongoing'; passed += COMBAT.tickMs) {
    next = stepFight(next, null)
  }
  return next
}

const act = (fight: Fight, action: FightAction): Fight => stepFight(fight, action)

const waitUntilWindup = (fight: Fight): Fight => {
  let next = fight
  while (next.enemy.phase !== 'windup') next = stepFight(next, null)
  return next
}

describe('전투 시작', () => {
  it('양쪽 모두 체력이 가득 찬 채로 시작한다', () => {
    const fight = createFight(PLAYER, ENEMY, 1)
    expect(fight.player.hp).toBe(100)
    expect(fight.enemy.hp).toBe(50)
    expect(fight.result).toBe('ongoing')
  })

  it('전투 상태는 그대로 JSON이 된다', () => {
    const fight = act(createFight(PLAYER, ENEMY, 1), 'throw')
    expect(JSON.parse(JSON.stringify(fight))).toEqual(fight)
  })
})

describe('결재 서류 던지기', () => {
  it('공격에서 적 방어를 뺀 만큼 피해를 준다', () => {
    const fight = act(createFight(PLAYER, ENEMY, 1), 'throw')
    expect(fight.enemy.hp).toBe(41)
    expect(fight.events).toContainEqual({ type: 'enemy-hit', damage: 9 })
  })

  it('다시 던질 수 있을 때까지는 눌러도 나가지 않는다', () => {
    const thrown = act(createFight(PLAYER, ENEMY, 1), 'throw')
    expect(act(thrown, 'throw').enemy.hp).toBe(41)
    const ready = wait(thrown, PAPER_THROW.cooldownMs)
    expect(act(ready, 'throw').enemy.hp).toBe(32)
  })

  it('방어가 공격보다 높아도 최소 피해는 들어간다', () => {
    const fight = act(createFight(PLAYER, { ...ENEMY, defense: 99 }, 1), 'throw')
    expect(fight.enemy.hp).toBe(50 - COMBAT.minDamage)
  })
})

describe('적의 공격', () => {
  it('준비 동작을 보인 뒤에 때린다', () => {
    const windup = waitUntilWindup(createFight(PLAYER, ENEMY, 1))
    expect(windup.player.hp).toBe(100)
    expect(windup.events).toContainEqual({ type: 'enemy-windup' })
    const hit = wait(windup, ENEMY.windupMs)
    expect(hit.player.hp).toBe(90)
    expect(hit.enemy.phase).toBe('idle')
  })

  it('준비 동작이 끝나는 시각을 알려 준다', () => {
    const windup = waitUntilWindup(createFight(PLAYER, ENEMY, 1))
    expect(windup.enemy.nextAt - windup.elapsedMs).toBe(ENEMY.windupMs)
  })

  it('공격 간격은 시드마다 달라지고 같은 시드면 똑같다', () => {
    const firstWindupAt = (seed: number) => waitUntilWindup(createFight(PLAYER, ENEMY, seed)).elapsedMs
    expect(firstWindupAt(7)).toBe(firstWindupAt(7))
    const times = [1, 2, 3, 4, 5, 6, 7, 8].map(firstWindupAt)
    expect(new Set(times).size).toBeGreaterThan(1)
    const jitter = ENEMY.attackIntervalMs * COMBAT.enemyIntervalJitter
    for (const time of times) {
      expect(time).toBeGreaterThanOrEqual(ENEMY.attackIntervalMs - jitter)
      expect(time).toBeLessThanOrEqual(ENEMY.attackIntervalMs + jitter + COMBAT.tickMs)
    }
  })
})

describe('칼퇴 돌진', () => {
  it('맞기 직전에 돌진하면 피해 없이 피한다', () => {
    const windup = waitUntilWindup(createFight(PLAYER, ENEMY, 1))
    const closeToHit = wait(windup, ENEMY.windupMs - 2 * COMBAT.tickMs)
    const dodged = wait(act(closeToHit, 'dash'), 2 * COMBAT.tickMs)
    expect(dodged.player.hp).toBe(100)
    expect(dodged.enemy.phase).toBe('idle')
  })

  it('피한 순간을 이벤트로 알린다', () => {
    let fight = waitUntilWindup(createFight(PLAYER, ENEMY, 1))
    fight = act(wait(fight, ENEMY.windupMs - 2 * COMBAT.tickMs), 'dash')
    fight = stepFight(fight, null)
    expect(fight.events).toContainEqual({ type: 'player-dodged' })
  })

  it('돌진이 끝난 뒤에 맞으면 피해를 입는다', () => {
    const start = createFight(PLAYER, { ...ENEMY, windupMs: LEAVE_DASH.durationMs + 500 }, 1)
    const windup = waitUntilWindup(start)
    const hit = wait(act(windup, 'dash'), LEAVE_DASH.durationMs + 500)
    expect(hit.player.hp).toBe(90)
  })

  it('다시 돌진할 수 있을 때까지는 밀어도 나가지 않는다', () => {
    const dashed = act(createFight(PLAYER, ENEMY, 1), 'dash')
    const after = wait(dashed, LEAVE_DASH.durationMs)
    expect(act(after, 'dash').player.dashingUntil).toBe(dashed.player.dashingUntil)
  })
})

describe('야근 버프', () => {
  it('켜져 있는 동안 피해가 늘고 끝나면 돌아온다', () => {
    const buffed = act(createFight(PLAYER, { ...ENEMY, hp: 500 }, 1), 'overtime')
    const hit = act(buffed, 'throw')
    expect(hit.enemy.hp).toBe(500 - (10 * OVERTIME.attackMultiplier - 1))
    const ended = wait(hit, OVERTIME.durationMs)
    expect(act(ended, 'throw').enemy.hp).toBe(hit.enemy.hp - 9)
  })

  it('다시 쓸 수 있을 때까지는 눌러도 켜지지 않는다', () => {
    const buffed = act(createFight(PLAYER, ENEMY, 1), 'overtime')
    expect(act(buffed, 'overtime').player.overtimeUntil).toBe(buffed.player.overtimeUntil)
  })
})

describe('전투 끝', () => {
  it('적 체력이 0이 되면 이긴다', () => {
    const fight = act(createFight(PLAYER, { ...ENEMY, hp: 5 }, 1), 'throw')
    expect(fight.enemy.hp).toBe(0)
    expect(fight.result).toBe('won')
  })

  it('내 체력이 0이 되면 진다', () => {
    const fight = wait(createFight({ ...PLAYER, hp: 5 }, ENEMY, 1), 10_000)
    expect(fight.player.hp).toBe(0)
    expect(fight.result).toBe('lost')
  })

  it('제한 시간을 넘기면 진다', () => {
    const harmless = { ...ENEMY, attack: 0 }
    const fight = wait(createFight({ ...PLAYER, defense: 99, hp: 1_000_000 }, harmless, 1), COMBAT.fightLimitMs * 2)
    expect(fight.result).toBe('lost')
    expect(fight.elapsedMs).toBe(COMBAT.fightLimitMs)
  })

  it('끝난 전투는 더 진행할 수 없다', () => {
    const fight = act(createFight(PLAYER, { ...ENEMY, hp: 5 }, 1), 'throw')
    expect(() => stepFight(fight, null)).toThrow()
  })
})
