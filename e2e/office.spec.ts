import { test, expect } from '@playwright/test'

test('폰 크기 화면에 빈 사무실 층이 그려진다', async ({ page }) => {
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
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
  const shot = await page.screenshot({ path: 'test-results/screens/office.png' })

  // 캔버스가 비어 있으면 색이 한두 개뿐이다. 벽·카펫·책상 색이 실제로 찍혔는지 본다.
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
  expect(colors).toBeGreaterThan(8)
})
