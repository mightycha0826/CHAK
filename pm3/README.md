# 착(CHAK) PM3 도구 — 현충사

지점 5개 · 카드 97바이트 · MIFARE Classic 1K

## 설치

PM3 클라이언트의 `luascripts/`에 두 파일을 복사합니다.

```
copy pm3\chak_init.lua  <PM3>\client\luascripts\
copy pm3\chak_stamp.lua <PM3>\client\luascripts\
```

## 1. 착 카드 발급

```
script run chak_init
hf mf ndefread
```

공장 출하 상태의 새 카드면 `-n`으로 cwipe를 건너뛸 수 있습니다.

## 2. 현장 리더

지점마다 이 명령을 띄워둡니다. 착이 올라오면 자동으로 찍힙니다.

```
script run chak_stamp -s gwan     # 충무공이순신기념관
script run chak_stamp -s nanjung     # 난중일기
script run chak_stamp -s janggeom     # 이순신 장검
script run chak_stamp -s gotaek     # 이충무공 고택과 활터
script run chak_stamp -s bonjeon     # 본전
```

## 3. 카드 내용 확인

```
hf mf dump
```

슬롯이 전부 ASCII라 덤프 출력에서 눈으로 바로 읽힙니다.

## 슬롯 배치

| 슬롯 | 지점 | 코드 | 블록 |
|---|---|---|---|
| 0 | 충무공이순신기념관 | `GWAN` | 5 |
| 1 | 난중일기 | `NANJ` | 6 |
| 2 | 이순신 장검 | `JANG` | 8 |
| 3 | 이충무공 고택과 활터 | `GOTA` | 9 |
| 4 | 본전 | `BONJ` | 10 |

헤더는 블록 4, TLV 종단은 블록 12입니다.

## 초기 카드 이미지

```
blk  4  035ED1015A5402656E4348414B313A3A  |.^..ZT.enCHAK1::|
blk  5  2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E  |................|
blk  6  2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E  |................|
blk  8  2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E  |................|
blk  9  2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E  |................|
blk 10  2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E2E  |................|
blk 12  FE000000000000000000000000000000  |................|
```

⚠️ 지점을 추가·삭제하면 배치가 바뀝니다. 이미 발급한 카드는 옛 배치를
갖고 있으므로 다시 발급해야 합니다.
