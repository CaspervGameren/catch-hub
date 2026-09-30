import { getElement } from "./ui";

let countdownInterval: number | null = null;
const UPDATE_INTERVAL_SECONDS = 300;
let secondsRemaining = UPDATE_INTERVAL_SECONDS;
let latestRunnerCoords: { latitude: number; longitude: number } | null = null;
let currentOnPulse:
  | ((coords: { latitude: number; longitude: number }) => void)
  | null = null;

type OnRadarPulseCallback = (coords: {
  latitude: number;
  longitude: number;
}) => void;

export function startHunterRadarTimer(onPulse: OnRadarPulseCallback) {
  currentOnPulse = onPulse;

  if (countdownInterval !== null) return;

  secondsRemaining = UPDATE_INTERVAL_SECONDS;
  updateTimerDisplay();

  countdownInterval = window.setInterval(() => {
    secondsRemaining--;

    if (secondsRemaining <= 0) {
      triggerInstantPulse();
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

export function stopHunterRadarTimer() {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  const timerElement = getElement("#radar-timer");
  if (timerElement) {
    timerElement.textContent = "Wachten op Runner...";
  }
}

// NIEUW: Reset de radar gegevens als er geen Runner meer is
export function resetRadar() {
  stopHunterRadarTimer();
  latestRunnerCoords = null;

  const textElement = getElement("#runner-coordinates");
  if (textElement) {
    textElement.textContent = "Laatst bekende locatie: Wachten op signaal...";
  }
}

export function triggerInstantPulse() {
  secondsRemaining = UPDATE_INTERVAL_SECONDS;
  updateTimerDisplay();

  if (latestRunnerCoords) {
    if (currentOnPulse) currentOnPulse(latestRunnerCoords);
    updateRunnerText(latestRunnerCoords);
  } else {
    const textElement = getElement("#runner-coordinates");
    if (textElement) {
      textElement.textContent =
        "Nog geen GPS-coördinaten van een Runner ontvangen.";
    }
  }
}

export function storeLatestRunnerLocation(coords: {
  latitude: number;
  longitude: number;
}) {
  latestRunnerCoords = coords;
}

function updateTimerDisplay() {
  const timerElement = getElement("#radar-timer");
  if (!timerElement) return;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  timerElement.textContent = `Volgende update: ${formattedMinutes}:${formattedSeconds}`;
}

function updateRunnerText(coords: { latitude: number; longitude: number }) {
  const textElement = getElement("#runner-coordinates");
  if (textElement) {
    const timeString = new Date().toLocaleTimeString();
    textElement.textContent = `Laatst bekende locatie (${timeString}): ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
  }
}
