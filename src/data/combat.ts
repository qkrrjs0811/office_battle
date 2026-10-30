// 실시간 전투 수치. 모두 임시값이며 4단계에서 봇으로 조정한다.
export const COMBAT = {
  // 규칙을 한 번 진행하는 시간 간격
  tickMs: 100,
  // 이 시간 안에 못 끝내면 진다
  fightLimitMs: 90_000,
  // 방어가 아무리 높아도 최소한 들어가는 피해
  minDamage: 1,
  // 적의 공격 간격이 이 비율만큼 흔들려 박자만 외워서는 못 피한다
  enemyIntervalJitter: 0.2,
  // 화면이 멈췄다 돌아와도 한 번에 이만큼만 진행한다. tickMs의 배수로 둔다
  maxFrameMs: 300,
}

// 이만큼 움직이면 누르기가 아니라 밀기다
export const SWIPE = { distancePx: 30 }

// 결재 서류 던지기(누르기)
export const PAPER_THROW = { cooldownMs: 800 }

// 칼퇴 돌진(밀기): 돌진하는 동안 공격을 피한다
export const LEAVE_DASH = { cooldownMs: 2500, durationMs: 500 }

// 야근 버프: 잠깐 공격력이 오른다
export const OVERTIME = { cooldownMs: 15_000, durationMs: 5000, attackMultiplier: 1.5 }
