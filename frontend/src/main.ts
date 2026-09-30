import "./styles/tailwind.css";
import "./styles/main.scss";

import type { SessionResponse, Player } from "./types";
import { getElement, showGameUi, renderPlayers } from "./ui";
import { socket, initSocketListeners, sendLocationUpdate } from "./socket";
import { startGpsTracking } from "./location";
import { updateMapMarker } from "./map";
import {
  startHunterRadarTimer,
  resetRadar,
  triggerInstantPulse,
  storeLatestRunnerLocation,
} from "./radar";

initSocketListeners();

let userRole: "runner" | "hunter" = "runner";

getElement("#join-form")?.addEventListener("submit", (e: SubmitEvent) => {
  e.preventDefault();

  const submitter = (e.submitter ||
    document.activeElement) as HTMLButtonElement | null;
  userRole = (submitter?.dataset.role as "runner" | "hunter") || "runner";

  const username =
    getElement<HTMLInputElement>("#player-name")?.value.trim() || "";
  const code =
    getElement<HTMLInputElement>("#session-code")?.value.trim() || "";

  if (!username || !code) return alert("Vul een naam en sessiecode in.");

  socket.emit(
    "joinSession",
    { code, username, role: userRole },
    (response: SessionResponse) => {
      if (!response.success || !response.session) {
        return alert(response.message);
      }

      showGameUi(username, userRole);
      renderPlayers(response.session.players, socket.id);
      checkRunnerAndManageTimer(response.session.players);

      if (userRole === "runner") {
        // RUNNER: Live tracking & update kaart
        startGpsTracking((coords) => {
          sendLocationUpdate(coords);
          updateMapMarker("me", coords, "Jouw GPS Locatie");

          const coordsText = getElement("#coordinates");
          if (coordsText) {
            coordsText.textContent = `Coördinaten: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
          }
        });
      } else {
        // HUNTER: Start radar timer
        startHunterRadarTimer((runnerCoords) => {
          updateMapMarker(
            "runner",
            runnerCoords,
            "Laatst bekende Runner locatie",
          );
        });
      }
    },
  );
});

socket.on("sessionUpdate", (session) => {
  checkRunnerAndManageTimer(session.players);
});

socket.on("runnerLocationUpdate", (data) => {
  if (userRole === "hunter") {
    storeLatestRunnerLocation(data.location);
  }
});

getElement("#btn-pulse-now")?.addEventListener("click", () => {
  triggerInstantPulse();
});

getElement("#share-location")?.addEventListener("click", () => {
  startGpsTracking((coords) => {
    sendLocationUpdate(coords);
    updateMapMarker("me", coords, "Jouw GPS Locatie");
  });
});

function checkRunnerAndManageTimer(players: Player[]) {
  if (userRole !== "hunter") return;

  const hasRunner = players.some((p) => p.role === "runner");

  if (hasRunner) {
    startHunterRadarTimer((runnerCoords) => {
      updateMapMarker("runner", runnerCoords, "Laatst bekende Runner locatie");
    });
  } else {
    resetRadar();
  }
}
