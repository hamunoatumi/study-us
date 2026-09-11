# StudyUs

友達同士で「勉強中 / サボり / 離席」の状態をリアルタイムで共有し、
2Dアバターでお互いの存在を感じながら勉強するWebアプリ。

## ngrokの公開URL設定

ルートの`.env.example`を`.env`にコピーし、公開Originを1か所だけ設定する。

```env
PUBLIC_APP_ORIGIN=https://example.ngrok-free.dev
```

この値からWebSocket接続先、WebSocketのOrigin制限、Viteの許可ホスト、
配布するChrome拡張機能の許可Originを導出する。
フロントとサーバーを別Originでデプロイする場合は、
各フォルダの`.env.example`に記載した個別変数で上書きできる。
