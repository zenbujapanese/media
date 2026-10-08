import { createRequire } from 'node:module'
import { mkdir, rm, readdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(process.env.PW_FROM || '/Users/devin/dev/repos/zenbujapanese-monorepo/apps/web/package.json')
const { chromium } = require(process.env.PW_PKG || '/Users/devin/dev/repos/zenbujapanese-monorepo/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright')
const run = promisify(execFile)

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v = '1'] = a.replace(/^--/, '').split('='); return [k, v] }))
const OUT = args.out || path.join(process.env.HOME, 'Desktop', 'Zenbu Motion Pack')
const FPS = Number(args.fps || 30)
const ONLY = args.only ? args.only.split(',') : null
const PREVIEW = args.preview === '1'
const WORKERS = Number(args.workers || 4)
const FRAMES = path.join(here, 'frames')

const SIZE = { '9x16': [1080, 1920], '16x9': [1920, 1080], '1x1': [1080, 1080], 'lockup-h': [3200, 800], 'lockup-v': [2200, 1500] }
const qs = o => Object.entries(o).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')

const jobs = []
const add = (dir, name, params, opts = {}) => jobs.push({ dir, name, params, ...opts })
const ARS = ['9x16', '16x9']

for (const ar of ARS) {
  for (const bg of ['red', 'ink', 'paper']) {
    add('01-intro', `intro-${ar}-${bg}`, { scene: 'intro', ar, bg, dur: 3000 })
    add('01-intro', `bumper-${ar}-${bg}`, { scene: 'intro', ar, bg, dur: 3000, exit: 1 })
  }
  add('01-intro', `intro-${ar}-alpha`, { scene: 'intro', ar, bg: 'none', dur: 3000 }, { alpha: true })
  add('02-sting', `sting-${ar}-alpha`, { scene: 'sting', ar, bg: 'none', dur: 1500 }, { alpha: true })
  add('02-sting', `sting-${ar}-alpha-exit`, { scene: 'sting', ar, bg: 'none', dur: 1800, exit: 1 }, { alpha: true })
  for (const bg of ['red', 'ink']) add('02-sting', `sting-${ar}-${bg}`, { scene: 'sting', ar, bg, dur: 1600, exit: 1 })
  add('03-transitions', `transition-stamp-${ar}`, { scene: 'transition', ar, bg: 'none' }, { alpha: true })
  add('03-transitions', `transition-wipe-${ar}`, { scene: 'wipe', ar, bg: 'none' }, { alpha: true })
  for (const bg of ['ink', 'red', 'paper']) add('04-outro', `outro-${ar}-${bg}`, { scene: 'outro', ar, bg, dur: 10000 })
  add('04-outro', `outro-${ar}-ink-fadeout`, { scene: 'outro', ar, bg: 'ink', dur: 10000, exit: 1 })
  add('05-lower-third', `lower-third-${ar}-alpha`, { scene: 'lower-third', ar, bg: 'none', dur: 6000 }, { alpha: true })
  add('06-cta', `cta-follow-${ar}-alpha`, { scene: 'cta', ar, bg: 'none', dur: 4000 }, { alpha: true })
  add('06-cta', `cta-link-in-bio-${ar}-alpha`, { scene: 'cta', ar, bg: 'none', dur: 4000, cta: 'Link in bio' }, { alpha: true })
  for (const bg of ['ink', 'paper', 'red']) add('07-background-loops', `bg-loop-${ar}-${bg}`, { scene: 'bg-loop', ar, bg, dur: 10000 }, { loop: true })
  for (const bg of ['ink', 'paper', 'red']) add('08-stills', `title-card-${ar}-${bg}`, { scene: 'title-card', ar, bg }, { still: true })
}
add('08-stills', 'thumbnail-base-1920x1080-ink', { scene: 'thumbnail', ar: '16x9', bg: 'ink' }, { still: true })
add('08-stills', 'thumbnail-base-1920x1080-red', { scene: 'thumbnail', ar: '16x9', bg: 'red' }, { still: true })
add('08-stills', 'endscreen-guide-16x9', { scene: 'endscreen-guide', ar: '16x9', bg: 'none' }, { still: true, alpha: true })
add('09-logo-lockups', 'lockup-horizontal-ink', { scene: 'lockup', ar: 'lockup-h', bg: 'none', fg: 'ink' }, { still: true, alpha: true, clip: true })
add('09-logo-lockups', 'lockup-horizontal-white', { scene: 'lockup', ar: 'lockup-h', bg: 'none', fg: 'white' }, { still: true, alpha: true, clip: true })
add('09-logo-lockups', 'lockup-stacked-ink', { scene: 'lockup', ar: 'lockup-v', bg: 'none', fg: 'ink' }, { still: true, alpha: true, clip: true })
add('09-logo-lockups', 'lockup-stacked-white', { scene: 'lockup', ar: 'lockup-v', bg: 'none', fg: 'white' }, { still: true, alpha: true, clip: true })

const selected = ONLY ? jobs.filter(j => ONLY.some(o => j.name.includes(o))) : jobs

async function encode(job, dir, out) {
  const base = path.join(OUT, job.dir, job.name)
  const input = ['-framerate', String(FPS), '-i', path.join(dir, '%05d.png')]
  const c709 = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
  const to709 = (fmt) => ['-vf', `scale=out_color_matrix=bt709:out_range=tv,format=${fmt}`, ...c709]
  if (job.alpha) {
    await run('ffmpeg', ['-y', ...input, ...to709('yuva444p10le'), '-c:v', 'prores_ks', '-profile:v', '4444', '-vendor', 'apl0', base + '.mov'])
    await run('ffmpeg', ['-y', ...input, ...to709('yuva420p'), '-c:v', 'hevc_videotoolbox', '-alpha_quality', '0.95', '-q:v', '75', '-tag:v', 'hvc1', base + '-hevc-alpha.mov'])
    await run('ffmpeg', ['-y', ...input, ...to709('yuva420p'), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '22', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', base + '.webm'])
  } else {
    await run('ffmpeg', ['-y', ...input, ...to709('yuv420p'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-movflags', '+faststart', base + '.mp4'])
  }
}

async function renderJob(browser, job) {
  const [w, h] = SIZE[job.params.ar]
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await page.goto('file://' + path.join(here, 'scenes.html') + '?' + qs(job.params), { waitUntil: 'load' })
  await page.evaluate(() => window.__ready)
  await page.waitForTimeout(150)
  const duration = await page.evaluate(() => window.__duration)
  await mkdir(path.join(OUT, job.dir), { recursive: true })
  const shot = (p, extra = {}) => job.clip
    ? page.locator('#stage').screenshot({ path: p, omitBackground: !!job.alpha, ...extra })
    : page.screenshot({ path: p, omitBackground: !!job.alpha, ...extra })
  if (job.still) {
    await page.evaluate(() => window.__seek(0))
    const png = path.join(OUT, job.dir, job.name + '.png')
    await shot(png)
    if (job.clip) await run('magick', [png, '-trim', '+repage', '-bordercolor', 'none', '-border', '80', png])
    await page.close()
    return `${job.name}: still`
  }
  if (PREVIEW) {
    const dir = path.join(OUT, '_preview'); await mkdir(dir, { recursive: true })
    for (const f of [0.15, 0.4, 0.7, 1]) {
      const t = Math.min(duration - 1, duration * f)
      await page.evaluate(ms => window.__seek(ms), t)
      await shot(path.join(dir, `${job.name}-${Math.round(f * 100)}.png`))
    }
    await page.close()
    return `${job.name}: preview (${duration}ms)`
  }
  const dir = path.join(FRAMES, job.name)
  await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true })
  const n = Math.round(duration / 1000 * FPS)
  for (let i = 0; i < n; i++) {
    const t = job.loop ? i * 1000 / FPS : Math.min(duration, i * 1000 / FPS)
    await page.evaluate(ms => window.__seek(ms), t)
    await shot(path.join(dir, String(i).padStart(5, '0') + '.png'))
  }
  await page.close()
  await encode(job, dir)
  await rm(dir, { recursive: true, force: true })
  return `${job.name}: ${n} frames`
}

const browser = await chromium.launch()
const queue = [...selected]
let done = 0
const started = Date.now()
await Promise.all(Array.from({ length: WORKERS }, async () => {
  while (queue.length) {
    const job = queue.shift()
    try {
      const msg = await renderJob(browser, job)
      done++
      console.log(`[${done}/${selected.length}] ${msg} (${Math.round((Date.now() - started) / 1000)}s)`)
    } catch (e) {
      console.error(`FAILED ${job.name}:`, e.message)
    }
  }
}))
await browser.close()
