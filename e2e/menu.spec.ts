import { test, expect, type Page } from '@playwright/test'

const SCREEN = { width: 390, height: 844 }

const openWith = async (page: Page, seed: Record<string, unknown> = {}) => {
  await page.addInitScript((value) => {
    ;(window as unknown as { __careerSeed: unknown }).__careerSeed = value
  }, seed)
  await page.goto('/')
  await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'work')
}

// 메뉴 칸의 버튼은 모두 누르기 충분히 크고, 글자가 칸 밖으로 넘치지 않으며, 칸이 화면 안에 있다
const expectTidySheet = async (page: Page) => {
  const sheet = (await page.getByTestId('sheet').boundingBox())!
  expect(sheet.y).toBeGreaterThanOrEqual(0)
  expect(sheet.y + sheet.height).toBeLessThanOrEqual(SCREEN.height + 1)
  for (const button of await page.getByTestId('sheet').locator('button').all()) {
    await button.scrollIntoViewIfNeeded()
    const box = (await button.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.width).toBeGreaterThanOrEqual(44)
  }
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-testid="sheet"] *')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.dataset.testid !== 'sheet-list')
      .map((el) => el.className),
  )
  expect(overflowing).toEqual([])
}

test('맵 화면에 경험치, 월급, 실적과 메뉴 버튼이 보인다', async ({ page }) => {
  await openWith(page)
  await expect(page.getByTestId('profile-xp')).toHaveText('XP 0/20')
  await expect(page.getByTestId('wallet-money')).toHaveText('월급 0')
  await expect(page.getByTestId('wallet-performance')).toHaveText('실적 0')
  await expect(page.getByTestId('quest-badge')).toBeHidden()
  await expect(page.getByTestId('sheet')).toBeHidden()
  for (const id of ['menu-quest', 'menu-shop', 'menu-train']) {
    const box = (await page.getByTestId(id).boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await page.screenshot({ path: 'test-results/screens/menu-bar.png' })
})

test('회사 정문에 들르면 퀘스트가 깨지고, 보상을 받으면 레벨 칸과 월급이 오른다', async ({ page }) => {
  await openWith(page)

  await page.getByTestId('menu-quest').click()
  await expect(page.getByTestId('sheet-title')).toHaveText('퀘스트')
  await expect(page.getByTestId('quest-first-commute')).toContainText('0/1')
  await expect(page.getByTestId('quest-claim-first-commute')).toHaveCount(0)
  await expectTidySheet(page)
  await page.screenshot({ path: 'test-results/screens/sheet-quest.png' })
  await page.getByTestId('sheet-close').click()
  await expect(page.getByTestId('sheet')).toBeHidden()

  // 처음 뜬 맵이 아니라 포탈로 들어가야 들른 것이다
  await page.getByTestId('portal-gate').click()
  await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'gate')
  await expect(page.getByTestId('quest-badge')).toHaveText('1')
  await page.screenshot({ path: 'test-results/screens/menu-badge.png' })

  await page.getByTestId('menu-quest').click()
  await page.screenshot({ path: 'test-results/screens/sheet-quest-done.png' })
  await page.getByTestId('quest-claim-first-commute').click()
  await expect(page.getByTestId('quest-first-commute')).toContainText('받음')
  await expect(page.getByTestId('quest-badge')).toBeHidden()
  await expect(page.getByTestId('wallet-money')).toHaveText('월급 10')
  await expect(page.getByTestId('profile-xp')).toHaveText('XP 5/20')
})

test('매점에서 월급으로 장비를 사면 능력치가 오르고 다시 살 수 없다', async ({ page }) => {
  await openWith(page, { money: 150 })
  await page.getByTestId('menu-shop').click()
  await expect(page.getByTestId('sheet-summary')).toContainText('공격 10')
  await expect(page.getByTestId('shop-buy-neck-pillow')).toBeDisabled()
  await expectTidySheet(page)
  await page.screenshot({ path: 'test-results/screens/sheet-shop.png' })

  await page.getByTestId('shop-buy-wrist-guard').click()
  await expect(page.getByTestId('wallet-money')).toHaveText('월급 50')
  await expect(page.getByTestId('sheet-summary')).toContainText('공격 11')
  await expect(page.getByTestId('shop-buy-wrist-guard')).toHaveText('보유 중')
  await expect(page.getByTestId('shop-buy-wrist-guard')).toBeDisabled()
  // 매점 구매 퀘스트가 깨진다
  await expect(page.getByTestId('quest-badge')).toHaveText('1')
})

test('실적으로 능력치를 훈련하고, 모자라면 누를 수 없다', async ({ page }) => {
  await openWith(page, { performance: 3 })
  await page.getByTestId('menu-train').click()
  await expect(page.getByTestId('train-attack')).toContainText('공격 10')
  await expectTidySheet(page)
  await page.screenshot({ path: 'test-results/screens/sheet-train.png' })

  await page.getByTestId('train-do-attack').click()
  await expect(page.getByTestId('train-attack')).toContainText('공격 12')
  await expect(page.getByTestId('wallet-performance')).toHaveText('실적 0')
  await expect(page.getByTestId('train-do-hp')).toBeDisabled()
})

test('퀘스트가 많고 숫자가 커도 칸이 넘치지 않는다', async ({ page }) => {
  await openWith(page, { rankIndex: 7, level: 50, money: 12345, performance: 999, stats: { hp: 1000, attack: 300, defense: 100 } })
  await expect(page.getByTestId('profile-xp')).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/menu-big-numbers.png' })
  const corner = (await page.getByTestId('wallet').boundingBox())!
  const profile = (await page.getByTestId('profile').boundingBox())!
  expect(corner.x).toBeGreaterThanOrEqual(profile.x + profile.width)

  await page.getByTestId('menu-quest').click()
  await expectTidySheet(page)
  await page.screenshot({ path: 'test-results/screens/sheet-quest-many.png' })
})
