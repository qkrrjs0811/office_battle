import { describe, expect, it } from 'vitest'
import { runCareer } from '../core/run'
import { formatRun } from './formatRun'
import { steadyPilot } from './steadyPilot'

describe('터미널 한 판', () => {
  it('기본 조작으로 CEO까지 가서 회사를 지배한다', () => {
    for (const seed of [1, 2, 3]) expect(runCareer(steadyPilot, seed).career.ruling).toBe(true)
  })

  it('기록에 층, 상대, 승패, 최종 결과가 찍힌다', () => {
    const text = formatRun(runCareer(steadyPilot, 1))
    expect(text).toContain('[인턴] 직원 복사기 앞 선배: 승')
    expect(text).toContain('[CEO] 보스 물러나지 않는 전임 대표: 승')
    expect(text).toContain('결과: 회사를 지배했다!')
  })

  it('멈춘 판은 어느 직급에서 멈췄는지 찍힌다', () => {
    const text = formatRun(runCareer({ act: () => null, train: () => null }, 1, 3))
    expect(text).toContain('결과: 인턴에서 멈췄다')
  })
})
