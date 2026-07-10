// Firebase Console > Project settings > Your apps > SDK setup and configuration
// に表示される値へ置き換えてください。FirebaseのWeb APIキーは公開前提の識別子です。
export const firebaseConfig = {
  apiKey: "AIzaSyAPUmy82ASU4TseDkINDSQSkoRiwvBhlIM",
  authDomain: "taku-f8db6.firebaseapp.com",
  projectId: "taku-f8db6",
  storageBucket: "taku-f8db6.firebasestorage.app",
  messagingSenderId: "1062178841013",
  appId: "1:1062178841013:web:c6dfd06cb7b1bd8bd239fc",
};

// 任意: App Checkを使う場合だけreCAPTCHA v3のサイトキーを設定します。
export const appCheckSiteKey = "";

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.projectId,
  firebaseConfig.appId,
];

export const firebaseEnabled =
  requiredConfig.every(Boolean) &&
  !requiredConfig.some((value) => String(value).includes("YOUR_"));
