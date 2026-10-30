import { COMBAT, LEAVE_DASH, OVERTIME, PAPER_THROW, SWIPE } from '../data/combat'
import { stepFight, type Fight, type FightAction, type FightEvent } from './combat'
import type { Gauge } from './profile'

// 사람이 조작하는 전투. 화면의 시간과 입력을 규칙의 칸으로 바꾼다.
export type LiveFight = {
  fight: Fight
  // 아직 한 칸이 되지 못하고 남은 시간
  carryMs: number
  // 다음 칸에 쓸 입력. 칸마다 입력은 하나라 나중 것이 앞의 것을 대신한다
  pending: FightAction | null
}

export const startLive = (fight: Fight): LiveFight => ({ fight, carryMs: 0, pending: null })

export const queueAction = (live: LiveFight, action: FightAction): LiveFight => ({ ...live, pending: action })

export const advanceLive = (live: LiveFight, deltaMs: number): { live: LiveFight; events: FightEvent[] } => {
  if (live.fight.result !== 'ongoing') return { live, events: [] }
  let { fight, pending } = live
  let leftMs = live.carryMs + Math.min(deltaMs, COMBAT.maxFrameMs)
  const events: FightEvent[] = []
  while (leftMs >= COMBAT.tickMs && fight.result === 'ongoing') {
    fight = stepFight(fight, pending)
    pending = null
    events.push(...fight.events)
    leftMs -= COMBAT.tickMs
  }
  return { live: { fight, carryMs: leftMs, pending }, events }
}

export const isSwipe = (dx: number, dy: number): boolean => Math.hypot(dx, dy) >= SWIPE.distancePx

export type FightGauges = {
  playerHp: Gauge
  enemyHp: Gauge
  // 0이면 방금 썼고 1이면 쓸 수 있다
  throwCharge: number
  dashCharge: number
  overtimeCharge: number
  dashing: boolean
  overtimeActive: boolean
  windup: boolean
  // 준비 동작 중일 때 공격이 들어오기까지 남은 게임 시간
  hitInMs: number | null
}

const charge = (readyAt: number, now: number, cooldownMs: number) => Math.min(1, 1 - (readyAt - now) / cooldownMs)

// 전투 화면에 보여 줄 값
export const fightGauges = ({ player, enemy, elapsedMs: now, maxHp }: Fight): FightGauges => ({
  playerHp: { current: player.hp, max: maxHp.player },
  enemyHp: { current: enemy.hp, max: maxHp.enemy },
  throwCharge: charge(player.throwReadyAt, now, PAPER_THROW.cooldownMs),
  dashCharge: charge(player.dashReadyAt, now, LEAVE_DASH.cooldownMs),
  overtimeCharge: charge(player.overtimeReadyAt, now, OVERTIME.cooldownMs),
  dashing: now < player.dashingUntil,
  overtimeActive: now < player.overtimeUntil,
  windup: enemy.phase === 'windup',
  hitInMs: enemy.phase === 'windup' ? enemy.nextAt - now : null,
})
