import path from 'path'

import {assert} from 'chai'
import puppeteer from 'puppeteer'

const FORTY_SECONDS = 40000

describe('Browser Tests', function () {
  it('Integration Tests', async function () {
    const browser = await puppeteer.launch({headless: true})
    try {
      const page = await browser.newPage().catch()
      const url = path.resolve('./../localintegrationrunner.html')
      await page.goto(url)

      await page.waitForFunction(
        'document.querySelector("body").innerText.includes("submit multisigned transaction")'
      )

      const fails = await page.evaluate(() => {
        return document.querySelector('.failures').textContent
      })
      const passes = await page.evaluate(() => {
        return document.querySelector('.passes').textContent
      })

      assert.equal(fails, 'failures: 0')
      assert.notEqual(passes, 'passes: 0')
    } catch (_err) {
      assert(false)
    } finally {
      await browser.close()
    }
  }).timeout(FORTY_SECONDS)
})
