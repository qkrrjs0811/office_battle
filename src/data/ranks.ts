// 직급, 능력치, 승진 보상 수치. 모두 임시값이며 4단계에서 봇으로 조정한다.
export type Stats = { hp: number; attack: number; defense: number }

export type StatName = keyof Stats

export const STAT_LABELS: Record<StatName, string> = { hp: '체력', attack: '공격', defense: '방어' }

export type Equipment = { id: string; name: string; bonus: Partial<Stats> }

export type EnemyStats = {
  hp: number
  attack: number
  defense: number
  // 공격을 마친 뒤 다음 공격 준비까지 걸리는 시간
  attackIntervalMs: number
  // 공격 준비 동작이 보이는 시간. 이때 피해야 한다
  windupMs: number
}

export type Rank = {
  id: string
  name: string
  employeeCount: number
  employeeName: string
  employee: EnemyStats
  bossName: string
  boss: EnemyStats
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
    employeeName: '복사기 앞 선배',
    employee: { hp: 30, attack: 8, defense: 0, attackIntervalMs: 2000, windupMs: 700 },
    bossName: '깐깐한 사수',
    boss: { hp: 90, attack: 14, defense: 1, attackIntervalMs: 2200, windupMs: 800 },
    promotionBonus: { hp: 20, attack: 2 },
    bossDrop: { id: 'stapler', name: '묵직한 스테이플러', bonus: { attack: 2 } },
  },
  {
    id: 'junior',
    name: '신입',
    employeeCount: 3,
    employeeName: '메신저 빌런',
    employee: { hp: 45, attack: 11, defense: 1, attackIntervalMs: 2000, windupMs: 650 },
    bossName: '잔소리 선임',
    boss: { hp: 130, attack: 18, defense: 2, attackIntervalMs: 2100, windupMs: 750 },
    promotionBonus: { hp: 20, attack: 2 },
    bossDrop: { id: 'mug', name: '식지 않는 머그컵', bonus: { hp: 20 } },
  },
  {
    id: 'assistant-manager',
    name: '대리',
    employeeCount: 4,
    employeeName: '회의실 점거자',
    employee: { hp: 60, attack: 14, defense: 2, attackIntervalMs: 1900, windupMs: 600 },
    bossName: '라떼 과장',
    boss: { hp: 170, attack: 23, defense: 3, attackIntervalMs: 2000, windupMs: 700 },
    promotionBonus: { hp: 30, attack: 3, defense: 1 },
    bossDrop: { id: 'lanyard', name: '튼튼한 사원증 줄', bonus: { defense: 2 } },
  },
  {
    id: 'manager',
    name: '과장',
    employeeCount: 4,
    employeeName: '보고서 반려꾼',
    employee: { hp: 80, attack: 18, defense: 3, attackIntervalMs: 1900, windupMs: 550 },
    bossName: '실적왕 차장',
    boss: { hp: 220, attack: 28, defense: 4, attackIntervalMs: 1900, windupMs: 650 },
    promotionBonus: { hp: 30, attack: 3, defense: 1 },
    bossDrop: { id: 'keyboard', name: '기계식 키보드', bonus: { attack: 4 } },
  },
  {
    id: 'deputy-manager',
    name: '차장',
    employeeCount: 5,
    employeeName: '회식 총무',
    employee: { hp: 100, attack: 22, defense: 4, attackIntervalMs: 1800, windupMs: 500 },
    bossName: '호통 부장',
    boss: { hp: 280, attack: 34, defense: 6, attackIntervalMs: 1800, windupMs: 600 },
    promotionBonus: { hp: 40, attack: 4, defense: 1 },
    bossDrop: { id: 'chair', name: '허리 살리는 의자', bonus: { hp: 40, defense: 1 } },
  },
  {
    id: 'general-manager',
    name: '부장',
    employeeCount: 5,
    employeeName: '줄 서는 팀장',
    employee: { hp: 130, attack: 27, defense: 6, attackIntervalMs: 1800, windupMs: 450 },
    bossName: '낙하산 임원',
    boss: { hp: 350, attack: 40, defense: 8, attackIntervalMs: 1700, windupMs: 550 },
    promotionBonus: { hp: 40, attack: 4, defense: 2 },
    bossDrop: { id: 'tie', name: '기선 제압 넥타이', bonus: { attack: 5 } },
  },
  {
    id: 'executive',
    name: '임원',
    employeeCount: 6,
    employeeName: '예스맨 상무',
    employee: { hp: 160, attack: 32, defense: 8, attackIntervalMs: 1700, windupMs: 400 },
    bossName: '철벽 부사장',
    boss: { hp: 430, attack: 48, defense: 10, attackIntervalMs: 1600, windupMs: 500 },
    promotionBonus: { hp: 50, attack: 5, defense: 2 },
    bossDrop: { id: 'car-key', name: '법인차 열쇠', bonus: { hp: 50, defense: 2 } },
  },
  {
    id: 'ceo',
    name: 'CEO',
    employeeCount: 6,
    employeeName: '대표실 비서실장',
    employee: { hp: 200, attack: 38, defense: 10, attackIntervalMs: 1700, windupMs: 400 },
    bossName: '물러나지 않는 전임 대표',
    boss: { hp: 550, attack: 58, defense: 12, attackIntervalMs: 1500, windupMs: 450 },
    promotionBonus: {},
    bossDrop: { id: 'seal', name: '대표이사 직인', bonus: { attack: 10 } },
  },
]
