const KEY = 'chak.stage'

/** 마지막으로 보던 무대. 태그 URL의 `?m=`이 있으면 그쪽이 우선한다. */
export function loadStageId(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveStageId(id: string) {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* noop */
  }
}
