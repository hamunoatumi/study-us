# 使用ライブラリ

外部ライブラリを追加するときは、採用目的、利用箇所、データの扱い、
ライセンス、更新時の注意事項をこのファイルへ記録する。

## @mediapipe/tasks-vision

- バージョン: `1.0.1`
- ライセンス: Apache-2.0
- 公式サイト: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js
- npm: https://www.npmjs.com/package/@mediapipe/tasks-vision

### 採用目的

カメラ映像から顔の位置、傾き、まばたき、口の開閉を検出し、
Canvas 2Dアバターへ反映するために使用する。検出対象は1人に限定する。

### 利用箇所

- `frontend/src/features/avatar/faceTracker.ts`
  - Face Landmarkerの初期化
  - 動画フレームからの顔検出
  - 検出結果から`AvatarPose`への変換
- `frontend/src/features/avatar/avatarController.ts`
  - 顔検出器とカメラ・描画処理の統合

画面側では、MediaPipeを直接操作せず次の関数を使用する。

```ts
const controller = await createFaceTrackedAvatarController({
  video,
  canvas,
  onError: console.error,
})

await controller.start()

// 退出時
controller.destroy()
```

### 検出結果の変換

| MediaPipeの出力 | StudyUsの値 | 用途 |
| --- | --- | --- |
| 鼻のランドマーク | `faceX`, `faceY` | アバターの顔位置 |
| 左右の目のランドマーク | `rotation` | 顔の傾き |
| `eyeBlinkLeft` | `eyeOpenLeft` | 左目の開き |
| `eyeBlinkRight` | `eyeOpenRight` | 右目の開き |
| `jawOpen` | `mouthOpen` | 口の開き |

値は描画前に`0`から`1`、または`-1`から`1`へ制限する。
検出値の揺れを抑えるため、直前の値との平滑化を行う。

### モデルとWASM

初期実装では、ブラウザ起動時に次の公式配布先から取得する。

- WASM: jsDelivr上の`@mediapipe/tasks-vision@1.0.1`
- モデル: GoogleのMediaPipe Models

URLは`createFaceTracker()`のオプションで差し替えられる。VPSから自己配信する場合は、
`wasmBaseUrl`と`modelAssetUrl`へ同一オリジンのURLを指定する。

### データとプライバシー

- カメラ映像はブラウザ内で推論し、StudyUsサーバーへ送信しない。
- サーバーへ送信する場合は、アバター用に正規化した状態値だけを対象とする。
- MediaPipe Tasksの公式プライバシー記載では、入力データは端末内で処理される。
- 同記載では、性能・利用状況のメトリクスがGoogleへ送られる場合があるため、
  本番公開前にユーザーへの説明と同意要否を確認する。

### 更新時の確認

- `package-lock.json`を更新し、意図したバージョンであることを確認する。
- `npm run typecheck`と`npm run build`を実行する。
- blendshape名や戻り値の型に変更がないか確認する。
- WASMとモデルの取得URLが利用可能か確認する。
- プライバシー通知とライセンスに変更がないか確認する。

### 置き換え境界

MediaPipe固有処理は`faceTracker.ts`へ閉じ込める。別の顔検出ライブラリへ
置き換える場合も、`PoseProvider`として`AvatarPose`を返せば、カメラ処理、
Canvas描画、画面側の呼び出し方は変更しない。

## 検討中の描画ライブラリ

以下は比較対象であり、現時点ではインストールも採用決定もしていない。
方式ごとの詳細は[アバター描画方式の比較](./avatar-rendering-options.md)を参照する。

### PixiJS

- 状態: 未導入
- 想定用途: PNG/SVGパーツを使った複数アバターの高速描画
- 公式サイト: https://pixijs.com/
- 確認事項: 採用バージョン、バンドルサイズ、WebGLの同時描画性能、ライセンス

### Rive

- 状態: 未導入
- 想定用途: `.riv`で作成したベクターアバターとState Machineの再生
- 公式Webランタイム: https://rive.app/docs/runtimes/web/web-js
- 確認事項: 採用ランタイム、WASMサイズ、素材制作フロー、ランタイムと素材のライセンス

### Live2D Cubism SDK for Web

- 状態: 未導入
- 想定用途: パーツ分け・モデリング済みキャラクターの本格的な表情追従
- 公式マニュアル: https://docs.live2d.com/en/cubism-sdk-manual/cubism-sdk-for-web/
- ライセンス案内: https://www.live2d.com/en/sdk/about/
- 確認事項: StudyUsの配布形態に対する公開ライセンス、モデル利用権、制作工数、性能

検討中のライブラリを実際に導入する場合は、バージョンを固定してこのファイルに
採用理由、利用箇所、データの扱い、ライセンス、更新手順を追記する。
