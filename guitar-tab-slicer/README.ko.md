# Guitar Tab Slicer

[English](README.md) | [한국어](README.ko.md)

기타 악보를 영상용 PNG 오버레이로 잘라 ZIP으로 내려받는 웹 앱입니다. Guitar Pro / MusicXML / AlphaTex를 올리면 선택한 마디 범위를 N마디 단위로 나눠 렌더링합니다.

![Guitar Tab Slicer 화면](docs/screenshot.png)

## 주요 기능

- `.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`, `.gpif`, `.musicxml`, `.xml`, `.alphatex`, `.txt` 업로드
- AlphaTex 직접 붙여넣기
- 이미지당 마디 수, 시작/끝 마디, 트랙 선택
- Tab only / Score + Tab / Score only / Tab mixed 표기
- 글자·선 색상, 배경색, 배경 불투명도, 완전 투명 PNG
- 이미지 폭, 배율, 여백, 마디 간격 조절
- 악보 헤더(제목, 아티스트) 숨기기
- EN / 한국어 / 日本語
- `manifest.json` 포함 ZIP 다운로드

## 사용 방법

1. **Upload Score** — 악보 파일을 올리거나 AlphaTex를 붙여넣습니다.
2. **Bars & Tracks** — 이미지당 마디 수, 표기 방식, 마디 범위, 트랙을 고릅니다.
3. **Image Style** — 전경/배경 색과 투명도를 맞춥니다. 미리보기로 확인합니다.
4. **Render Size** — 폭, 배율, 여백, 마디 간격을 조절합니다.
5. **Export ZIP** — PNG 슬라이스가 들어 있는 ZIP을 받습니다.

## 사용 예시

내보낸 PNG는 기타 튜토리얼 영상 위에 탭 오버레이로 얹는 용도입니다.

![기타 영상 위 탭 오버레이](docs/screenshot2.png)

## 실행

Node.js 20 이상을 권장합니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다. 개발 모드에서는 Vite가 `/api` 요청을 Express 서버로 프록시합니다.

## 프로덕션 실행

```bash
npm install
npm run build
npm start
```

기본 포트는 `3001`입니다. 필요하면 환경변수로 바꿀 수 있습니다.

```bash
PORT=8080 npm start
```

## Docker

```bash
docker build -t guitar-tab-slicer .
docker run --rm -p 3001:3001 guitar-tab-slicer
```

그 다음 `http://localhost:3001`로 접속합니다.

## 구조

```text
server/index.mjs   Express API, alphaTab/alphaSkia 렌더링, ZIP 생성
src/App.jsx        웹 UI
src/styles.css     스타일
vite.config.js     개발 서버 프록시와 빌드 설정
```

## API

### `POST /api/score`

멀티파트 필드 `score`에 악보 파일을 보내면 악보 메타데이터를 반환합니다.

### `POST /api/render`

멀티파트 필드 `score`와 렌더 옵션을 보내면 ZIP 파일을 반환합니다.

옵션 예시:

```text
barsPerImage=2
startBar=1
endBar=16
tracks=[0]
staveProfile=tab
foregroundColor=#ffffff
backgroundColor=#000000
backgroundOpacity=0.55
transparent=false
width=1400
scale=1.4
paddingX=28
paddingY=14
stretchForce=0.9
hideScoreInfo=true
```

## 참고/주의

- 렌더링은 서버에서 처리됩니다. 실제 서비스로 배포할 때는 업로드 파일 보관 금지, 요청 크기 제한, rate limit, 작업 큐를 붙이는 것을 권장합니다.
- 큰 GP 파일이나 다중 트랙 악보는 렌더링 시간이 길 수 있습니다.
- AlphaSkia는 운영체제별 네이티브 패키지를 사용합니다. 이 프로젝트는 Linux/macOS/Windows 패키지를 optional dependency로 넣어두었습니다.
- 영상 편집에서 PNG가 너무 작거나 흐리면 `이미지 폭`과 `확대 배율`을 올려 출력하세요.
