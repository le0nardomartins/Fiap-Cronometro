import { gsap } from "gsap";
import { tsParticles } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import fiapLogo from "../assets/logo-fiap.png";
import "./styles/style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <div id="particles"></div>
  <main class="shell">
    <header class="brand">
      <img class="logo" src="${fiapLogo}" alt="Logo FIAP" />
      <nav class="mode-switch" aria-label="Selecionar modo">
        <button class="mode-btn active" data-mode="timer" type="button">
          <span>Temporizador</span>
        </button>
        <button class="mode-btn" data-mode="stopwatch" type="button">
          <span>Cronometro</span>
        </button>
      </nav>
    </header>

    <section class="stage">
      <div class="view view-timer is-visible" id="timerView">
        <input
          id="timerDisplayInput"
          class="big-time big-time-input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          value="02:00"
          aria-label="Tempo do temporizador"
        />
      </div>

      <div class="view view-stopwatch" id="stopwatchView" hidden>
        <p id="stopwatchDisplay" class="big-time big-time-text">00:00:00</p>
      </div>

      <div class="controls">
        <button id="controlStart" class="icon-btn icon-start" type="button" aria-label="Iniciar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        </button>
        <button id="controlPause" class="icon-btn icon-pause" type="button" aria-label="Pausar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 5h4v14H7zm6 0h4v14h-4z"></path>
          </svg>
        </button>
        <button id="controlReset" class="icon-btn icon-reset" type="button" aria-label="Reiniciar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 8a7 7 0 1 1-2 4.9"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            ></path>
            <path
              d="M7 4.8v3.8h3.8"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </button>
      </div>
    </section>
  </main>
`;

const modeButtons = [...document.querySelectorAll(".mode-btn")];
const timerView = document.querySelector("#timerView");
const stopwatchView = document.querySelector("#stopwatchView");
const timerDisplayInput = document.querySelector("#timerDisplayInput");

const stopwatchDisplay = document.querySelector("#stopwatchDisplay");
const controlStart = document.querySelector("#controlStart");
const controlPause = document.querySelector("#controlPause");
const controlReset = document.querySelector("#controlReset");

let stopwatchElapsed = 0;
let stopwatchStartedAt = 0;
let stopwatchRaf = null;
let stopwatchRunning = false;
let activeMode = "timer";

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
  stopwatchDisplay.classList.add("is-running");
};

const pauseStopwatch = () => {
  if (!stopwatchRunning) return;
  stopwatchRunning = false;
  stopwatchElapsed += performance.now() - stopwatchStartedAt;
  cancelAnimationFrame(stopwatchRaf);
  stopwatchRaf = null;
  stopwatchDisplay.classList.remove("is-running");
};

const resetStopwatch = () => {
  pauseStopwatch();
  stopwatchElapsed = 0;
  stopwatchDisplay.textContent = "00:00:00";
};

let timerRunning = false;
let timerRemainingMs = 120000;
let timerConfiguredMs = 120000;
let timerLastTick = 0;
let timerInterval = null;
let timerDraftDigits = "200";

const MAX_TIMER_DIGITS = 5;

const clampInt = (value, min, max) => Math.min(max, Math.max(min, value));

const getTimerDigits = (value) => value.replace(/\D/g, "").slice(0, MAX_TIMER_DIGITS);

const digitsToTimerParts = (digitsValue) => {
  const digits = getTimerDigits(digitsValue);
  let minutes = 0;
  let seconds = 0;

  if (digits.length <= 2) {
    seconds = parseInt(digits || "0", 10) || 0;
  } else {
    minutes = parseInt(digits.slice(0, -2), 10) || 0;
    seconds = parseInt(digits.slice(-2), 10) || 0;
  }

  minutes = clampInt(minutes, 0, 999);
  seconds = clampInt(seconds, 0, 59);

  return { minutes, seconds, digits };
};

const parseTimerInputValue = () => {
  const { minutes, seconds, digits } = digitsToTimerParts(timerDraftDigits);
  return {
    milliseconds: (minutes * 60 + seconds) * 1000,
    text: `${pad2(minutes)}:${pad2(seconds)}`,
    digits
  };
};

const formatTimer = (ms) => {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.ceil(clamped / 1000);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${pad2(min)}:${pad2(sec)}`;
};

const renderTimer = () => {
  timerDisplayInput.value = formatTimer(timerRemainingMs);
};

const pauseTimer = () => {
  if (!timerRunning) return;
  timerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  timerDisplayInput.disabled = false;
  timerDisplayInput.classList.remove("is-running");
};

const finishTimer = () => {
  pauseTimer();
  timerRemainingMs = 0;
  renderTimer();
  gsap.fromTo(
    timerDisplayInput,
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

  if (timerRemainingMs <= 0) {
    timerRemainingMs = timerConfiguredMs;
    renderTimer();
  }

  if (timerRemainingMs <= 0) return;

  timerRunning = true;
  timerDisplayInput.disabled = true;
  timerDisplayInput.classList.add("is-running");
  timerLastTick = performance.now();
  timerInterval = setInterval(tickTimer, 80);
};

const resetTimer = () => {
  pauseTimer();
  timerRemainingMs = timerConfiguredMs;
  renderTimer();
};

const applyTimerInput = () => {
  if (timerRunning) return;
  const parsed = parseTimerInputValue();
  timerConfiguredMs = parsed.milliseconds;
  timerRemainingMs = parsed.milliseconds;
  timerDisplayInput.value = parsed.text;
  timerDraftDigits = parsed.digits;
};

const setMode = (mode) => {
  activeMode = mode;
  const timerSelected = mode === "timer";

  timerView.hidden = !timerSelected;
  stopwatchView.hidden = timerSelected;
  timerView.classList.toggle("is-visible", timerSelected);
  stopwatchView.classList.toggle("is-visible", !timerSelected);

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  const visibleView = timerSelected ? timerView : stopwatchView;
  gsap.fromTo(visibleView, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.28 });
};

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

const startActiveMode = () => {
  if (activeMode === "timer") {
    startTimer();
    return;
  }
  startStopwatch();
};

const pauseActiveMode = () => {
  if (activeMode === "timer") {
    pauseTimer();
    return;
  }
  pauseStopwatch();
};

const resetActiveMode = () => {
  if (activeMode === "timer") {
    resetTimer();
    return;
  }
  resetStopwatch();
};

controlStart.addEventListener("click", startActiveMode);
controlPause.addEventListener("click", pauseActiveMode);
controlReset.addEventListener("click", resetActiveMode);

timerDisplayInput.addEventListener("focus", () => {
  timerDraftDigits = getTimerDigits(timerDisplayInput.value);
});
timerDisplayInput.addEventListener("input", () => {
  if (timerRunning) return;
  timerDraftDigits = getTimerDigits(timerDisplayInput.value);
  const parsed = parseTimerInputValue();
  timerDisplayInput.value = parsed.text;
});
timerDisplayInput.addEventListener("blur", applyTimerInput);
timerDisplayInput.addEventListener("keydown", (event) => {
  if (timerRunning) return;

  if (
    event.key.length === 1 &&
    !/\d/.test(event.key) &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    event.preventDefault();
    return;
  }

  if (event.key === "Enter") {
    timerDisplayInput.blur();
  }
});

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
        number: { value: 170, density: { enable: true, area: 900 } },
        color: { value: ["#ED145B", "#FFFFFF", "#5B5B63"] },
        links: {
          enable: true,
          color: "#ED145B",
          distance: 145,
          opacity: 0.28,
          width: 1
        },
        move: {
          enable: true,
          speed: 1.7,
          outModes: { default: "bounce" }
        },
        opacity: { value: { min: 0.08, max: 0.62 } },
        size: { value: { min: 1, max: 4.2 } }
      }
    }
  });
};

const animateUi = () => {
  gsap.from(".brand", {
    y: 24,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out"
  });

  gsap.from(".mode-switch", {
    y: 12,
    opacity: 0,
    duration: 0.6,
    delay: 0.2,
    ease: "power2.out"
  });

  gsap.from(".stage", {
    opacity: 0,
    y: 18,
    duration: 0.8,
    delay: 0.28,
    ease: "power3.out",
    clearProps: "all"
  });

  gsap.to(".logo", {
    y: 6,
    duration: 2.1,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  });

  document.querySelectorAll(".icon-btn, .mode-btn").forEach((button) => {
    button.addEventListener("mouseenter", () => {
      gsap.to(button, { y: -2, scale: 1.03, duration: 0.18, ease: "power2.out" });
    });
    button.addEventListener("mouseleave", () => {
      gsap.to(button, { y: 0, scale: 1, duration: 0.2, ease: "power2.out" });
    });
  });
};

applyTimerInput();
setMode("timer");
animateUi();
initParticles();
