import { gsap } from "gsap";
import { tsParticles } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import fiapLogo from "../assets/logo-fiap.png";
import "./styles/style.css";

const alarmSoundEntries = Object.entries(
  import.meta.glob("../sounds/*.{mp3,wav,ogg,m4a,aac}", {
    eager: true,
    import: "default"
  })
)
  .map(([filePath, fileUrl]) => {
    const fileName = filePath.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "Alarme";
    return {
      label: fileName.replace(/[_-]+/g, " "),
      value: fileUrl
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

const normalizeLabel = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const defaultAlarmIndex = Math.max(
  0,
  alarmSoundEntries.findIndex((sound) => normalizeLabel(sound.label) === "padrao")
);

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");

const defaultAlarmEntry = alarmSoundEntries[defaultAlarmIndex] ?? null;

const alarmOptionsMarkup = alarmSoundEntries.length
  ? alarmSoundEntries
      .map(
        (sound, index) => `
          <li>
            <button
              class="alarm-option${index === defaultAlarmIndex ? " is-selected" : ""}"
              type="button"
              data-value="${escapeHtml(sound.value)}"
              data-label="${escapeHtml(sound.label)}"
            >
              ${escapeHtml(sound.label)}
            </button>
          </li>
        `
      )
      .join("")
  : `
      <li>
        <button class="alarm-option is-selected" type="button" data-value="" data-label="Sem som">Sem som</button>
      </li>
    `;

const app = document.querySelector("#app");

app.innerHTML = `
  <div id="particles"></div>
  <div class="alarm-dock">
    <button id="alarmToggle" class="alarm-toggle is-off" type="button" aria-pressed="false" aria-label="Ativar alarme">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 18c0 1.2-1.1 2.1-2.4 2.1S4.2 19.2 4.2 18c0-1.2 1.1-2.1 2.4-2.1S9 16.8 9 18Zm0 0V7l10.8-2.9v10.6m0 0c0 1.2-1.1 2.1-2.4 2.1s-2.4-.9-2.4-2.1c0-1.2 1.1-2.1 2.4-2.1s2.4.9 2.4 2.1Z"
        ></path>
      </svg>
    </button>
    <div class="alarm-select-wrap">
      <button
        id="alarmSelectToggle"
        class="alarm-select-trigger"
        type="button"
        aria-label="Selecionar som do alarme"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <span id="alarmSelectLabel">${escapeHtml(defaultAlarmEntry?.label ?? "Sem som")}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10.5 12 15l5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
        </svg>
      </button>
      <ul id="alarmSelectMenu" class="alarm-select-menu" role="listbox" hidden>
        ${alarmOptionsMarkup}
      </ul>
    </div>
  </div>
  <main class="shell">
    <header class="brand">
      <img class="logo" src="${fiapLogo}" alt="Logo FIAP" />
      <nav class="mode-switch" aria-label="Selecionar modo">
        <button class="mode-btn active" data-mode="timer" type="button">
          <span>Temporizador</span>
        </button>
        <button class="mode-btn" data-mode="stopwatch" type="button">
          <span>Cron&#244;metro</span>
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
const alarmToggle = document.querySelector("#alarmToggle");
const alarmSelectToggle = document.querySelector("#alarmSelectToggle");
const alarmSelectLabel = document.querySelector("#alarmSelectLabel");
const alarmSelectMenu = document.querySelector("#alarmSelectMenu");
const alarmOptionButtons = [...document.querySelectorAll(".alarm-option")];

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
let alarmEnabled = false;
let alarmAudio = null;
let alarmAutoStopTimeout = null;
let selectedAlarmValue = defaultAlarmEntry?.value ?? "";
let selectedAlarmLabel = defaultAlarmEntry?.label ?? "Sem som";

const MAX_TIMER_DIGITS = 5;
const MAX_TIMER_MAX_MINUTES = 999;
const MAX_TIMER_MAX_SECONDS_INPUT = 99;
const MAX_TIMER_TOTAL_SECONDS = (MAX_TIMER_MAX_MINUTES * 60) + MAX_TIMER_MAX_SECONDS_INPUT;
const MAX_ALARM_PLAYBACK_MS = 10000;

const clampInt = (value, min, max) => Math.min(max, Math.max(min, value));

const getTimerDigits = (value) => value.replace(/\D/g, "").slice(0, MAX_TIMER_DIGITS);

const digitsToTimerParts = (digitsValue) => {
  const digits = getTimerDigits(digitsValue).replace(/^0+(?=\d)/, "");
  let minutes = 0;
  let seconds = 0;

  if (digits.length <= 2) {
    seconds = parseInt(digits || "0", 10) || 0;
  } else {
    minutes = parseInt(digits.slice(0, -2), 10) || 0;
    seconds = parseInt(digits.slice(-2), 10) || 0;
  }

  minutes = clampInt(minutes, 0, MAX_TIMER_MAX_MINUTES);
  seconds = clampInt(seconds, 0, MAX_TIMER_MAX_SECONDS_INPUT);

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

const stopAlarm = () => {
  if (alarmAutoStopTimeout) {
    clearTimeout(alarmAutoStopTimeout);
    alarmAutoStopTimeout = null;
  }

  if (!alarmAudio) return;
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  alarmAudio = null;
};

const playAlarm = async () => {
  if (!alarmEnabled || !selectedAlarmValue) return;

  stopAlarm();
  alarmAudio = new Audio(selectedAlarmValue);
  alarmAudio.loop = true;
  alarmAudio.preload = "auto";
  alarmAutoStopTimeout = setTimeout(() => {
    stopAlarm();
  }, MAX_ALARM_PLAYBACK_MS);

  try {
    await alarmAudio.play();
  } catch {}
};

const syncAlarmUi = () => {
  alarmToggle.classList.toggle("is-on", alarmEnabled);
  alarmToggle.classList.toggle("is-off", !alarmEnabled);
  alarmToggle.setAttribute("aria-pressed", String(alarmEnabled));
  alarmToggle.setAttribute("aria-label", alarmEnabled ? "Desativar alarme" : "Ativar alarme");
};

const setAlarmSelection = (value, label) => {
  selectedAlarmValue = value;
  selectedAlarmLabel = label;
  alarmSelectLabel.textContent = selectedAlarmLabel;

  alarmOptionButtons.forEach((button) => {
    const isSelected = button.dataset.value === selectedAlarmValue;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });
};

const closeAlarmMenu = () => {
  alarmSelectMenu.hidden = true;
  alarmSelectToggle.classList.remove("is-open");
  alarmSelectToggle.setAttribute("aria-expanded", "false");
};

const openAlarmMenu = () => {
  alarmSelectMenu.hidden = false;
  alarmSelectToggle.classList.add("is-open");
  alarmSelectToggle.setAttribute("aria-expanded", "true");
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
  playAlarm();
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
  stopAlarm();

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
  stopAlarm();
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
    stopAlarm();
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

alarmToggle.addEventListener("click", () => {
  alarmEnabled = !alarmEnabled;

  if (!alarmEnabled) {
    stopAlarm();
  } else if (!timerRunning && timerRemainingMs <= 0) {
    playAlarm();
  }

  syncAlarmUi();
});

alarmSelectToggle.addEventListener("click", () => {
  if (alarmSelectMenu.hidden) {
    openAlarmMenu();
    return;
  }
  closeAlarmMenu();
});

alarmOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextValue = button.dataset.value ?? "";
    const nextLabel = button.dataset.label ?? "Sem som";
    setAlarmSelection(nextValue, nextLabel);
    closeAlarmMenu();

    if (!alarmEnabled) {
      stopAlarm();
      return;
    }

    if (alarmAudio) {
      playAlarm();
    }
  });
});

document.addEventListener("click", (event) => {
  if (!alarmSelectMenu || alarmSelectMenu.hidden) return;
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (alarmSelectToggle.contains(target) || alarmSelectMenu.contains(target)) return;
  closeAlarmMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (alarmSelectMenu.hidden) return;
  closeAlarmMenu();
});

timerDisplayInput.addEventListener("focus", () => {
  if (timerRunning) return;
  stopAlarm();
  timerDraftDigits = getTimerDigits(timerDisplayInput.value);
  if (!timerDraftDigits) {
    timerDraftDigits = "0";
  }
  requestAnimationFrame(() => {
    const end = timerDisplayInput.value.length;
    timerDisplayInput.setSelectionRange(end, end);
  });
});
timerDisplayInput.addEventListener("blur", applyTimerInput);
timerDisplayInput.addEventListener("keydown", (event) => {
  if (timerRunning) return;
  stopAlarm();

  const isDigit = /^\d$/.test(event.key);
  const isBackspace = event.key === "Backspace" || event.key === "Delete";
  const isNavigation =
    event.key === "Tab" ||
    event.key === "Escape" ||
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight" ||
    event.key === "Home" ||
    event.key === "End";

  if (isDigit) {
    event.preventDefault();
    timerDraftDigits = `${timerDraftDigits}${event.key}`.slice(-MAX_TIMER_DIGITS);
    const parsed = parseTimerInputValue();
    timerConfiguredMs = parsed.milliseconds;
    timerRemainingMs = parsed.milliseconds;
    timerDisplayInput.value = parsed.text;
    return;
  }

  if (isBackspace) {
    event.preventDefault();
    timerDraftDigits = timerDraftDigits.slice(0, -1);
    if (!timerDraftDigits) {
      timerDraftDigits = "0";
    }
    const parsed = parseTimerInputValue();
    timerConfiguredMs = parsed.milliseconds;
    timerRemainingMs = parsed.milliseconds;
    timerDisplayInput.value = parsed.text;
    return;
  }

  if (isNavigation || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    timerDisplayInput.blur();
    return;
  }

  if (event.key.length === 1) {
    event.preventDefault();
  }
});

timerDisplayInput.addEventListener("paste", (event) => {
  if (timerRunning) return;
  stopAlarm();
  event.preventDefault();
  const pasted = event.clipboardData?.getData("text") || "";
  timerDraftDigits = getTimerDigits(`${timerDraftDigits}${pasted}`).slice(-MAX_TIMER_DIGITS);
  if (!timerDraftDigits) {
    timerDraftDigits = "0";
  }
  const parsed = parseTimerInputValue();
  timerConfiguredMs = parsed.milliseconds;
  timerRemainingMs = parsed.milliseconds;
  timerDisplayInput.value = parsed.text;
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
setAlarmSelection(selectedAlarmValue, selectedAlarmLabel);
syncAlarmUi();
setMode("timer");
animateUi();
initParticles();

