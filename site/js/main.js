import { connectLeaderboard, loadScores, submitScore } from "./firebase-service.js";
import { createGame } from "./game.js";

const elements = {
  arena: document.querySelector("#arena"),
  target: document.querySelector("#target"),
  startButton: document.querySelector("#start-button"),
  startLayer: document.querySelector("#start-layer"),
  gameMessage: document.querySelector("#game-message"),
  scoreValue: document.querySelector("#score-value"),
  timeValue: document.querySelector("#time-value"),
  bestValue: document.querySelector("#best-value"),
  cloudStatus: document.querySelector("#cloud-status"),
  cloudStatusText: document.querySelector("#cloud-status-text"),
  rankingList: document.querySelector("#ranking-list"),
  scoreForm: document.querySelector("#score-form"),
  playerName: document.querySelector("#player-name"),
  saveScoreButton: document.querySelector("#save-score-button"),
  formMessage: document.querySelector("#form-message"),
};

let latestScore = 0;
let bestScore = Number(localStorage.getItem("pico-pop-best") || 0);
let connectionMode = "local";

elements.bestValue.textContent = String(bestScore);
elements.playerName.value = localStorage.getItem("pico-pop-name") || "";

function setConnectionStatus(mode) {
  connectionMode = mode;
  elements.cloudStatus.dataset.mode = mode;
  elements.cloudStatusText.textContent = mode === "cloud" ? "ONLINE RANKING" : "LOCAL MODE";
}

function renderScores(scores) {
  elements.rankingList.replaceChildren();

  if (!scores.length) {
    const empty = document.createElement("li");
    empty.className = "ranking-placeholder";
    empty.textContent = "まだ記録がありません。最初の1人になろう！";
    elements.rankingList.append(empty);
    return;
  }

  scores.slice(0, 10).forEach((item, index) => {
    const row = document.createElement("li");
    row.className = "ranking-row";

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = String(index + 1).padStart(2, "0");

    const name = document.createElement("span");
    name.className = "ranking-name";
    name.textContent = String(item.name || "PLAYER").slice(0, 12);

    const score = document.createElement("strong");
    score.className = "ranking-score";
    score.textContent = String(Number(item.score) || 0);

    row.append(rank, name, score);
    elements.rankingList.append(row);
  });
}

async function refreshRanking() {
  const scores = await loadScores();
  renderScores(scores);
}

createGame({
  arena: elements.arena,
  target: elements.target,
  startButton: elements.startButton,
  startLayer: elements.startLayer,
  message: elements.gameMessage,
  scoreValue: elements.scoreValue,
  timeValue: elements.timeValue,
  onFinish(score) {
    latestScore = score;
    bestScore = Math.max(bestScore, score);
    localStorage.setItem("pico-pop-best", String(bestScore));
    elements.bestValue.textContent = String(bestScore);
    elements.saveScoreButton.disabled = false;
    elements.formMessage.textContent = `${score}点をランキングに登録できます。`;
  },
});

elements.scoreForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = elements.playerName.value.trim();
  if (!name || latestScore < 0) return;

  elements.saveScoreButton.disabled = true;
  elements.formMessage.textContent = "記録を保存中...";
  localStorage.setItem("pico-pop-name", name.slice(0, 12));

  try {
    const result = await submitScore(name, bestScore);
    elements.formMessage.textContent =
      result.mode === "cloud" ? "オンラインランキングに保存しました！" : "この端末に保存しました。";
    await refreshRanking();
  } catch (error) {
    console.error(error);
    elements.saveScoreButton.disabled = false;
    elements.formMessage.textContent =
      connectionMode === "cloud"
        ? "保存できませんでした。Firebaseの設定とルールを確認してください。"
        : "保存できませんでした。もう一度お試しください。";
  }
});

const connection = await connectLeaderboard();
setConnectionStatus(connection.mode);
await refreshRanking();
