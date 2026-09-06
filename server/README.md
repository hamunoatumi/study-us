# StudyUs WebSocketサーバー

同じルームへ参加したクライアント間で、参加者の状態とアバター姿勢を中継する。
受信したJSONは`shared/websocket/`のバリデーターで検証し、クライアントが送った
ユーザーIDは使用せず、接続時にサーバーが発行する。

## 起動

```console
cd server
npm install
npm run dev
```

- HTTPヘルスチェック: `http://localhost:3000/health`
- WebSocket: `ws://localhost:3000/ws`

## 設定

環境変数で次の値を変更できる。

| 環境変数 | 既定値 | 用途 |
| --- | --- | --- |
| `PORT` | `3000` | HTTP/WebSocketの待受ポート |
| `WEBSOCKET_PATH` | `/ws` | WebSocketの接続パス |
| `BANNED_HOSTNAMES` | `youtube.com` | BAN対象ホスト名。複数はカンマ区切り |
| `HEARTBEAT_TIMEOUT_MS` | `30000` | 受信が途絶えた参加者を離席にする時間 |
| `MAX_ROOM_PARTICIPANTS` | `100` | 1ルームの参加上限（最大100） |

`youtube.com`を指定すると、`www.youtube.com`などのサブドメインも対象になる。
URL全体やページタイトルは保存・配信しない。

## ブロードキャストのデモ

サーバーを起動したまま、別のターミナルで実行する。

```console
cd server
npm run demo
```

デモは2つのクライアントを同じルームへ参加させ、次の受信結果を表示する。

1. ルームのスナップショットと参加通知
2. アバター姿勢の転送
3. YouTube閲覧による`distracted`への変更
4. 顔検出喪失による`away`への変更

接続先を変える場合は`WS_URL`を指定する。

## ビルドと型チェック

```console
npm run typecheck
npm run build
npm start
```

ルーム自体の永続化や存在確認、認証はこの中継機能の対象外である。現在のルームは
WebSocket接続をメモリ上でグループ化したもので、最後の参加者が退出すると破棄される。
