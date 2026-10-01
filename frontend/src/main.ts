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

function checkSessionRoleAvailability() {
  const code =
    getElement<HTMLInputElement>("#session-code")?.value.trim() || "";
  if (!code) return;

  socket.emit("checkSessionStatus", code, (status) => {
    const runnerBtn = getElement("#btn-join-runner");
    if (runnerBtn) {
      if (status.hasHunter) {
        runnerBtn.classList.remove("hidden");
      } else {
        runnerBtn.classList.add("hidden");
      }
    }
  });
}

socket.on("connect", () => {
  checkSessionRoleAvailability();

  const savedUsername = localStorage.getItem("catchhub_username");
  const savedCode = localStorage.getItem("catchhub_sessionCode");
  const savedRole = localStorage.getItem("catchhub_role") as
    | "runner"
    | "hunter";

  if (savedUsername && savedCode && savedRole) {
    userRole = savedRole;
    socket.emit(
      "joinSession",
      { code: savedCode, username: savedUsername, role: savedRole },
      (response: SessionResponse) => {
        if (response.success && response.session) {
          showGameUi(savedUsername, savedRole);
          renderPlayers(response.session.players, socket.id);
          checkRunnerAndManageTimer(response.session.players);
          setupGameRoleListeners();
        } else {
          localStorage.removeItem("catchhub_username");
          localStorage.removeItem("catchhub_sessionCode");
          localStorage.removeItem("catchhub_role");
        }
      },
    );
  }
});

getElement("#session-code")?.addEventListener("input", () => {
  checkSessionRoleAvailability();
});

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

      localStorage.setItem("catchhub_username", username);
      localStorage.setItem("catchhub_sessionCode", code);
      localStorage.setItem("catchhub_role", userRole);

      showGameUi(username, userRole);
      renderPlayers(response.session.players, socket.id);
      checkRunnerAndManageTimer(response.session.players);
      setupGameRoleListeners();
    },
  );
});

socket.on("sessionUpdate", (session) => {
  checkRunnerAndManageTimer(session.players);

  const hasHunter = session.players.some((p) => p.role === "hunter");
  const runnerBtn = getElement("#btn-join-runner");
  if (runnerBtn) {
    if (hasHunter) runnerBtn.classList.remove("hidden");
    else runnerBtn.classList.add("hidden");
  }
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

getElement("#leave-session")?.addEventListener("click", () => {
  localStorage.removeItem("catchhub_username");
  localStorage.removeItem("catchhub_sessionCode");
  localStorage.removeItem("catchhub_role");
  window.location.reload();
});

function setupGameRoleListeners() {
  if (userRole === "runner") {
    startGpsTracking((coords) => {
      sendLocationUpdate(coords);
      updateMapMarker("me", coords, "Jouw GPS Locatie");

      const coordsText = getElement("#coordinates");
      if (coordsText) {
        coordsText.textContent = `Coördinaten: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
      }
    });
  } else {
    startHunterRadarTimer((runnerCoords) => {
      updateMapMarker("runner", runnerCoords, "Laatst bekende Runner locatie");
    });
  }
}

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
