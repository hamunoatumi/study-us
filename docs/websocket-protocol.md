# WebSocket通信仕様

## 目的

StudyUsのフロントエンドとサーバー間で、参加状態、アクティブタブ、
アバター姿勢をJSONとして安全に送受信するための形式を定義する。
TypeScript型と実行時バリデーターは`shared/websocket/`を正本とする。

## 共通形式

すべてのメッセージは次の外枠を使用する。

```json
{
  "v": 1,
  "type": "avatar.pose",
  "seq": 42,
  "sentAt": 1788652800000,
  "payload": {}
}
```

- `v`: 通信仕様のバージョン。現在は`1`。
- `type`: メッセージ種別。
- `seq`: 送信側の接続内で増加する0以上の整数。
- `sentAt`: 送信時刻を表すUnix時刻（ミリ秒）。
- `payload`: メッセージ種別ごとのデータ。

クライアントから届いた`userId`は信用しない。ルーム参加後は、サーバーが
WebSocket接続とユーザーを関連付け、転送時にサーバー側で`userId`を付与する。

## クライアントからサーバー

### `room.join`

```json
{
  "v": 1,
  "type": "room.join",
  "seq": 1,
  "sentAt": 1788652800000,
  "payload": {
    "roomId": "room-123",
    "username": "Taro",
    "avatarId": "haru"
  }
}
```

### `activity.tab`

```json
{
  "v": 1,
  "type": "activity.tab",
  "seq": 2,
  "sentAt": 1788652801000,
  "payload": {
    "hostname": "www.youtube.com"
  }
}
```

閲覧内容を必要以上に収集しないため、URL全体やページタイトルは送らない。
サーバーは`hostname`とBAN対象ドメインを比較してステータスを判定する。

### `avatar.pose`

```json
{
  "v": 1,
  "type": "avatar.pose",
  "seq": 3,
  "sentAt": 1788652802000,
  "payload": {
    "faceX": 0.12,
    "faceY": -0.08,
    "headYaw": 0.24,
    "headPitch": 0.15,
    "rotation": -0.05,
    "eyeOpenLeft": 0.92,
    "eyeOpenRight": 0.88,
    "eyeX": 0.2,
    "eyeY": -0.1,
    "mouthOpen": 0
  }
}
```

カメラ映像やMediaPipeのランドマークは送らず、アバター描画に必要な正規化済みの
値だけを送る。姿勢値は10〜15fpsを上限の目安とし、小数第3位程度へ丸める。

`faceX`、`faceY`、`headYaw`、`headPitch`、`rotation`、`eyeX`、`eyeY`は
`-1`から`1`、目の開きと`mouthOpen`は`0`から`1`の範囲とする。

### `avatar.tracking`

```json
{
  "v": 1,
  "type": "avatar.tracking",
  "seq": 4,
  "sentAt": 1788652803000,
  "payload": {
    "faceDetected": false
  }
}
```

顔検出状態が変化したときだけ送信する。

### `heartbeat`

```json
{
  "v": 1,
  "type": "heartbeat",
  "seq": 5,
  "sentAt": 1788652810000,
  "payload": {}
}
```

10〜15秒間隔で送信し、サーバーは一定時間受信できなければ切断または離席として
扱う。

## サーバーからクライアント

- `room.snapshot`: 参加直後・再接続時の参加者一覧。
- `participant.joined`: 参加者の追加。
- `participant.left`: 参加者の退出。
- `participant.status`: `studying`、`distracted`、`away`の変更。
- `participant.pose`: 他ユーザーのアバター姿勢。
- `protocol.error`: 不正なメッセージや参加失敗の通知。

例として、ステータス更新は次の形式で配信する。

```json
{
  "v": 1,
  "type": "participant.status",
  "seq": 58,
  "sentAt": 1788652804000,
  "payload": {
    "userId": "user-123",
    "status": "distracted",
    "changedAt": 1788652804000
  }
}
```

BAN対象のホスト名は他の参加者へ配信しない。

## ステータス判定順序

サーバーは次の優先順位で参加状態を決定する。

1. ハートビート切れ、または一定時間顔を検出できない: `away`
2. BAN対象サイトを表示中: `distracted`
3. それ以外: `studying`

## 受信時の検証

WebSocketから受信したJSONは`unknown`として扱い、処理前に必ず検証する。

```ts
import { parseClientMessage } from '../shared/websocket/index.js'

const parsedJson: unknown = JSON.parse(receivedText)
const result = parseClientMessage(parsedJson)

if (!result.ok) {
  console.error(result.error)
  return
}

switch (result.value.type) {
  case 'avatar.pose':
    console.log(result.value.payload.headYaw)
    break
}
```

現在のバリデーターは、プロトコルバージョン、メッセージ種別、必須値、文字列長、
数値範囲を検証する。未知のメッセージ種別は受け入れない。
