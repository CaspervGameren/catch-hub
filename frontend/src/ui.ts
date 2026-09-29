import type { Player } from "./types";

export const getElement = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector);

export function updateStatus(message: string) {
  const status = getElement("#socket-status");
  if (status) status.textContent = message;
}

export function showGameUi(username: string, role: string) {
  getElement("#join-section")?.classList.add("hidden");
  getElement("#game-ui")?.classList.remove("hidden");

  const roleDisplay = getElement("#role-display");
  if (roleDisplay) {
    roleDisplay.textContent = `Welkom ${username} (${role === "runner" ? "Runner" : "Hunter"})`;
  }
}

export function renderPlayers(players: Player[], currentSocketId?: string) {
  const playersList = getElement("#players-list");
  if (!playersList) return;

  playersList.innerHTML = players
    .map((player) => {
      const isMe = player.id === currentSocketId;
      const borderStyle = isMe
        ? "border-gray-300 font-semibold"
        : "border-gray-200";

      return `
        <li class="flex items-center justify-between p-2.5 rounded border bg-gray-50 ${borderStyle}">
          <span class="text-sm text-gray-800">
            ${player.isHost ? "♛ " : ""}${player.username}
          </span>
          <span class="rounded bg-gray-100 px-2 py-0.5 text-xs capitalize">${player.role}</span>
        </li>
      `;
    })
    .join("");
}
