import type { GameZone, ZoneStatus } from "../../shared/gameZone";
export type PlayerRole = "runner" | "hunter";

export interface Player {
  id: string;
  username: string;
  role: PlayerRole;
  isHost: boolean;
  eliminated?: boolean;
  zoneStatus?: ZoneStatus;
  location?: {
    latitude: number;
    longitude: number;
    updatedAt: number;
  };
}

export interface Session {
  code: string;
  isStarted: boolean;
  players: Player[];
  zone?: GameZone;
  eliminatedNames?: string[];
  zoneWarnings?: Record<string, ZoneStatus>;
}

export interface SessionResponse {
  success: boolean;
  message: string;
  session?: Session;
}

// Events die de SERVER ONTVANGT (van client naar server)
export interface ToServer {
  joinSession: (
    data: { code: string; username: string; role: PlayerRole },
    callback: (response: SessionResponse) => void,
  ) => void;
  checkSessionStatus: (
    code: string,
    callback: (status: { exists: boolean; hasHunter: boolean }) => void,
  ) => void;
  setGameZone: (zone: GameZone, callback: (response: SessionResponse) => void) => void;
  startGame: (callback: (response: SessionResponse) => void) => void;
  updateLocation: (coords: { latitude: number; longitude: number }) => void;
}

// Events die de SERVER VERSTUURT (van server naar client)
export interface ToClient {
  zoneStatus: (status: ZoneStatus) => void;
  sessionUpdate: (session: Session) => void;
  runnerLocationUpdate: (data: {
    runnerName: string;
    location: { latitude: number; longitude: number };
  }) => void;
}
