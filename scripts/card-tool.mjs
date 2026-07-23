#!/usr/bin/env node
/**
 * 착(CHAK) 카드 도구 — proxmark3용 Lua 스크립트 생성기.
 *
 *   node scripts/card-tool.mjs --stage hcs
 *
 * 하는 일:
 *   1) 무대의 지점 목록에서 슬롯↔블록 배치를 계산하고
 *   2) 착 카드를 발급하는 스크립트(chak_init.lua)와
 *   3) 지점마다 도장을 찍는 현장 리더 스크립트(chak_stamp.lua)를 뱉는다.
 *
 * 생성물은 PM3 클라이언트의 luascripts/ 에 복사해서 쓴다:
 *   script run chak_init
 *   script run chak_stamp -s nanjung
 *
 * ⚠️ 지점을 추가·삭제하면 슬롯 배치가 통째로 바뀐다. 이미 발급한 카드는
 *    옛 배치를 갖고 있으므로 다시 발급해야 한다. 콘텐츠를 고쳤으면 이 도구를
 *    반드시 다시 돌릴 것.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv) {
  const args = { stage: 'hcs', out: 'pm3' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--stage') args.stage = argv[++i]
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

const HELP = `
착(CHAK) 카드 도구 — PM3 Lua 스크립트 생성

  --stage <id>   무대 id      (기본: hcs)
  --out <dir>    출력 폴더    (기본: pm3)

생성된 .lua를 PM3 클라이언트의 luascripts/ 에 복사한 뒤:
  script run chak_init            빈 착 카드 발급
  script run chak_stamp -s <지점> 현장 리더 (키오스크 모드)
`

/** Lua 문자열 리터럴로 안전하게 감싼다. */
function lua(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/**
 * 생성한 Lua가 대괄호 구분자 때문에 깨지지 않는지 검사한다.
 *
 * Lua의 긴 주석 `--[[ ... --]]` 와 긴 문자열 `[[ ... ]]` 는 **처음 만나는**
 * 닫는 구분자에서 끝난다. 그래서 본문 안에 `]]` 가 하나라도 들어가면 거기서
 * 잘리고, 뒤따르는 글자가 코드로 해석돼 엉뚱한 위치에서 문법 에러가 난다.
 *
 * 실제로 이 생성기가 두 번 그 실수를 냈다 — usage 문구의 `[-n]]]` 와,
 * 그 버그를 설명하려고 주석에 적은 `]]` 자체. 사람 눈으로는 잘 안 보이고
 * 증상이 원인에서 멀리 떨어져 나타나므로 기계가 막는 편이 낫다.
 */
function assertLuaBrackets(name, src) {
  const open = src.indexOf('--[[')
  if (open !== -1) {
    const body = src.slice(open + 4)
    const end = body.indexOf(']]')
    const intended = body.indexOf('--]]')
    if (end === -1) throw new Error(`${name}: 블록 주석이 닫히지 않았습니다.`)
    if (end !== intended + 2) {
      const line = src.slice(0, open + 4 + end).split('\n').length
      throw new Error(
        `${name}:${line} 블록 주석 안에 닫는 대괄호 두 개가 있어 주석이 일찍 끝납니다.\n` +
          `  → ${src.split('\n')[line - 1].trim()}`,
      )
    }
  }

  // `[[ ... ]]` 로 연 긴 문자열은 본문에 대괄호가 없어야 안전하다.
  for (const m of src.matchAll(/(?<!\[=*)\[\[([\s\S]*?)\]\]/g)) {
    if (/[[\]]/.test(m[1])) {
      const line = src.slice(0, m.index).split('\n').length
      throw new Error(
        `${name}:${line} 긴 문자열 안에 대괄호가 있습니다. [==[ ]==] 로 바꾸세요.\n` +
          `  → ${m[0].split('\n')[0].trim()}`,
      )
    }
  }
}

// ── chak_init.lua ────────────────────────────────────────────────
function initScript({ stage, blocks, blockNums, key, spots }) {
  const writes = blocks
    .map((hex, i) => `    { blk = ${blockNums[i]}, data = ${lua(hex)} },`)
    .join('\n')

  return `--[[
  착(CHAK) 카드 발급 — ${stage.name}

  빈 매직카드를 착 카드로 만든다. NDEF 포맷을 얹고, 지점 ${spots.length}개짜리
  빈 슬롯 골격을 써 넣는다.

  주의: 이미 한 번 발급한 카드를 다시 발급하려면 ndefformat이 공장 기본키를
  요구하므로 cwipe로 되돌려야 한다. Gen1a 매직카드라 백도어로 가능하다.

  ⚠️ 화면에 찍는 글자는 전부 ASCII다. PM3 윈도우 콘솔이 한글 UTF-8을 깨뜨려서
     (script list 출력의 경로가 깨지는 것과 같은 이유) 현장에서 읽을 수 없다.
     한글은 이렇게 주석에만 둔다.

  ⚠️ 긴 문자열을 등호 두 개짜리 구분자로 여는 이유: 대괄호를 겹쳐 여는 기본
     구분자는 안에 닫는 대괄호가 둘 붙어 나오면 거기서 끝나버린다. usage 문구에
     -h 같은 옵션을 대괄호로 감싸 쓰므로 반드시 등호를 끼워야 한다.
     같은 이유로 이 주석에도 닫는 대괄호를 붙여 쓰지 않는다.

  사용법:
    script run chak_init          (cwipe → ndefformat → 골격)
    script run chak_init -n       (cwipe 생략 — 새 카드일 때)
--]]

local getopt = require('getopt')
local ansicolors = require('ansicolors')

author = 'CHAK'
version = 'v1.0.0'
desc = [==[Issue a CHAK card - ${stage.id} (${spots.length} slots)]==]
usage = [==[script run chak_init [-h] [-n]]==]
arguments = [==[
    -h    this help
    -n    skip cwipe (factory-fresh card)
]==]

local KEY = ${lua(key)}

local BLOCKS = {
${writes}
}

local function help()
    print(desc); print(ansicolors.cyan .. usage .. ansicolors.reset); print(arguments)
end

local function main(args)
    local skipWipe = false
    for o in getopt.getopt(args, 'hn') do
        if o == 'h' then return help() end
        if o == 'n' then skipWipe = true end
    end

    print(ansicolors.cyan .. '[CHAK] issue card - stage ${stage.id}, ${spots.length} slots' .. ansicolors.reset)

    if not skipWipe then
        print('[CHAK] wipe (gen1a backdoor)')
        core.console('hf mf cwipe')
    end

    print('[CHAK] ndef format')
    core.console('hf mf ndefformat')

    print('[CHAK] write empty slots')
    for _, b in ipairs(BLOCKS) do
        core.console(('hf mf wrbl --blk %d -a -k %s -d %s'):format(b.blk, KEY, b.data))
    end

    print(ansicolors.green .. '[CHAK] done. verify with:  hf mf ndefread' .. ansicolors.reset)
end

main(args)
`
}

// ── chak_stamp.lua ───────────────────────────────────────────────
function stampScript({ stage, key, spots }) {
  const table = spots
    .map(
      (s) =>
        `    { id = ${lua(s.id)}, code = ${lua(s.code)}, blk = ${s.block} },  -- ${s.title}`,
    )
    .join('\n')

  return `--[[
  착(CHAK) 현장 리더 — ${stage.name}

  지점에 두고 돌려놓는 스크립트. 착 카드가 올라오면 그 지점 슬롯에
  「방문했음 + 시각」을 찍는다.

  ── 왜 카드를 읽지 않는가

  슬롯이 MIFARE 블록 경계에 정확히 맞춰져 있어서, 각 지점은 자기 블록
  하나만 덮어쓰면 된다. 읽고→해석하고→덧붙여 다시 쓰는 방식이었다면
  현장 리더가 실패할 수 있는 지점이 세 배로 늘어난다.

  시각은 이 PC의 로컬 시각을 쓴다. 리더 PC 시계가 틀어져 있으면 그대로
  카드에 박히므로 설치 전에 한 번 맞출 것.

  ⚠️ 화면에 찍는 글자는 전부 ASCII다. PM3 윈도우 콘솔이 한글 UTF-8을 깨뜨려서
     현장에서 읽을 수 없다. 지점 한글 이름은 아래 표의 주석에만 둔다.

  ⚠️ 긴 문자열을 등호 두 개짜리 구분자로 여는 이유: 대괄호를 겹쳐 여는 기본
     구분자는 안에 닫는 대괄호가 둘 붙어 나오면 거기서 끝나버린다. usage 문구에
     -h 같은 옵션을 대괄호로 감싸 쓰므로 반드시 등호를 끼워야 한다.
     같은 이유로 이 주석에도 닫는 대괄호를 붙여 쓰지 않는다.

  사용법:
    script run chak_stamp -s nanjung      키오스크 모드 (엔터로 종료)
    script run chak_stamp -s nanjung -1   한 장만 찍고 종료
    script run chak_stamp -l              지점 목록
--]]

local getopt = require('getopt')
local ansicolors = require('ansicolors')
local lib14a = require('read14a')

author = 'CHAK'
version = 'v1.0.0'
desc = [==[CHAK spot reader - stage ${stage.id}]==]
usage = [==[script run chak_stamp [-h] [-l] [-1] -s <spotid>]==]
arguments = [==[
    -h            this help
    -l            list spots
    -s <spotid>   which spot this reader is
    -1            stamp one card then quit (default: keep waiting)
]==]

local KEY = ${lua(key)}

local SPOTS = {
${table}
}

local function help()
    print(desc); print(ansicolors.cyan .. usage .. ansicolors.reset); print(arguments)
end

local function listSpots()
    print(ansicolors.cyan .. '[CHAK] spots - stage ${stage.id}' .. ansicolors.reset)
    for i, s in ipairs(SPOTS) do
        print(('  %d  %-10s %s  blk %d'):format(i - 1, s.id, s.code, s.blk))
    end
end

local function findSpot(id)
    for _, s in ipairs(SPOTS) do
        if s.id == id then return s end
    end
    return nil
end

--- ASCII 문자열 → PM3 -d 인자로 쓸 16진수
local function tohex(s)
    return (s:gsub('.', function(c) return string.format('%02X', c:byte()) end))
end

--- 지점 슬롯 한 블록을 통째로 덮어쓴다. 명령 한 줄이면 끝난다.
local function stamp(spot)
    local slot = spot.code .. os.date('%y%m%d%H%M%S')
    core.console(('hf mf wrbl --blk %d -a -k %s -d %s'):format(spot.blk, KEY, tohex(slot)))
    return slot
end

local function main(args)
    local spotId, once = nil, false
    for o, a in getopt.getopt(args, 'hls:1') do
        if o == 'h' then return help() end
        if o == 'l' then return listSpots() end
        if o == 's' then spotId = a end
        if o == '1' then once = true end
    end

    if not spotId then
        print(ansicolors.red .. '[CHAK] need -s <spotid>' .. ansicolors.reset)
        return listSpots()
    end

    local spot = findSpot(spotId)
    if not spot then
        print(ansicolors.red .. ('[CHAK] unknown spot: %s'):format(spotId) .. ansicolors.reset)
        return listSpots()
    end

    print(ansicolors.cyan ..
        ('[CHAK] reader ready - %s / %s  (code %s, blk %d)')
            :format('${stage.id}', spot.id, spot.code, spot.blk) ..
        ansicolors.reset)
    print(('[CHAK] present card...%s'):format(once and '' or '  (ENTER to quit)'))

    local stamped = 0
    repeat
        local card = lib14a.read(false, true)
        if card then
            local slot = stamp(spot)
            stamped = stamped + 1
            print(ansicolors.green ..
                ('[CHAK] stamped  UID %s  -> %s'):format(card.uid, slot) ..
                ansicolors.reset)

            -- 카드를 떼기 전까지 기다린다. 안 그러면 한 번 댄 걸로 계속 찍힌다.
            while lib14a.read(false, false) do
                if core.kbd_enter_pressed() then break end
            end
        end
        core.clearCommandBuffer()
    until once or core.kbd_enter_pressed()

    print(ansicolors.cyan .. ('[CHAK] bye - %d card(s)'):format(stamped) .. ansicolors.reset)
end

main(args)
`
}

// ── 메인 ─────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(HELP)
    return
  }

  const src = pathToFileURL(path.join(ROOT, 'src')).href
  const card = await import(`${src}/chak/card.ts`)
  const { STAGES } = await import(`${src}/content/index.ts`)

  const stage = STAGES.find((s) => s.id === args.stage)
  if (!stage) {
    console.error(`오류: '${args.stage}' 무대를 찾을 수 없습니다.`)
    console.error(`쓸 수 있는 무대: ${STAGES.map((s) => s.id).join(', ')}`)
    process.exitCode = 1
    return
  }

  const ids = stage.spots.map((s) => s.id)
  card.assertUniqueCodes(ids)

  const bytes = card.buildEmptyCard(ids)
  const blockNums = card.dataBlocks(card.blockCount(ids.length))
  const blocks = card.toBlocks(bytes).map(card.toHex)

  const spots = stage.spots.map((s, i) => ({
    id: s.id,
    title: s.title,
    code: card.spotCode(s.id),
    block: card.slotBlock(i, ids.length),
  }))

  const ctx = { stage, blocks, blockNums, key: card.NDEF_KEY, spots }
  const outDir = path.join(ROOT, args.out)
  await mkdir(outDir, { recursive: true })

  const initSrc = initScript(ctx)
  const stampSrc = stampScript(ctx)

  // 쓰기 전에 검사한다. 깨진 Lua를 PM3에 배포하면 원인이 한참 뒤에 드러난다.
  assertLuaBrackets('chak_init.lua', initSrc)
  assertLuaBrackets('chak_stamp.lua', stampSrc)

  await writeFile(path.join(outDir, 'chak_init.lua'), initSrc, 'utf8')
  await writeFile(path.join(outDir, 'chak_stamp.lua'), stampSrc, 'utf8')

  const readme = [
    `# 착(CHAK) PM3 도구 — ${stage.name}`,
    '',
    `지점 ${spots.length}개 · 카드 ${bytes.length}바이트 · MIFARE Classic 1K`,
    '',
    '## 설치',
    '',
    'PM3 클라이언트의 `luascripts/`에 두 파일을 복사합니다.',
    '',
    '```',
    'copy pm3\\chak_init.lua  <PM3>\\client\\luascripts\\',
    'copy pm3\\chak_stamp.lua <PM3>\\client\\luascripts\\',
    '```',
    '',
    '## 1. 착 카드 발급',
    '',
    '```',
    'script run chak_init',
    'hf mf ndefread',
    '```',
    '',
    '공장 출하 상태의 새 카드면 `-n`으로 cwipe를 건너뛸 수 있습니다.',
    '',
    '## 2. 현장 리더',
    '',
    '지점마다 이 명령을 띄워둡니다. 착이 올라오면 자동으로 찍힙니다.',
    '',
    '```',
    ...spots.map((s) => `script run chak_stamp -s ${s.id}     # ${s.title}`),
    '```',
    '',
    '## 3. 카드 내용 확인',
    '',
    '```',
    'hf mf dump',
    '```',
    '',
    '슬롯이 전부 ASCII라 덤프 출력에서 눈으로 바로 읽힙니다.',
    '',
    '## 슬롯 배치',
    '',
    '| 슬롯 | 지점 | 코드 | 블록 |',
    '|---|---|---|---|',
    ...spots.map((s, i) => `| ${i} | ${s.title} | \`${s.code}\` | ${s.block} |`),
    '',
    '헤더는 블록 ' + blockNums[0] + ', TLV 종단은 블록 ' + blockNums[blockNums.length - 1] + '입니다.',
    '',
    '## 초기 카드 이미지',
    '',
    '```',
    ...blocks.map((hex, i) => {
      const ascii = (hex.match(/../g) ?? [])
        .map((h) => {
          const c = parseInt(h, 16)
          return c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : '.'
        })
        .join('')
      return `blk ${String(blockNums[i]).padStart(2)}  ${hex}  |${ascii}|`
    }),
    '```',
    '',
    '⚠️ 지점을 추가·삭제하면 배치가 바뀝니다. 이미 발급한 카드는 옛 배치를',
    '갖고 있으므로 다시 발급해야 합니다.',
    '',
  ].join('\n')

  await writeFile(path.join(ROOT, args.out, 'README.md'), readme, 'utf8')

  console.log(`\n━━ ${stage.name} (${stage.id}) ━━`)
  console.log(`카드 ${bytes.length}바이트 · 블록 ${blockNums.join(',')}`)
  console.log('\n슬롯 배치:')
  for (const [i, s] of spots.entries()) {
    console.log(`  ${i}  ${s.code}  블록 ${String(s.block).padStart(2)}  ${s.title}`)
  }
  console.log(`\n생성: ${args.out}/chak_init.lua · ${args.out}/chak_stamp.lua · ${args.out}/README.md`)
  console.log(`\n다음: 두 .lua를 PM3의 luascripts/ 에 복사한 뒤`)
  console.log(`  script run chak_init`)
  console.log(`  script run chak_stamp -s ${spots[0].id}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
