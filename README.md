# PICO POP — GitHub Pages × Firebase ミニゲーム構成

GitHub Pagesでゲーム本体を配信し、Firebase Authentication（匿名認証）とCloud Firestoreでオンラインランキングだけを管理する最小構成です。Firebaseが未設定・一時的に利用できない場合も、ブラウザの`localStorage`を使うローカルランキングで遊べます。

## 構成

```text
Testgame/
├─ site/                         # GitHub Pagesで公開する静的ファイル
│  ├─ index.html
│  ├─ styles.css
│  └─ js/
│     ├─ main.js                # 画面制御
│     ├─ game.js                # 15秒タップゲーム
│     ├─ firebase-service.js    # 認証・ランキングI/O・ローカル代替
│     └─ firebase-config.js     # Firebase Webアプリ設定
├─ firebase/
│  ├─ firestore.rules           # スコア以外を拒否するルール
│  └─ firestore.indexes.json
├─ .github/workflows/
│  └─ deploy-pages.yml          # mainへのpushで自動公開
├─ firebase.json
└─ .firebaserc.example
```

## まずローカルで遊ぶ

モジュールを使っているため、`index.html`を直接開くのではなく簡易サーバーを起動します。

```bash
python -m http.server 8000 -d site
```

ブラウザで `http://localhost:8000` を開きます。この時点では`LOCAL MODE`で、Firebaseなしでも動作します。

## Firebaseを接続する

1. [Firebase Console](https://console.firebase.google.com/)でSparkプランのプロジェクトを作成します。Google Analyticsはこの構成では不要です。
2. Webアプリを登録し、表示された設定値を `site/js/firebase-config.js` にコピーします。
3. Authentication → Sign-in method で「匿名」を有効にします。
4. Firestore Databaseを作成します。日本中心ならリージョンは利用者に近い場所を選びます。開始後すぐ本リポジトリのルールへ置き換えるため、公開前にテストモードのまま放置しないでください。
5. `.firebaserc.example` を `.firebaserc` にコピーし、`YOUR_PROJECT_ID`を実際のProject IDへ変更します。
6. ルールをデプロイします。

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

任意でApp Checkを有効化する場合は、reCAPTCHA v3のサイトキーを`site/js/firebase-config.js`の`appCheckSiteKey`へ設定し、動作確認後にFirestoreの強制適用を有効にします。

## GitHub Pagesへ公開する

1. このフォルダーをGitHubの新しいリポジトリへpushします。
2. リポジトリの Settings → Pages → Build and deployment → Source で `GitHub Actions` を選択します。
3. `main`へpushすると、同梱のworkflowが`site/`だけを公開します。
4. Firebase Authenticationの許可済みドメインに、必要に応じて`<ユーザー名>.github.io`を追加します。

FirebaseのWeb設定値（APIキーを含む）はブラウザから利用するため公開されます。秘密鍵として扱うのではなく、Authentication・Firestore Security Rules・App Checkで権限を制御します。サービスアカウントJSONやAdmin SDKの秘密鍵は絶対に`site/`へ置かないでください。

## 無料枠を活かす実装方針

- ゲーム画面・CSS・JavaScriptはGitHub Pagesに置き、Firebase HostingとCloud Functionsは使いません。
- Firestoreは上位10件を必要な時だけ取得し、リアルタイム監視を使いません。1回の表示で最大10ドキュメント読み取りです。
- スコアは匿名ユーザーUIDをドキュメントIDにして1人1件とし、プレイごとの無制限な追加を避けます。
- 端末内ベストを更新した時だけ保存する設計にし、書き込み回数を抑えます。
- Security Rulesでフィールド、名前の長さ、スコア範囲、UID、サーバー時刻を検証します。
- Firebase障害時や未設定時は`localStorage`へフォールバックし、ゲーム本体を止めません。
- 画像・BGMを追加する場合は圧縮し、巨大な動画やユーザー投稿ファイルはGitHub Pages/Firestoreに載せません。

2026年7月時点の公式案内では、Cloud Firestoreの無料枠は1プロジェクトにつき無料データベース1個、保存1GiB、1日50,000読み取り・20,000書き込み・20,000削除、月10GiBの外向き転送です。GitHub Pagesは公開サイト1GB、月100GBのソフト帯域上限が案内されています。最新値は必ず公式ページで確認してください。

- [Cloud Firestoreの料金と無料枠](https://firebase.google.com/docs/firestore/pricing)
- [Firebase Authenticationの制限](https://firebase.google.com/docs/auth/limits)
- [Firebase App Check（Web）](https://firebase.google.com/docs/app-check/web/recaptcha-provider)
- [GitHub Pagesの制限](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub Pagesの公開元設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 小規模の次に追加しやすいもの

- 2つ目のゲーム: `site/games/<game-name>/`を追加し、ランキングの`gameId`を分ける
- 効果音: 100〜300KB程度の圧縮音源を必要時だけ読み込む
- 日次ランキング: Cloud Functionsを使わず、`seasonId`（例: `2026-07-10`）をスコアに追加
- チート耐性: App Checkを有効化。厳密なスコア検証が必要になった段階でのみ、信頼できるサーバー処理を検討

クライアントだけで動くゲームのスコアは完全な改ざん防止ができません。この構成は友人内・小規模公開向けです。賞金や景品を扱う場合は、サーバー側でゲーム進行を検証する別構成にしてください。
