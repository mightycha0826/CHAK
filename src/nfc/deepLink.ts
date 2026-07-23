import type { TagRef } from './urls.ts'

/**
 * 콜드 탭 처리.
 *
 * 앱을 켜지 않은 상태에서 실물 태그를 대면 안드로이드가 NDEF URI를 읽어
 * 브라우저를 연다. 즉 태그 한 번 = 새 페이지 로드다. 그래서 진행 상태는
 * localStorage에 있어야 하고(state/progress), 쿼리는 한 번만 소비돼야 한다.
 *
 * ⚠️ 안드로이드는 화면이 꺼졌거나 잠금 상태면 NFC 자체를 끈다. 즉 「잠긴 폰에
 * 대면 열린다」는 성립하지 않는다 — 화면이 켜지고 잠금이 풀려 있어야 하며,
 * 대신 앱이나 브라우저를 미리 띄워둘 필요는 없다.
 *
 * 소비 직후 replaceState로 쿼리를 지운다. 안 그러면 사용자가 새로고침하거나
 * 뒤로 갔다 올 때마다 같은 도장이 다시 찍히는 연출이 반복된다.
 */

/** 최초 로드 시점의 URL에서 무대/스팟을 읽는다. 부작용 없음. */
export function readLaunchRef(): TagRef {
  if (typeof window === 'undefined') return { stageId: null, spotId: null }
  const params = new URLSearchParams(window.location.search)
  return {
    stageId: params.get('m'),
    spotId: params.get('spot'),
  }
}

/** 주소창에서 태그 관련 쿼리만 걷어낸다. 다른 쿼리는 보존. */
export function clearTagQuery(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has('m') && !url.searchParams.has('spot')) return
  url.searchParams.delete('m')
  url.searchParams.delete('spot')
  const search = url.searchParams.toString()
  window.history.replaceState(
    null,
    '',
    url.pathname + (search ? `?${search}` : '') + url.hash,
  )
}
