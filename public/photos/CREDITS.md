# 사진 출처

이 폴더의 사진은 전부 **위키미디어 공용**의 자유 라이선스 저작물이다.
`scripts/fetch-photos.mjs`가 내려받아 최적화했고, 저작자·라이선스는
`src/content/photos.ts`에 함께 박혀 화면에도 노출된다.

| 파일 | 쓰임 | 라이선스 | 저작자 |
|---|---|---|---|
| `bonjeon.jpg` | 무대 표지 · 본전 | CC BY-SA 2.0 | Joongi Kim |
| `hyeonpan.jpg` | 본전 편액 | CC BY-SA 2.0 | Joongi Kim |
| `janggeom.jpg` | 이순신 장검 | CC0 | (공용) |
| `nanjung.jpg` | 난중일기 · 임진장초 | Public domain | 국가유산청 |
| `gwan.jpg` | 기념관 · 거북선 도설 | CC BY-SA 3.0 | (공용) |
| `gotaek.jpg` | 고택 구역 · 경내 정원 | CC BY 2.0 | (공용) |
| `bust.jpg` | 흉상 (보조) | KOGL 제1유형 | (공용) |
| `sugyeol.png` | 이순신 수결(서명) | Public domain | (공용) |

## 다시 받으려면

```bash
node scripts/fetch-photos.mjs
```

위키미디어 서버가 잦은 요청을 429로 막으므로, 이미 받아 둔 원본 폴더가
있으면 그쪽을 먼저 쓴다:

```bash
node scripts/fetch-photos.mjs --from ./originals
```

## 대회 제출 전 확인

- CC BY / CC BY-SA 사진은 **저작자 표시가 라이선스 조건**이다. 지금은
  각 화면(온보딩 하단, 상세 도판 아래)에 자동 노출되므로 그대로 두면 된다.
- 더 좋은 사진(직접 촬영, 현충사관리소 제공)이 생기면 같은 키의 파일로
  `public/photos/`에 덮어쓰고 `photos.ts`의 출처만 손보면 된다.
- 기념관·고택 사진은 위키미디어에 마땅한 게 없어 각각 거북선 도설·경내
  정원으로 대신했다. 현장 촬영본이 있으면 교체를 권한다.
