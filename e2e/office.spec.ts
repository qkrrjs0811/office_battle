import { test, expect, type Page } from '@playwright/test'

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

test('폰 크기 화면에 블록 사무실 층이 그려진다', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app')).toHaveAttribute('data-scene', 'office')
  await expect(page.getByTestId('floor-label')).toHaveText('1층 · 인턴')

  // 화면 맞춤 계산에서 1px 미만의 소수점 오차가 난다
  const canvas = (await page.locator('canvas').boundingBox())!
  expect(canvas.x).toBeCloseTo(0, 0)
  expect(canvas.y).toBeCloseTo(0, 0)
  expect(canvas.width).toBeCloseTo(390, 0)
  expect(canvas.height).toBeCloseTo(844, 0)

  // 첫 프레임이 그려질 때까지 기다린 뒤 찍는다
  await nextFrames(page)
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

test('끌어서 맵의 다른 구역을 둘러본다', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app')).toHaveAttribute('data-scene', 'office')
  await nextFrames(page)

  const start = await camera(page)
  await drag(page, [200, 700], [200, 200])
  const moved = await camera(page)
  expect(moved.y).toBeGreaterThan(start.y + 100)
  await page.screenshot({ path: 'test-results/screens/office-lounge.png' })

  await drag(page, [300, 700], [40, 200])
  await drag(page, [300, 700], [40, 200])
  const further = await camera(page)
  expect(further.x).toBeGreaterThan(moved.x)
  expect(further.y).toBeGreaterThanOrEqual(moved.y)
  await page.screenshot({ path: 'test-results/screens/office-executive.png' })

  // 맵 끝을 넘어가도 카메라가 빈 곳으로 나가지 않는다
  for (let i = 0; i < 5; i++) await drag(page, [40, 200], [380, 800])
  const corner = await camera(page)
  expect(corner.y).toBeGreaterThanOrEqual(0)
  expect(corner.x).toBeGreaterThanOrEqual(0)
  await page.screenshot({ path: 'test-results/screens/office-top.png' })
})
