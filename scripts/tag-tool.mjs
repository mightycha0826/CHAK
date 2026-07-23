#!/usr/bin/env node
/**
 * 착(CHAK) 태그 굽기 도구 — proxmark3용 명령 시퀀스 생성기.
 *
 *   node scripts/tag-tool.mjs --base https://chak.pages.dev --type ntag
 *   node scripts/tag-tool.mjs --base https://chak.pages.dev --type mfc --stage hcs
 *
 * 하는 일:
 *   1) content/의 무대·스팟에서 태그 URL을 만들고
 *   2) NDEF URI 레코드로 인코딩해
 *   3) 태그 종류별 PM3 명령 시퀀스를 화면과 `tags/` 폴더에 뱉는다.
 *
 * 생성된 .cmd 파일은 PM3 클라이언트에 그대로 먹일 수 있다:
 *   pm3 -s tags/ntag/hcs-nanjung.cmd
 *
 * ⚠️ 굽기 전에 반드시 --base를 프로덕션 도메인으로 고정할 것.
 *    한 번 구운 태그의 URL은 다시 구워야만 바뀐다.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chunk, tagBytesFor, toHex } from './ndef.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ── 인자 파싱 ────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { base: '', type: 'ntag', stage: '', out: 'tags' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--base') args.base = argv[++i]
    else if (a === '--type') args.type = argv[++i]
    else if (a === '--stage') args.stage = argv[++i]
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

const HELP = `
착(CHAK) 태그 굽기 도구

  --base <url>    태그에 구울 뿌리 주소 (필수, 예: https://chak.pages.dev)
  --type <종류>   ntag | mfc          (기본: ntag)
  --stage <id>    특정 무대만          (생략 시 전체)
  --out <dir>     출력 폴더            (기본: tags)

먼저 PM3에서 'hf search'를 돌려 카드 종류를 확인하세요.
  · NTAG213/215 등 → --type ntag
  · MIFARE Classic 1K → --type mfc
`

// ── NTAG21x ──────────────────────────────────────────────────────
// 사용자 메모리는 page 4부터. 한 page = 4바이트.
function ntagCommands(bytes) {
  return chunk(bytes, 4).map((part, i) => `hf mfu wrbl -b ${4 + i} -d ${toHex(part)}`)
}

// ── MIFARE Classic 1K ────────────────────────────────────────────
// 섹터당 4블록(데이터 3 + 트레일러 1). 섹터 0은 MAD이므로 섹터 1부터 쓴다.
const MFC_NDEF_KEY = 'D3F7D3F7D3F7'

function mfcDataBlocks(count) {
  const blocks = []
  for (let sector = 1; blocks.length < count && sector < 16; sector++) {
    for (let b = 0; b < 3 && blocks.length < count; b++) {
      blocks.push(sector * 4 + b)
    }
  }
  return blocks
}

function mfcCommands(bytes) {
  const parts = chunk(bytes, 16)
  const blocks = mfcDataBlocks(parts.length)
  if (blocks.length < parts.length) {
    throw new Error('NDEF 데이터가 MIFARE Classic 1K 용량을 넘습니다.')
  }
  return [
    'hf mf ndefformat',
    ...parts.map(
      (part, i) => `hf mf wrbl --blk ${blocks[i]} -a -k ${MFC_NDEF_KEY} -d ${toHex(part)}`,
    ),
  ]
}

const VERIFY = {
  ntag: 'hf mfu ndefread',
  mfc: 'hf mf ndefread',
}

// ── 메인 ─────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(HELP)
    return
  }
  if (!args.base) {
    console.error('오류: --base 가 필요합니다. 예) --base https://chak.pages.dev')
    console.log(HELP)
    process.exitCode = 1
    return
  }
  if (args.type !== 'ntag' && args.type !== 'mfc') {
    console.error(`오류: --type 은 ntag 또는 mfc 여야 합니다 (받은 값: ${args.type})`)
    process.exitCode = 1
    return
  }

  const base = args.base.replace(/\/+$/, '')
  // 윈도우 절대경로는 file:// URL로 바꿔야 ESM 로더가 받아준다.
  const { STAGES } = await import(pathToFileURL(path.join(ROOT, 'src/content/index.ts')).href)
  const stages = args.stage ? STAGES.filter((s) => s.id === args.stage) : STAGES

  if (stages.length === 0) {
    console.error(`오류: '${args.stage}' 무대를 찾을 수 없습니다.`)
    process.exitCode = 1
    return
  }

  const outDir = path.join(ROOT, args.out, args.type)
  await mkdir(outDir, { recursive: true })

  const index = [
    `# 착(CHAK) 태그 목록 — ${args.type.toUpperCase()}`,
    '',
    `뿌리 주소: \`${base}\``,
    '',
    '굽기 전 PM3에서 `hf search`로 카드 종류를 확인하세요.',
    '',
  ]
  let total = 0

  for (const stage of stages) {
    console.log(`\n━━ ${stage.name} (${stage.id}) ━━`)
    index.push(`## ${stage.name} (\`${stage.id}\`)`, '')

    for (const spot of stage.spots) {
      const url = `${base}/?m=${stage.id}&spot=${spot.id}`
      const bytes = tagBytesFor(url)
      const commands = args.type === 'ntag' ? ntagCommands(bytes) : mfcCommands(bytes)
      const file = path.join(outDir, `${stage.id}-${spot.id}.cmd`)

      await writeFile(
        file,
        [
          `# ${stage.name} · ${spot.title}`,
          `# ${url}`,
          `# 굽기: pm3 -s ${path.relative(ROOT, file).replace(/\\/g, '/')}`,
          `# 검증: ${VERIFY[args.type]}`,
          '',
          ...commands,
          '',
        ].join('\n'),
        'utf8',
      )

      console.log(`  ${spot.title}`)
      console.log(`    ${url}`)
      console.log(`    ${bytes.length}바이트 · ${commands.length}개 명령 → ${path.relative(ROOT, file)}`)

      index.push(
        `### ${spot.title}`,
        '',
        `- URL: \`${url}\``,
        `- 명령 파일: \`${path.relative(ROOT, file).replace(/\\/g, '/')}\``,
        `- NDEF: \`${toHex(bytes)}\``,
        '',
      )
      total++
    }
  }

  const indexFile = path.join(ROOT, args.out, `${args.type}-README.md`)
  await writeFile(indexFile, index.join('\n'), 'utf8')

  console.log(`\n총 ${total}장 분량 생성. 목록: ${path.relative(ROOT, indexFile)}`)
  console.log(`\n다음 순서로 구우세요:`)
  console.log(`  1. PM3에 태그를 올리고  hf search  로 종류 확인`)
  console.log(`  2. pm3 -s ${args.out}/${args.type}/<무대>-<스팟>.cmd`)
  console.log(`  3. ${VERIFY[args.type]}  로 URL이 제대로 들어갔는지 확인`)
  console.log(`  4. 안드로이드 폰으로 실제 태그해서 브라우저가 열리는지 확인\n`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
