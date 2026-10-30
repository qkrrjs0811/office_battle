import { defineConfig } from '@playwright/test'

// 라이브 화면의 개발 서버(5310)와 부딪치지 않도록 검사는 다른 포트를 쓴다
const baseURL = 'http://localhost:5320/'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  // 4개를 동시에 그리면 밀기 입력이 준비 동작 안에 들어가지 못한다
  workers: 2,
  use: { baseURL, viewport: { width: 390, height: 844 } },
  webServer: { command: 'npm run preview -- --port 5320 --strictPort', url: baseURL, reuseExistingServer: false },
})
