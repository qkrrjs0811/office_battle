import { SKILLED_BOT } from '../data/bots'
import { createBot } from './pilots'

// 터미널 한 판을 돌리는 기본 조작. 잘하는 봇이며 실수하지 않아 시드가 달라도 조작은 같다.
export const steadyPilot = createBot(SKILLED_BOT, 0)
