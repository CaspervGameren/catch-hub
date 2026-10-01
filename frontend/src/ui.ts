import type { Player } from "./types";
import { initMap, refreshMapLayout } from "./map";

export const getElement = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector);

export function updateStatus(message: string) {
  const status = getElement("#socket-status");
  if (status) status.textContent = message;
}

export function showGameUi(username: string, role: "runner" | "hunter") {
  getElement("#join-section")?.classList.add("hidden");
  getElement("#game-ui")?.classList.remove("hidden");

  const roleDisplay = getElement("#role-display");
  if (roleDisplay) {
    roleDisplay.textContent = `Welkom ${username} (${role === "runner" ? "Runner 🏃" : "Hunter 🎯"})`;
  }

  const radarBox = getElement("#runner-radar-box");
  const shareLocationBtn = getElement("#share-location");

  if (role === "runner") {
    radarBox?.classList.add("hidden");
    shareLocationBtn?.classList.remove("hidden");
  } else {
    radarBox?.classList.remove("hidden");
    shareLocationBtn?.classList.add("hidden");
  }

  // WAKKER MAKEN VAN DE KAART:
  initMap();
  refreshMapLayout();
}

export function renderPlayers(players: Player[], currentSocketId?: string) {
  const playersList = getElement("#players-list");
  if (!playersList) return;

  playersList.innerHTML = players
    .map((player) => {
      const isMe = player.id === currentSocketId;
      const borderStyle = isMe ? "border-[#2DD6B7]" : "border-[#2DD6B7]/30";

      return `
        <li class="flex items-center justify-between p-3 rounded-xl border bg-black/20 ${borderStyle}">
          <span class="text-sm font-semibold text-[#73e6d0]">
            ${player.isHost ? "👑 " : ""}${escapeHtml(player.username)} ${isMe ? "(Jij)" : ""}${player.zoneStatus?.exceeded ? " · Uitgeschakeld" : player.zoneStatus?.outside ? " · Buiten zone" : ""}
          </span>
          <span class="rounded-md bg-[#2DD6B7]/20 border border-[#2DD6B7]/40 px-2 py-0.5 text-xs font-bold text-[#2DD6B7] uppercase">
            ${escapeHtml(player.role)}
          </span>
        </li>
      `;
    })
    .join("");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
