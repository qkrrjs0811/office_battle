import { test, expect, type Locator, type Page } from '@playwright/test'

const SCREEN = { width: 390, height: 844 }

const nextFrames = (page: Page) =>
  page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))

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

// 찍은 화면의 색 가짓수. 맵이 그려졌는지 본다
const countColors = (page: Page, shot: Buffer) =>
  page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
    const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')!
    context.drawImage(bitmap, 0, 0)
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height)
    const seen = new Set<number>()
    for (let i = 0; i < data.length; i += 4) seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])
    return seen.size
  }, shot.toString('base64'))

// 화면 네 가장자리가 바탕색 한 가지면 맵이 어느 쪽으로도 잘리지 않은 것이다
const expectMapNotCut = async (page: Page) => {
  const edges = [
    { x: 0, y: 0, width: SCREEN.width, height: 2 },
    { x: 0, y: SCREEN.height - 2, width: SCREEN.width, height: 2 },
    { x: 0, y: 0, width: 2, height: SCREEN.height },
    { x: SCREEN.width - 2, y: 0, width: 2, height: SCREEN.height },
  ]
  for (const clip of edges) expect(await countColors(page, await page.screenshot({ clip }))).toBe(1)
}

test('폰 세로 화면에 블록 사무실 맵 전체가 그려진다', async ({ page }) => {
  await openMap(page)
  await expect(page.getByTestId('map-name')).toHaveText('1층 업무 구역')

  const canvas = (await page.locator('canvas').boundingBox())!
  expect(canvas.x).toBeCloseTo(0, 0)
  expect(canvas.y).toBeCloseTo(0, 0)
  expect(canvas.width).toBeCloseTo(SCREEN.width, 0)
  expect(canvas.height).toBeCloseTo(SCREEN.height, 0)

  const shot = await page.screenshot({ path: 'test-results/screens/office.png' })
  // 캔버스가 비어 있으면 색이 한두 개뿐이다. 바닥·벽·가구 색이 실제로 찍혔는지 본다.
  expect(await countColors(page, shot)).toBeGreaterThan(30)
  await expectMapNotCut(page)
})

for (const size of [
  { width: 640, height: 360 },
  { width: 1920, height: 1080 },
  { width: 1000, height: 900 },
  { width: 1280, height: 720 },
]) {
  test(`창이 ${size.width}×${size.height}이어도 화면 전체가 창 안에 들어오고 포탈을 누를 수 있다`, async ({ page }) => {
    await page.setViewportSize(size)
    await openMap(page)
    const canvas = (await page.locator('canvas').boundingBox())!
    expect(canvas.x).toBeGreaterThanOrEqual(-1)
    expect(canvas.y).toBeGreaterThanOrEqual(-1)
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(size.width + 1)
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(size.height + 1)
    expect(canvas.width / canvas.height).toBeCloseTo(SCREEN.width / SCREEN.height, 1)
    await page.screenshot({ path: `test-results/screens/window-${size.width}x${size.height}.png` })

    // 줄어든 화면에서도 프로필의 비율이 그대로이고 이름표가 눌린다
    const scale = canvas.width / SCREEN.width
    const profile = (await page.getByTestId('profile').boundingBox())!
    expect(profile.width).toBeCloseTo(196 * scale, 0)
    await page.getByTestId('portal-meeting').click()
    await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'meeting')
  })
}

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

  await page.screenshot({ path: 'test-results/screens/profile.png', clip: { x: 0, y: 0, width: SCREEN.width, height: 110 } })
})

test('맵 아래에 1층 구조도가 늘 보이고 내 위치와 갈 수 있는 곳이 표시된다', async ({ page }) => {
  await openMap(page)
  await expect(page.getByTestId('plan-title')).toHaveText('1층 구조도')
  await expect(page.getByTestId('plan-room-work').getByTestId('plan-here')).toHaveText('내 위치')
  await expect(page.getByTestId('plan-room-meeting')).toHaveText('→ 회의실')
  await expect(page.getByTestId('plan-room-gate')).toHaveText('→ 회사 정문')
  await expect(page.getByTestId('plan-room-archive')).toHaveText('자료실')

  // 방 일곱 칸이 판 안에 있고 글자가 칸 밖으로 넘치지 않는다
  const panel = (await page.getByTestId('floor-plan').boundingBox())!
  const rooms = await page.locator('.plan-room').all()
  expect(rooms).toHaveLength(7)
  for (const room of rooms) {
    const box = (await room.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(panel.x)
    expect(box.y).toBeGreaterThanOrEqual(panel.y)
    expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width)
    expect(box.y + box.height).toBeLessThanOrEqual(panel.y + panel.height)
  }
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.plan-room')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
      .map((el) => el.dataset.testid),
  )
  expect(overflowing).toEqual([])
  await page.screenshot({ path: 'test-results/screens/floor-plan.png' })

  // 구조도는 보기만 하므로 눌러도 움직이지 않는다
  const meeting = (await page.getByTestId('plan-room-meeting').boundingBox())!
  await page.mouse.click(meeting.x + meeting.width / 2, meeting.y + meeting.height / 2)
  await nextFrames(page)
  await expect(page.getByTestId('app')).toHaveAttribute('data-map', 'work')

  // 메뉴 칸과 전투 화면에서는 구조도가 보이지 않는다
  await page.getByTestId('menu-quest').click()
  await page.screenshot({ path: 'test-results/screens/floor-plan-under-sheet.png' })
  const sheet = (await page.getByTestId('sheet').boundingBox())!
  expect(sheet.y).toBeLessThanOrEqual(panel.y)
  await page.getByTestId('sheet-close').click()
  await page.getByTestId('menu-fight').click()
  await expect(page.getByTestId('floor-plan')).toBeHidden()
})

test('포탈 이름표를 지나가며 끌어도 이동하지 않는다', async ({ page }) => {
  await openMap(page)
  const box = (await page.getByTestId('portal-meeting').boundingBox())!
  const y = box.y + box.height / 2
  const startX = box.x + box.width + 40
  await page.mouse.move(startX, y)
  await page.mouse.down()
  await page.mouse.move(box.x - 40, y, { steps: 8 })
  await page.mouse.up()
  await nextFrames(page)
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

test('포탈로 맵 일곱 곳을 한 바퀴 돌아 제자리로 오고, 어느 맵이든 전체가 끌지 않아도 보인다', async ({ page }) => {
  // 맵마다 스크린샷을 여러 번 찍으므로 일곱 곳을 돌면 기본 제한 60초에 닿는다
  test.setTimeout(180_000)
  await openMap(page)
  const route = [
    ['meeting', '회의실', 'work'],
    ['executive', '임원실', 'meeting'],
    ['archive', '자료실', 'executive'],
    ['lounge', '휴게실', 'archive'],
    ['restroom', '화장실', 'lounge'],
    ['gate', '회사 정문', 'restroom'],
    ['work', '업무 구역', 'gate'],
  ] as const

  const backgrounds = new Set<string>()
  for (const [to, name, back] of route) {
    const portal = page.getByTestId(`portal-${to}`)
    const box = (await portal.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.width).toBeGreaterThanOrEqual(44)
    await portal.click()

    await expect(page.getByTestId('app')).toHaveAttribute('data-map', to)
    await expect(page.getByTestId('map-name')).toHaveText(`1층 ${name}`)
    await nextFrames(page)
    await expect(page.getByTestId(`portal-${back}`)).toBeVisible()

    // 포탈 이름표는 모두 화면 안에 있고 다른 칸에 가려지지 않는다
    const hud = await Promise.all(
      ['profile', 'map-name', 'wallet', 'menu-fight', 'menu-quest', 'menu-shop', 'menu-train'].map(
        async (id) => (await page.getByTestId(id).boundingBox())!,
      ),
    )
    const signs = await page.locator('.portal-sign').all()
    expect(signs).toHaveLength(2)
    for (const sign of signs) {
      await expectFullyOnScreen(sign)
      const signBox = (await sign.boundingBox())!
      for (const other of hud) expectApart(signBox, other)
    }
    expectApart((await signs[0].boundingBox())!, (await signs[1].boundingBox())!)
    await page.screenshot({ path: `test-results/screens/map-${to}.png` })
    await expectMapNotCut(page)

    // 구조도에서 내 위치가 지금 맵으로 옮겨 가고, 구조도가 맵과 이름표를 가리지 않는다
    await expect(page.getByTestId('plan-here')).toHaveCount(1)
    await expect(page.getByTestId(`plan-room-${to}`).getByTestId('plan-here')).toBeVisible()
    await expect(page.getByTestId(`plan-room-${back}`)).toContainText(`→`)
    const plan = (await page.getByTestId('floor-plan').boundingBox())!
    for (const sign of signs) expectApart((await sign.boundingBox())!, plan)
    expectApart(plan, (await page.getByTestId('menu-fight').boundingBox())!)
    // 구조도 바로 위 띠가 바탕색 한 가지면 맵이 구조도 밑으로 들어가지 않은 것이다
    expect(
      await countColors(page, await page.screenshot({ clip: { x: 0, y: plan.y - 2, width: SCREEN.width, height: 2 } })),
    ).toBe(1)

    // 맵마다 바탕색이 다르다. 빈 구석 한 점으로 확인한다
    const shot = await page.screenshot({ clip: { x: 0, y: SCREEN.height - 2, width: 2, height: 2 } })
    backgrounds.add(shot.toString('base64'))
  }
  expect(backgrounds.size).toBe(7)
})
