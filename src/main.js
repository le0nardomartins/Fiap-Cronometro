import { gsap } from "gsap";
import { tsParticles } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import "./styles/style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <div id="particles"></div>
  <main class="shell">
    <header class="hero">
      <img class="logo" src="/assets/logo-fiap.png" alt="Logo FIAP" />
      <h1>FIAP Timer Lab</h1>
      <p>Cronometro + Temporizador com estilo clean e animacoes.</p>
    </header>

    <section class="panel" data-panel="cronometro">
      <div class="panel-head">
        <h2>Cronometro</h2>
        <span class="dot"></span>
      </div>
      <p id="stopwatchDisplay" class="display">00:00:00</p>
      <div class="actions">
        <button id="swStart" class="btn btn-primary">Iniciar</button>
        <button id="swPause" class="btn btn-muted">Pausar</button>
        <button id="swReset" class="btn btn-ghost">Zerar</button>
      </div>
    </section>

    <section class="panel" data-panel="temporizador">
      <div class="panel-head">
        <h2>Temporizador</h2>
        <span class="dot"></span>
      </div>
      <div class="timer-inputs">
        <label>
          Min
          <input
            id="timerMin"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="3"
            value="2"
          />
        </label>
        <label>
          Seg
          <input
            id="timerSec"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="2"
            value="0"
          />
        </label>
      </div>
      <p id="timerDisplay" class="display">02:00</p>
      <div class="actions">
        <button id="tmStart" class="btn btn-primary">Iniciar</button>
        <button id="tmPause" class="btn btn-muted">Pausar</button>
        <button id="tmReset" class="btn btn-ghost">Reiniciar</button>
      </div>
    </section>
  </main>
`;

const stopwatchDisplay = document.querySelector("#stopwatchDisplay");
const swStart = document.querySelector("#swStart");
const swPause = document.querySelector("#swPause");
const swReset = document.querySelector("#swReset");

let stopwatchElapsed = 0;
let stopwatchStartedAt = 0;
let stopwatchRaf = null;
let stopwatchRunning = false;

const pad2 = (value) => String(value).padStart(2, "0");

const formatStopwatch = (ms) => {
  const cs = Math.floor(ms / 10) % 100;
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / 60000);
  return `${pad2(min)}:${pad2(sec)}:${pad2(cs)}`;
};

const renderStopwatch = () => {
  const now = performance.now();
  const total = stopwatchElapsed + (now - stopwatchStartedAt);
  stopwatchDisplay.textContent = formatStopwatch(total);
  stopwatchRaf = requestAnimationFrame(renderStopwatch);
};

const startStopwatch = () => {
  if (stopwatchRunning) return;
  stopwatchRunning = true;
  stopwatchStartedAt = performance.now();
  renderStopwatch();
  document.querySelector("[data-panel='cronometro']").classList.add("is-running");
};

const pauseStopwatch = () => {
  if (!stopwatchRunning) return;
  stopwatchRunning = false;
  stopwatchElapsed += performance.now() - stopwatchStartedAt;
  cancelAnimationFrame(stopwatchRaf);
  stopwatchRaf = null;
  document.querySelector("[data-panel='cronometro']").classList.remove("is-running");
};

const resetStopwatch = () => {
  pauseStopwatch();
  stopwatchElapsed = 0;
  stopwatchDisplay.textContent = "00:00:00";
};

swStart.addEventListener("click", startStopwatch);
swPause.addEventListener("click", pauseStopwatch);
swReset.addEventListener("click", resetStopwatch);

const timerDisplay = document.querySelector("#timerDisplay");
const timerMinInput = document.querySelector("#timerMin");
const timerSecInput = document.querySelector("#timerSec");
const tmStart = document.querySelector("#tmStart");
const tmPause = document.querySelector("#tmPause");
const tmReset = document.querySelector("#tmReset");
const timerPanel = document.querySelector("[data-panel='temporizador']");

let timerRunning = false;
let timerRemainingMs = 120000;
let timerLastTick = 0;
let timerInterval = null;

const onlyDigits = (value, maxLength) => value.replace(/\D+/g, "").slice(0, maxLength);
const clampInt = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeTimerInputs = () => {
  const minutesRaw = onlyDigits(timerMinInput.value, 3);
  const secondsRaw = onlyDigits(timerSecInput.value, 2);

  const minutes = clampInt(parseInt(minutesRaw || "0", 10), 0, 999);
  const seconds = clampInt(parseInt(secondsRaw || "0", 10), 0, 59);

  timerMinInput.value = String(minutes);
  timerSecInput.value = String(seconds);

  return { minutes, seconds };
};

const parseTimerInputs = () => {
  const { minutes, seconds } = normalizeTimerInputs();
  return (minutes * 60 + seconds) * 1000;
};

const formatTimer = (ms) => {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.ceil(clamped / 1000);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${pad2(min)}:${pad2(sec)}`;
};

const renderTimer = () => {
  timerDisplay.textContent = formatTimer(timerRemainingMs);
};

const pauseTimer = () => {
  if (!timerRunning) return;
  timerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  timerPanel.classList.remove("is-running");
};

const finishTimer = () => {
  pauseTimer();
  timerRemainingMs = 0;
  renderTimer();
  timerPanel.classList.add("is-finished");
  gsap.fromTo(
    timerDisplay,
    { scale: 1 },
    { scale: 1.06, repeat: 6, yoyo: true, duration: 0.16, ease: "power1.inOut" }
  );
};

const tickTimer = () => {
  const now = performance.now();
  const delta = now - timerLastTick;
  timerLastTick = now;
  timerRemainingMs -= delta;
  renderTimer();

  if (timerRemainingMs <= 0) {
    finishTimer();
  }
};

const startTimer = () => {
  if (timerRunning) return;
  timerPanel.classList.remove("is-finished");

  if (timerRemainingMs <= 0) {
    timerRemainingMs = parseTimerInputs();
    renderTimer();
  }

  if (timerRemainingMs <= 0) return;

  timerRunning = true;
  timerLastTick = performance.now();
  timerInterval = setInterval(tickTimer, 80);
  timerPanel.classList.add("is-running");
};

const resetTimer = () => {
  pauseTimer();
  timerPanel.classList.remove("is-finished");
  timerRemainingMs = parseTimerInputs();
  renderTimer();
};

tmStart.addEventListener("click", startTimer);
tmPause.addEventListener("click", pauseTimer);
tmReset.addEventListener("click", resetTimer);

const bindTimerInput = (input, maxLength) => {
  input.addEventListener("focus", () => input.select());
  input.addEventListener("input", () => {
    input.value = onlyDigits(input.value, maxLength);
  });
  input.addEventListener("blur", resetTimer);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      input.blur();
    }
  });
};

bindTimerInput(timerMinInput, 3);
bindTimerInput(timerSecInput, 2);

const initParticles = async () => {
  await loadSlim(tsParticles);
  await tsParticles.load({
    id: "particles",
    options: {
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      detectRetina: true,
      fpsLimit: 120,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          onClick: { enable: true, mode: "push" }
        },
        modes: {
          repulse: { distance: 90, duration: 0.35 },
          push: { quantity: 6 }
        }
      },
      particles: {
        number: { value: 85, density: { enable: true, area: 900 } },
        color: { value: ["#ED145B", "#FFFFFF", "#5B5B63"] },
        links: {
          enable: true,
          color: "#ED145B",
          distance: 120,
          opacity: 0.18,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.9,
          outModes: { default: "bounce" }
        },
        opacity: { value: { min: 0.08, max: 0.45 } },
        size: { value: { min: 1, max: 3.5 } }
      }
    }
  });
};

const animateUi = () => {
  gsap.from(".hero", {
    y: 24,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out"
  });

  gsap.from(".panel", {
    y: 28,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    stagger: 0.16
  });

  gsap.to(".logo", {
    y: 4,
    duration: 2.1,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  });

  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("mouseenter", () => {
      gsap.to(button, { y: -2, scale: 1.02, duration: 0.2, ease: "power2.out" });
    });
    button.addEventListener("mouseleave", () => {
      gsap.to(button, { y: 0, scale: 1, duration: 0.2, ease: "power2.out" });
    });
  });
};

resetTimer();
animateUi();
initParticles();
