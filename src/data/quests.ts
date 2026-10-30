// 퀘스트 목록과 보상. 모두 임시값이며 4단계에서 봇으로 조정한다. 구조 설명은 docs/성장 구조.md
export type QuestGoal =
  | { kind: 'employeeWin' | 'bossWin' | 'loss' | 'train' | 'buy'; count: number }
  // 그 맵에 들르기. 포탈로 돌아다닐 까닭을 만든다
  | { kind: 'visit'; mapId: string; count: number }

export type QuestReward = { xp: number; money: number; performance: number }

export type Quest = {
  id: string
  title: string
  description: string
  // 이 직급이 되면 받는다. 받은 뒤에 한 일만 센다
  rankId: string
  goal: QuestGoal
  reward: QuestReward
}

// 매점 물건은 다시 살 수 없어, 'buy' 퀘스트는 처음부터 받는 인턴 퀘스트로만 둔다.
// 늦게 받으면 살 물건이 이미 없어 영영 못 깰 수 있기 때문이다.
export const QUESTS: Quest[] = [
  {
    id: 'first-commute',
    title: '첫 출근 도장',
    description: '회사 정문에 들러 사원증을 찍는다.',
    rankId: 'intern',
    goal: { kind: 'visit', mapId: 'gate', count: 1 },
    reward: { xp: 5, money: 10, performance: 0 },
  },
  {
    id: 'copy-machine-war',
    title: '복사기 쟁탈전',
    description: '복사기 앞 선배들을 밀어낸다.',
    rankId: 'intern',
    goal: { kind: 'employeeWin', count: 3 },
    reward: { xp: 10, money: 20, performance: 1 },
  },
  {
    id: 'first-flex',
    title: '첫 월급 탕진',
    description: '사내 매점에서 장비를 하나 산다.',
    rankId: 'intern',
    goal: { kind: 'buy', count: 1 },
    reward: { xp: 5, money: 20, performance: 0 },
  },
  {
    id: 'learn-by-losing',
    title: '깨지면서 배운다',
    description: '시원하게 세 번 깨진다.',
    rankId: 'intern',
    goal: { kind: 'loss', count: 3 },
    reward: { xp: 15, money: 30, performance: 2 },
  },
  {
    id: 'beat-mentor',
    title: '사수 졸업',
    description: '깐깐한 사수를 이기고 승진한다.',
    rankId: 'intern',
    goal: { kind: 'bossWin', count: 1 },
    reward: { xp: 15, money: 30, performance: 1 },
  },
  {
    id: 'toilet-break',
    title: '월급 루팡의 시작',
    description: '화장실에 들러 잠깐 숨을 돌린다.',
    rankId: 'junior',
    goal: { kind: 'visit', mapId: 'restroom', count: 1 },
    reward: { xp: 8, money: 15, performance: 0 },
  },
  {
    id: 'self-study',
    title: '퇴근 후 자기계발',
    description: '실적을 써서 능력치를 두 번 훈련한다.',
    rankId: 'junior',
    goal: { kind: 'train', count: 2 },
    reward: { xp: 12, money: 25, performance: 1 },
  },
  {
    id: 'coffee-run',
    title: '커피 셔틀 탈출',
    description: '휴게실에서 내 커피부터 챙긴다.',
    rankId: 'assistant-manager',
    goal: { kind: 'visit', mapId: 'lounge', count: 1 },
    reward: { xp: 12, money: 25, performance: 0 },
  },
  {
    id: 'meeting-room-raid',
    title: '회의실 탈환',
    description: '회의실 점거자들을 쫓아낸다.',
    rankId: 'assistant-manager',
    goal: { kind: 'employeeWin', count: 4 },
    reward: { xp: 20, money: 40, performance: 1 },
  },
  {
    id: 'lost-report',
    title: '사라진 보고서',
    description: '자료실에서 반려된 보고서를 찾아온다.',
    rankId: 'manager',
    goal: { kind: 'visit', mapId: 'archive', count: 1 },
    reward: { xp: 18, money: 35, performance: 0 },
  },
  {
    id: 'beat-top-seller',
    title: '실적왕 끌어내리기',
    description: '실적왕 차장을 이긴다.',
    rankId: 'manager',
    goal: { kind: 'bossWin', count: 1 },
    reward: { xp: 30, money: 60, performance: 2 },
  },
  {
    id: 'skip-dinner',
    title: '회식 불참 선언',
    description: '회식 총무들을 이기고 칼퇴한다.',
    rankId: 'deputy-manager',
    goal: { kind: 'employeeWin', count: 5 },
    reward: { xp: 30, money: 60, performance: 2 },
  },
  {
    id: 'overtime-grind',
    title: '야근으로 쌓은 내공',
    description: '실적을 써서 능력치를 다섯 번 훈련한다.',
    rankId: 'general-manager',
    goal: { kind: 'train', count: 5 },
    reward: { xp: 35, money: 70, performance: 2 },
  },
  {
    id: 'peek-executive',
    title: '임원실 염탐',
    description: '임원실에 들어가 의자에 앉아 본다.',
    rankId: 'general-manager',
    goal: { kind: 'visit', mapId: 'executive', count: 1 },
    reward: { xp: 25, money: 50, performance: 0 },
  },
  {
    id: 'no-more-yes',
    title: '예스맨 해산',
    description: '예스맨 상무들을 모두 이긴다.',
    rankId: 'executive',
    goal: { kind: 'employeeWin', count: 6 },
    reward: { xp: 45, money: 90, performance: 3 },
  },
  {
    id: 'take-the-seal',
    title: '직인을 내 손에',
    description: '물러나지 않는 전임 대표를 이긴다.',
    rankId: 'ceo',
    goal: { kind: 'bossWin', count: 1 },
    reward: { xp: 60, money: 120, performance: 5 },
  },
]
