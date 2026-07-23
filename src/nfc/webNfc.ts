import { MAGIC, SLOT_SIZE, encodeSlot, parseCard, type CardData } from '../chak/card.ts'

/**
 * Web NFC(NDEFReader) 래퍼 — 착 카드를 읽고 쓴다.
 *
 * 착은 관람객이 들고 다니는 상품이고, 방문 기록은 카드 안에 쌓인다. 폰은
 * 그걸 읽어서 앱에 등록하는 단말이다. 즉 여기서 읽는 값이 진실이고
 * localStorage는 카드를 안 댔을 때 보여줄 캐시일 뿐이다.
 *
 * 안드로이드 Chrome + HTTPS(또는 localhost)에서만 동작한다. 그 밖의 환경
 * (데스크톱·iOS·평문 HTTP)에서는 'unsupported'를 돌려주고 화면은 폴백으로 간다.
 *
 * ⚠️ MIFARE Classic은 NFC Forum 표준 태그가 아니다. 안드로이드는 NXP 계열
 *    NFC 컨트롤러를 단 기기에서만 읽고, 아이폰은 아예 못 읽는다. 착 카드를
 *    MIFARE Classic으로 가는 한 이 제약은 앱 코드로 우회할 수 없다.
 */

interface NDEFRecordLike {
  recordType?: string
  encoding?: string
  lang?: string
  data?: BufferSource
}

interface NDEFReaderLike {
  scan(options?: { signal?: AbortSignal }): Promise<void>
  write(message: unknown, options?: { signal?: AbortSignal }): Promise<void>
  onreading: ((event: NDEFReadingEventLike) => void) | null
  onreadingerror: ((event: unknown) => void) | null
}

interface NDEFReadingEventLike {
  serialNumber?: string
  message?: { records?: NDEFRecordLike[] }
}

export type NfcSupport = 'ready' | 'unsupported'

/** 카드 한 장을 읽은 결과. */
export interface CardRead {
  card: CardData
  /** 카드 UID. 같은 착인지 구분하는 데 쓴다. */
  serial: string | null
}

function reader(): NDEFReaderLike | null {
  if (typeof window === 'undefined') return null
  const Ctor = (window as unknown as { NDEFReader?: new () => NDEFReaderLike }).NDEFReader
  if (!Ctor) return null
  try {
    return new Ctor()
  } catch {
    return null
  }
}

export function nfcSupport(): NfcSupport {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('NDEFReader' in window)) return 'unsupported'
  // 보안 컨텍스트가 아니면 scan()이 즉시 거부된다. 미리 걸러 폴백을 띄운다.
  if (!window.isSecureContext) return 'unsupported'
  return 'ready'
}

/** NDEF 레코드들에서 착 카드 본문을 찾아 해석한다. 착이 아니면 null. */
function cardFromEvent(event: NDEFReadingEventLike): CardData | null {
  for (const record of event.message?.records ?? []) {
    if (!record.data) continue
    let text = ''
    try {
      text = new TextDecoder(record.encoding ?? 'utf-8').decode(record.data)
    } catch {
      continue
    }
    const card = parseCard(text)
    if (card) return card
  }
  return null
}

/**
 * 착 카드를 계속 대기하다가 읽을 때마다 콜백. 중단은 signal로.
 * 지원하지 않는 환경이면 아무것도 하지 않고 started=false를 돌려준다.
 */
export function watchCards(
  onCard: (read: CardRead) => void,
  onForeign: () => void,
  signal: AbortSignal,
): { started: Promise<boolean> } {
  const r = reader()
  if (!r) return { started: Promise.resolve(false) }

  r.onreading = (event) => {
    if (signal.aborted) return
    const card = cardFromEvent(event)
    if (card) onCard({ card, serial: event.serialNumber ?? null })
    else onForeign()
  }
  r.onreadingerror = () => {
    /* 읽기 실패는 무시하고 다음 카드를 기다린다 */
  }

  const started = r
    .scan({ signal })
    .then(() => true)
    .catch(() => false)

  return { started }
}

/**
 * 착 한 장만 읽고 끝낸다. 폰을 현장 리더로 쓸 때 「읽고 → 고쳐서 → 다시 쓰기」의
 * 첫 단계다. 시간 안에 못 읽으면 null.
 */
export function readCardOnce(timeoutMs = 20000): Promise<CardRead | null> {
  const controller = new AbortController()
  return new Promise<CardRead | null>((resolve) => {
    let settled = false
    const finish = (value: CardRead | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      controller.abort()
      resolve(value)
    }
    const timer = setTimeout(() => finish(null), timeoutMs)

    const { started } = watchCards(
      (read) => finish(read),
      () => {
        /* 착이 아닌 태그는 무시하고 계속 기다린다 */
      },
      controller.signal,
    )
    started.then((ok) => {
      if (!ok) finish(null)
    })
  })
}

/** 착 카드 본문 문자열을 만든다. PM3가 굽는 바이트와 같은 규칙이어야 한다. */
function cardText(slots: string[]): string {
  return MAGIC + slots.join('')
}

/**
 * 카드에 NDEF 텍스트 레코드를 통째로 다시 쓴다.
 *
 * Web NFC는 블록 단위 접근이 없어 메시지 전체를 갈아끼우는 방식뿐이다.
 * 다행히 Chrome이 만드는 바이트 배치(상태바이트 0x02 + 'en' + 본문)가
 * card.ts의 설계와 동일하므로, **PM3로 구운 카드와 폰으로 쓴 카드는 서로
 * 완전히 호환된다.**
 */
async function writeCardText(text: string, timeoutMs: number): Promise<boolean> {
  const r = reader()
  if (!r) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await r.write(
      { records: [{ recordType: 'text', lang: 'en', data: text }] },
      { signal: controller.signal },
    )
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
    controller.abort()
  }
}

/** 빈 착 카드를 폰으로 발급한다. PM3가 없을 때의 백업 경로. */
export function issueCard(spotCount: number, timeoutMs = 20000): Promise<boolean> {
  const empty = '.'.repeat(SLOT_SIZE)
  return writeCardText(cardText(Array.from({ length: spotCount }, () => empty)), timeoutMs)
}

/**
 * 폰을 현장 리더로 쓴다 — 지정한 슬롯에 도장을 찍는다.
 *
 * PM3를 지점마다 두기 어려울 때의 대안이자, 발표 시연에서 지점을 옮겨다니는
 * 걸 흉내 낼 때 쓴다. 카드를 읽어서 해당 슬롯만 갈아끼우고 전체를 다시 쓴다.
 */
export async function stampCard(
  current: CardData,
  index: number,
  code: string,
  at: Date = new Date(),
  timeoutMs = 20000,
): Promise<boolean> {
  const empty = '.'.repeat(SLOT_SIZE)
  const slots = current.slots.map((v) => (v ? encodeSlot(v.code, v.at) : empty))
  if (index < 0 || index >= slots.length) return false
  slots[index] = encodeSlot(code, at)
  return writeCardText(cardText(slots), timeoutMs)
}
