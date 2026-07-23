/**
 * NDEF URI 레코드 인코딩 (의존성 없음).
 *
 * 앱은 이 파일을 쓰지 않는다 — Web NFC의 `NDEFReader.write()`는 고수준 API라
 * 바이트를 직접 만들 필요가 없기 때문이다. 이건 오직 proxmark3로 태그를
 * 구울 때, 태그 메모리에 그대로 밀어 넣을 바이트를 만들기 위한 것이다.
 */

/** NDEF URI 접두사 축약 코드. 긴 것부터 검사해야 한다. */
const URI_PREFIXES = [
  [0x01, 'http://www.'],
  [0x02, 'https://www.'],
  [0x03, 'http://'],
  [0x04, 'https://'],
]

/** URI 하나를 담은 NDEF 메시지(단일 레코드)를 바이트 배열로. */
export function encodeUriMessage(url) {
  let code = 0x00
  let rest = url
  for (const [c, prefix] of URI_PREFIXES) {
    if (url.startsWith(prefix)) {
      code = c
      rest = url.slice(prefix.length)
      break
    }
  }

  const payload = [code, ...new TextEncoder().encode(rest)]
  if (payload.length > 255) {
    throw new Error(`URI가 너무 깁니다 (${payload.length}바이트). 도메인을 줄이세요.`)
  }

  // MB=1 ME=1 CF=0 SR=1 IL=0 TNF=001(well-known) → 0xD1
  return [0xd1, 0x01, payload.length, 0x55, ...payload]
}

/** 태그 메모리에 올릴 TLV 래핑: 03 <len> <ndef> FE */
export function wrapTlv(message) {
  const head =
    message.length < 0xff
      ? [0x03, message.length]
      : [0x03, 0xff, (message.length >> 8) & 0xff, message.length & 0xff]
  return [...head, ...message, 0xfe]
}

/** 스팟 URL 하나를 태그에 쓸 최종 바이트로. */
export function tagBytesFor(url) {
  return wrapTlv(encodeUriMessage(url))
}

export function toHex(bytes) {
  return bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

/** 지정한 크기로 잘라 채우고, 마지막 조각은 0x00으로 패딩. */
export function chunk(bytes, size) {
  const out = []
  for (let i = 0; i < bytes.length; i += size) {
    const part = bytes.slice(i, i + size)
    while (part.length < size) part.push(0x00)
    out.push(part)
  }
  return out
}
