// 루프 실행기의 판단 로직. 부작용 없는 순수 함수만 둔다.

const window = (w) => ({ utilization: w.utilization, resetsAt: w.resetsAt, status: w.status })

/** claude -p stream-json 출력에서 마지막 rate_limit_event 의 사용량을 읽는다 */
export function parseRateLimit(streamJsonText) {
  let found = null
  for (const line of streamJsonText.split('\n')) {
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      continue
    }
    const w = msg?.type === 'rate_limit_event' ? msg.rate_limit_info?.unifiedWindows : null
    if (w?.five_hour && w?.seven_day) found = { fiveHour: window(w.five_hour), sevenDay: window(w.seven_day) }
  }
  return found
}

/**
 * 다음 바퀴를 돌릴지, 기다릴지, 멈출지. 먼저 맞는 조건으로 정한다.
 * 스스로 멈추는 건 STOP 파일(사용자가 멈춤)과 최대 바퀴(--once)뿐이다. 나머지는 기다렸다가 다시 한다.
 * untilMs 가 null 이면 시간으로 깨지 않는다: 할 일이 없을 때 세션을 또 열어 쉬운 일을 지어내지 않게, 사용자 입력만 기다린다.
 * reset: 기다린 뒤 실행기가 지울 상태('idle' = IDLE 파일, 'failures' = 연속 실패 수)
 */
export function decideNext(s) {
  const later = (minutes) => s.nowMs + minutes * 60_000
  if (s.stopFile) return { action: 'stop', reason: 'STOP 파일' }
  if (s.maxIterations != null && s.iteration >= s.maxIterations) return { action: 'stop', reason: '최대 바퀴' }
  if (s.rate) {
    const { fiveHour, sevenDay } = s.rate
    if (sevenDay.utilization >= s.weeklyStopAt || sevenDay.status === 'rejected') {
      // 사용자 몫(주간 10%)은 남기고, 주간 한도가 돌아오면 이어서 한다
      return { action: 'wait', untilMs: sevenDay.resetsAt ? sevenDay.resetsAt * 1000 + 60_000 : later(60), reason: '주간 사용량' }
    }
    if (fiveHour.status === 'rejected') return { action: 'wait', untilMs: fiveHour.resetsAt * 1000 + 60_000, reason: '5시간 한도' }
  }
  if (s.consecutiveFailures >= s.maxConsecutiveFailures) return { action: 'wait', untilMs: later(s.failurePauseMinutes), reason: '연속 실패', reset: 'failures' }
  if (s.idleFile) return { action: 'wait', untilMs: null, reason: '사용자 입력 대기', reset: 'idle' }
  if (s.lastEndedMs != null && s.nowMs < s.lastEndedMs + s.pauseMinutes * 60_000) {
    return { action: 'wait', untilMs: s.lastEndedMs + s.pauseMinutes * 60_000, reason: '다음 바퀴 대기' }
  }
  return { action: 'run' }
}

export function shouldPush(lastPushMs, nowMs, intervalMinutes) {
  return lastPushMs == null || nowMs - lastPushMs >= intervalMinutes * 60_000
}

/**
 * 피드백.md 의 "## 새 피드백" 항목을 원문 그대로 할일.md 목록 맨 위로 옮기고,
 * 피드백.md 에서는 "## 처리됨" 맨 위로 내린다. 세션이 아니라 실행기가 결정적으로 한다
 */
export function moveFeedback(feedbackText, todoText, date) {
  const lines = feedbackText.split('\n')
  const start = lines.findIndex((l) => l.trim() === '## 새 피드백')
  const done = lines.findIndex((l) => l.trim() === '## 처리됨')
  if (start < 0 || done < start) return { moved: 0, feedback: feedbackText, todo: todoText }
  const items = lines
    .slice(start + 1, done)
    .map((l) => l.trim().replace(/^[-*]\s+/, ''))
    .filter(Boolean)
  if (items.length === 0) return { moved: 0, feedback: feedbackText, todo: todoText }

  const feedback = [...lines.slice(0, start + 1), '', lines[done], ...items.map((t) => `- (${date}) ${t}`), ...lines.slice(done + 1)].join('\n')

  const todoLines = todoText.split('\n')
  const added = items.map((t) => `- [ ] (피드백 ${date}) ${t}`)
  const first = todoLines.findIndex((l) => l.startsWith('- ['))
  let todo
  if (first >= 0) todo = [...todoLines.slice(0, first), ...added, ...todoLines.slice(first)].join('\n')
  else todo = (todoText.endsWith('\n') ? todoText : todoText + '\n') + added.join('\n') + '\n'
  return { moved: items.length, feedback, todo }
}

export const hasNewFeedback = (feedbackText) => moveFeedback(feedbackText, '', '').moved > 0

/** `git status --porcelain -z` 출력에서 보호할 파일을 뺀 변경 경로 목록 */
export function leftoverPaths(porcelainZ, protectedPaths) {
  const entries = porcelainZ.split('\0')
  const out = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (e.length < 4) continue
    const status = e.slice(0, 2)
    const path = e.slice(3)
    if (/[RC]/.test(status)) i++ // 이름 바꾸기는 다음 칸이 원래 이름
    if (!protectedPaths.includes(path)) out.push(path)
  }
  return out
}

const SESSION_LOG = /^\d{4}-.*\.jsonl$/
export const isSessionLog = (name) => SESSION_LOG.test(name)

/** 오래된 것부터 지울 이름들. 이름이 시각으로 시작하므로 이름순 = 시각순이다. 최근 keep개는 남긴다 */
export function oldLogs(names, keep, isTarget = isSessionLog) {
  const targets = names.filter(isTarget).sort()
  return targets.slice(0, Math.max(0, targets.length - keep))
}

const HERE = '← 지금 여기'

/** 할일.md 에서 지금 할 항목과 진척. "지금 여기" 표시가 있으면 그 항목, 없으면 맨 위의 끝나지 않은 항목 */
export function todoSummary(todoText) {
  const items = todoText.split('\n').filter((l) => /^- \[[ x]\]/.test(l))
  const open = items.filter((l) => l.startsWith('- [ ]'))
  const current = open.find((l) => l.includes(HERE)) ?? open[0]
  return {
    current: current ? current.slice(5).replace(HERE, '').trim() : null,
    done: items.length - open.length,
    total: items.length,
  }
}

/** 진행기록.md 맨 위 기록 하나 */
export function latestRecord(recordText) {
  const lines = recordText.split('\n')
  const start = lines.findIndex((l) => l.startsWith('## '))
  if (start < 0) return ''
  const next = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return lines
    .slice(start, next < 0 ? undefined : next)
    .join('\n')
    .trim()
}

/** 세션 로그(stream-json)에서 AI 가 최근에 한 일 n개. 파일 끝만 읽어 앞이 잘린 줄은 건너뛴다 */
export function recentActivity(jsonlText, n) {
  const out = []
  for (const line of jsonlText.split('\n')) {
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      continue
    }
    if (msg?.type !== 'assistant') continue
    for (const c of msg.message?.content ?? []) {
      if (c.type === 'text' && c.text.trim()) out.push(c.text.trim().split('\n')[0].slice(0, 160))
      if (c.type === 'tool_use') {
        const target = c.input?.file_path ?? c.input?.command ?? c.input?.pattern ?? ''
        out.push(`${c.name} ${String(target).split('\n')[0].slice(0, 160)}`.trim())
      }
    }
  }
  return out.slice(-n)
}

/** 라이브 화면에 보여 줄 루프 상태. 실행기 프로세스가 죽었으면 남은 상태 파일을 믿지 않는다 */
export function describeLoop({ state, alive, stopFile }) {
  if (!state || !alive) return { phase: 'off', label: '루프 꺼짐' }
  if (stopFile) return { phase: 'stopping', label: '이번 바퀴가 끝나면 멈춤' }
  if (state.phase === 'waiting') return { phase: 'waiting', label: state.reason }
  return { phase: 'running', label: `${state.iteration}바퀴째 작업 중` }
}
