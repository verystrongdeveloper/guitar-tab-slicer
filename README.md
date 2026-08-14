# Guitar Tab Slicer

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

Guitar Tab Slicer is a desktop app for slicing Guitar Pro and AlphaTex scores into PNG overlays for video editing. Select a score file or paste AlphaTex text, choose the bar range and style options, then export a ZIP file containing bar-based PNG slices and `manifest.json`.

## Features

- Score input for `.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`, `.gpif`, `.musicxml`, `.xml`, `.alphatex`, `.at`, `.txt`
- Direct AlphaTex paste input
- Start bar, end bar, and bars-per-image settings
- Track analysis and track selection
- Notation modes: Tab only, Score + Tab, Score only, Tab mixed
- PNG width, scale, horizontal/vertical padding, and bar spacing controls
- Foreground color, background color, and background opacity settings
- Fully transparent background PNG export
- Option to hide score headers such as title and artist
- ZIP export with PNG slices and rendering metadata in `manifest.json`
- Windows portable executable packaging

## Download

Download the Windows build from the release page.

- `Guitar Tab Slicer 0.2.0.exe`: portable Windows app
- `Guitar Tab Slicer 0.2.0.zip`: zipped build

## How To Use

1. Launch the app.
2. Select a score file or paste AlphaTex.
3. After analysis, choose the bar range and tracks.
4. Adjust notation, colors, transparency, and image size options.
5. Click `Export ZIP` to save the PNG overlay ZIP file.

The generated ZIP contains files like this:

```text
01_bars_1-2.png
02_bars_3-4.png
...
manifest.json
```

## Development

Node.js 20 or newer is recommended.

```bash
npm install
```

### Run The Desktop App In Development

```bash
npm run dev
```

This starts the Vite development server and the Electron app together.

### Run The Web/Server Development Mode

```bash
npm run dev:web
```

Open `http://localhost:5173` in your browser. In development mode, Vite proxies `/api` requests to the Express server.

### Production Build

```bash
npm run build
```

### Run The Electron App

```bash
npm start
```

### Build Windows Release Files

```bash
npm run desktop:dist
```

Build artifacts are created in the `release/` directory.

## Server Mode

You can also run only the Express server without Electron.

```bash
npm run build
npm run serve
```

The default port is `3001`.

```bash
PORT=8080 npm run serve
```

## Docker

```bash
docker build -t guitar-tab-slicer .
docker run --rm -p 3001:3001 guitar-tab-slicer
```

Then open `http://localhost:3001`.

## Project Structure

```text
electron/main.mjs           Electron main process and file select/save IPC
electron/preload.cjs        Safe desktop API exposed to the renderer
electron/render-service.mjs Score analysis and rendering service used by Electron
server/index.mjs            Express API, alphaTab/alphaSkia rendering, ZIP creation
src/App.jsx                 React UI
src/styles.css              Screen styles
scripts/package-win.mjs     Windows release packaging script
vite.config.js              Vite build and development proxy configuration
```

## API

### `GET /api/health`

Checks the server status.

### `POST /api/score`

Send a score file in the multipart field `score` to receive score metadata.

### `POST /api/render`

Send a score file in the multipart field `score` with render options to receive a ZIP file.

Example options:

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

## Notes

- Rendering uses alphaTab and alphaSkia.
- Large Guitar Pro files or multi-track scores may take longer to render.
- The desktop app is currently packaged as a Windows portable build.
- If you deploy this as a public service, add upload size limits, rate limits, a job queue, and temporary file cleanup policies.
- If exported PNGs look too small or blurry in a video editor, increase `Image width` and `Scale`.
