# Guitar Tab Slicer

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

Guitar Tab Slicer は、Guitar Pro/AlphaTex のスコアを動画編集用の PNG オーバーレイに分割するデスクトップアプリです。スコアファイルまたは AlphaTex テキストを入力し、必要な小節範囲とスタイルを選択すると、小節単位の PNG ファイルと `manifest.json` を含む ZIP ファイルを生成します。

## 主な機能

- `.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`, `.gpif`, `.musicxml`, `.xml`, `.alphatex`, `.at`, `.txt` のスコア入力
- AlphaTex の直接貼り付け
- 開始小節、終了小節、画像ごとの小節数の設定
- スコア内のトラック解析と選択
- Tab only, Score + Tab, Score only, Tab mixed の表記モード選択
- PNG の幅、拡大率、左右/上下余白、小節間隔の調整
- 前景色、背景色、背景不透明度の設定
- 完全透明背景の PNG 出力
- タイトルやアーティストなどのスコアヘッダーを非表示にするオプション
- PNG 分割画像とレンダリング情報を含む `manifest.json` の ZIP 保存
- Windows ポータブル実行ファイルのパッケージング

## ダウンロード

リリースページから Windows 用ファイルをダウンロードできます。

- `Guitar Tab Slicer 0.1.0.exe`: インストール不要で実行できる Windows アプリ
- `Guitar Tab Slicer 0.1.0.zip`: ZIP 版ビルド

## 使い方

1. アプリを起動します。
2. スコアファイルを選択するか、AlphaTex を貼り付けます。
3. 解析後、小節範囲とトラックを選択します。
4. 表記モード、色、透明度、画像サイズのオプションを調整します。
5. `Export ZIP` ボタンを押して PNG オーバーレイ ZIP ファイルを保存します。

生成される ZIP には次のようなファイルが含まれます。

```text
01_bars_1-2.png
02_bars_3-4.png
...
manifest.json
```

## 開発環境

Node.js 20 以上を推奨します。

```bash
npm install
```

### デスクトップアプリを開発モードで実行

```bash
npm run dev
```

Vite 開発サーバーと Electron アプリを同時に起動します。

### Web/サーバー開発モードで実行

```bash
npm run dev:web
```

ブラウザで `http://localhost:5173` を開きます。開発モードでは、Vite が `/api` リクエストを Express サーバーへプロキシします。

### プロダクションビルド

```bash
npm run build
```

### Electron アプリの実行

```bash
npm start
```

### Windows リリースファイルの作成

```bash
npm run desktop:dist
```

ビルド成果物は `release/` フォルダーに生成されます。

## サーバーモード

Electron を使わずに Express サーバーだけを実行することもできます。

```bash
npm run build
npm run serve
```

デフォルトのポートは `3001` です。

```bash
PORT=8080 npm run serve
```

## Docker

```bash
docker build -t guitar-tab-slicer .
docker run --rm -p 3001:3001 guitar-tab-slicer
```

その後、`http://localhost:3001` を開きます。

## プロジェクト構成

```text
electron/main.mjs           Electron メインプロセスとファイル選択/保存 IPC
electron/preload.cjs        Renderer に公開する安全なデスクトップ API
electron/render-service.mjs Electron で使用するスコア解析/レンダリングサービス
server/index.mjs            Express API、alphaTab/alphaSkia レンダリング、ZIP 生成
src/App.jsx                 React UI
src/styles.css              画面スタイル
scripts/package-win.mjs     Windows リリースファイルのパッケージングスクリプト
vite.config.js              Vite ビルドと開発サーバープロキシ設定
```

## API

### `GET /api/health`

サーバーの状態を確認します。

### `POST /api/score`

マルチパートフィールド `score` にスコアファイルを送信すると、スコアのメタデータを返します。

### `POST /api/render`

マルチパートフィールド `score` とレンダリングオプションを送信すると、ZIP ファイルを返します。

オプション例:

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

## 注意事項

- レンダリングには alphaTab と alphaSkia を使用しています。
- 大きな Guitar Pro ファイルや複数トラックのスコアは、レンダリングに時間がかかる場合があります。
- デスクトップアプリは現在 Windows ポータブルビルドを基準にパッケージングしています。
- 公開サービスとしてデプロイする場合は、アップロードサイズ制限、rate limit、ジョブキュー、一時ファイル削除ポリシーの追加を推奨します。
- 動画編集ソフト上で PNG が小さすぎたりぼやけたりする場合は、`Image width` と `Scale` の値を上げて出力してください。
