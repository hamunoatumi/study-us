# デプロイ手順

フロントエンドはCloudflare Pages、WebSocketサーバーはRenderへ別々に
デプロイする。

## 1. Renderへサーバーをデプロイする

1. Renderで本リポジトリを接続する。
2. リポジトリ直下の`render.yaml`を使ってBlueprintを作成する。
3. 初回作成時に`ALLOWED_ORIGINS`へCloudflare PagesのOriginを設定する。

```text
https://<Cloudflare Pagesのプロジェクト名>.pages.dev
```

独自ドメインも使う場合は、カンマ区切りで両方指定する。

```text
https://<プロジェクト名>.pages.dev,https://<独自ドメイン>
```

デプロイ後、次のURLへアクセスし、`{"status":"ok"}`が返ることを確認する。

```text
https://<Renderのサービス名>.onrender.com/health
```

WebSocketの接続先は次の形式になる。

```text
wss://<Renderのサービス名>.onrender.com/ws
```

`PORT`はRenderが自動設定するため、`render.yaml`では指定しない。

## 2. Cloudflare Pagesへフロントエンドをデプロイする

Cloudflare Pagesで本リポジトリを接続し、次のビルド設定を指定する。

| 項目 | 値 |
| --- | --- |
| ルートディレクトリ | `frontend` |
| ビルドコマンド | `npm run build` |
| ビルド出力ディレクトリ | `dist` |

Production環境の環境変数には、Renderで確認した接続先を設定する。

| 環境変数 | 値 |
| --- | --- |
| `VITE_WEBSOCKET_URL` | `wss://<Renderのサービス名>.onrender.com/ws` |

`VITE_`で始まる値はビルド時にJavaScriptへ埋め込まれるため、秘密情報は
設定しない。

## 3. Originを確定する

Cloudflare PagesのURLが確定したら、Renderの`ALLOWED_ORIGINS`がそのOriginと
完全に一致していることを確認する。URLのパスや末尾のスラッシュは含めない。

設定変更後、Cloudflare Pagesを再デプロイし、ブラウザーからルームへ参加して
WebSocket接続が成功することを確認する。

## ローカルで環境変数を使う

`frontend/.env.example`を`frontend/.env.local`へコピーして接続先を変更する。
`.env.local`はGitの追跡対象外になる。
