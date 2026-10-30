import type { Equipment, Stats } from './ranks'

// 레벨과 재화 수치. 모두 임시값이며 4단계에서 봇으로 조정한다. 구조 설명은 docs/성장 구조.md
export const LEVEL = {
  start: 1,
  max: 50,
  // 1레벨에서 2레벨로 오르는 데 드는 경험치와, 레벨마다 더 드는 경험치
  firstLevelXp: 20,
  xpStepPerLevel: 15,
}

// 레벨이 하나 오를 때마다 저절로 오르는 능력치
export const LEVEL_GAIN: Stats = { hp: 5, attack: 1, defense: 0 }

export const MP = { start: 30, perLevel: 5 }

export type FightReward = { xp: number; money: number }

// 인턴 층 기준 보상. 직급이 오를수록 rankScale만큼씩 커진다.
// 진 판에서도 경험치를 조금 벌어 벽 앞에서 영영 막히지 않게 한다
export const FIGHT_REWARDS: Record<'employee' | 'boss' | 'loss', FightReward> = {
  employee: { xp: 6, money: 10 },
  boss: { xp: 25, money: 50 },
  loss: { xp: 2, money: 0 },
}

export const REWARD_RANK_SCALE = 0.5

export type ShopItem = Equipment & { price: number }

// 사내 매점: 월급으로 사는 장비. 한 번 사면 계속 효과가 있다
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'wrist-guard', name: '마우스 손목 받침', price: 100, bonus: { attack: 1 } },
  { id: 'neck-pillow', name: '거북목 베개', price: 200, bonus: { hp: 15 } },
  { id: 'slippers', name: '푹신한 사무실 슬리퍼', price: 300, bonus: { defense: 1 } },
  { id: 'cold-brew', name: '대용량 콜드브루 텀블러', price: 500, bonus: { attack: 3 } },
  { id: 'noise-headset', name: '잔소리 차단 헤드셋', price: 800, bonus: { hp: 20, defense: 2 } },
]
