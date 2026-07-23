/**
 * 무대 사진 수집기.
 *
 * 위키미디어 공용에서 자유 라이선스 사진만 받아 `public/photos/`에 굳힌다.
 * 빌드 시점에 정적 파일로 만들어 두는 이유:
 *   - 발표장 와이파이가 죽어도 사진이 뜬다
 *   - 외부 핫링크로 트래픽을 빌려 쓰지 않는다
 *   - 라이선스 표기를 코드에 함께 박아 둘 수 있다
 *
 * 라이선스는 전부 CC0 / PD / CC BY / CC BY-SA / KOGL 제1유형이며,
 * 저작자 표시는 `src/content/photos.ts`에 함께 기록되어 화면 하단에 노출된다.
 *
 *   node scripts/fetch-photos.mjs
 *
 * 위키미디어 업로드 서버는 연속 요청에 429를 오래 물린다. 이미 원본을
 * 받아 둔 폴더가 있으면 그쪽을 먼저 쓴다 (파일명은 공용의 원본명 그대로):
 *
 *   node scripts/fetch-photos.mjs --from ./originals
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'photos')
const API = 'https://commons.wikimedia.org/w/api.php'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 실제로 화면에 쓰는 사진들. key = 파일명(확장자 제외) */
const PHOTOS = {
  // 무대 표지 · 본전 — 계단을 올라 사당에 닿는 그 장면
  bonjeon: {
    file: '현충사(Hyeonchoong-sa) 01.jpg',
    width: 1600,
  },
  // 본전 편액 — 顯忠祠 현판과 단청
  hyeonpan: {
    file: '현충사(Hyeonchoong-sa) 02.jpg',
    width: 1400,
  },
  // 장검 — 전시장 유리 너머 두 자루
  janggeom: {
    file: 'Yi sun-sin general sword.jpg',
    width: 1600,
  },
  // 난중일기 계열 — 임진장초 실물
  nanjung: {
    file: '이순신 난중일기 및 서간첩 임진장초.jpg',
    width: 1200,
  },
  // 기념관 — 이충무공전서의 거북선 도설
  gwan: {
    file: '1795WoodblockPrintedBookOnYiSunSin.jpg',
    width: 1400,
  },
  // 고택 구역 — 현충사 경내의 봄
  gotaek: {
    file: 'Korea-Asan-Spring garden near Hyeonchungsa-01.jpg',
    width: 1600,
  },
  // 흉상 — 인증서·온보딩 보조
  bust: {
    file: 'Bust of Yi Sun-sin 01.jpg',
    width: 1100,
  },
}

/** 수결(서명) — 투명 PNG 그대로 쓴다. 앱 전체의 그래픽 액센트. */
const SIGNATURE = { file: 'SignatureYiSunSin.png', out: 'sugyeol.png' }

/**
 * 위키미디어는 연속 요청에 429로 답한다. 넉넉히 기다렸다 다시 묻는다 —
 * 어차피 한 번 받아 두면 정적 파일로 굳으므로 느려도 상관없다.
 */
async function api(params, tries = 8) {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'chak-app/0.1 (research)' } })
      if (r.ok) return r.json()
      if (r.status !== 429) throw new Error(`HTTP ${r.status}`)
    } catch (e) {
      if (!/429|fetch/i.test(e.message)) throw e
    }
    const wait = Math.min(60000, 5000 * 2 ** i)
    console.error(`  … 레이트 리밋, ${wait / 1000}초 대기`)
    await sleep(wait)
  }
  throw new Error('레이트 리밋이 풀리지 않음 — 잠시 후 다시 실행하세요')
}

async function download(url, tries = 6) {
  // 업로드 서버는 Referer 없는 요청을 막고, 연타하면 429로 돌려보낸다
  let last = ''
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'chak-app/0.1 (research) node-fetch',
          Referer: 'https://commons.wikimedia.org/',
          Accept: 'image/jpeg,image/png,*/*',
        },
      })
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer())
        if (buf[0] === 0xff || buf[0] === 0x89) return buf
        last = 'HTML 응답'
      } else {
        last = `HTTP ${r.status}`
      }
    } catch (e) {
      last = e.message
    }
    await sleep(3000 * (i + 1))
  }
  throw new Error(last)
}

async function exists(p) {
  try {
    return (await readFile(p)).length > 3000
  } catch {
    return false
  }
}

/** `--from <dir>`로 받은 로컬 원본 폴더 (없으면 null) */
const FROM = (() => {
  const i = process.argv.indexOf('--from')
  return i > -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : null
})()

/** 로컬 원본을 먼저 찾고, 없으면 내려받는다. */
async function source(fileName, url) {
  if (FROM) {
    const local = path.join(FROM, fileName)
    if (await exists(local)) return readFile(local)
  }
  return download(url)
}

const strip = (v) => (v?.value ?? '').replace(/<[^>]*>/g, '').trim()

/** 이전 실행 결과를 읽어 둔다 — 중간에 끊겨도 이어받기 위해. */
async function loadCache() {
  try {
    const src = await readFile(path.join(ROOT, 'src', 'content', 'photos.ts'), 'utf8')
    const m = src.match(/PHOTO_CREDITS: Record<string, PhotoCredit> = (\{[\s\S]*?\n\})\n/)
    return m ? JSON.parse(m[1]) : {}
  } catch {
    return {}
  }
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const cache = await loadCache()

  const titles = [...Object.values(PHOTOS).map((p) => p.file), SIGNATURE.file]
  const d = await api({
    action: 'query',
    titles: titles.map((t) => 'File:' + t).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
  })

  const byTitle = new Map()
  for (const p of Object.values(d?.query?.pages ?? {})) {
    const ii = p.imageinfo?.[0]
    if (ii) byTitle.set(p.title.replace(/^File:/, ''), ii)
  }

  const credits = {}

  for (const [key, spec] of Object.entries(PHOTOS)) {
    const ii = byTitle.get(spec.file)
    if (!ii) {
      console.error(`✗ ${key}: 원본을 찾지 못함 — ${spec.file}`)
      continue
    }

    const dest = path.join(OUT, `${key}.jpg`)
    const cachedBlur = cache[key]?.blur

    // 이미 받아 둔 건 건너뛴다 — 레이트 리밋에 걸려도 이어서 받을 수 있다
    if ((await exists(dest)) && cachedBlur) {
      credits[key] = cache[key]
      console.error(`· ${key.padEnd(10)} 건너뜀 (이미 있음)`)
      continue
    }

    let src
    try {
      src = await source(spec.file, ii.url)
    } catch (e) {
      // 여기서 멈춰도 지금까지 받은 건 남긴다. 다시 실행하면 이어받는다.
      console.error(`✗ ${key}: ${e.message} — 여기까지 저장하고 중단합니다`)
      await writeCredits(credits)
      throw new Error('중단됨. 잠시 후 다시 실행하면 이어받습니다.')
    }

    await sharp(src)
      .rotate()
      .resize({ width: spec.width, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(dest)

    // 흐릿한 자리표시자 — 사진이 뜨기 전 레이아웃이 덜컥거리지 않게 한다
    const blur = await sharp(src).resize(20).blur(1.4).jpeg({ quality: 42 }).toBuffer()

    const m = ii.extmetadata ?? {}
    credits[key] = {
      license: strip(m.LicenseShortName),
      author: strip(m.Artist).slice(0, 90),
      page: ii.descriptionurl,
      blur: `data:image/jpeg;base64,${blur.toString('base64')}`,
    }

    const kb = ((await readFile(dest)).length / 1024) | 0
    console.error(`✓ ${key.padEnd(10)} ${kb}KB  ${credits[key].license}`)
    await sleep(1500)
  }

  // 수결은 투명도를 살려야 하므로 PNG 그대로
  const sig = byTitle.get(SIGNATURE.file)
  if (sig && !((await exists(path.join(OUT, SIGNATURE.out))) && cache.sugyeol)) {
    const buf = await source(SIGNATURE.file, sig.url)
    await sharp(buf)
      .resize({ height: 520, withoutEnlargement: true })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(OUT, SIGNATURE.out))
    const m = sig.extmetadata ?? {}
    credits.sugyeol = {
      license: strip(m.LicenseShortName),
      author: strip(m.Artist).slice(0, 90),
      page: sig.descriptionurl,
    }
    console.error(`✓ sugyeol    ${credits.sugyeol.license}`)
  } else if (cache.sugyeol) {
    credits.sugyeol = cache.sugyeol
    console.error('· sugyeol    건너뜀 (이미 있음)')
  }

  await writeCredits(credits)
}

/** 출처 표기를 코드로 굳힌다 — 화면 하단에 그대로 노출된다. */
async function writeCredits(credits) {
  if (Object.keys(credits).length === 0) return
  const ts = new Date().toISOString().slice(0, 10)
  const body = `/**
 * 사진 출처 — \`scripts/fetch-photos.mjs\`가 생성. 직접 고치지 말 것.
 *
 * 전부 위키미디어 공용의 자유 라이선스 저작물이다. 화면에 저작자와
 * 라이선스를 함께 노출하는 것이 CC BY / CC BY-SA의 조건이다.
 *
 * 마지막 수집: ${ts}
 */
export interface PhotoCredit {
  license: string
  author: string
  page: string
  /** 로딩 전 자리표시자 (20px 축소본) */
  blur?: string
}

export const PHOTO_CREDITS: Record<string, PhotoCredit> = ${JSON.stringify(credits, null, 2)}

/** 사진 경로. 없으면 빈 문자열이 아니라 undefined를 돌려준다. */
export function photo(key: string): string | undefined {
  return PHOTO_CREDITS[key] ? \`/photos/\${key}.jpg\` : undefined
}
`
  await writeFile(path.join(ROOT, 'src', 'content', 'photos.ts'), body)
  console.error(`\n출처 표기 → src/content/photos.ts`)
}

main().catch((e) => {
  console.error('\n✗ ' + e.message)
  process.exitCode = 1
})
