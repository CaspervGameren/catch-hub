import { Session, Player, PlayerRole } from "./types";

export const sessions: Record<string, Session> = {
  CATCH123: {
    code: "CATCH123",
    isStarted: false,
    players: [],
  },
};

export function getSession(code: string): Session | undefined {
  if (!code) return undefined;
  return sessions[code.toUpperCase()];
}

export function isUsernameTaken(session: Session, username: string): boolean {
  return session.players.some(
    (p) => p.username.toLowerCase() === username.trim().toLowerCase(),
  );
}

export function addPlayer(
  session: Session,
  socketId: string,
  username: string,
  role: PlayerRole,
): Player {
  const isHost = session.players.length === 0;

  const newPlayer: Player = {
    id: socketId,
    username: username.trim(),
    role,
    isHost,
  };

  session.players.push(newPlayer);
  return newPlayer;
}

export function updatePlayerLocation(
  socketId: string,
  coords: { latitude: number; longitude: number },
) {
  for (const code in sessions) {
    const session = sessions[code];
    const player = session.players.find((p) => p.id === socketId);

    if (player) {
      player.location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        updatedAt: Date.now(),
      };
      break;
    }
  }
}

export function removePlayerFromAllSessions(
  socketId: string,
): { session: Session; removedPlayer: Player }[] {
  const updates: { session: Session; removedPlayer: Player }[] = [];

  for (const code in sessions) {
    const session = sessions[code];
    const playerIndex = session.players.findIndex((p) => p.id === socketId);

    if (playerIndex !== -1) {
      const [removedPlayer] = session.players.splice(playerIndex, 1);

      if (removedPlayer.isHost && session.players.length > 0) {
        session.players[0].isHost = true;
      }

      updates.push({ session, removedPlayer });
    }
  }

  return updates;
}
