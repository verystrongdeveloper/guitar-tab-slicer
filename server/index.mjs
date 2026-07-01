import cors from 'cors';
import express from 'express';
import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import multer from 'multer';
import JSZip from 'jszip';
import * as alphaSkia from '@coderline/alphaskia';
import * as alphaTab from '@coderline/alphatab';

const PORT = Number(process.env.PORT || 3001);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 30 * 1024 * 1024);
const RENDER_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS || 30_000);
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES }
});
const require = createRequire(import.meta.url);
const BRAVURA_FONT_CANDIDATES = [
  '@coderline/alphatab/font/Bravura.otf',
  '@coderline/alphatab/font/Bravura.ttf'
];
const SCORE_INFO_ELEMENTS = [
  alphaTab.NotationElement.ScoreTitle,
  alphaTab.NotationElement.ScoreSubTitle,
  alphaTab.NotationElement.ScoreArtist,
  alphaTab.NotationElement.ScoreAlbum,
  alphaTab.NotationElement.ScoreWords,
  alphaTab.NotationElement.ScoreMusic,
  alphaTab.NotationElement.ScoreWordsAndMusic,
  alphaTab.NotationElement.ScoreCopyright,
  alphaTab.NotationElement.ChordDiagrams
];
const SCORE_HEADER_FOOTER_ELEMENTS = [
  alphaTab.model.ScoreSubElement.Title,
  alphaTab.model.ScoreSubElement.SubTitle,
  alphaTab.model.ScoreSubElement.Artist,
  alphaTab.model.ScoreSubElement.Album,
  alphaTab.model.ScoreSubElement.Words,
  alphaTab.model.ScoreSubElement.Music,
  alphaTab.model.ScoreSubElement.WordsAndMusic,
  alphaTab.model.ScoreSubElement.Transcriber,
  alphaTab.model.ScoreSubElement.Copyright,
  alphaTab.model.ScoreSubElement.CopyrightSecondLine,
  alphaTab.model.ScoreSubElement.ChordDiagramList
];

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

let alphaSkiaInitPromise = null;

function asArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function readBravuraFont() {
  for (const specifier of BRAVURA_FONT_CANDIDATES) {
    try {
      return await fs.readFile(require.resolve(specifier));
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND' && error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  throw new Error('Bravura font file was not found in @coderline/alphatab.');
}

async function ensureAlphaSkia() {
  if (!alphaSkiaInitPromise) {
    alphaSkiaInitPromise = (async () => {
      const bravuraData = await readBravuraFont();
      alphaTab.Environment.enableAlphaSkia(asArrayBuffer(bravuraData), alphaSkia);
    })();
  }
  await alphaSkiaInitPromise;
}

function loadScoreFromUpload(fileBuffer) {
  const settings = new alphaTab.Settings();
  return alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(fileBuffer), settings);
}

function cleanScoreInfo(score) {
  const textFields = [
    'title',
    'subTitle',
    'artist',
    'album',
    'words',
    'music',
    'copyright',
    'notices',
    'instructions',
    'tab',
    'genre'
  ];
  for (const field of textFields) {
    if (field in score) score[field] = '';
  }
}

function ensureScoreStyle(score) {
  if (!score.style) {
    score.style = new alphaTab.model.ScoreStyle();
  }
  return score.style;
}

function hideScoreHeaderFooter(score) {
  const style = ensureScoreStyle(score);
  for (const element of SCORE_HEADER_FOOTER_ELEMENTS) {
    style.headerAndFooter.set(element, new alphaTab.model.HeaderFooterStyle('', false, 1));
  }
}

function applyScoreDisplayOptions(score, options) {
  score.stylesheet.globalDisplayTuning = true;
  if (options.hideScoreInfo) {
    cleanScoreInfo(score);
    hideScoreHeaderFooter(score);
  } else {
    const style = ensureScoreStyle(score);
    style.headerAndFooter.set(
      alphaTab.model.ScoreSubElement.CopyrightSecondLine,
      new alphaTab.model.HeaderFooterStyle('', false, 1)
    );
  }
}

function applyChunkScoreDisplayOptions(score, options, chunk) {
  score.stylesheet.globalDisplayTuning = chunk.startBar === options.startBar;
}

function scoreToMetadata(score) {
  const tracks = Array.isArray(score.tracks)
    ? score.tracks.map((track, index) => ({
        index,
        name: track.name || track.shortName || track.playbackInfo?.name || `Track ${index + 1}`
      }))
    : [];

  return {
    title: score.title || '',
    artist: score.artist || '',
    album: score.album || '',
    tempo: score.tempo || null,
    barCount: Array.isArray(score.masterBars) ? score.masterBars.length : 0,
    trackCount: tracks.length,
    tracks
  };
}

function parseNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function parseInteger(value, fallback, min, max) {
  return Math.round(parseNumber(value, fallback, min, max));
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).toLowerCase());
}

function parseTracks(raw, score) {
  const maxIndex = Math.max(0, (score.tracks?.length || 1) - 1);
  if (!raw || raw === 'first') return [0];
  if (raw === 'all') return score.tracks.map((_, index) => index);
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [0];
    const normalized = [...new Set(parsed.map(Number))]
      .filter(Number.isInteger)
      .filter(index => index >= 0 && index <= maxIndex);
    return normalized.length ? normalized : [0];
  } catch {
    return [0];
  }
}

function getStaveProfile(profileName) {
  const map = {
    default: alphaTab.StaveProfile.Default,
    scoretab: alphaTab.StaveProfile.ScoreTab,
    score: alphaTab.StaveProfile.Score,
    tab: alphaTab.StaveProfile.Tab,
    tabmixed: alphaTab.StaveProfile.TabMixed
  };
  return map[String(profileName || 'tab').toLowerCase()] ?? alphaTab.StaveProfile.Tab;
}

function normalizeColor(color, fallback = '#ffffff') {
  const value = String(color || '').trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return value;
  if (/^rgba?\([^)]+\)$/i.test(value)) return value;
  return fallback;
}

function parseHexColorForSkia(color, opacity) {
  const fallback = { r: 0, g: 0, b: 0, a: Math.round(opacity * 255) };
  if (!color || !color.startsWith('#')) return fallback;
  let hex = color.slice(1).trim();
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6 && hex.length !== 8) return fallback;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const alphaFromHex = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
  const a = Math.round(Math.min(1, Math.max(0, opacity * alphaFromHex)) * 255);
  return { r, g, b, a };
}

function applyRenderColors(settings, foregroundColor) {
  const color = alphaTab.model.Color.fromJson(foregroundColor) || alphaTab.model.Color.fromJson('#ffffff');
  const resources = settings.display.resources;
  resources.mainGlyphColor = color;
  resources.secondaryGlyphColor = color;
  resources.staffLineColor = color;
  resources.barSeparatorColor = color;
  resources.scoreInfoColor = color;
  resources.barNumberColor = color;
}

function createRenderSettings(options, chunk) {
  const settings = new alphaTab.Settings();
  settings.core.engine = 'skia';
  settings.core.useWorkers = false;
  settings.core.enableLazyLoading = false;

  settings.display.layoutMode = alphaTab.LayoutMode.Page;
  settings.display.startBar = chunk.startBar;
  settings.display.barCount = chunk.count;
  settings.display.barsPerRow = chunk.count;
  settings.display.barCountPerPartial = chunk.count;
  settings.display.scale = options.scale;
  settings.display.padding = [options.paddingX, options.paddingY];
  settings.display.staveProfile = getStaveProfile(options.staveProfile);
  settings.display.stretchForce = options.stretchForce;
  settings.display.justifyLastSystem = true;

  settings.notation.elements.set(alphaTab.NotationElement.GuitarTuning, chunk.startBar === options.startBar);
  if (options.hideScoreInfo) {
    for (const element of SCORE_INFO_ELEMENTS) {
      settings.notation.elements.set(element, false);
    }
  }

  settings.player.enablePlayer = false;
  settings.player.enableCursor = false;
  settings.player.enableUserInteraction = false;
  settings.player.enableElementHighlighting = false;

  applyRenderColors(settings, options.foregroundColor);
  return settings;
}

function dispose(value) {
  if (value && typeof value[Symbol.dispose] === 'function') {
    value[Symbol.dispose]();
  }
}

function isAlphaTabCreditPartial(result, options) {
  return result.firstMasterBarIndex === -1 &&
    result.lastMasterBarIndex === -1 &&
    result.height <= (14 * options.scale) + 1;
}

function getCenteredXOffset(outputWidth, renderedWidth) {
  return Math.max(0, (outputWidth - renderedWidth) / 2);
}

async function renderChunkToPng(score, trackIndexes, options, chunk) {
  applyChunkScoreDisplayOptions(score, options, chunk);
  const settings = createRenderSettings(options, chunk);
  const renderer = new alphaTab.rendering.ScoreRenderer(settings);
  renderer.width = options.width;

  const partialIds = [];
  const renderedPartials = [];
  const renderedPartialIds = new Set();
  let finalCanvas = null;
  const unregister = [];

  await new Promise((resolve, reject) => {
    let layoutFinished = false;
    let settled = false;
    const timeout = setTimeout(() => {
      fail(new Error('렌더링 시간이 초과되었습니다. 마디 범위를 줄이거나 이미지 폭/배율을 낮춰 주세요.'));
    }, RENDER_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      for (const off of unregister) {
        off();
      }
    };
    const fail = error => {
      if (settled) return;
      settled = true;
      cleanup();
      for (const partial of renderedPartials) {
        dispose(partial.renderResult);
      }
      dispose(finalCanvas);
      reject(error);
    };
    const completeIfReady = () => {
      if (!layoutFinished || !partialIds.length || renderedPartialIds.size < partialIds.length || settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    unregister.push(renderer.preRender.on(() => {
      partialIds.length = 0;
      renderedPartials.length = 0;
      renderedPartialIds.clear();
      layoutFinished = false;
      dispose(finalCanvas);
      finalCanvas = null;
    }));

    unregister.push(renderer.partialLayoutFinished.on(result => {
      partialIds.push(result.id);
      try {
        renderer.renderResult(result.id);
      } catch (error) {
        fail(error);
      }
    }));

    unregister.push(renderer.renderFinished.on(result => {
      if (result.totalWidth <= 0 || result.totalHeight <= 0) {
        fail(new Error('렌더링 크기가 0입니다. 선택한 트랙이나 마디 범위를 확인해 주세요.'));
        return;
      }

      const drawablePartials = renderedPartials.filter(partial => !isAlphaTabCreditPartial(partial, options));
      const bottomPadding = options.paddingY * options.scale;
      const renderedHeight = drawablePartials.reduce((height, partial) => {
        return Math.max(height, partial.y + partial.height);
      }, 0);
      const outputWidth = Math.max(options.width, result.totalWidth);
      const outputHeight = Math.max(1, Math.ceil(renderedHeight + bottomPadding));
      const xOffset = getCenteredXOffset(outputWidth, result.totalWidth);

      finalCanvas = new alphaSkia.AlphaSkiaCanvas();
      finalCanvas.beginRender(outputWidth, outputHeight);

      if (options.backgroundOpacity > 0) {
        const { r, g, b, a } = parseHexColorForSkia(options.backgroundColor, options.backgroundOpacity);
        finalCanvas.color = alphaSkia.AlphaSkiaCanvas.rgbaToColor(r, g, b, a);
        finalCanvas.fillRect(0, 0, outputWidth, outputHeight);
      }

      layoutFinished = true;
      if (!partialIds.length) {
        fail(new Error('렌더링 결과가 비어 있습니다. 선택한 트랙이나 마디 범위를 확인해 주세요.'));
        return;
      }
      for (const partial of drawablePartials) {
        finalCanvas.drawImage(partial.renderResult, xOffset + partial.x, partial.y, partial.width, partial.height);
        dispose(partial.renderResult);
      }
      for (const partial of renderedPartials) {
        if (isAlphaTabCreditPartial(partial, options)) {
          dispose(partial.renderResult);
        }
      }
      renderedPartials.length = 0;
      completeIfReady();
    }));

    unregister.push(renderer.partialRenderFinished.on(result => {
      try {
        if (finalCanvas) {
          if (!isAlphaTabCreditPartial(result, options)) {
            finalCanvas.drawImage(result.renderResult, result.x, result.y, result.width, result.height);
          }
          dispose(result.renderResult);
        } else {
          renderedPartials.push(result);
        }
        renderedPartialIds.add(result.id);
        completeIfReady();
      } catch (error) {
        dispose(result.renderResult);
        fail(error);
      }
    }));

    unregister.push(renderer.error.on(fail));

    try {
      renderer.renderScore(score, trackIndexes);
    } catch (error) {
      fail(error);
    }
  });

  if (!finalCanvas || !renderedPartialIds.size) {
    throw new Error('렌더링 결과가 비어 있습니다. 선택한 트랙이나 마디 범위를 확인해 주세요.');
  }

  const finalImage = finalCanvas.endRender();
  try {
    const pngBytes = finalImage.toPng();
    return Buffer.from(new Uint8Array(pngBytes));
  } finally {
    dispose(finalImage);
    dispose(finalCanvas);
  }
}

function buildChunks(startBar, endBar, barsPerImage) {
  const chunks = [];
  for (let bar = startBar; bar <= endBar; bar += barsPerImage) {
    const count = Math.min(barsPerImage, endBar - bar + 1);
    chunks.push({ startBar: bar, endBar: bar + count - 1, count });
  }
  return chunks;
}

function normalizeRenderOptions(body, score) {
  const maxBars = score.masterBars?.length || 1;
  const startBar = parseInteger(body.startBar, 1, 1, maxBars);
  const endBar = parseInteger(body.endBar, maxBars, startBar, maxBars);
  const barsPerImage = parseInteger(body.barsPerImage, 2, 1, 16);
  const transparent = parseBoolean(body.transparent, false);

  return {
    startBar,
    endBar,
    barsPerImage,
    width: parseInteger(body.width, 1400, 320, 5000),
    scale: parseNumber(body.scale, 1.4, 0.25, 4),
    stretchForce: parseNumber(body.stretchForce, 0.9, 0.1, 2.5),
    paddingX: parseInteger(body.paddingX, 28, 0, 400),
    paddingY: parseInteger(body.paddingY, 14, 0, 400),
    staveProfile: body.staveProfile || 'tab',
    foregroundColor: normalizeColor(body.foregroundColor, '#ffffff'),
    backgroundColor: normalizeColor(body.backgroundColor, '#000000'),
    backgroundOpacity: transparent ? 0 : parseNumber(body.backgroundOpacity, 0.55, 0, 1),
    transparent,
    hideScoreInfo: parseBoolean(body.hideScoreInfo, true)
  };
}

function requireUploadedScore(req, res) {
  if (!req.file?.buffer?.length) {
    res.status(400).json({ message: 'gp, gp5, gpx, gpif, musicxml, alphatex 파일을 업로드하거나 AlphaTex 텍스트를 보내 주세요.' });
    return null;
  }
  return req.file;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/score', upload.single('score'), (req, res) => {
  try {
    const file = requireUploadedScore(req, res);
    if (!file) return;
    const score = loadScoreFromUpload(file.buffer);
    res.json(scoreToMetadata(score));
  } catch (error) {
    console.error(error);
    res.status(422).json({ message: `악보를 읽지 못했습니다: ${error.message}` });
  }
});

app.post('/api/render', upload.single('score'), async (req, res) => {
  try {
    const file = requireUploadedScore(req, res);
    if (!file) return;

    await ensureAlphaSkia();

    const score = loadScoreFromUpload(file.buffer);
    const metadata = scoreToMetadata(score);
    const options = normalizeRenderOptions(req.body, score);
    const trackIndexes = parseTracks(req.body.tracks, score);

    applyScoreDisplayOptions(score, options);

    const chunks = buildChunks(options.startBar, options.endBar, options.barsPerImage);
    const zip = new JSZip();
    const pad = String(chunks.length).length;

    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const png = await renderChunkToPng(score, trackIndexes, options, chunk);
      const filename = `${String(i + 1).padStart(pad, '0')}_bars_${chunk.startBar}-${chunk.endBar}.png`;
      zip.file(filename, png);
    }

    zip.file('manifest.json', JSON.stringify({
      sourceFile: file.originalname,
      score: metadata,
      selectedTracks: trackIndexes,
      options,
      chunks
    }, null, 2));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const baseName = path.basename(file.originalname || 'tab', path.extname(file.originalname || 'tab')).replace(/[^a-z0-9_-]+/gi, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', zipBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName || 'tab'}_overlay_slices.zip"`);
    res.send(zipBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `이미지 생성에 실패했습니다: ${error.message}` });
  }
});

const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', async (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  try {
    await fs.access(path.join(distPath, 'index.html'));
    res.sendFile(path.join(distPath, 'index.html'));
  } catch {
    res.status(404).send('Frontend build not found. Run `npm run build` or use `npm run dev`.');
  }
});

app.listen(PORT, () => {
  console.log(`Guitar Tab Slicer API listening on http://localhost:${PORT}`);
});
