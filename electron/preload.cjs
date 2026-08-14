const { contextBridge, ipcRenderer, webUtils } = require('electron');

async function invoke(channel, payload) {
  const result = await ipcRenderer.invoke(channel, payload);
  if (!result || result.ok !== true) {
    throw new Error(result?.error || 'The request could not be completed.');
  }
  return result.value;
}

contextBridge.exposeInMainWorld('guitarTabSlicer', {
  isDesktop: true,
  selectScoreFile: () => invoke('score:select-file'),
  getPathForFile: file => webUtils.getPathForFile(file),
  openScoreFilePath: filePath => invoke('score:open-file-path', { path: filePath }),
  analyzeScore: payload => invoke('score:analyze', payload),
  renderPreview: payload => invoke('score:render-preview', payload),
  renderZip: payload => invoke('score:render-zip', payload)
});
