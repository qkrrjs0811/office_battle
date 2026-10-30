// 봇 3종 결과 표: npx tsx src/bots/balance.ts [봇마다 판 수]
import { BOT_GAMES, BOT_MAX_FIGHTS, BOT_PROFILES } from '../data/bots'
import { formatTables, playMany, summarize } from './tournament'

const games = Number(process.argv[2] ?? BOT_GAMES)
if (!Number.isInteger(games) || games < 1) throw new Error('판 수는 1 이상의 정수여야 한다')

const summaries = BOT_PROFILES.map((profile) => summarize(profile.name, playMany(profile, games)))
console.log(`봇마다 ${games}판, 한 판 싸움 상한 ${BOT_MAX_FIGHTS}번\n`)
console.log(formatTables(summaries))
