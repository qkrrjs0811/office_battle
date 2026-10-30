import { test, expect } from '@playwright/test'

test('폰 세로 화면에서 게임이 뜬다', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app')).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/boot.png' })
})
