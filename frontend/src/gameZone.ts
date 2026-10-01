import { stopGpsTracking } from "./location";
import L from "leaflet";
import type { Session } from "./types";
import type { GameZone, ZoneStatus } from "../../shared/gameZone";
import { socket } from "./socket";
import { showZone } from "./map";

let editor: L.Map | undefined;
let rectangle: L.Rectangle | undefined;
let firstCorner: L.LatLng | undefined;
let draft: GameZone | undefined;
let currentSession: Session | undefined;
let audio: AudioContext | undefined;
let audioReady = false;
let alarmInterval: number | undefined;
let countdownInterval: number | undefined;
let latestStatus: ZoneStatus | undefined;
let receivedAt = 0;

function message(text: string) {
  const element = document.getElementById("zone-editor-status");
  if (element) element.textContent = text;
}

export async function enableZoneAlarm() {
  try {
    audio ??= new AudioContext();
    await audio.resume();
    audioReady = audio.state === "running";
    const button = document.getElementById("enable-zone-audio");
    if (button) button.textContent = audioReady ? "Alarmgeluid ingeschakeld" : "Tik om alarmgeluid in te schakelen";
  } catch { audioReady = false; }
}

function beep() {
  if (!audio || audio.state !== "running") return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.12, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.25);
}

export function updateZoneAlarm(status: ZoneStatus | undefined) {
  if (!latestStatus || latestStatus.serverNow !== status?.serverNow || latestStatus.deadline !== status?.deadline) receivedAt = performance.now();
  latestStatus = status;
  const warning = document.getElementById("zone-warning");
  if (!warning) return;
  warning.hidden = !status?.outside;
  if (!status?.outside) {
    window.clearInterval(alarmInterval);
    window.clearInterval(countdownInterval);
    alarmInterval = countdownInterval = undefined;
    return;
  }
  const render = () => {
    if (!latestStatus) return;
    const now = latestStatus.serverNow + performance.now() - receivedAt;
    const seconds = Math.max(0, Math.ceil(((latestStatus.deadline ?? now) - now) / 1000));
    warning.textContent = seconds > 0 && !latestStatus.exceeded
      ? `Buiten de spelzone! Ga binnen ${seconds} seconden terug.${audioReady ? "" : " Tik op Alarmgeluid inschakelen om geluid te horen."}`
      : latestStatus.exceeded ? "Je bent uitgeschakeld: je was langer dan 10 seconden buiten de spelzone." : "Terugkeertijd verstreken · wachten op bevestiging van de server.";
  };
  render();
  if (countdownInterval === undefined) countdownInterval = window.setInterval(render, 100);
  if (status.exceeded) { window.clearInterval(alarmInterval); alarmInterval = undefined; }
  else if (alarmInterval === undefined) { beep(); alarmInterval = window.setInterval(beep, 1000); }
}

export function renderGameZone(session: Session) {
  currentSession = session;
  const me = session.players.find((player) => player.id === socket.id);
  const controls = document.getElementById("host-zone-controls");
  if (controls) controls.hidden = !me?.isHost;
  const summary = document.getElementById("game-zone-summary");
  if (summary) summary.textContent = session.isStarted ? "Spel gestart · zone staat vast" : session.zone ? "Spelzone gekozen · wachten op de host" : "Wachten tot de host een spelzone kiest";
  showZone(session.zone);
  if (me?.role === "runner") {
    updateZoneAlarm(me.zoneStatus);
    if (me.eliminated) {
      stopGpsTracking();
      const share = document.getElementById("share-location") as HTMLButtonElement | null;
      if (share) share.disabled = true;
    }
  }

  const save = document.getElementById("save-game-zone") as HTMLButtonElement;
  const start = document.getElementById("start-zone-game") as HTMLButtonElement;
  save.disabled = session.isStarted || !draft;
  start.disabled = session.isStarted || !session.zone || !!draft || !!firstCorner;
  if (!me?.isHost) return;
  if (!editor) {
    editor = L.map("zone-editor-map", { scrollWheelZoom: false }).setView([51.9185, 4.4803], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(editor);
    editor.on("click", (event: L.LeafletMouseEvent) => {
      if (currentSession?.isStarted) return;
      if (!firstCorner) {
        firstCorner = event.latlng;
        start.disabled = true;
        message("Klik nu op de tegenoverliggende hoek.");
        return;
      }
      const bounds = L.latLngBounds(firstCorner, event.latlng);
      draft = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() };
      firstCorner = undefined;
      rectangle?.remove();
      rectangle = L.rectangle(bounds, { color: "#2dd6b7", fillOpacity: 0.15 }).addTo(editor!);
      save.disabled = false;
      message("Zone getekend. Klik op Zone opslaan of kies opnieuw twee hoeken.");
    });
  }
  if (!session.zone && !draft && !firstCorner) { rectangle?.remove(); rectangle = undefined; }
  if (session.zone && !draft && !firstCorner) {
    const bounds = L.latLngBounds([session.zone.south, session.zone.west], [session.zone.north, session.zone.east]);
    rectangle?.remove();
    rectangle = L.rectangle(bounds, { color: "#2dd6b7", fillOpacity: 0.15 }).addTo(editor);
    editor.fitBounds(bounds);
  }
  setTimeout(() => editor?.invalidateSize(), 0);
}

export function initGameZone() {
  document.getElementById("enable-zone-audio")?.addEventListener("click", () => void enableZoneAlarm());
  document.getElementById("save-game-zone")?.addEventListener("click", () => {
    if (!draft) return;
    socket.emit("setGameZone", draft, (response) => {
      message(response.message);
      if (response.success) draft = undefined;
      if (response.session) renderGameZone(response.session);
    });
  });
  document.getElementById("start-zone-game")?.addEventListener("click", () => {
    socket.emit("startGame", (response) => {
      message(response.message);
      if (response.session) renderGameZone(response.session);
    });
  });
  socket.on("zoneStatus", updateZoneAlarm);
  socket.on("disconnect", () => {
    updateZoneAlarm(undefined);
    const summary = document.getElementById("game-zone-summary");
    if (summary) summary.textContent = "Verbinding weg · zonecontrole tijdelijk niet beschikbaar";
  });
}
