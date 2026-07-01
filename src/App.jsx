import { useMemo, useState } from 'react';

const translations = {
  en: {
    eyebrow: 'Guitar Tab Overlay Exporter',
    h1Line1: 'Slice Guitar Tabs into',
    h1Line2: 'Video-Ready PNG Overlays',
    heroCopy:
      'Export transparent or semi-transparent tab overlays sliced by bar range — perfect for layering over guitar tutorial videos.',
    zipBtn: 'Export ZIP',
    sec1: '1. Upload Score',
    fileDrop: 'gp / gp5 / gpx / gpif / musicxml / alphatex',
    fileSelected: name => name,
    or: 'or',
    alphaTexLabel: 'Paste AlphaTex',
    alphaTexPlaceholder: 'e.g.  .  0.6 2.5 3.4 | 0.6 2.5 3.4 |',
    analyzeBtn: 'Analyze Score',
    noTitle: 'Untitled',
    noArtist: 'Unknown artist',
    scoreStats: (bars, tracks) => `${bars} bars · ${tracks} tracks`,
    sec2: '2. Bars & Tracks',
    barsPerImage: 'Bars per image',
    notation: 'Notation',
    startBar: 'Start bar',
    endBar: 'End bar',
    endBarPlaceholder: 'all',
    trackLabel: 'Tracks',
    selectAll: 'Select all',
    trackHint: 'Analyze the score first to see the track list. The first track is used otherwise.',
    sec3: '3. Image Style',
    fgColor: 'Foreground color',
    bgColor: 'Background color',
    transparentLabel: 'Fully transparent background',
    opacityLabel: v => `Background opacity: ${v}`,
    sec4: '4. Render Size',
    widthLabel: 'Image width (px)',
    scaleLabel: 'Scale',
    paddingXLabel: 'Horizontal padding',
    paddingYLabel: 'Vertical padding',
    stretchLabel: v => `Bar spacing: ${v}`,
    hideScoreInfo: 'Hide score header (title, artist)',
    ready: 'Ready',
    noFile: 'Please select a file or paste AlphaTex.',
    analyzing: 'Reading score…',
    analyzed: (bars, tracks) => `Done: ${bars} bars, ${tracks} tracks`,
    rendering: 'Generating PNGs and packing ZIP… Large files may take a while.',
    rendered: 'Done! ZIP file downloaded.',
    errorFallback: 'An error occurred while processing the request.',
  },
  ko: {
    eyebrow: '기타 탭 오버레이 익스포터',
    h1Line1: '기타 악보를 영상용',
    h1Line2: 'PNG 오버레이로 슬라이스',
    heroCopy:
      '기타 튜토리얼 영상에 얹기 좋은 투명/반투명 배경 악보 이미지를 마디 범위별로 나눠 ZIP으로 받을 수 있습니다.',
    zipBtn: 'ZIP 생성',
    sec1: '1. 악보 입력',
    fileDrop: 'gp / gp5 / gpx / gpif / musicxml / alphatex 파일 선택',
    fileSelected: name => name,
    or: '또는',
    alphaTexLabel: 'AlphaTex 붙여넣기',
    alphaTexPlaceholder: '예: . 0.6 2.5 3.4 | 0.6 2.5 3.4 |',
    analyzeBtn: '악보 정보 읽기',
    noTitle: '제목 없음',
    noArtist: '아티스트 정보 없음',
    scoreStats: (bars, tracks) => `${bars}마디 · ${tracks}트랙`,
    sec2: '2. 마디/트랙 선택',
    barsPerImage: '이미지당 마디 수',
    notation: '표기 방식',
    startBar: '시작 마디',
    endBar: '끝 마디',
    endBarPlaceholder: '전체',
    trackLabel: '트랙',
    selectAll: '전체 선택',
    trackHint:
      '악보 정보 읽기를 누르면 트랙 목록이 표시됩니다. 읽지 않고 생성하면 첫 번째 트랙으로 처리합니다.',
    sec3: '3. 이미지 스타일',
    fgColor: '글자/선 색상',
    bgColor: '배경색',
    transparentLabel: '완전 투명 배경으로 출력',
    opacityLabel: v => `배경 불투명도: ${v}`,
    sec4: '4. 렌더 크기',
    widthLabel: '이미지 폭 (px)',
    scaleLabel: '확대 배율',
    paddingXLabel: '좌우 여백',
    paddingYLabel: '상하 여백',
    stretchLabel: v => `마디 간격: ${v}`,
    hideScoreInfo: '제목/아티스트 같은 악보 헤더 숨기기',
    ready: '준비됨',
    noFile: '파일을 선택하거나 AlphaTex를 붙여넣어 주세요.',
    analyzing: '악보를 읽는 중…',
    analyzed: (bars, tracks) => `읽기 완료: ${bars}마디, ${tracks}트랙`,
    rendering: 'PNG 이미지를 생성하고 ZIP으로 묶는 중… 파일이 크면 시간이 걸릴 수 있어요.',
    rendered: '완료! ZIP 파일이 다운로드되었습니다.',
    errorFallback: '요청 처리 중 오류가 발생했습니다.',
  },
  ja: {
    eyebrow: 'ギタータブ オーバーレイ エクスポーター',
    h1Line1: 'ギタータブを動画向け',
    h1Line2: 'PNGオーバーレイにスライス',
    heroCopy:
      'ギターチュートリアル動画に重ねるための透明・半透明背景の譜面画像を小節範囲ごとに分割してZIPで取得できます。',
    zipBtn: 'ZIPを出力',
    sec1: '1. 楽譜の入力',
    fileDrop: 'gp / gp5 / gpx / gpif / musicxml / alphatex ファイルを選択',
    fileSelected: name => name,
    or: 'または',
    alphaTexLabel: 'AlphaTexを貼り付け',
    alphaTexPlaceholder: '例: . 0.6 2.5 3.4 | 0.6 2.5 3.4 |',
    analyzeBtn: '楽譜情報を読む',
    noTitle: 'タイトルなし',
    noArtist: 'アーティスト情報なし',
    scoreStats: (bars, tracks) => `${bars}小節 · ${tracks}トラック`,
    sec2: '2. 小節/トラックの選択',
    barsPerImage: '1画像あたりの小節数',
    notation: '記譜タイプ',
    startBar: '開始小節',
    endBar: '終了小節',
    endBarPlaceholder: '全体',
    trackLabel: 'トラック',
    selectAll: '全て選択',
    trackHint:
      '楽譜情報を読むとトラックリストが表示されます。読まずに生成した場合は最初のトラックが使用されます。',
    sec3: '3. 画像スタイル',
    fgColor: '前景色',
    bgColor: '背景色',
    transparentLabel: '完全透明背景で出力',
    opacityLabel: v => `背景の不透明度: ${v}`,
    sec4: '4. レンダリングサイズ',
    widthLabel: '画像の幅 (px)',
    scaleLabel: '拡大率',
    paddingXLabel: '水平パディング',
    paddingYLabel: '垂直パディング',
    stretchLabel: v => `小節間隔: ${v}`,
    hideScoreInfo: '楽譜ヘッダー（タイトル・アーティスト）を非表示',
    ready: '準備完了',
    noFile: 'ファイルを選択するか、AlphaTexを貼り付けてください。',
    analyzing: '楽譜を読み込み中…',
    analyzed: (bars, tracks) => `読み込み完了: ${bars}小節, ${tracks}トラック`,
    rendering: 'PNG画像を生成してZIPにまとめ中… ファイルが大きい場合は時間がかかります。',
    rendered: '完了！ZIPファイルがダウンロードされました。',
    errorFallback: 'エラーが発生しました。',
  },
};

const LANGS = [
  { id: 'en', label: 'EN' },
  { id: 'ko', label: '한국어' },
  { id: 'ja', label: '日本語' },
];

const defaultOptions = {
  barsPerImage: 2,
  startBar: 1,
  endBar: '',
  width: 1400,
  scale: 1.4,
  stretchForce: 0.9,
  paddingX: 28,
  paddingY: 14,
  staveProfile: 'tab',
  foregroundColor: '#ffffff',
  backgroundColor: '#000000',
  backgroundOpacity: 0.55,
  transparent: false,
  hideScoreInfo: true,
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function readError(response, fallback) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data.message || fallback;
  }
  return await response.text();
}

function makeUploadFile(file, alphaTex) {
  if (file) return file;
  const text = alphaTex.trim();
  if (!text) return null;
  return new File([text], 'input.alphatex', { type: 'text/plain' });
}

function formatTrackName(track) {
  return `${track.index + 1}. ${track.name || `Track ${track.index + 1}`}`;
}

const desktopApi = typeof window !== 'undefined' ? window.guitarTabSlicer : null;

export default function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  const [file, setFile] = useState(null);
  const [desktopFile, setDesktopFile] = useState(null);
  const [alphaTex, setAlphaTex] = useState('');
  const [scoreInfo, setScoreInfo] = useState(null);
  const [selectedTracks, setSelectedTracks] = useState([0]);
  const [options, setOptions] = useState(defaultOptions);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const isDesktop = Boolean(desktopApi?.isDesktop);
  const uploadFile = useMemo(() => isDesktop ? null : makeUploadFile(file, alphaTex), [file, alphaTex, isDesktop]);
  const hasDesktopSource = Boolean(desktopFile) || Boolean(alphaTex.trim());
  const canSubmit = (isDesktop ? hasDesktopSource : Boolean(uploadFile)) && !busy;
  const selectedFileName = isDesktop ? desktopFile?.name : file?.name;

  const setOption = (name, value) => {
    setOptions(prev => ({ ...prev, [name]: value }));
  };

  const getDesktopSource = (selected = desktopFile) => {
    if (selected) return { type: 'file', token: selected.token };
    const text = alphaTex.trim();
    if (text) return { type: 'alphatex', text };
    return null;
  };

  const resetScoreSelection = () => {
    setScoreInfo(null);
    setSelectedTracks([0]);
    setOptions(prev => ({ ...prev, endBar: '' }));
  };

  const analyzeScore = async (scoreFile = uploadFile, selectedDesktopFile = desktopFile) => {
    const desktopSource = isDesktop ? getDesktopSource(selectedDesktopFile) : null;
    if (isDesktop ? !desktopSource : !scoreFile) {
      setMessage(t.noFile);
      return;
    }
    setBusy(true);
    setMessage(t.analyzing);
    try {
      let data;
      if (isDesktop) {
        data = await desktopApi.analyzeScore({ source: desktopSource });
      } else {
        const form = new FormData();
        form.append('score', scoreFile);
        const response = await fetch('/api/score', { method: 'POST', body: form });
        if (!response.ok) throw new Error(await readError(response, t.errorFallback));
        data = await response.json();
      }
      setScoreInfo(data);
      setSelectedTracks(data.tracks?.length ? [data.tracks[0].index] : [0]);
      setOptions(prev => ({ ...prev, endBar: data.barCount || '' }));
      setMessage(t.analyzed(data.barCount, data.trackCount));
    } catch (error) {
      setScoreInfo(null);
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const selectDesktopFile = async () => {
    try {
      const selected = await desktopApi.selectScoreFile();
      if (!selected) return;
      setDesktopFile(selected);
      setFile(null);
      setAlphaTex('');
      resetScoreSelection();
      await analyzeScore(null, selected);
    } catch (error) {
      setMessage(error.message || t.errorFallback);
    }
  };

  const toggleTrack = index => {
    setSelectedTracks(prev => {
      if (prev.includes(index)) {
        const next = prev.filter(item => item !== index);
        return next.length ? next : prev;
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  };

  const renderZip = async () => {
    const desktopSource = isDesktop ? getDesktopSource() : null;
    if (isDesktop ? !desktopSource : !uploadFile) {
      setMessage(t.noFile);
      return;
    }
    setBusy(true);
    setMessage(t.rendering);
    try {
      const renderOptions = { ...options };
      if (!renderOptions.endBar) {
        renderOptions.endBar = String(scoreInfo?.barCount || 1);
      }

      if (isDesktop) {
        const result = await desktopApi.renderZip({
          source: desktopSource,
          options: renderOptions,
          selectedTracks
        });
        setMessage(result?.canceled ? t.ready : t.rendered);
      } else {
        const form = new FormData();
        form.append('score', uploadFile);
        form.append('tracks', JSON.stringify(selectedTracks));
        for (const [key, value] of Object.entries(renderOptions)) {
          form.append(key, String(value));
        }
        const response = await fetch('/api/render', { method: 'POST', body: form });
        if (!response.ok) throw new Error(await readError(response, t.errorFallback));
        const blob = await response.blob();
        const filename =
          response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/i)?.[1] ||
          'tab_overlay_slices.zip';
        downloadBlob(blob, filename);
        setMessage(t.rendered);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const opacityDisplay = options.transparent
    ? '0%'
    : `${Math.round(Number(options.backgroundOpacity) * 100)}%`;

  return (
    <>
      <nav className="top-bar">
        <div className="top-bar-inner">
          <div className="brand">
            <svg className="brand-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Guitar Tab Slicer</span>
          </div>
          <div className="lang-switcher" role="group" aria-label="Language">
            {LANGS.map(l => (
              <button
                key={l.id}
                className={`lang-btn${lang === l.id ? ' active' : ''}`}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="page-shell">
        <section className="hero">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>
            <span>{t.h1Line1}</span>
            <span className="h1-accent">{t.h1Line2}</span>
          </h1>
          <p className="hero-copy">{t.heroCopy}</p>
        </section>

        <section className="upload-zone">
          <div className="card upload-card">
            <h2>{t.sec1}</h2>
            {isDesktop ? (
              <button type="button" className="file-drop file-drop-button" onClick={selectDesktopFile} disabled={busy}>
                <span className="file-drop-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>{selectedFileName ? t.fileSelected(selectedFileName) : t.fileDrop}</span>
              </button>
            ) : (
              <label className="file-drop">
                <input
                  type="file"
                  accept=".gp,.gp3,.gp4,.gp5,.gpx,.gpif,.musicxml,.xml,.alphatex,.at,.txt"
                  onChange={event => {
                    const next = event.target.files?.[0] || null;
                    setFile(next);
                    setDesktopFile(null);
                    if (next) setAlphaTex('');
                    resetScoreSelection();
                    if (next) {
                      analyzeScore(next);
                    } else {
                      setMessage('');
                    }
                  }}
                />
                <span className="file-drop-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>{selectedFileName ? t.fileSelected(selectedFileName) : t.fileDrop}</span>
              </label>
            )}

            <div className="divider"><span>{t.or}</span></div>

            <label className="field">
              <span>{t.alphaTexLabel}</span>
              <textarea
                rows={4}
                placeholder={t.alphaTexPlaceholder}
                value={alphaTex}
                onChange={event => {
                  setAlphaTex(event.target.value);
                  if (event.target.value.trim()) {
                    setFile(null);
                    setDesktopFile(null);
                  }
                  resetScoreSelection();
                }}
              />
            </label>

            {alphaTex.trim() ? (
              <div className="actions">
                <button className="secondary" onClick={() => analyzeScore()} disabled={!canSubmit}>
                  {t.analyzeBtn}
                </button>
              </div>
            ) : null}

            {scoreInfo && (
              <div className="score-info">
                <strong>{scoreInfo.title || t.noTitle}</strong>
                <span>{scoreInfo.artist || t.noArtist}</span>
                <span>{t.scoreStats(scoreInfo.barCount, scoreInfo.trackCount)}</span>
              </div>
            )}
          </div>
        </section>

        <section className="options-grid">
          <div className="card">
            <h2>{t.sec2}</h2>
            <div className="two-col">
              <label className="field">
                <span>{t.barsPerImage}</span>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={options.barsPerImage}
                  onChange={event => setOption('barsPerImage', event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.notation}</span>
                <select value={options.staveProfile} onChange={event => setOption('staveProfile', event.target.value)}>
                  <option value="tab">Tab only</option>
                  <option value="scoretab">Score + Tab</option>
                  <option value="score">Score only</option>
                  <option value="tabmixed">Tab mixed</option>
                  <option value="default">Default</option>
                </select>
              </label>
              <label className="field">
                <span>{t.startBar}</span>
                <input
                  type="number"
                  min="1"
                  value={options.startBar}
                  onChange={event => setOption('startBar', event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.endBar}</span>
                <input
                  type="number"
                  min="1"
                  placeholder={scoreInfo?.barCount ? String(scoreInfo.barCount) : t.endBarPlaceholder}
                  value={options.endBar}
                  onChange={event => setOption('endBar', event.target.value)}
                />
              </label>
            </div>

            <div className="track-box">
              <div className="track-head">
                <span>{t.trackLabel}</span>
                {scoreInfo?.tracks?.length ? (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setSelectedTracks(scoreInfo.tracks.map(track => track.index))}
                  >
                    {t.selectAll}
                  </button>
                ) : null}
              </div>
              {scoreInfo?.tracks?.length ? (
                <div className="track-list">
                  {scoreInfo.tracks.map(track => (
                    <label key={track.index} className="check-row">
                      <input
                        type="checkbox"
                        checked={selectedTracks.includes(track.index)}
                        onChange={() => toggleTrack(track.index)}
                      />
                      <span>{formatTrackName(track)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="hint">{t.trackHint}</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2>{t.sec3}</h2>
            <div className="two-col">
              <label className="field">
                <span>{t.fgColor}</span>
                <input
                  type="color"
                  value={options.foregroundColor}
                  onChange={event => setOption('foregroundColor', event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.bgColor}</span>
                <input
                  type="color"
                  value={options.backgroundColor}
                  onChange={event => setOption('backgroundColor', event.target.value)}
                  disabled={options.transparent}
                />
              </label>
            </div>

            <label className="check-row standalone">
              <input
                type="checkbox"
                checked={options.transparent}
                onChange={event => setOption('transparent', event.target.checked)}
              />
              <span>{t.transparentLabel}</span>
            </label>

            <label className="field slider-field">
              <span>{t.opacityLabel(opacityDisplay)}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={options.transparent ? 0 : options.backgroundOpacity}
                disabled={options.transparent}
                onChange={event => setOption('backgroundOpacity', event.target.value)}
              />
            </label>

            <div
              className="preview-strip"
              style={{ backgroundColor: options.transparent ? 'transparent' : options.backgroundColor }}
            >
              <div
                className="preview-overlay"
                style={{
                  color: options.foregroundColor,
                  borderColor: options.foregroundColor,
                  backgroundColor: options.transparent
                    ? 'transparent'
                    : `${options.backgroundColor}${Math.round(Number(options.backgroundOpacity) * 255).toString(16).padStart(2, '0')}`,
                }}
              >
                <span>e|--0---3---5---|--7---5---3---|</span>
                <span>B|--1---3---5---|--8---5---3---|</span>
                <span>G|--0---4---5---|--7---5---4---|</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>{t.sec4}</h2>
            <div className="two-col">
              <label className="field">
                <span>{t.widthLabel}</span>
                <input
                  type="number"
                  min="320"
                  max="5000"
                  value={options.width}
                  onChange={event => setOption('width', event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.scaleLabel}</span>
                <input
                  type="number"
                  min="0.25"
                  max="4"
                  step="0.05"
                  value={options.scale}
                  onChange={event => setOption('scale', event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.paddingXLabel}</span>
                <input
                  type="number"
                  min="0"
                  max="400"
                  value={options.paddingX}
                  onChange={event => setOption('paddingX', event.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.paddingYLabel}</span>
                <input
                  type="number"
                  min="0"
                  max="400"
                  value={options.paddingY}
                  onChange={event => setOption('paddingY', event.target.value)}
                />
              </label>
            </div>

            <label className="field slider-field">
              <span>{t.stretchLabel(Number(options.stretchForce).toFixed(2))}</span>
              <input
                type="range"
                min="0.1"
                max="2.5"
                step="0.05"
                value={options.stretchForce}
                onChange={event => setOption('stretchForce', event.target.value)}
              />
            </label>

            <label className="check-row standalone">
              <input
                type="checkbox"
                checked={options.hideScoreInfo}
                onChange={event => setOption('hideScoreInfo', event.target.checked)}
              />
              <span>{t.hideScoreInfo}</span>
            </label>
          </div>
        </section>

        <div className="export-area">
          <button className="primary export-btn" onClick={renderZip} disabled={!canSubmit}>
            {t.zipBtn}
          </button>
        </div>

        <section className={`status ${message ? 'visible' : ''}`}>
          {busy && <span className="spinner" aria-hidden="true" />}
          <span>{message || t.ready}</span>
        </section>
      </main>
    </>
  );
}
