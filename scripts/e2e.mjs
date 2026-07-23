/**
 * 브라우저 E2E — 실물 착 없이 전체 플로우를 검증한다.
 * 설치된 크롬을 그대로 쓰므로 별도 브라우저 다운로드가 없다.
 *
 *   npm run dev      (다른 터미널에서)
 *   npm run e2e
 *
 * 검증하는 것은 「착을 읽어 등록한다」는 새 모델이다. 지점 리더가 착에 기록을
 * 쓰는 부분은 하드웨어라 여기서 못 돌리고, 대신 폴백과 시연 패널이 **실물
 * 카드와 똑같은 등록 경로**를 타므로 앱 쪽 동작은 전부 덮인다.
 */
import puppeteer from 'puppeteer-core'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CHROME =
  process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const SHOTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.e2e-shots')

/**
 * dev 서버 포트를 찾는다.
 *
 * 구버전 chak / chak-web이 5173을 이미 물고 있으면 Vite가 조용히 5174로
 * 밀린다. 그때 5173을 그대로 때리면 **다른 앱을 테스트하면서 통과·실패가
 * 뒤죽박죽인 결과**가 나오므로, 제목으로 우리 앱인지 확인하고 고른다.
 */
async function findBase() {
  if (process.env.E2E_BASE) return process.env.E2E_BASE
  const wrong = []
  for (let port = 5173; port <= 5180; port++) {
    const url = `http://localhost:${port}`
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
      const html = await res.text()
      if (html.includes('<title>착(CHAK)</title>')) return url
      wrong.push(`${port}(${html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '?'})`)
    } catch {
      /* 안 떠 있는 포트 */
    }
  }
  throw new Error(
    `chak-app dev 서버를 못 찾았습니다. \`npm run dev\`를 켜세요.` +
      (wrong.length ? `\n  다른 앱이 쓰는 포트: ${wrong.join(', ')}` : ''),
  )
}

const errors = []
let step = 0
const log = (m) => console.log(`  ${m}`)
const head = (m) => console.log(`\n━━ ${m}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const BASE = await findBase()
  console.log(`  대상: ${BASE}`)

  // 이전 실행 결과가 남아 있으면 화면이 바뀐 뒤에도 옛 스크린샷을 보게 된다
  await rm(SHOTS, { recursive: true, force: true })
  await mkdir(SHOTS, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--window-size=420,900', '--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

  const shot = async (name) => {
    step++
    await page.screenshot({ path: `${SHOTS}/${String(step).padStart(2, '0')}-${name}.png` })
  }

  const clickText = async (text) => {
    const ok = await page.evaluate((t) => {
      const el = [...document.querySelectorAll('button')].find((e) =>
        e.textContent.replace(/\s+/g, ' ').includes(t),
      )
      if (!el) return false
      el.click()
      return true
    }, text)
    if (!ok) throw new Error(`버튼을 찾지 못함: "${text}"`)
    await sleep(420)
  }

  const clickAria = async (label) => {
    const ok = await page.evaluate((l) => {
      const el = [...document.querySelectorAll('[aria-label]')].find((e) =>
        e.getAttribute('aria-label').includes(l),
      )
      if (!el) return false
      el.click()
      return true
    }, label)
    if (!ok) throw new Error(`aria-label을 찾지 못함: "${label}"`)
    await sleep(420)
  }

  /** 하단 탭 이동 */
  const tab = async (label) => {
    const ok = await page.evaluate((l) => {
      const el = [...document.querySelectorAll('nav button[aria-label]')].find(
        (e) => e.getAttribute('aria-label') === l,
      )
      if (!el) return false
      el.click()
      return true
    }, label)
    if (!ok) throw new Error(`탭을 찾지 못함: "${label}"`)
    await sleep(450)
  }

  const text = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
  const expect = async (t, label) => {
    const body = await text()
    if (!body.includes(t)) {
      throw new Error(`실패 [${label}] — "${t}" 없음.\n화면: ${body.slice(0, 400)}`)
    }
    log(`✓ ${label}`)
  }

  /** 답사 탭 진행 카드에 박아둔 상태 */
  const progress = () =>
    page.evaluate(() => document.querySelector('[data-progress]')?.dataset.progress ?? null)

  const expectProgress = async (want, label) => {
    const got = await progress()
    if (got !== want) throw new Error(`실패 [${label}] — 진행률 ${want} 기대, 실제 ${got}`)
    log(`✓ ${label} (${got})`)
  }

  const visitedDate = () =>
    page.evaluate(() => {
      const m = document.body.innerText.match(/방문 · ([^\n]+)/)
      return m ? m[1] : null
    })

  /** 시연 패널 열기 — 리셋 아이콘 롱프레스 */
  const openDemo = async () => {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[aria-label]')].find((e) =>
        e.getAttribute('aria-label').includes('답사 초기화'),
      )
      b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    })
    await sleep(900)
  }

  // ── Flow A: 최초 진입 ─────────────────────────────────────────
  head('Flow A — 최초 진입')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await sleep(750)
  await expect('착을 들고 지점을 도세요', '온보딩이 착 모델을 설명')
  await expect('현충사', '기본 무대 = 현충사')
  await shot('onboarding')

  await clickText('답사 시작하기')
  await sleep(550)
  await expectProgress('0/5', '홈 진입')
  await expect('착 읽기', '주 동작이 착 읽기')
  await expect('답사 지점', '지점 목록')
  await shot('home-empty')

  // ── Flow B: 착 읽기 → 도장 ────────────────────────────────────
  head('Flow B — 착 읽기 → 도장')
  await clickText('착 읽기')
  await expect('착을 대주세요', '스캔 화면')
  await expect('원을 눌러 체험', '폴백 안내')
  await shot('scan')

  await clickAria('눌러서 체험하기')
  await sleep(1300)
  await expect('도장 1번째', '도장 획득 연출')
  await shot('stamp')

  await clickText('확인')
  await sleep(550)
  await expectProgress('1/5', '등록 반영')
  await shot('home-1')

  // ── 지점 상세 ────────────────────────────────────────────────
  head('지점 상세 — 도장은 현장에서만')
  await clickAria('난중일기')
  await expect('난중일기', '상세 진입')
  await expect('미방문', '미방문 상태 표시')
  await expect('리더에 착을 대면', '현장 리더 안내')
  await expect('유네스코', '제원 표')
  await shot('detail')
  await clickAria('뒤로')
  await sleep(450)

  // ── Flow C: 여러 곳 한 번에 등록 ──────────────────────────────
  head('Flow C — 여러 곳 돌고 온 착 (착의 핵심)')
  await openDemo()
  await expect('시연 도구', '롱프레스로 패널 열림')
  await expect('여러 곳 돌고 온 착 읽기', '다중 방문 시연 도구')
  await shot('demo-panel')

  await clickText('3곳 방문')
  await sleep(1300)
  await expect('다음 도장', '여러 도장이 순차 공개됨')
  await shot('stamp-multi')
  await clickText('다음 도장')
  await sleep(1300)
  await expect('도장 3번째', '두 번째 도장 공개')
  await clickText('확인')
  await sleep(550)
  await expectProgress('3/5', '한 번에 두 곳 등록')
  await shot('home-3')

  // ── 방문 시각은 카드 것을 쓴다 ────────────────────────────────
  head('엣지 — 이미 등록한 착을 다시 읽어도 시각 보존')
  await clickAria('난중일기')
  await expect('방문 ·', '상세에 방문일 반영')
  const before = await visitedDate()
  await clickAria('뒤로')
  await sleep(450)
  await openDemo()
  await clickText('3곳 방문')
  await sleep(1300)
  await expect('새 도장이 없습니다', '새 기록 없음 안내')
  await shot('no-new')
  await clickText('확인')
  await sleep(450)
  await expectProgress('3/5', '중복 등록 없음')
  await clickAria('난중일기')
  const after = await visitedDate()
  if (before !== after) throw new Error(`방문일이 바뀜: ${before} → ${after}`)
  log('✓ 방문 시각 보존')
  await clickAria('뒤로')
  await sleep(450)

  // ── Flow D: 수첩 탭 ───────────────────────────────────────────
  head('Flow D — 수첩 탭')
  await tab('수첩')
  await expect('2곳이 남았습니다', '남은 곳 표시')
  await expect('현장에서 착을 대면 채워집니다', '미방문 안내')
  await shot('journal')
  await tab('답사')

  // ── Flow E: 완주 ──────────────────────────────────────────────
  head('Flow E — 완주 → 증명서')
  await openDemo()
  await clickText('5곳 방문')
  await sleep(1300)
  await clickText('다음 도장')
  await sleep(1450)
  await expect('증명서를 펼치는 중', '완주 시 확인 버튼 없음')
  await shot('stamp-final')
  await sleep(3200)
  await expect('현충사 답사기', '증명서 자동 진입')
  await expect('발로 걸어 끝까지 읽었음', '증명 문구')
  await shot('certificate')

  await clickText('공유하기')
  await sleep(450)
  await expect('시연용 목업', '공유 목업 토스트')

  await clickText('처음으로')
  await sleep(750)
  await expect('답사 시작하기', '리셋 후 온보딩 복귀')
  log('✓ 상태 초기화')

  // ── Flow F: 무대 전환 ─────────────────────────────────────────
  head('Flow F — 무대 전환 · 진행 분리')
  await clickText('답사 시작하기')
  await sleep(500)
  await tab('무대')
  await expect('신라스테이 천안', '무대 목록')
  await expect('선택됨', '현재 무대 표시')
  await shot('stages')

  await clickText('신라스테이 천안')
  await sleep(700)
  await expect('착을 들고', '새 무대는 온보딩부터')
  await clickText('답사 시작하기')
  await sleep(550)
  await expectProgress('0/5', '신라스테이는 현충사와 분리')
  await expect('로비', '호텔 무대 지점 노출')
  await shot('home-shillastay')

  const schematic = await page.evaluate(() => !!document.querySelector('svg polyline'))
  if (!schematic) throw new Error('도식 관내도가 렌더되지 않음')
  log('✓ 실내 무대는 도식 관내도로 폴백')

  await clickText('착 읽기')
  await clickAria('눌러서 체험하기')
  await sleep(1300)
  await clickText('확인')
  await sleep(450)
  await expectProgress('1/5', '신라스테이 적립')

  await tab('무대')
  const counts = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((e) => /^\d\/\d$/.test(e.textContent?.trim() ?? ''))
      .map((e) => e.textContent.trim()),
  )
  if (!(counts.includes('0/5') && counts.includes('1/5'))) {
    throw new Error(`무대별 진행이 분리되지 않음: ${JSON.stringify(counts)}`)
  }
  log('✓ 무대별 진행 분리 (현충사 0/5, 신라스테이 1/5)')

  await browser.close()

  head('결과')
  if (errors.length) {
    console.log(`  ✗ 콘솔 에러 ${errors.length}건`)
    errors.slice(0, 10).forEach((e) => console.log(`    - ${e.slice(0, 200)}`))
    process.exitCode = 1
  } else {
    console.log('  ✓ 콘솔 에러 0건')
  }
  console.log(`  스크린샷: ${SHOTS}`)
}

main().catch((e) => {
  console.error('\n✗ ' + e.message)
  process.exitCode = 1
})
