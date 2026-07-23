import type { Stage } from '../types.ts'

/**
 * 현충사 (충남 아산) — 메인 무대.
 *
 * 이순신을 기리는 사적지. 다섯 지점을 착으로 돌며 「답사 수첩」을 채운다.
 *
 * **사실 확인 원칙**: `facts`와 `meta`에 적힌 지정 등급·연도·명문은 공개
 * 자료로 확인된 것만 적었다. 2021년 문화재 지정번호 제도가 폐지되어
 * 번호는 표기하지 않는다. `story`·`excerpt`는 창작 카피다.
 *
 * ⚠️ 대회 제출 전 현충사관리소 공식 자료로 한 번 더 대조할 것.
 *
 * 사진은 전부 위키미디어 공용의 자유 라이선스 저작물이며, 저작자 표기는
 * `src/content/photos.ts`에 기록되어 화면에 함께 노출된다.
 */
export const hyeonchungsa: Stage = {
  id: 'hcs',
  name: '현충사',
  subtitle: '충무공의 자취를 따라 걷다',
  region: '충남 아산',
  intro: '이순신이 살고, 쏘고, 적어 내려간 자리. 다섯 곳을 돌며 수첩을 채웁니다.',
  certificateTitle: '현충사 답사기',
  credit: '현충사관리소 공개 자료 기반 큐레이션',
  // 계단을 올라 본전에 닿는 장면. 이 무대의 첫인상이자 마지막 장면이다.
  cover: { photo: 'bonjeon', position: '50% 42%' },
  map: {
    terrain: 'shrine',
    // 도식 관내도 — 아래(정문)에서 위(본전)로 오르는 실제 동선을 반영
    points: {
      gwan: { x: 21, y: 84 },
      nanjung: { x: 35, y: 62 },
      janggeom: { x: 60, y: 72 },
      gotaek: { x: 79, y: 40 },
      bonjeon: { x: 47, y: 14 },
    },
    zones: [
      { label: '기념관 구역', x: 27, y: 88 },
      { label: '고택 구역', x: 78, y: 56 },
      { label: '사당 구역', x: 46, y: 9 },
    ],
    // ⚠️ 근사 좌표 — 현장 답사 후 반드시 미세조정할 것
    geo: {
      center: { lat: 36.7936, lng: 126.9986 },
      level: 4,
      points: {
        gwan: { lat: 36.7925, lng: 126.9979 },
        nanjung: { lat: 36.7929, lng: 126.9981 },
        janggeom: { lat: 36.793, lng: 126.9987 },
        gotaek: { lat: 36.7938, lng: 127.0002 },
        bonjeon: { lat: 36.795, lng: 126.9989 },
      },
    },
  },
  spots: [
    {
      id: 'gwan',
      kind: 'place',
      title: '충무공이순신기념관',
      subtitle: '답사의 첫 장을 여는 곳',
      meta: '전시관 · 현충사 경내',
      zone: '기념관 구역',
      motif: '始',
      photo: 'gwan',
      photoPosition: '50% 45%',
      facts: [
        { label: '위치', value: '현충사 경내' },
        { label: '전시', value: '이충무공 유물, 임진왜란 해전 자료' },
        { label: '사진', value: '『이충무공전서』 권수 거북선 도설(圖說)' },
      ],
      story:
        '현충사 답사는 여기서 시작합니다. 거북선의 구조부터 한산도의 물길까지, 흩어져 있던 이야기가 한 줄기로 모이는 자리입니다. 이 문을 나서면 보이는 모든 것이 조금 다르게 보일 겁니다.',
      excerpt: '첫 장을 열다.',
      source: '사진: 『이충무공전서』(1795, 정조 19년 왕명으로 간행)',
    },
    {
      id: 'nanjung',
      kind: 'work',
      title: '난중일기',
      subtitle: '전장에서 매일 밤 적어 내려간 문장',
      meta: '국보 · 유네스코 세계기록유산',
      zone: '기념관 구역',
      motif: '記',
      photo: 'nanjung',
      photoPosition: '50% 50%',
      facts: [
        { label: '지정', value: '국보 「이순신 난중일기 및 서간첩 임진장초」' },
        { label: '등재', value: '유네스코 세계기록유산 (2013)' },
        { label: '기간', value: '1592년 임진왜란 발발부터 1598년까지' },
        { label: '소장', value: '현충사관리소' },
      ],
      story:
        '전쟁 한복판에서 7년을 하루도 거르다시피 하며 써 내려간 일기입니다. 승전의 기록만 있는 것이 아니라 앓는 몸과 잠 못 드는 밤, 어머니를 향한 마음까지 그대로 적혀 있습니다. 영웅이 아니라 사람이 남긴 글이라서 오늘까지 읽힙니다.',
      excerpt: '맑음. 오늘도 한 줄을 남긴다.',
      source: '사진: 임진장초(壬辰狀草) — 국보 지정 일괄에 포함된 장계 초본',
    },
    {
      id: 'janggeom',
      kind: 'work',
      title: '이순신 장검',
      subtitle: '두 자루에 새긴 맹세',
      meta: '보물 · 명문 새김',
      zone: '기념관 구역',
      motif: '誓',
      photo: 'janggeom',
      photoPosition: '50% 62%',
      facts: [
        { label: '지정', value: '보물' },
        { label: '수량', value: '두 자루 한 벌' },
        { label: '명문', value: '三尺誓天 山河動色 / 一揮掃蕩 血染山河' },
        { label: '소장', value: '현충사관리소' },
      ],
      story:
        '한 자루에 「석 자 칼로 하늘에 맹세하니 산하가 빛을 잃는다」, 다른 한 자루에 「한 번 휘둘러 쓸어버리니 피가 산하를 물들인다」는 글이 새겨져 있습니다. 실제로 휘두르기엔 너무 긴 칼입니다. 베기 위한 것이 아니라, 매일 스스로에게 되새기기 위한 칼이었습니다.',
      excerpt: '三尺誓天 — 석 자 칼로 하늘에 맹세하다.',
    },
    {
      id: 'gotaek',
      kind: 'place',
      title: '이충무공 고택과 활터',
      subtitle: '장군이기 이전에, 한 사람이 살던 집',
      meta: '고택 · 궁도장 · 은행나무',
      zone: '고택 구역',
      motif: '家',
      photo: 'gotaek',
      photoPosition: '50% 55%',
      facts: [
        { label: '성격', value: '이순신이 혼인한 뒤 살던 집. 이후 종가가 관리' },
        { label: '주변', value: '활을 쏘던 터, 수령 오랜 은행나무' },
        { label: '위치', value: '현충사 경내 동편' },
      ],
      story:
        '혼인한 뒤 이순신이 살았고, 이후 종가가 대대로 지켜온 집입니다. 마당을 나서면 활을 쏘던 터가 이어지고, 그 곁에 수백 년을 함께 선 은행나무가 있습니다. 시위를 당기던 소리가 사라진 자리에 나뭇잎 스치는 소리만 남았습니다.',
      excerpt: '활 시위 소리 그친 자리, 은행잎이 진다.',
      source: '사진: 현충사 경내 정원',
    },
    {
      id: 'bonjeon',
      kind: 'place',
      title: '본전',
      subtitle: '답사의 마지막 계단 위',
      meta: '사당 · 영정 봉안 · 사적 현충사',
      zone: '사당 구역',
      motif: '忠',
      photo: 'hyeonpan',
      photoPosition: '50% 42%',
      facts: [
        { label: '사액', value: '1707년(숙종 33) 「顯忠祠」 사액' },
        { label: '봉안', value: '충무공 이순신 영정' },
        { label: '편액', value: '宣賜 丁亥四月日 — 사액 당시의 기록' },
        { label: '지정', value: '사적 「아산 이충무공 유허」' },
      ],
      story:
        '긴 계단을 올라야 닿는 사당입니다. 오르는 동안 숨이 차고, 다 오르면 아래로 걸어온 길이 한눈에 들어옵니다. 그 앞에서는 대개 아무 말도 하지 않게 됩니다.',
      excerpt: '계단 끝에서, 걸어온 길을 돌아보다.',
      source: '사진: 본전 편액과 단청',
    },
  ],
}
