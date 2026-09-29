import { io, Socket } from "socket.io-client";
import type { ToClient, ToServer, Session } from "./types";
import { updateStatus, renderPlayers, getElement } from "./ui";

// ToServer EERST, daarna ToClient
export const socket: Socket<ToServer, ToClient> = io("http://localhost:3000");

export function initSocketListeners() {
  socket.on("connect", () => updateStatus("Verbonden met server"));
  socket.on("disconnect", () => updateStatus("Verbinding verbroken"));

  socket.on("sessionUpdate", (session: Session) => {
    const codeDisplay = getElement("#session-code-display");
    if (codeDisplay) codeDisplay.textContent = session.code;
    renderPlayers(session.players, socket.id);
  });
}

export function sendLocationUpdate(coords: {
  latitude: number;
  longitude: number;
}) {
  socket.emit("updateLocation", coords);
}
