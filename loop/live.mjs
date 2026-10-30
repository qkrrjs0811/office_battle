// 라이브 화면: PC 브라우저 한 페이지에서 폰 크기 게임과 루프 진행을 실시간으로 본다.
// 사용법: npm run live (이 창을 닫으면 라이브 화면도 꺼진다. 루프는 npm run loop 로 따로 돈다)
// 게임은 vite 개발 서버로 띄우므로, 루프가 파일을 고치는 즉시 화면에 반영된다.
import { spawn, execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describeLoop, isSessionLog, latestRecord, recentActivity, todoSummary } from './lib.mjs'
import { killTree } from './git.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LOGS = join(ROOT, 'loop', 'logs')
const SHOTS = join(ROOT, 'test-results', 'screens')
const PORT = 5300
const GAME_URL = 'http://127.0.0.1:5310/'
const LOG_TAIL_BYTES = 256 * 1024

const read = (path, fallback = '') => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return fallback
  }
}
const list = (dir) => {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}
const alive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function readTail(path) {
  const size = statSync(path).size
  const length = Math.min(size, LOG_TAIL_BYTES)
  const fd = openSync(path, 'r')
  try {
    const buf = Buffer.alloc(length)
    readSync(fd, buf, 0, length, size - length)
    return buf.toString('utf8')
  } finally {
    closeSync(fd)
  }
}

function collectState() {
  let state = null
  try {
    state = JSON.parse(read(join(LOGS, 'state.json')))
  } catch {
    // 실행기가 아직 없거나 쓰는 중이면 다음 조회 때 다시 읽는다
  }
  const sessionLog = list(LOGS).filter(isSessionLog).sort().pop()
  let commits = []
  try {
    commits = execFileSync('git', ['log', '-5', '--format=%ar · %s'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n')
  } catch {
    // 커밋이 아직 없으면 비워 둔다
  }
  const shots = list(SHOTS)
    .filter((n) => n.endsWith('.png'))
    .map((n) => ({ name: n, at: statSync(join(SHOTS, n)).mtimeMs }))
    .sort((a, b) => b.at - a.at)
    .slice(0, 6)
  return {
    loop: describeLoop({ state, alive: state ? alive(state.pid) : false, stopFile: existsSync(join(ROOT, 'STOP')) }),
    until: state?.until ?? null,
    waitingForUser: existsSync(join(ROOT, 'IDLE')),
    todo: todoSummary(read(join(ROOT, '할일.md'))),
    record: latestRecord(read(join(ROOT, '진행기록.md'))),
    activity: sessionLog ? recentActivity(readTail(join(LOGS, sessionLog)), 8) : [],
    commits,
    shots,
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    return res.end(read(join(ROOT, 'loop', 'live.html')).replace('__GAME_URL__', GAME_URL))
  }
  if (url.pathname === '/api/state') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    return res.end(JSON.stringify(collectState()))
  }
  const shot = url.pathname.match(/^\/shots\/(.+\.png)$/)
  if (shot) {
    const path = join(SHOTS, basename(decodeURIComponent(shot[1])))
    if (existsSync(path)) {
      res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' })
      return res.end(readFileSync(path))
    }
  }
  res.writeHead(404)
  res.end()
})

const vite = spawn('npm', ['run', 'dev'], { cwd: ROOT, stdio: 'ignore', shell: true })
const shutdown = () => {
  killTree(vite.pid)
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}/`
  console.log(`라이브 화면: ${url} (끄려면 Ctrl+C)`)
  if (process.argv.includes('--no-open')) return
  if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true }).unref()
})
