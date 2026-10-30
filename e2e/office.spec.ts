import { test, expect, type Locator, type Page } from '@playwright/test'

const SCREEN = { width: 390, height: 844 }

const nextFrames = (page: Page) =>
  page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))

const camera = async (page: Page) => {
  const value = await page.getByTestId('app').getAttribute('data-camera')
  const [x, y] = value!.split(',').map(Number)
  return { x, y }
}

const drag = async (page: Page, from: [number, number], to: [number, number]) => {
  await page.mouse.move(...from)
  await page.mouse.down()
  await page.mouse.move(...to, { steps: 8 })
  await page.mouse.up()
  await nextFrames(page)
}

const openMap = async (page: Page) => {
  await page.goto('/')
  await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'work')
  await nextFrames(page)
}

const expectFullyOnScreen = async (button: Locator) => {
  const box = (await button.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(SCREEN.width)
  expect(box.y + box.height).toBeLessThanOrEqual(SCREEN.height)
}

type Box = { x: number; y: number; width: number; height: number }

const expectApart = (a: Box, b: Box) => {
  const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
  expect(overlap).toBe(false)
}

// 맵을 끌어 이름표를 화면 가운데로 데려온다. 빈 곳(화면 아래쪽)에서 잡아 끈다.
const bringIntoView = async (page: Page, button: Locator) => {
  for (let i = 0; i < 4; i++) {
    const box = (await button.boundingBox())!
    const dx = SCREEN.width / 2 - (box.x + box.width / 2)
    if (Math.abs(dx) < 60) return
    const reach = Math.max(-150, Math.min(150, dx))
    await drag(page, [195, 800], [195 + reach, 800])
  }
}

test('폰 크기 화면에 블록 사무실 맵이 그려진다', async ({ page }) => {
  await openMap(page)
  await expect(page.getByTestId('map-name')).toHaveText('1층 업무 구역')

  // 화면 맞춤 계산에서 1px 미만의 소수점 오차가 난다
  const canvas = (await page.locator('canvas').boundingBox())!
  expect(canvas.x).toBeCloseTo(0, 0)
  expect(canvas.y).toBeCloseTo(0, 0)
  expect(canvas.width).toBeCloseTo(390, 0)
  expect(canvas.height).toBeCloseTo(844, 0)

  const shot = await page.screenshot({ path: 'test-results/screens/office.png' })

  // 캔버스가 비어 있으면 색이 한두 개뿐이다. 바닥·벽·가구 색이 실제로 찍혔는지 본다.
  const colors = await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
    const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')!
    context.drawImage(bitmap, 0, 0)
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height)
    const seen = new Set<number>()
    for (let i = 0; i < data.length; i += 4) seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])
    return seen.size
  }, shot.toString('base64'))
  expect(colors).toBeGreaterThan(30)
})

test('왼쪽 위 프로필에 얼굴, 직급, 레벨, HP, MP가 보이고 맵 이름과 나뉘어 있다', async ({ page }) => {
  await openMap(page)
  await expect(page.getByTestId('profile-rank')).toHaveText('인턴')
  await expect(page.getByTestId('profile-level')).toHaveText('Lv.1')
  await expect(page.getByTestId('profile-hp')).toHaveText('HP 100/100')
  await expect(page.getByTestId('profile-mp')).toHaveText('MP 30/30')
  await expect(page.getByTestId('map-name')).not.toContainText('인턴')

  const profile = (await page.getByTestId('profile').boundingBox())!
  const mapName = (await page.getByTestId('map-name').boundingBox())!
  const portrait = (await page.getByTestId('profile-portrait').boundingBox())!
  expect(portrait.width).toBeGreaterThan(40)
  expect(profile.x).toBeLessThan(SCREEN.width / 2)
  expectApart(profile, mapName)
  expect(mapName.x + mapName.width).toBeLessThanOrEqual(SCREEN.width)

  // 글자가 칸 밖으로 넘치지 않는다
  const overflowing = await page.evaluate(() =>
    ['map-name', 'profile-hp', 'profile-mp', 'profile-rank']
      .map((id) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!)
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.dataset.testid),
  )
  expect(overflowing).toEqual([])

  // 프로필 위를 끌어도 맵이 움직인다
  const start = await camera(page)
  const y = profile.y + profile.height / 2
  await drag(page, [profile.x + 100, y], [profile.x + 40, y])
  expect((await camera(page)).x).toBe(start.x + 60)

  await page.screenshot({ path: 'test-results/screens/profile.png', clip: { x: 0, y: 0, width: SCREEN.width, height: 110 } })
})

test('끌어서 맵의 다른 곳을 둘러보고, 맵 끝 밖으로는 나가지 않는다', async ({ page }) => {
  await openMap(page)

  const start = await camera(page)
  await drag(page, [195, 800], [95, 800])
  expect((await camera(page)).x).toBe(start.x + 100)
  await page.screenshot({ path: 'test-results/screens/office-right.png' })

  for (let i = 0; i < 6; i++) await drag(page, [40, 800], [380, 800])
  const corner = await camera(page)
  expect(corner.x).toBe(0)
  expect(corner.y).toBeGreaterThanOrEqual(0)
  await page.screenshot({ path: 'test-results/screens/office-left.png' })
})

test('포탈 이름표를 지나가며 끌어도 맵이 끊기지 않고, 이동하지도 않는다', async ({ page }) => {
  await openMap(page)
  const box = (await page.getByTestId('portal-meeting').boundingBox())!
  const y = box.y + box.height / 2
  const startX = box.x + box.width + 40
  const start = await camera(page)
  await drag(page, [startX, y], [startX - 120, y])
  expect((await camera(page)).x).toBe(start.x + 120)
  await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'work')
})

test('이름표에서 누른 뒤 밖에서 떼면 이동하지 않는다', async ({ page }) => {
  await openMap(page)
  const box = (await page.getByTestId('portal-meeting').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + 200, { steps: 4 })
  await page.mouse.up()
  await nextFrames(page)
  await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'work')
})

test('포탈로 맵 다섯 곳을 한 바퀴 돌아 제자리로 온다', async ({ page }) => {
  await openMap(page)
  const route = [
    ['meeting', '회의실', 'work'],
    ['executive', '임원실', 'meeting'],
    ['archive', '자료실', 'executive'],
    ['lounge', '휴게실', 'archive'],
    ['work', '업무 구역', 'lounge'],
  ] as const

  const backgrounds = new Set<string>()
  for (const [to, name, back] of route) {
    const portal = page.getByTestId(`portal-${to}`)
    await bringIntoView(page, portal)
    const box = (await portal.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.width).toBeGreaterThanOrEqual(44)
    await portal.click()

    await expect(page.getByTestId('app')).toHaveAttribute('data-map', to)
    await expect(page.getByTestId('map-name')).toHaveText(`1층 ${name}`)
    await nextFrames(page)

    // 도착하면 돌아가는 포탈이 끌지 않아도 화면 안에 있고, 프로필과 맵 이름에 가려지지 않는다
    const backPortal = page.getByTestId(`portal-${back}`)
    await expectFullyOnScreen(backPortal)
    const backBox = (await backPortal.boundingBox())!
    expectApart(backBox, (await page.getByTestId('profile').boundingBox())!)
    expectApart(backBox, (await page.getByTestId('map-name').boundingBox())!)
    await page.screenshot({ path: `test-results/screens/map-${to}.png` })

    // 맵마다 바탕색이 다르다. 빈 구석 한 점으로 확인한다
    const shot = await page.screenshot({ clip: { x: 0, y: SCREEN.height - 2, width: 2, height: 2 } })
    backgrounds.add(shot.toString('base64'))

    // 다시 시작한 장면에서 끌기가 두 번 먹지 않는다
    const before = await camera(page)
    await drag(page, [195, 800], [175, 800])
    expect(Math.abs((await camera(page)).x - before.x)).toBeLessThanOrEqual(20)
    await drag(page, [175, 800], [195, 800])
  }
  expect(backgrounds.size).toBe(5)
})
