// Firebase Console > Project settings > Your apps > SDK setup and configuration
// に表示される値へ置き換えてください。FirebaseのWeb APIキーは公開前提の識別子です。
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
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
