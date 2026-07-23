/**
 * 착(CHAK) 카드 데이터 포맷 — 폰과 proxmark3가 공유하는 단 하나의 규칙.
 *
 * 착은 관람객이 사서 들고 다니는 상품이고, 카드 자체가 수첩이다. 지점마다
 * 놓인 리더가 카드에 「여기 왔다」를 쓰고, 나중에 폰에 대면 그 누적분이
 * 앱으로 등록된다. 즉 진실의 원천은 폰이 아니라 카드다.
 *
 * ── 왜 NDEF 텍스트 레코드인가
 *
 * 폰이 Web NFC(`NDEFReader`)로 읽어야 하는데, Web NFC는 NDEF만 볼 수 있다.
 * 원시 블록 접근이 아예 노출되지 않으므로 카드 내용이 NDEF가 아니면 브라우저는
 * 아무것도 못 읽는다. 그래서 방문 기록도 NDEF 안에 담는다.
 *
 * ── 왜 슬롯을 블록 경계에 맞추는가
 *
 * 각 지점 슬롯이 MIFARE 블록 하나와 정확히 겹치도록 헤더에 7바이트를 채워
 * 넣었다. 덕분에 지점 리더는 **카드를 읽지 않고 자기 블록만 덮어쓰면 된다** —
 * 명령 한 줄이다. 읽고·해석하고·덧붙여 다시 쓰는 방식이었다면 현장 리더가
 * 실패할 수 있는 지점이 세 배로 늘어난다.
 *
 * ── 메모리 배치 (지점 N개)
 *
 *   오프셋  크기   내용                        MIFARE 블록
 *   ------  ----   -------------------------   -----------
 *        0     2   TLV 헤더 `03 <len>`         4
 *        2     4   NDEF 헤더 `D1 01 <len> 54`  4
 *        6     3   텍스트 레코드 `02 65 6E`     4
 *        9     7   매직 `CHAK1::` (정렬용)      4
 *       16    16   슬롯 0                      5
 *       32    16   슬롯 1                      6
 *       48    16   슬롯 2                      8   ← 7은 섹터 트레일러
 *       64    16   슬롯 3                      9
 *       80    16   슬롯 4                      10
 *       96     1   TLV 종단 `FE`               12  ← 11은 섹터 트레일러
 *
 * 슬롯 하나(16바이트)는 전부 ASCII다: `<지점코드 4><YYMMDDhhmmss 12>`.
 * 미방문 슬롯은 `.` 16개. ASCII로 둔 이유는 `hf mf dump` 출력에서 눈으로
 * 바로 읽히기 때문이다 — 현장에서 디버깅할 때 이게 결정적이다.
 *
 * ⚠️ 카드에는 도메인이 들어가지 않는다. 등록은 앱을 켠 채로 대는 인앱 스캔이
 *    담당하므로 URL이 필요 없고, 덕분에 **배포 도메인이 바뀌어도 이미 발급한
 *    카드는 그대로 유효하다.**
 */

/** 포맷 판별용 매직. 7바이트인 건 헤더를 블록 하나(16B)로 맞추기 위해서다. */
export const MAGIC = 'CHAK1::'

export const BLOCK_SIZE = 16
export const SLOT_SIZE = 16
/** 슬롯 앞부분 — 지점 코드 */
export const CODE_SIZE = 4
/** 슬롯 뒷부분 — `YYMMDDhhmmss` */
export const STAMP_SIZE = 12

/** 아직 안 찍힌 슬롯. */
export const EMPTY_SLOT = '.'.repeat(SLOT_SIZE)

/** NDEF 포맷된 MIFARE Classic의 데이터 섹터 키 A. `hf mf ndefformat`이 넣는 값. */
export const NDEF_KEY = 'D3F7D3F7D3F7'

/** 헤더(TLV+NDEF+텍스트+매직)가 차지하는 바이트. 정확히 블록 하나. */
const HEADER_SIZE = 16

/**
 * NDEF 데이터가 실제로 들어가는 MIFARE Classic 블록 번호를 순서대로.
 *
 * 섹터당 4블록인데 마지막 하나는 키·접근비트가 든 트레일러라 못 쓴다.
 * 섹터 0은 MAD(제조사·디렉터리)라 통째로 건너뛴다.
 */
export function dataBlocks(count: number): number[] {
  const blocks: number[] = []
  for (let sector = 1; blocks.length < count && sector < 16; sector++) {
    for (let b = 0; b < 3 && blocks.length < count; b++) {
      blocks.push(sector * 4 + b)
    }
  }
  if (blocks.length < count) {
    throw new Error(`MIFARE Classic 1K 용량 초과 — 블록 ${count}개가 필요합니다.`)
  }
  return blocks
}

/** 지점 N개짜리 카드가 쓰는 총 블록 수 (헤더 1 + 슬롯 N + 종단 1). */
export function blockCount(spotCount: number): number {
  return spotCount + 2
}

/** i번째 지점 슬롯이 놓이는 블록 번호. 지점 리더가 덮어쓸 바로 그 블록. */
export function slotBlock(index: number, spotCount: number): number {
  if (index < 0 || index >= spotCount) {
    throw new Error(`슬롯 번호가 범위를 벗어났습니다: ${index}`)
  }
  // 0번 블록은 헤더가 쓰므로 +1
  return dataBlocks(blockCount(spotCount))[index + 1]
}

/**
 * 지점 id에서 슬롯에 새길 4글자 코드.
 * `hf mf dump`에서 사람이 읽을 수 있어야 하므로 대문자 ASCII로 고정한다.
 */
export function spotCode(spotId: string): string {
  const ascii = spotId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (!ascii) throw new Error(`지점 id에서 코드를 만들 수 없습니다: ${spotId}`)
  return ascii.slice(0, CODE_SIZE).padEnd(CODE_SIZE, '_')
}

/**
 * 지점 코드가 겹치는지 검사. 겹치면 서로 다른 지점이 같은 도장으로 보인다.
 * 콘텐츠를 고칠 때 조용히 깨지지 않도록 생성 단계에서 터뜨린다.
 */
export function assertUniqueCodes(spotIds: string[]): void {
  const seen = new Map<string, string>()
  for (const id of spotIds) {
    const code = spotCode(id)
    const prev = seen.get(code)
    if (prev) {
      throw new Error(
        `지점 코드가 충돌합니다: '${prev}'와 '${id}'가 모두 '${code}'. ` +
          `둘 중 하나의 id 앞 ${CODE_SIZE}글자를 다르게 바꾸세요.`,
      )
    }
    seen.set(code, id)
  }
}

/** `YYMMDDhhmmss`. 현장 리더의 로컬 시각을 그대로 쓴다. */
export function formatStamp(at: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return (
    p(at.getFullYear() % 100) +
    p(at.getMonth() + 1) +
    p(at.getDate()) +
    p(at.getHours()) +
    p(at.getMinutes()) +
    p(at.getSeconds())
  )
}

/** `YYMMDDhhmmss` → Date. 형식이 깨졌으면 null. */
export function parseStamp(raw: string): Date | null {
  if (!/^\d{12}$/.test(raw)) return null
  const n = (i: number) => Number(raw.slice(i, i + 2))
  const at = new Date(2000 + n(0), n(2) - 1, n(4), n(6), n(8), n(10))
  return Number.isNaN(at.getTime()) ? null : at
}

/** 슬롯 하나(16글자 ASCII)를 만든다. */
export function encodeSlot(code: string, at: Date): string {
  if (code.length !== CODE_SIZE) {
    throw new Error(`지점 코드는 ${CODE_SIZE}글자여야 합니다: '${code}'`)
  }
  const slot = code + formatStamp(at)
  if (slot.length !== SLOT_SIZE) {
    throw new Error(`슬롯 길이가 어긋났습니다: ${slot.length}`)
  }
  return slot
}

export interface CardVisit {
  /** 슬롯 번호 = 무대의 spots 배열 인덱스 */
  index: number
  /** 슬롯에 새겨진 4글자 코드 */
  code: string
  at: Date
}

export interface CardData {
  /** 슬롯 순서대로. 미방문은 null. */
  slots: (CardVisit | null)[]
}

/**
 * 카드에서 읽은 텍스트 레코드를 해석한다.
 *
 * 형식이 아니면 null — 착 카드가 아닌 다른 NFC를 댄 경우다. 예외를 던지지
 * 않는 이유는 스캔 화면이 「이 앱의 카드가 아니에요」로 조용히 넘어가야 하기
 * 때문이다.
 */
export function parseCard(text: string): CardData | null {
  if (!text.startsWith(MAGIC)) return null

  const body = text.slice(MAGIC.length)
  const slots: (CardVisit | null)[] = []

  for (let i = 0; i * SLOT_SIZE < body.length; i++) {
    const raw = body.slice(i * SLOT_SIZE, (i + 1) * SLOT_SIZE)
    if (raw.length < SLOT_SIZE) break

    const code = raw.slice(0, CODE_SIZE)
    const at = parseStamp(raw.slice(CODE_SIZE))
    // 미방문(`.`으로 채워짐)이거나 시각이 깨졌으면 빈 슬롯으로 본다
    slots.push(at && !code.startsWith('.') ? { index: i, code, at } : null)
  }

  return { slots }
}

/** 빈 착 카드의 NDEF 영역 전체 바이트. 발급(초기화) 때 한 번 쓴다. */
export function buildEmptyCard(spotIds: string[]): number[] {
  assertUniqueCodes(spotIds)

  const text = MAGIC + EMPTY_SLOT.repeat(spotIds.length)
  const textBytes = [...new TextEncoder().encode(text)]

  // 텍스트 레코드 페이로드: 상태바이트(UTF-8, 언어코드 2글자) + "en" + 본문
  const payload = [0x02, 0x65, 0x6e, ...textBytes]
  if (payload.length > 0xff) {
    throw new Error(`지점이 너무 많습니다 (페이로드 ${payload.length}바이트).`)
  }

  // MB=1 ME=1 CF=0 SR=1 IL=0 TNF=001(well-known) → 0xD1, 타입 'T'(0x54)
  const record = [0xd1, 0x01, payload.length, 0x54, ...payload]
  const bytes = [0x03, record.length, ...record, 0xfe]

  // 헤더가 정확히 블록 하나여야 슬롯이 블록 경계에 떨어진다. 여기가 어긋나면
  // 지점 리더의 블록 계산이 통째로 틀어지므로 조용히 넘기지 않는다.
  const headerLen = 2 + 4 + 3 + MAGIC.length
  if (headerLen !== HEADER_SIZE) {
    throw new Error(`헤더가 ${headerLen}바이트 — 매직을 ${HEADER_SIZE - 9}글자로 맞추세요.`)
  }

  return bytes
}

/** 바이트 배열을 BLOCK_SIZE씩 잘라 0x00으로 패딩. */
export function toBlocks(bytes: number[]): number[][] {
  const out: number[][] = []
  for (let i = 0; i < bytes.length; i += BLOCK_SIZE) {
    const part = bytes.slice(i, i + BLOCK_SIZE)
    while (part.length < BLOCK_SIZE) part.push(0x00)
    out.push(part)
  }
  return out
}

export function toHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

/** ASCII 문자열을 그대로 16진수로. 슬롯을 PM3 `-d` 인자로 넘길 때 쓴다. */
export function asciiHex(s: string): string {
  return toHex([...new TextEncoder().encode(s)])
}
