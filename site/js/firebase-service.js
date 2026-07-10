import {
  appCheckSiteKey,
  firebaseConfig,
  firebaseEnabled,
} from "./firebase-config.js";

const GAME_ID = "pico-pop-v1";
const LOCAL_SCORES_KEY = "pico-pop-scores";
const LOCAL_PLAYER_KEY = "pico-pop-player-id";

let auth;
let db;
let mode = "local";
let firestoreApi;

function normalizeName(name) {
  return String(name).trim().replace(/\s+/g, " ").slice(0, 12) || "PLAYER";
}

function readLocalScores() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function localPlayerId() {
  let id = localStorage.getItem(LOCAL_PLAYER_KEY);
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `local-${Date.now()}`;
    localStorage.setItem(LOCAL_PLAYER_KEY, id);
  }
  return id;
}

function saveLocalScore(name, score) {
  const uid = localPlayerId();
  const scores = readLocalScores().filter((item) => item.uid !== uid);
  scores.push({ uid, name: normalizeName(name), score: Number(score) || 0 });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores.slice(0, 10)));
}

export async function connectLeaderboard() {
  if (!firebaseEnabled) return { mode: "local" };

  try {
    const [appApi, authApi, loadedFirestoreApi] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js"),
    ]);
    const app = appApi.initializeApp(firebaseConfig);
    firestoreApi = loadedFirestoreApi;

    if (appCheckSiteKey) {
      const appCheckApi = await import(
        "https://www.gstatic.com/firebasejs/12.15.0/firebase-app-check.js"
      );
      appCheckApi.initializeAppCheck(app, {
        provider: new appCheckApi.ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }

    auth = authApi.getAuth(app);
    db = firestoreApi.getFirestore(app);

    if (!auth.currentUser) {
      await authApi.signInAnonymously(auth);
    }

    mode = "cloud";
    return { mode };
  } catch (error) {
    console.warn("Firebase connection failed; using local ranking.", error);
    mode = "local";
    return { mode, error };
  }
}

export async function loadScores() {
  if (mode !== "cloud" || !db) return readLocalScores();

  try {
    const topTen = firestoreApi.query(
      firestoreApi.collection(db, "scores"),
      firestoreApi.orderBy("score", "desc"),
      firestoreApi.limit(10),
    );
    const snapshot = await firestoreApi.getDocs(topTen);
    return snapshot.docs.map((scoreDoc) => ({ id: scoreDoc.id, ...scoreDoc.data() }));
  } catch (error) {
    console.warn("Cloud ranking could not be loaded; using local ranking.", error);
    return readLocalScores();
  }
}

export async function submitScore(name, score) {
  const cleanName = normalizeName(name);
  const cleanScore = Math.max(0, Math.min(500, Math.trunc(Number(score) || 0)));

  saveLocalScore(cleanName, cleanScore);

  if (mode !== "cloud" || !db || !auth?.currentUser) {
    return { mode: "local" };
  }

  await firestoreApi.setDoc(firestoreApi.doc(db, "scores", auth.currentUser.uid), {
    uid: auth.currentUser.uid,
    name: cleanName,
    score: cleanScore,
    gameId: GAME_ID,
    createdAt: firestoreApi.serverTimestamp(),
  });

  return { mode: "cloud" };
}
