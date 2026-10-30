// 직급, 능력치, 승진 보상 수치. 모두 임시값이며 4단계에서 봇으로 조정한다.
export type Stats = { hp: number; attack: number; defense: number }

export type StatName = keyof Stats

export type Equipment = { id: string; name: string; bonus: Partial<Stats> }

export type Rank = {
  id: string
  name: string
  employeeCount: number
  bossName: string
  // 보스를 이기면 받는 것
  promotionBonus: Partial<Stats>
  bossDrop: Equipment
}

export const STARTING_STATS: Stats = { hp: 100, attack: 10, defense: 2 }

// 실적: 싸워서 벌고 능력치 훈련에 쓴다
export const PERFORMANCE = {
  perEmployeeWin: 2,
  perBossWin: 5,
  // 진 판에서도 조금 벌어 벽 앞에서 영영 막히지 않게 한다
  perLoss: 1,
  trainCost: 3,
}

export const TRAIN_GAIN: Stats = { hp: 10, attack: 2, defense: 1 }

export const RANKS: Rank[] = [
  {
    id: 'intern',
    name: '인턴',
    employeeCount: 3,
    bossName: '깐깐한 사수',
    promotionBonus: { hp: 20, attack: 2 },
    bossDrop: { id: 'stapler', name: '묵직한 스테이플러', bonus: { attack: 2 } },
  },
  {
    id: 'junior',
    name: '신입',
    employeeCount: 3,
    bossName: '잔소리 선임',
    promotionBonus: { hp: 20, attack: 2 },
    bossDrop: { id: 'mug', name: '식지 않는 머그컵', bonus: { hp: 20 } },
  },
  {
    id: 'assistant-manager',
    name: '대리',
    employeeCount: 4,
    bossName: '라떼 과장',
    promotionBonus: { hp: 30, attack: 3, defense: 1 },
    bossDrop: { id: 'lanyard', name: '튼튼한 사원증 줄', bonus: { defense: 2 } },
  },
  {
    id: 'manager',
    name: '과장',
    employeeCount: 4,
    bossName: '실적왕 차장',
    promotionBonus: { hp: 30, attack: 3, defense: 1 },
    bossDrop: { id: 'keyboard', name: '기계식 키보드', bonus: { attack: 4 } },
  },
  {
    id: 'deputy-manager',
    name: '차장',
    employeeCount: 5,
    bossName: '호통 부장',
    promotionBonus: { hp: 40, attack: 4, defense: 1 },
    bossDrop: { id: 'chair', name: '허리 살리는 의자', bonus: { hp: 40, defense: 1 } },
  },
  {
    id: 'general-manager',
    name: '부장',
    employeeCount: 5,
    bossName: '낙하산 임원',
    promotionBonus: { hp: 40, attack: 4, defense: 2 },
    bossDrop: { id: 'tie', name: '기선 제압 넥타이', bonus: { attack: 5 } },
  },
  {
    id: 'executive',
    name: '임원',
    employeeCount: 6,
    bossName: '철벽 부사장',
    promotionBonus: { hp: 50, attack: 5, defense: 2 },
    bossDrop: { id: 'car-key', name: '법인차 열쇠', bonus: { hp: 50, defense: 2 } },
  },
  {
    id: 'ceo',
    name: 'CEO',
    employeeCount: 6,
    bossName: '물러나지 않는 전임 대표',
    promotionBonus: {},
    bossDrop: { id: 'seal', name: '대표이사 직인', bonus: { attack: 10 } },
  },
]
