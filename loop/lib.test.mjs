import { test, expect } from 'vitest'
import { parseRateLimit, decideNext, shouldPush, oldLogs, moveFeedback, leftoverPaths, hasNewFeedback, todoSummary, latestRecord, recentActivity, describeLoop } from './lib.mjs'

const ev = (fu, fs, su, ss) =>
  JSON.stringify({
    type: 'rate_limit_event',
    rate_limit_info: {
      unifiedWindows: {
        five_hour: { utilization: fu, resetsAt: 1000, status: fs },
        seven_day: { utilization: su, resetsAt: 2000, status: ss },
      },
    },
  })
const NOW = 5_000_000
const base = { nowMs: NOW, stopFile: false, idleFile: false, rate: null, iteration: 0, maxIterations: null, consecutiveFailures: 0, maxConsecutiveFailures: 3, weeklyStopAt: 0.9, failurePauseMinutes: 30, lastEndedMs: null, pauseMinutes: 5 }

test('parseRateLimit: 마지막 이벤트 사용, 다른 줄 무시', () => {
  const text = ['{"type":"system"}', ev(0.1, 'allowed', 0.2, 'allowed'), 'not json', ev(0.3, 'allowed', 0.5, 'allowed')].join('\n')
  expect(parseRateLimit(text)).toEqual({
    fiveHour: { utilization: 0.3, resetsAt: 1000, status: 'allowed' },
    sevenDay: { utilization: 0.5, resetsAt: 2000, status: 'allowed' },
  })
  expect(parseRateLimit('{"type":"result"}')).toBeNull()
})

test('decideNext 순서: 멈추는 건 STOP 파일과 최대 바퀴뿐, 나머지는 기다렸다가 다시', () => {
  const r = (fu, fs, su, ss) => parseRateLimit(ev(fu, fs, su, ss))
  expect(decideNext({ ...base, stopFile: true, idleFile: true })).toEqual({ action: 'stop', reason: 'STOP 파일' })
  expect(decideNext({ ...base, iteration: 5, maxIterations: 5 })).toEqual({ action: 'stop', reason: '최대 바퀴' })
  expect(decideNext({ ...base, idleFile: true, rate: r(0.1, 'allowed', 0.9, 'allowed') })).toEqual({ action: 'wait', untilMs: 2_060_000, reason: '주간 사용량' })
  expect(decideNext({ ...base, rate: r(0.1, 'allowed', 0.5, 'rejected') })).toEqual({ action: 'wait', untilMs: 2_060_000, reason: '주간 사용량' })
  expect(decideNext({ ...base, rate: r(1, 'rejected', 0.5, 'allowed') })).toEqual({ action: 'wait', untilMs: 1_060_000, reason: '5시간 한도' })
  expect(decideNext({ ...base, consecutiveFailures: 3, idleFile: true })).toEqual({ action: 'wait', untilMs: NOW + 30 * 60_000, reason: '연속 실패', reset: 'failures' })
  expect(decideNext({ ...base, rate: r(0.5, 'allowed', 0.89, 'allowed') })).toEqual({ action: 'run' })
  expect(decideNext(base)).toEqual({ action: 'run' })
})

test('decideNext: 주간 한도의 되돌아오는 시각을 모르면 한 시간 뒤 다시 본다', () => {
  const rate = { fiveHour: { utilization: 0, resetsAt: 1000, status: 'allowed' }, sevenDay: { utilization: 0.95, resetsAt: undefined, status: 'allowed' } }
  expect(decideNext({ ...base, rate })).toEqual({ action: 'wait', untilMs: NOW + 60 * 60_000, reason: '주간 사용량' })
})

test('decideNext: 할 일이 없으면 시간으로 깨지 않고 사용자 입력을 기다린다', () => {
  expect(decideNext({ ...base, idleFile: true })).toEqual({ action: 'wait', untilMs: null, reason: '사용자 입력 대기', reset: 'idle' })
})

test('decideNext: 한 바퀴가 끝나면 일정 시간 쉬고 다음 바퀴를 연다', () => {
  expect(decideNext({ ...base, lastEndedMs: NOW - 60_000 })).toEqual({ action: 'wait', untilMs: NOW + 4 * 60_000, reason: '다음 바퀴 대기' })
  expect(decideNext({ ...base, lastEndedMs: NOW - 5 * 60_000 })).toEqual({ action: 'run' })
})

test('shouldPush', () => {
  expect(shouldPush(null, 0, 60)).toBe(true)
  expect(shouldPush(0, 59 * 60_000, 60)).toBe(false)
  expect(shouldPush(0, 60 * 60_000, 60)).toBe(true)
})

test('oldLogs: 이름순(시각순)으로 최근 keep개만 남기고 나머지를 돌려준다', () => {
  const names = ['2026-10-24T03.jsonl', '2026-10-24T01.jsonl', 'runs.jsonl', '2026-10-24T02.jsonl', 'user-files']
  expect(oldLogs(names, 2)).toEqual(['2026-10-24T01.jsonl'])
  expect(oldLogs(names, 5)).toEqual([])
  expect(oldLogs(['b', 'a', 'c'], 1, () => true)).toEqual(['a', 'b'])
})

const FB = (newItems, done = '') => `# 피드백\n\n> 안내\n\n## 새 피드백\n${newItems}\n## 처리됨\n${done}`

test('moveFeedback: 새 피드백을 원문 그대로 할일 맨 위로, 피드백은 처리됨으로', () => {
  const todo = '# 할 일\n\n> 안내\n\n- [ ] 기존 일\n'
  const r = moveFeedback(FB('- 버튼이 너무 작아\n보스가 너무 세\n\n'), todo, '2026-10-25')
  expect(r.moved).toBe(2)
  expect(r.todo).toBe('# 할 일\n\n> 안내\n\n- [ ] (피드백 2026-10-25) 버튼이 너무 작아\n- [ ] (피드백 2026-10-25) 보스가 너무 세\n- [ ] 기존 일\n')
  expect(r.feedback).toBe('# 피드백\n\n> 안내\n\n## 새 피드백\n\n## 처리됨\n- (2026-10-25) 버튼이 너무 작아\n- (2026-10-25) 보스가 너무 세\n')
})

test('moveFeedback: 새 피드백이 없으면 그대로', () => {
  const fb = FB('\n')
  expect(moveFeedback(fb, '# 할 일\n', '2026-10-25')).toEqual({ moved: 0, feedback: fb, todo: '# 할 일\n' })
})

test('moveFeedback: 할일에 목록이 비어 있으면 끝에 붙임', () => {
  const r = moveFeedback(FB('- 하나\n'), '# 할 일\n\n> 안내\n', '2026-10-25')
  expect(r.todo).toBe('# 할 일\n\n> 안내\n- [ ] (피드백 2026-10-25) 하나\n')
})

test('hasNewFeedback: 새 피드백 칸에 글이 있을 때만 참', () => {
  expect(hasNewFeedback(FB('\n', '- (2026-10-25) 옛날 것\n'))).toBe(false)
  expect(hasNewFeedback(FB('- 보스가 너무 세\n'))).toBe(true)
})

test('leftoverPaths: 사용자 파일과 무시할 경로를 뺀 변경만', () => {
  const z = [' M 피드백.md', ' M 기획서.md', ' M src/a.ts', '?? loop/new.txt', 'R  b.ts', 'old.ts', ''].join('\0')
  expect(leftoverPaths(z, ['피드백.md', '기획서.md'])).toEqual(['src/a.ts', 'loop/new.txt', 'b.ts'])
})

test('todoSummary: "지금 여기" 표시를 우선하고, 없으면 맨 위의 끝나지 않은 항목', () => {
  const marked = '# 할 일\n\n- [x] 끝난 일\n- [ ] 다음 일\n- [ ] 지금 일 ← 지금 여기\n'
  expect(todoSummary(marked)).toEqual({ current: '지금 일', done: 1, total: 3 })
  expect(todoSummary('- [x] 끝난 일\n- [ ] 다음 일\n')).toEqual({ current: '다음 일', done: 1, total: 2 })
  expect(todoSummary('# 할 일\n')).toEqual({ current: null, done: 0, total: 0 })
})

test('latestRecord: 진행기록 맨 위 기록 하나만', () => {
  expect(latestRecord('# 진행 기록\n\n> 안내\n\n## 새 기록\n- 한 일\n\n## 옛 기록\n- 옛일\n')).toBe('## 새 기록\n- 한 일')
  expect(latestRecord('# 진행 기록\n')).toBe('')
})

test('recentActivity: 세션 로그에서 최근 도구 사용과 말을 뽑고 잘린 줄은 무시', () => {
  const line = (content) => JSON.stringify({ type: 'assistant', message: { content } })
  const text = [
    '{"type":"assis', // 파일 끝을 읽을 때 앞이 잘린 줄
    line([{ type: 'text', text: '  뼈대를 만든다\n둘째 줄' }]),
    line([{ type: 'tool_use', name: 'Read', input: { file_path: '할일.md' } }]),
    '{"type":"user"}',
    line([{ type: 'tool_use', name: 'Bash', input: { command: 'npm run check' } }, { type: 'tool_use', name: 'TodoWrite', input: {} }]),
  ].join('\n')
  expect(recentActivity(text, 3)).toEqual(['Read 할일.md', 'Bash npm run check', 'TodoWrite'])
  expect(recentActivity(text, 10)[0]).toBe('뼈대를 만든다')
})

test('describeLoop: 실행기 상태를 사람이 읽을 말로', () => {
  const state = { phase: 'running', iteration: 2, reason: null, until: null, pid: 1 }
  expect(describeLoop({ state: null, alive: false, stopFile: false })).toEqual({ phase: 'off', label: '루프 꺼짐' })
  expect(describeLoop({ state, alive: false, stopFile: false })).toEqual({ phase: 'off', label: '루프 꺼짐' })
  expect(describeLoop({ state, alive: true, stopFile: false })).toEqual({ phase: 'running', label: '2바퀴째 작업 중' })
  expect(describeLoop({ state, alive: true, stopFile: true })).toEqual({ phase: 'stopping', label: '이번 바퀴가 끝나면 멈춤' })
  expect(describeLoop({ state: { ...state, phase: 'waiting', reason: '사용자 입력 대기' }, alive: true, stopFile: false })).toEqual({ phase: 'waiting', label: '사용자 입력 대기' })
})
