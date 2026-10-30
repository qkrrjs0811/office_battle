import { COMBAT, LEAVE_DASH, OVERTIME, PAPER_THROW } from '../data/combat'
import type { EnemyStats, Stats } from '../data/ranks'

export type FightAction = 'throw' | 'dash' | 'overtime'

export type FightEvent =
  | { type: 'enemy-hit'; damage: number }
  | { type: 'enemy-windup' }
  | { type: 'player-hit'; damage: number }
  | { type: 'player-dodged' }

export type FightResult = 'ongoing' | 'won' | 'lost'

// 전투 한 번의 상태. 시각은 전투 시작부터 지난 시간(ms)이고, 그대로 JSON이 되는 값만 둔다.
export type Fight = {
  elapsedMs: number
  rngState: number
  player: Stats & {
    throwReadyAt: number
    dashReadyAt: number
    dashingUntil: number
    overtimeReadyAt: number
    overtimeUntil: number
  }
  enemy: EnemyStats & {
    phase: 'idle' | 'windup'
    // idle이면 준비 동작을 시작할 시각, windup이면 때릴 시각
    nextAt: number
  }
  result: FightResult
  // 이번 진행에서 일어난 일. 화면 연출과 터미널 기록이 읽는다
  events: FightEvent[]
}

const damageOf = (attack: number, defense: number) => Math.max(COMBAT.minDamage, attack - defense)

// 시드가 같으면 같은 전투가 나오도록 직접 만든 난수(mulberry32)
const nextRandom = (state: number): { value: number; state: number } => {
  const next = (state + 0x6d2b79f5) | 0
  let mixed = Math.imul(next ^ (next >>> 15), 1 | next)
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
  return { value: ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296, state: next }
}

const rollInterval = (attackIntervalMs: number, rngState: number) => {
  const { value, state } = nextRandom(rngState)
  const swing = attackIntervalMs * COMBAT.enemyIntervalJitter * (value * 2 - 1)
  return { intervalMs: Math.round(attackIntervalMs + swing), rngState: state }
}

export const createFight = (player: Stats, enemy: EnemyStats, seed: number): Fight => {
  const { intervalMs, rngState } = rollInterval(enemy.attackIntervalMs, seed)
  return {
    elapsedMs: 0,
    rngState,
    player: {
      ...player,
      throwReadyAt: 0,
      dashReadyAt: 0,
      dashingUntil: 0,
      overtimeReadyAt: 0,
      overtimeUntil: 0,
    },
    enemy: { ...enemy, phase: 'idle', nextAt: intervalMs },
    result: 'ongoing',
    events: [],
  }
}

const applyAction = (fight: Fight, action: FightAction | null): Fight => {
  const { player, enemy, elapsedMs: now } = fight
  if (action === 'throw' && now >= player.throwReadyAt) {
    const attack = now < player.overtimeUntil ? player.attack * OVERTIME.attackMultiplier : player.attack
    const damage = damageOf(attack, enemy.defense)
    return {
      ...fight,
      player: { ...player, throwReadyAt: now + PAPER_THROW.cooldownMs },
      enemy: { ...enemy, hp: Math.max(0, enemy.hp - damage) },
      events: [...fight.events, { type: 'enemy-hit', damage }],
    }
  }
  if (action === 'dash' && now >= player.dashReadyAt) {
    return {
      ...fight,
      player: {
        ...player,
        dashReadyAt: now + LEAVE_DASH.cooldownMs,
        dashingUntil: now + LEAVE_DASH.durationMs,
      },
    }
  }
  if (action === 'overtime' && now >= player.overtimeReadyAt) {
    return {
      ...fight,
      player: {
        ...player,
        overtimeReadyAt: now + OVERTIME.cooldownMs,
        overtimeUntil: now + OVERTIME.durationMs,
      },
    }
  }
  return fight
}

const advanceEnemy = (fight: Fight): Fight => {
  const { player, enemy, elapsedMs: now } = fight
  if (now < enemy.nextAt) return fight
  if (enemy.phase === 'idle') {
    return {
      ...fight,
      enemy: { ...enemy, phase: 'windup', nextAt: now + enemy.windupMs },
      events: [...fight.events, { type: 'enemy-windup' }],
    }
  }
  const { intervalMs, rngState } = rollInterval(enemy.attackIntervalMs, fight.rngState)
  const swung = {
    ...fight,
    rngState,
    enemy: { ...enemy, phase: 'idle' as const, nextAt: now + intervalMs },
  }
  if (now < player.dashingUntil) {
    return { ...swung, events: [...fight.events, { type: 'player-dodged' }] }
  }
  const damage = damageOf(enemy.attack, player.defense)
  return {
    ...swung,
    player: { ...player, hp: Math.max(0, player.hp - damage) },
    events: [...fight.events, { type: 'player-hit', damage }],
  }
}

const judge = (fight: Fight): FightResult => {
  if (fight.enemy.hp <= 0) return 'won'
  if (fight.player.hp <= 0 || fight.elapsedMs >= COMBAT.fightLimitMs) return 'lost'
  return 'ongoing'
}

// 시간을 한 칸 진행한다. 같은 칸에서는 플레이어가 먼저 움직여 적을 쓰러뜨리면 맞지 않는다.
export const stepFight = (fight: Fight, action: FightAction | null): Fight => {
  if (fight.result !== 'ongoing') throw new Error('이미 끝난 전투다')
  const acted = applyAction({ ...fight, events: [] }, action)
  if (acted.enemy.hp <= 0) return { ...acted, result: 'won' }
  const advanced = advanceEnemy({ ...acted, elapsedMs: acted.elapsedMs + COMBAT.tickMs })
  return { ...advanced, result: judge(advanced) }
}
