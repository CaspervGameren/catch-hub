export type PlayerRole = "runner" | "hunter";

export interface Player {
  id: string;
  username: string;
  role: PlayerRole;
  isHost: boolean;
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
  updateLocation: (coords: { latitude: number; longitude: number }) => void;
}

// Events die de SERVER VERSTUURT (van server naar client)
export interface ToClient {
  sessionUpdate: (session: Session) => void;
  runnerLocationUpdate: (data: {
    runnerName: string;
    location: { latitude: number; longitude: number };
  }) => void;
}
