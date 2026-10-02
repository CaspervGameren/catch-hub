import { io, Socket } from "socket.io-client";
import type { ToClient, ToServer, Session } from "./types";
import { updateStatus, renderPlayers, getElement } from "./ui";
import { storeLatestRunnerLocation } from "./radar";

const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim() || undefined;
export const socket: Socket<ToClient, ToServer> = io(socketUrl, {
  transports: ["polling", "websocket"],
});

export function initSocketListeners() {
  socket.on("connect", () => updateStatus("Verbonden met server"));
  socket.on("disconnect", () => updateStatus("Verbinding verbroken"));
  socket.on("connect_error", () => updateStatus("Server niet bereikbaar · opnieuw verbinden (gratis hosting kan even opstarten)"));

  socket.on("sessionUpdate", (session: Session) => {
    const codeDisplay = getElement("#session-code-display");
    if (codeDisplay) codeDisplay.textContent = session.code;
    renderPlayers(session.players, socket.id);
  });

  socket.on("runnerLocationUpdate", (data) => {
    console.log("[SOCKET] Runner locatie ontvangen:", data.location);
    storeLatestRunnerLocation(data.location);
  });
}

export function sendLocationUpdate(coords: {
  latitude: number;
  longitude: number;
}) {
  socket.emit("updateLocation", coords);
}
