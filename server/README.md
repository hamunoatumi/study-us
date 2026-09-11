# StudyUs WebSocketサーバー

接続中のクライアント間で、参加者の状態とアバター姿勢を中継する。
受信したJSONは`shared/websocket/`のバリデーターで検証し、クライアントが送った
ユーザーIDは使用せず、接続時にサーバーが発行する。

## 起動

```console
cd server
npm install
npm run dev
```

ローカル用の環境変数は`.env.example`をコピーして設定できる。

```powershell
Copy-Item .env.example .env
npm run dev
```

`.env`は起動時に読み込まれるが、シェルやホスティングサービス側で設定した
環境変数がある場合はそちらを優先する。実際の`.env`はGitへコミットしない。

- HTTPヘルスチェック: `http://localhost:3000/health`
- WebSocket: `ws://localhost:3000/ws`
- 拡張機能ZIP: `http://localhost:3000/extension/download`

## 設定

環境変数で次の値を変更できる。

| 環境変数 | 既定値 | 用途 |
| --- | --- | --- |
| `PORT` | `3000` | HTTP/WebSocketの待受ポート |
| `WEBSOCKET_PATH` | `/ws` | WebSocketの接続パス |
| `ALLOWED_ORIGINS` | 未設定 | 接続を許可するフロントのOrigin。複数はカンマ区切り |
| `EXTENSION_ALLOWED_ORIGINS` | `ALLOWED_ORIGINS`の値 | 配布ZIP内の拡張機能を動作させるOrigin。複数はカンマ区切り |
| `BANNED_HOSTNAMES` | `youtube.com` | BAN対象ホスト名。複数はカンマ区切り |
| `HEARTBEAT_TIMEOUT_MS` | `30000` | 受信が途絶えた参加者を離席にする時間 |
| `DISCONNECT_TIMEOUT_MS` | `60000` | 受信が途絶えた接続を切断する時間 |
| `MAX_PARTICIPANTS` | `100` | 同時参加者の上限（最大100） |

`youtube.com`を指定すると、`www.youtube.com`などのサブドメインも対象になる。
`ALLOWED_ORIGINS`を設定した場合、一覧にないOriginとOriginを持たない接続は拒否する。
ローカル開発では未設定にすることで、接続元を制限せずに利用できる。
拡張機能ZIPの`manifest.json`と`config.js`には
`EXTENSION_ALLOWED_ORIGINS`を反映する。未設定の場合は`ALLOWED_ORIGINS`を使用する。
どちらも未設定のローカル開発では、localhostと127.0.0.1の全ポートを許可する。
`VITE_ALLOWED_HOSTS`はVite開発サーバーへのアクセス許可であり、
拡張機能の許可Originには使用しない。
URL全体やページタイトルは保存・配信しない。
アバター姿勢は最新値を保持し、他の参加者への配信を最大15fpsに制限する。
クライアントへの送信待ちが64 KiB以上の場合は姿勢の配信を省略し、古い姿勢が
溜まり続けることを防ぐ。送信待ちが1 MiB以上になった接続は切断する。

## ブロードキャストのデモ

サーバーを起動したまま、別のターミナルで実行する。

```console
cd server
npm run demo
```

デモは2つのクライアントを参加させ、次の受信結果を表示する。

1. ルームのスナップショットと参加通知
2. アバター姿勢の転送
3. YouTube閲覧による`distracted`への変更
4. 拡張機能の応答喪失による`unknown`への変更
5. 顔検出喪失による`away`への変更
6. 明示的な退出による`participant.left`

接続先を変える場合は`WS_URL`を指定する。

## ビルドと型チェック

```console
npm run typecheck
npm run build
npm start
```

複数ルームの管理、永続化、認証はこの中継機能の対象外である。接続中の参加者は
サーバーのメモリ上で管理される。
