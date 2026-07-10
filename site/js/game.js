const ROUND_MS = 15_000;
const TARGET_SIZE = 68;

export function createGame({
  arena,
  target,
  startButton,
  startLayer,
  message,
  scoreValue,
  timeValue,
  onFinish,
}) {
  let score = 0;
  let running = false;
  let startedAt = 0;
  let frameId = 0;

  function moveTarget() {
    const padding = 12;
    const maxX = Math.max(padding, arena.clientWidth - TARGET_SIZE - padding);
    const maxY = Math.max(padding, arena.clientHeight - TARGET_SIZE - padding);
    const x = padding + Math.random() * (maxX - padding);
    const y = padding + Math.random() * (maxY - padding);
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
  }

  function finish() {
    running = false;
    cancelAnimationFrame(frameId);
    target.hidden = true;
    startLayer.hidden = false;
    message.textContent = `FINISH — ${score} PTS`;
    startButton.firstChild.textContent = "RETRY ";
    timeValue.textContent = "0.0";
    onFinish(score);
  }

  function tick(now) {
    if (!running) return;
    const remaining = Math.max(0, ROUND_MS - (now - startedAt));
    timeValue.textContent = (remaining / 1000).toFixed(1);

    if (remaining === 0) {
      finish();
      return;
    }

    frameId = requestAnimationFrame(tick);
  }

  function start() {
    score = 0;
    running = true;
    scoreValue.textContent = "0";
    timeValue.textContent = (ROUND_MS / 1000).toFixed(1);
    startLayer.hidden = true;
    target.hidden = false;
    moveTarget();
    startedAt = performance.now();
    frameId = requestAnimationFrame(tick);
  }

  function hit() {
    if (!running) return;
    score += 1;
    scoreValue.textContent = String(score);
    moveTarget();
  }

  startButton.addEventListener("click", start);
  target.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    hit();
  });

  window.addEventListener("resize", () => {
    if (running) moveTarget();
  });

  return { start };
}
