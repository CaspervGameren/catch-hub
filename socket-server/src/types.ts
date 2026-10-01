export type PlayerRole = "hunter" | "runner";

export interface Location {
  latitude: number;
  longitude: number;
  updatedAt: number;
}

export interface Player {
  id: string;
  username: string; // Unieke identifier voor de speler
  role: PlayerRole;
  isHost: boolean; // Nieuwe vlag voor de eerste gebruiker
  location?: Location;
}

export interface Session {
  code: string;
  isStarted: boolean;
  players: Player[];
}

export interface ToClient {
  joinSession: (
    payload: { code: string; username: string; role: PlayerRole },
    callback: (response: {
      success: boolean;
      message: string;
      session?: Session;
    }) => void,
  ) => void;
  startGame: (
    code: string,
    callback: (response: { success: boolean; message: string }) => void,
  ) => void;
  updateLocation: (coords: { latitude: number; longitude: number }) => void;
}

export interface ToServer {
  sessionUpdate: (session: Session) => void;
  gameStarted: () => void;
}
