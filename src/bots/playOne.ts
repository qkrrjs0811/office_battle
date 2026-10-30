// 터미널에서 한 판 돌리기: npx tsx src/bots/playOne.ts [시드]
import { runCareer } from '../core/run'
import { formatRun } from './formatRun'
import { steadyPilot } from './steadyPilot'

const seed = Number(process.argv[2] ?? 1)
if (!Number.isInteger(seed)) throw new Error('시드는 정수여야 한다')

console.log(formatRun(runCareer(steadyPilot, seed)))
