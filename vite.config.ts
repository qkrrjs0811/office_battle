import { defineConfig } from 'vite'

export default defineConfig({
  // Phaser 한 덩어리(약 1.2MB)가 경고 기준을 넘는 건 의도된 것
  build: { chunkSizeWarningLimit: 1600 },
  // 라이브 화면(loop/live.mjs)이 띄우는 개발 서버. 파일이 바뀌면 브라우저에 바로 반영된다
  server: { host: '127.0.0.1', port: 5310, strictPort: true, watch: { ignored: ['**/loop/**', '**/test-results/**', '**/dist/**'] } },
})
