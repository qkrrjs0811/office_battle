// 밸런스 봇의 솜씨. 게임 수치에 맞춰 고치지 않는다. 사람의 플레이 습관을 흉내 낸 임시값이다.
export type BotProfile = {
  id: string
  name: string
  // 칸마다 서류를 던지려 할 확률
  throwChance: number
  // 준비 동작 한 번을 보고 피할 확률
  dodgeChance: number
  usesOvertime: boolean
  // 훈련할 능력치: 고르게 또는 공격만
  training: 'even' | 'attackOnly'
  // 매점을 쓰고, 퀘스트의 맵에 들르고, 보상을 받는지
  manages: boolean
}

export const DILIGENT_BOT: BotProfile = {
  id: 'diligent',
  name: '열심히 하는 봇',
  throwChance: 0.5,
  dodgeChance: 0.6,
  usesOvertime: true,
  training: 'even',
  manages: true,
}

export const SKILLED_BOT: BotProfile = {
  id: 'skilled',
  name: '잘하는 봇',
  throwChance: 1,
  dodgeChance: 1,
  usesOvertime: true,
  training: 'even',
  manages: true,
}

export const SLOPPY_BOT: BotProfile = {
  id: 'sloppy',
  name: '대충 하는 봇',
  throwChance: 0.1,
  dodgeChance: 0.1,
  usesOvertime: false,
  training: 'attackOnly',
  manages: false,
}

export const BOT_PROFILES = [DILIGENT_BOT, SKILLED_BOT, SLOPPY_BOT]

// 맞기 이만큼 전에 돌진한다
export const DASH_BEFORE_HIT_MS = 300

// 결과 표를 낼 때 봇마다 돌리는 판 수와, 한 판에서 싸우는 횟수의 상한. 상한까지 못 끝내면 벽에 막힌 것으로 본다
export const BOT_GAMES = 300
export const BOT_MAX_FIGHTS = 300
