const fiapColors = {
  bg: "#0F0F10",
  card: "#1B1B1E",
  cardAlt: "#24242A",
  text: "#F6F6F7",
  muted: "#B0B3BB",
  pink: "#ED145B",
  pinkDark: "#B80E45",
  border: "#2D2D33"
};

const app = document.createElement("main");
app.innerHTML = `
  <div class="container">
    <h1>FIAP | Cronometro e Temporizador</h1>

    <section class="card">
      <h2>Cronometro</h2>
      <p id="stopwatchDisplay" class="display">00:00:00</p>
      <div class="actions">
        <button id="swStart">Iniciar</button>
        <button id="swPause" class="secondary">Pausar</button>
        <button id="swReset" class="ghost">Zerar</button>
      </div>
    </section>

    <section class="card">
      <h2>Temporizador</h2>
      <div class="inputs">
        <label>
          Min
          <input id="timerMin" type="number" min="0" max="999" value="1" />
        </label>
        <label>
          Seg
          <input id="timerSec" type="number" min="0" max="59" value="0" />
        </label>
      </div>
      <p id="timerDisplay" class="display">01:00</p>
      <div class="actions">
        <button id="tmStart">Iniciar</button>
        <button id="tmPause" class="secondary">Pausar</button>
        <button id="tmReset" class="ghost">Reiniciar</button>
      </div>
    </section>
  </div>
`;
document.body.appendChild(app);

const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; font-family: Arial, sans-serif; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at top, #2A2A31 0%, ${fiapColors.bg} 45%),
      ${fiapColors.bg};
    color: ${fiapColors.text};
  }
  .container {
    width: min(92vw, 520px);
    display: grid;
    gap: 16px;
    padding: 20px 0;
  }
  h1 {
    margin: 0;
    text-align: center;
    color: ${fiapColors.pink};
    font-size: 1.35rem;
    letter-spacing: 0.03em;
  }
  .card {
    background: linear-gradient(180deg, ${fiapColors.card} 0%, ${fiapColors.cardAlt} 100%);
    border: 1px solid ${fiapColors.border};
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 14px 35px rgba(0, 0, 0, 0.3);
  }
  h2 {
    margin: 0 0 10px;
    font-size: 1.05rem;
    color: ${fiapColors.text};
  }
  .display {
    margin: 0 0 14px;
    text-align: center;
    font-size: clamp(2rem, 7vw, 3rem);
    font-weight: 700;
    color: ${fiapColors.pink};
  }
  .inputs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 14px;
  }
  label {
    display: grid;
    gap: 6px;
    color: ${fiapColors.muted};
    font-size: 0.9rem;
  }
  input {
    width: 100%;
    border-radius: 8px;
    border: 1px solid ${fiapColors.border};
    background: #101013;
    color: ${fiapColors.text};
    padding: 10px;
    font-size: 1rem;
    outline: none;
  }
  input:focus {
    border-color: ${fiapColors.pink};
    box-shadow: 0 0 0 2px rgba(237, 20, 91, 0.18);
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  button {
    border: 0;
    border-radius: 10px;
    padding: 10px 12px;
    font-weight: 700;
    cursor: pointer;
    background: ${fiapColors.pink};
    color: white;
  }
  button.secondary {
    background: #34343c;
    color: ${fiapColors.text};
  }
  button.ghost {
    background: transparent;
    color: ${fiapColors.text};
    border: 1px solid ${fiapColors.border};
  }
  button:hover { filter: brightness(1.06); }
  .finished {
    animation: blink 0.6s linear infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
  }
`;
document.head.appendChild(style);

const stopwatchDisplay = document.getElementById("stopwatchDisplay");
const swStart = document.getElementById("swStart");
const swPause = document.getElementById("swPause");
const swReset = document.getElementById("swReset");

let stopwatchElapsedMs = 0;
let stopwatchInterval = null;
let stopwatchLastTick = 0;

function formatStopwatch(ms) {
  const totalCentiseconds = Math.floor(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return [minutes, seconds, centiseconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function startStopwatch() {
  if (stopwatchInterval) return;
  stopwatchLastTick = performance.now();
  stopwatchInterval = setInterval(() => {
    const now = performance.now();
    const delta = now - stopwatchLastTick;
    stopwatchLastTick = now;
    stopwatchElapsedMs += delta;
    stopwatchDisplay.textContent = formatStopwatch(stopwatchElapsedMs);
  }, 10);
}

function pauseStopwatch() {
  clearInterval(stopwatchInterval);
  stopwatchInterval = null;
}

function resetStopwatch() {
  pauseStopwatch();
  stopwatchElapsedMs = 0;
  stopwatchDisplay.textContent = "00:00:00";
}

swStart.addEventListener("click", startStopwatch);
swPause.addEventListener("click", pauseStopwatch);
swReset.addEventListener("click", resetStopwatch);

const timerMin = document.getElementById("timerMin");
const timerSec = document.getElementById("timerSec");
const timerDisplay = document.getElementById("timerDisplay");
const tmStart = document.getElementById("tmStart");
const tmPause = document.getElementById("tmPause");
const tmReset = document.getElementById("tmReset");

let timerRemainingSeconds = 60;
let timerInterval = null;

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTimer(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${pad2(min)}:${pad2(sec)}`;
}

function getSecondsFromInputs() {
  const min = Math.max(0, Number.parseInt(timerMin.value, 10) || 0);
  const secRaw = Math.max(0, Number.parseInt(timerSec.value, 10) || 0);
  const sec = Math.min(secRaw, 59);

  timerMin.value = String(min);
  timerSec.value = String(sec);
  return (min * 60) + sec;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTimer(timerRemainingSeconds);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function startTimer() {
  if (timerInterval) return;
  timerDisplay.classList.remove("finished");

  if (timerRemainingSeconds <= 0) {
    timerRemainingSeconds = getSecondsFromInputs();
  }

  if (timerRemainingSeconds <= 0) return;

  timerInterval = setInterval(() => {
    timerRemainingSeconds -= 1;
    updateTimerDisplay();

    if (timerRemainingSeconds <= 0) {
      timerRemainingSeconds = 0;
      updateTimerDisplay();
      pauseTimer();
      timerDisplay.classList.add("finished");
    }
  }, 1000);
}

function resetTimer() {
  pauseTimer();
  timerRemainingSeconds = getSecondsFromInputs();
  timerDisplay.classList.remove("finished");
  updateTimerDisplay();
}

tmStart.addEventListener("click", startTimer);
tmPause.addEventListener("click", pauseTimer);
tmReset.addEventListener("click", resetTimer);

timerMin.addEventListener("change", resetTimer);
timerSec.addEventListener("change", resetTimer);

updateTimerDisplay();
