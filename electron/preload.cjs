const { contextBridge, ipcRenderer } = require('electron');

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
  analyzeScore: payload => invoke('score:analyze', payload),
  renderZip: payload => invoke('score:render-zip', payload)
});
