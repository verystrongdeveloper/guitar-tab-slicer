# Guitar Tab Slicer

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

Guitar Tab Slicer는 Guitar Pro/AlphaTex 악보를 영상 편집용 PNG 오버레이로 잘라내는 데스크톱 앱입니다. 악보 파일이나 AlphaTex 텍스트를 넣고, 원하는 마디 범위와 스타일을 선택하면 마디 단위 PNG 파일과 `manifest.json`이 포함된 ZIP 파일을 생성합니다.

## 주요 기능

- `.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`, `.gpif`, `.musicxml`, `.xml`, `.alphatex`, `.at`, `.txt` 악보 입력
- AlphaTex 직접 붙여넣기
- 시작 마디, 끝 마디, 이미지당 마디 수 설정
- 악보에 포함된 트랙 분석 및 선택
- Tab only, Score + Tab, Score only, Tab mixed 표기 방식 선택
- PNG 너비, 배율, 좌우/상하 여백, 마디 간격 조정
- 글자색, 배경색, 배경 불투명도 설정
- 완전 투명 배경 PNG 출력
- 제목/아티스트 등 악보 헤더 숨김 옵션
- PNG 조각과 렌더링 정보를 담은 `manifest.json` ZIP 저장
- Windows 휴대용 실행 파일 패키징

## 다운로드

릴리스 페이지에서 Windows용 파일을 받을 수 있습니다.

- `Guitar Tab Slicer 0.1.0.exe`: 설치 없이 실행 가능한 Windows 앱
- `Guitar Tab Slicer 0.1.0.zip`: 압축 파일 버전

## 사용 방법

1. 앱을 실행합니다.
2. 악보 파일을 선택하거나 AlphaTex를 붙여넣습니다.
3. 악보 분석 후 마디 범위와 트랙을 선택합니다.
4. 표기 방식, 색상, 투명도, 이미지 크기 옵션을 조정합니다.
5. `Export ZIP` 버튼을 눌러 PNG 오버레이 ZIP 파일을 저장합니다.

생성되는 ZIP에는 다음 파일이 들어갑니다.

```text
01_bars_1-2.png
02_bars_3-4.png
...
manifest.json
```

## 개발 환경

Node.js 20 이상을 권장합니다.

```bash
npm install
```

### 데스크톱 앱 개발 실행

```bash
npm run dev
```

Vite 개발 서버와 Electron 앱을 함께 실행합니다.

### 웹/서버 개발 실행

```bash
npm run dev:web
```

브라우저에서 `http://localhost:5173`을 엽니다. 개발 모드에서는 Vite가 `/api` 요청을 Express 서버로 프록시합니다.

### 프로덕션 빌드

```bash
npm run build
```

### Electron 앱 실행

```bash
npm start
```

### Windows 배포 파일 생성

```bash
npm run desktop:dist
```

빌드 결과는 `release/` 폴더에 생성됩니다.

## 서버 실행

Electron 없이 Express 서버만 실행할 수도 있습니다.

```bash
npm run build
npm run serve
```

기본 포트는 `3001`입니다.

```bash
PORT=8080 npm run serve
```

## Docker

```bash
docker build -t guitar-tab-slicer .
docker run --rm -p 3001:3001 guitar-tab-slicer
```

그 다음 `http://localhost:3001`로 접속합니다.

## 프로젝트 구조

```text
electron/main.mjs           Electron 메인 프로세스와 파일 선택/저장 IPC
electron/preload.cjs        Renderer에 노출되는 안전한 데스크톱 API
electron/render-service.mjs Electron에서 사용하는 악보 분석/렌더링 서비스
server/index.mjs            Express API, alphaTab/alphaSkia 렌더링, ZIP 생성
src/App.jsx                 React UI
src/styles.css              화면 스타일
scripts/package-win.mjs     Windows 릴리스 파일 패키징 스크립트
vite.config.js              Vite 빌드와 개발 서버 프록시 설정
```

## API

### `GET /api/health`

서버 상태를 확인합니다.

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

## 참고 사항

- 렌더링은 alphaTab과 alphaSkia를 사용합니다.
- 큰 GP 파일이나 다중 트랙 악보는 렌더링 시간이 길 수 있습니다.
- 데스크톱 앱은 현재 Windows 휴대용 빌드를 기준으로 패키징합니다.
- 실제 서비스로 배포할 경우 업로드 크기 제한, rate limit, 작업 큐, 임시 파일 정리 정책을 함께 두는 것을 권장합니다.
- 영상 편집에서 PNG가 작거나 흐리면 `Image width`와 `Scale` 값을 올려 출력하세요.
