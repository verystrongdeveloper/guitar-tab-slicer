import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ALLOWED_SCORE_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  analyzeScoreBuffer,
  createAlphaTexScoreInput,
  renderScorePreviewBuffer,
  renderScoreZipBuffer,
  validateScoreInput
} from './render-service.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const selectedFiles = new Map();

const scoreFileFilters = [
  {
    name: 'Score files',
    extensions: ['gp', 'gp3', 'gp4', 'gp5', 'gpx', 'gpif', 'musicxml', 'xml', 'alphatex', 'at', 'txt']
  },
  { name: 'All files', extensions: ['*'] }
];

function formatBytesAsMb(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

function serializeError(error) {
  if (error instanceof Error && error.message) return error.message;
  return 'The request could not be completed.';
}

function safeHandler(handler) {
  return async (_event, payload) => {
    try {
      return { ok: true, value: await handler(payload) };
    } catch (error) {
      console.error(error);
      return { ok: false, error: serializeError(error) };
    }
  };
}

function validateSelectedPath(filePath, stats) {
  const name = path.basename(filePath);
  const ext = path.extname(name).toLowerCase();

  if (!ALLOWED_SCORE_EXTENSIONS.has(ext)) {
    throw new Error('Unsupported score file type.');
  }
  if (!stats.isFile()) {
    throw new Error('Select a score file.');
  }
  if (stats.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large. Maximum size is ${formatBytesAsMb(MAX_UPLOAD_BYTES)} MB.`);
  }

  return { name, size: stats.size };
}

async function rememberSelectedFile(filePath) {
  const stats = await fs.stat(filePath);
  const file = validateSelectedPath(filePath, stats);
  const token = randomUUID();
  selectedFiles.set(token, { path: filePath, name: file.name, size: file.size });
  return { token, name: file.name, size: file.size };
}

async function readScoreSource(source) {
  if (!source || typeof source !== 'object') {
    throw new Error('Select a score file or paste AlphaTex.');
  }

  if (source.type === 'alphatex') {
    return createAlphaTexScoreInput(source.text);
  }

  if (source.type === 'file') {
    const file = selectedFiles.get(source.token);
    if (!file) {
      throw new Error('Select the score file again.');
    }
    const buffer = await fs.readFile(file.path);
    return validateScoreInput(buffer, file.name);
  }

  throw new Error('Select a score file or paste AlphaTex.');
}

function buildRenderBody(payload) {
  const selectedTracks = Array.isArray(payload?.selectedTracks) ? payload.selectedTracks : [0];
  return {
    ...(payload?.options || {}),
    tracks: JSON.stringify(selectedTracks)
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 900,
    minWidth: 920,
    minHeight: 680,
    autoHideMenuBar: true,
    backgroundColor: '#1f2227',
    title: 'Guitar Tab Slicer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    if (isDev && target.origin === new URL(devServerUrl).origin) return;
    if (!isDev && target.protocol === 'file:') return;
    event.preventDefault();
  });

  if (isDev) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

ipcMain.handle('score:select-file', safeHandler(async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Score File',
    properties: ['openFile'],
    filters: scoreFileFilters
  });

  if (result.canceled || !result.filePaths.length) return null;
  return await rememberSelectedFile(result.filePaths[0]);
}));

ipcMain.handle('score:open-file-path', safeHandler(async payload => {
  const filePath = typeof payload?.path === 'string' ? payload.path : '';
  if (!filePath) {
    throw new Error('Select a score file.');
  }
  return await rememberSelectedFile(filePath);
}));

ipcMain.handle('score:analyze', safeHandler(async payload => {
  const input = await readScoreSource(payload?.source);
  return analyzeScoreBuffer(input.buffer, input.originalName);
}));

ipcMain.handle('score:render-preview', safeHandler(async payload => {
  const input = await readScoreSource(payload?.source);
  return renderScorePreviewBuffer(input.buffer, input.originalName, buildRenderBody(payload));
}));

ipcMain.handle('score:render-zip', safeHandler(async payload => {
  const input = await readScoreSource(payload?.source);
  const zip = await renderScoreZipBuffer(input.buffer, input.originalName, buildRenderBody(payload));
  const result = await dialog.showSaveDialog({
    title: 'Save ZIP',
    defaultPath: path.join(app.getPath('documents'), zip.filename),
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    properties: ['createDirectory']
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, zip.buffer);
  return {
    canceled: false,
    filePath: result.filePath,
    filename: path.basename(result.filePath),
    bytes: zip.buffer.byteLength
  };
}));

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(createWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
