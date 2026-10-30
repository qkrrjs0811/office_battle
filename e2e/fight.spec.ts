import { test, expect, type Page } from '@playwright/test'

const SCREEN = { width: 390, height: 844 }
const CENTER = { x: 195, y: 420 }

const openWith = async (page: Page, seed: Record<string, unknown> = {}) => {
  await page.addInitScript((value) => {
    ;(window as unknown as { __careerSeed: unknown }).__careerSeed = value
  }, seed)
  await page.goto('/')
  await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'work')
}

const enterFight = async (page: Page) => {
  await page.getByTestId('menu-fight').click()
  await expect(page.getByTestId('fight')).toBeVisible()
}

const tap = (page: Page) => page.mouse.click(CENTER.x, CENTER.y)

const swipe = async (page: Page) => {
  await page.mouse.move(CENTER.x, CENTER.y)
  await page.mouse.down()
  await page.mouse.move(CENTER.x + 80, CENTER.y, { steps: 3 })
  await page.mouse.up()
}

// 컴퓨터가 밀려도 제때 조작하도록 전투를 5배 느리게 돌린다. 시간 차이를 검사하는 테스트에서 쓴다.
const slowFights = (page: Page, scale = 0.2) =>
  page.addInitScript((value) => {
    ;(window as unknown as { __fightTimeScale: number }).__fightTimeScale = value
  }, scale)

// 공격까지 남은 게임 시간을 화면 안에서 프레임마다 본다
const waitForHitWithin = (page: Page, ms: number) =>
  page.evaluate(
    (limit) =>
      new Promise<void>((done) => {
        const look = () => {
          const { hitIn } = document.querySelector<HTMLElement>('[data-testid="fight"]')!.dataset
          if (hitIn && Number(hitIn) <= limit) done()
          else requestAnimationFrame(look)
        }
        look()
      }),
    ms,
  )

// 쿨타임을 넘겨 가며 누른다. 이길 때까지 사람처럼 조작한다
const tapUntilEnd = async (page: Page) => {
  const fight = page.getByTestId('fight')
  for (let i = 0; i < 200; i++) {
    if ((await fight.getAttribute('data-result')) !== 'ongoing') return
    await tap(page)
    await page.waitForTimeout(150)
  }
}

test('싸우기 버튼으로 전투에 들어가면 맵 화면이 가려지고 양쪽 체력과 기술이 보인다', async ({ page }) => {
  await slowFights(page)
  await openWith(page)
  await expect(page.getByTestId('menu-fight-note')).toHaveText('직원 0/3')
  const button = (await page.getByTestId('menu-fight').boundingBox())!
  expect(button.height).toBeGreaterThanOrEqual(44)

  await enterFight(page)
  await expect(page.getByTestId('fight-kind')).toHaveText('직원')
  await expect(page.getByTestId('fight-enemy-name')).toHaveText('복사기 앞 선배')
  await expect(page.getByTestId('fight-enemy-hp')).toHaveText('체력 30/30')
  await expect(page.getByTestId('fight-player-hp')).toHaveText('체력 100/100')
  await expect(page.getByTestId('profile')).toBeHidden()
  await expect(page.getByTestId('menu-quest')).toBeHidden()
  await expect(page.getByTestId('portal-meeting')).toBeHidden()

  const overtime = (await page.getByTestId('fight-overtime').boundingBox())!
  expect(overtime.height).toBeGreaterThanOrEqual(44)
  expect(overtime.width).toBeGreaterThanOrEqual(44)
  const bottom = (await page.getByTestId('fight-player-hp').boundingBox())!
  expect(bottom.y + bottom.height).toBeLessThanOrEqual(SCREEN.height)

  // 장면이 그려질 틈을 주고 찍는다
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/screens/fight.png' })
})

test('화면을 누르면 서류가 날아가 상대 체력이 깎이고, 쿨타임 중에는 또 깎이지 않는다', async ({ page }) => {
  await slowFights(page)
  await openWith(page)
  await enterFight(page)
  const enemyHp = page.getByTestId('fight-enemy-hp')
  await tap(page)
  await expect(enemyHp).toHaveText('체력 20/30')
  await expect(page.getByTestId('fight-throw')).not.toHaveClass(/ready/)
  await tap(page)
  await page.waitForTimeout(1000)
  await expect(enemyHp).toHaveText('체력 20/30')
  await page.screenshot({ path: 'test-results/screens/fight-throw.png' })
})

test('적이 준비 동작을 할 때 밀면 공격을 피하고 체력이 그대로다', async ({ page }) => {
  // 동시에 그리면 밀기가 2초 넘게 늦기도 한다. 준비 동작 안에 들어가도록 10배 느리게 돌린다
  test.setTimeout(120_000)
  await slowFights(page, 0.1)
  await openWith(page)
  await enterFight(page)
  await waitForHitWithin(page, 450)
  await expect(page.getByTestId('fight-warning')).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/fight-windup.png' })
  // 돌진은 500ms, 준비 동작은 700ms라 너무 일찍 밀면 돌진이 먼저 끝난다
  await waitForHitWithin(page, 400)
  // 다음 공격이 오기 전에 값을 읽도록, 피한 바로 그 프레임의 체력을 화면 안에서 잡는다
  const hpWhenDodged = page.evaluate(
    () =>
      new Promise<(string | null)[]>((done) => {
        const text = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.textContent
        const look = () => {
          if (document.querySelector<HTMLElement>('[data-testid="fight"]')!.dataset.dodged === '1') {
            done([text('fight-player-hp'), text('fight-enemy-hp')])
          } else requestAnimationFrame(look)
        }
        look()
      }),
  )
  await swipe(page)
  expect(await hpWhenDodged).toEqual(['체력 100/100', '체력 30/30'])
})

test('야근 버프를 켜면 서류 피해가 커진다', async ({ page }) => {
  await openWith(page)
  await enterFight(page)
  await page.getByTestId('fight-overtime').click()
  await page.waitForTimeout(200)
  await tap(page)
  await expect(page.getByTestId('fight-enemy-hp')).toHaveText('체력 15/30')
})

test('직원을 이기면 번 것이 보이고, 사무실로 돌아오면 맵과 값이 이어진다', async ({ page }) => {
  await openWith(page, { stats: { hp: 1000, attack: 40, defense: 2 } })
  await enterFight(page)
  await tapUntilEnd(page)
  await expect(page.getByTestId('fight')).toHaveAttribute('data-result', 'won')
  await expect(page.getByTestId('fight-result-title')).toHaveText('이겼다!')
  await expect(page.getByTestId('fight-result-lines')).toContainText('월급 +10')
  await page.screenshot({ path: 'test-results/screens/fight-won.png' })

  await page.getByTestId('fight-result-close').click()
  await expect(page.getByTestId('fight')).toBeHidden()
  await expect(page.getByTestId('profile')).toBeVisible()
  await expect(page.getByTestId('menu-fight-note')).toHaveText('직원 1/3')
  await expect(page.getByTestId('wallet-money')).toHaveText('월급 10')
  await expect(page.getByTestId('map-name')).toHaveText('1층 업무 구역')
  await page.waitForTimeout(100)
  await page.screenshot({ path: 'test-results/screens/fight-back-to-office.png' })

  // 돌아온 뒤에도 포탈로 이동할 수 있다
  await page.getByTestId('portal-meeting').click()
  await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'meeting')
})

test('지면 층 처음으로 돌아가지만 번 것은 남는다', async ({ page }) => {
  await openWith(page, { employeesBeaten: 2, performance: 7, money: 30, stats: { hp: 1, attack: 1, defense: 0 } })
  await enterFight(page)
  await expect(page.getByTestId('fight')).toHaveAttribute('data-result', 'lost', { timeout: 15_000 })
  await expect(page.getByTestId('fight-result-title')).toHaveText('깨졌다…')
  await expect(page.getByTestId('fight-result-lines')).toContainText('키운 것은 그대로')
  await page.screenshot({ path: 'test-results/screens/fight-lost.png' })
  await page.getByTestId('fight-result-close').click()
  await expect(page.getByTestId('menu-fight-note')).toHaveText('직원 0/3')
  await expect(page.getByTestId('wallet-money')).toHaveText('월급 30')
  await expect(page.getByTestId('wallet-performance')).toHaveText('실적 8')
})

test('직원을 다 이기면 보스와 싸우고, 이기면 승진한다', async ({ page }) => {
  await openWith(page, { employeesBeaten: 3, stats: { hp: 1000, attack: 100, defense: 2 } })
  await expect(page.getByTestId('menu-fight-note')).toHaveText('보스 등장')
  await enterFight(page)
  await expect(page.getByTestId('fight-kind')).toHaveText('보스')
  await expect(page.getByTestId('fight-enemy-name')).toHaveText('깐깐한 사수')
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'test-results/screens/fight-boss.png' })
  await tapUntilEnd(page)
  await expect(page.getByTestId('fight-result-lines')).toContainText('승진! 이제 신입이다')
  await expect(page.getByTestId('fight-result-lines')).toContainText('묵직한 스테이플러')
  await page.screenshot({ path: 'test-results/screens/fight-promoted.png' })
  await page.getByTestId('fight-result-close').click()
  await expect(page.getByTestId('profile-rank')).toHaveText('신입')
  await expect(page.getByTestId('menu-fight-note')).toHaveText('직원 0/3')
})

test('회사를 지배하면 싸우기 버튼을 누를 수 없다', async ({ page }) => {
  await openWith(page, { ruling: true, rankIndex: 7 })
  await expect(page.getByTestId('menu-fight')).toBeDisabled()
  await expect(page.getByTestId('menu-fight-note')).toHaveText('판 끝남')
})
