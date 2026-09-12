# StudyUs

StudyUsは、友達同士で「勉強中・サボり・離席中」の状態をリアルタイムに共有するWebアプリです。

寮の個室などで一人になると勉強を始めにくい一方、ビデオ通話で姿や細かな行動を見られ続けることには抵抗がある、という課題を対象にしています。カメラ映像の代わりに2Dアバターと大まかな状態だけを共有し、同じ場所で友達と勉強するときの存在感と軽い緊張感を再現します。

## 主な機能

### 2Dアバター

カメラから顔の向き、上下の動き、まばたき、視線を検出し、SVGアバターへ反映します。顔を一時的に検出できなくなった場合は、直前の姿勢から徐々にニュートラルへ戻ります。

### リアルタイム状態共有

WebSocketを使って、参加・退出、アバター姿勢、次のステータスを参加者間で共有します。

| ステータス | 条件 |
| --- | --- |
| 勉強中 | 顔を検出し、寄り道サイトを開いていない |
| サボり | 設定された寄り道サイトを開いている |
| 離席中 | 一定時間顔を検出できない、または接続の応答がない |
| 判定できません | Chrome拡張機能からタブ情報を取得できない |

### 常時表示

Document Picture-in-Picture APIを利用し、課題や資料を別タブで開いたまま、参加者のアバターと状態を小さなウィンドウで確認できます。

### 寄り道サイトの検知

Chrome拡張機能が現在のアクティブタブのホスト名を取得します。サーバーが設定済みの対象ドメインと比較し、該当する場合はステータスを「サボり」へ変更します。

拡張機能がなくてもルームには参加できます。その場合、サボり検知の状態だけが「判定できません」になります。

## プライバシー

- カメラ映像はブラウザ内で処理し、サーバーへ送信しません。
- 顔を識別する顔認証は行いません。
- サーバーへ送るのは、アバター用に正規化した姿勢値と顔検出の有無です。
- タブ判定では現在のホスト名だけを扱い、URL全体、ページタイトル、閲覧履歴は共有しません。
- 他の参加者へ配信するのは、判定後のステータスだけです。
- 行動履歴を保存するデータベースは使用していません。

## 技術構成

| 対象 | 技術 |
| --- | --- |
| フロントエンド | Vite、TypeScript / JavaScript、Tailwind CSS |
| 顔・視線検出 | MediaPipe Face Landmarker |
| アバター描画 | SVG DOM API、TypeScript |
| 常時表示 | Document Picture-in-Picture API |
| リアルタイム通信 | WebSocket、JSON |
| サーバー | Node.js、Express、TypeScript、ws |
| タブ情報取得 | Chrome Extension Manifest V3、Tabs API |
| 拡張機能のZIP生成 | archiver |

## 動作の流れ

```text
カメラ ── MediaPipe ── 正規化した姿勢値 ── WebSocket ── 他の参加者
                         │                                  │
                         └─ SVGアバター              PiPアバター

Chrome拡張機能 ── アクティブタブのホスト名 ── サーバー
                                                │
                                                └─ ステータス判定・配信
```

## 必要な環境

- Node.js 20.12.0以上
- npm
- PC版Google Chrome
- カメラ

Chrome拡張機能とDocument Picture-in-Picture APIを利用するため、現在はPC版Chromeを主な対象にしています。

## ローカルでの起動

フロントエンドとサーバーの依存関係を、それぞれインストールします。

```console
cd server
npm install

cd ../frontend
npm install
```

最初のターミナルでサーバーを起動します。

```console
cd server
npm run dev
```

別のターミナルでフロントエンドを起動します。

```console
cd frontend
npm run dev
```

Chromeで `http://localhost:5173` を開きます。

ローカル開発では、環境変数を設定しなくても次の既定値で動作します。

- HTTPサーバー: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/ws`
- フロントエンド: `http://localhost:5173`

## Chrome拡張機能の導入

1. サーバーとフロントエンドを起動します。
2. StudyUsの参加画面から「サボり検知用Chrome拡張機能を設定する」を開きます。
3. ZIPをダウンロードして展開します。
4. Chromeで `chrome://extensions` を開きます。
5. 「デベロッパーモード」を有効にします。
6. 「パッケージ化されていない拡張機能を読み込む」から、展開したフォルダを選択します。
7. StudyUsのページを再読み込みします。

Chromeは展開したフォルダから拡張機能を読み込むため、導入後にフォルダを移動・削除しないでください。

## ngrokで公開する場合

リポジトリ直下の `.env.example` を `.env` にコピーし、ngrokの公開Originを設定します。

```env
PUBLIC_APP_ORIGIN=https://example.ngrok-free.dev
```

この値から、WebSocket接続先、WebSocketのOrigin制限、Viteの許可ホスト、配布するChrome拡張機能の許可Originを導出します。ドメインが変わった場合は、この値を変更してサーバーとフロントエンドを再起動し、拡張機能を再ダウンロードしてください。

フロントエンドとサーバーを別Originで公開する場合や複数Originを許可する場合は、[frontend/.env.example](./frontend/.env.example) と [server/.env.example](./server/.env.example) の個別設定で上書きできます。実際の `.env` はGitへコミットしないでください。

## プロジェクト構成

```text
study_us/
├─ frontend/   # Web画面、顔検出、SVGアバター、PiP、WebSocketクライアント
├─ server/     # HTTP/WebSocketサーバー、状態判定、拡張機能ZIP配信
├─ extension/  # Chrome拡張機能のソース
├─ shared/     # WebSocketメッセージの型定義と実行時バリデーター
└─ docs/       # 通信仕様、ライブラリ、アバター方式の設計資料
```

## 開発時の確認

フロントエンド:

```console
cd frontend
npm run typecheck
npm run build
```

サーバー:

```console
cd server
npm run typecheck
npm run build
```

WebSocketブロードキャストのデモは、サーバーを起動した状態で実行します。

```console
cd server
npm run demo
```

## 詳細資料

- [WebSocket通信仕様](./docs/websocket-protocol.md)
- [使用ライブラリとデータの扱い](./docs/libraries.md)
- [アバター描画方式の比較](./docs/avatar-rendering-options.md)
- [サーバーの設定とデモ](./server/README.md)
