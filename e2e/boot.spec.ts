import { test, expect } from '@playwright/test'

test('폰 크기 화면에서 게임이 뜬다', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app')).toBeVisible()
  await page.screenshot({ path: 'test-results/screens/boot.png' })
})
