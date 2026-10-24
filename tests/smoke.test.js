const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.FORGE_BROWSER || undefined });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  const errors = [];
  let backup = null;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(process.env.FORGE_URL || 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

  if (process.env.FORGE_BACKUP) {
    backup = JSON.parse(fs.readFileSync(process.env.FORGE_BACKUP, 'utf8'));
    await page.evaluate(history => localStorage.setItem('forge_history_v1', JSON.stringify(history)), backup.history);
    await page.reload({ waitUntil: 'networkidle' });
    if (await page.locator('#stTotal').textContent() !== String(backup.history.length)) throw new Error('backup history did not render');
  }

  await page.screenshot({ path: path.join(__dirname, 'home-smoke.png'), fullPage: true });
  await page.locator('#nextBtn').click();
  await page.locator('#howBtn').click();
  await page.locator('.pose img').first().waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(__dirname, 'guide-smoke.png') });
  await page.locator('[data-close="guide"]').last().click();

  if (process.env.FORGE_BACKUP) {
    for (let i = 0; i < 4; i += 1) await page.locator('#navNext').click();
    if (!(await page.locator('.lasttime .lh').textContent()).includes('Last Upper A')) throw new Error('A-day context label missing');
    if (await page.locator('#r0').inputValue() !== '9') throw new Error('Upper A incline history was not used');
    await page.evaluate(() => startSession('upperB'));
    if (!(await page.locator('.lasttime .lh').textContent()).includes('Last Upper B')) throw new Error('B-day context label missing');
    if (await page.locator('#r0').inputValue() !== '10') throw new Error('Upper B incline history was not used');

    await page.evaluate(() => { pauseSessionClock(); go('home'); renderHome(); });
    await page.locator('#toData').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#fileInput').setInputFiles(process.env.FORGE_BACKUP);
    await page.locator('#toast.show').waitFor();
    if (await page.locator('#stTotal').textContent() !== String(backup.history.length)) throw new Error('merge import duplicated or lost history');
  }

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.context().setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#home').waitFor();
  await page.context().setOffline(false);

  if (errors.length) throw new Error(`browser errors: ${errors.join(' | ')}`);
  console.log('FORGE mobile smoke test passed');
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
