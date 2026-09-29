export interface Player {
  id: string;
  username: string;
  role: "runner" | "hunter";
  isHost: boolean;
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

export interface ToClient {
  joinSession: (
    payload: { code: string; username: string; role: "runner" | "hunter" },
    callback: (response: SessionResponse) => void,
  ) => void;
  updateLocation: (coords: { latitude: number; longitude: number }) => void;
}

export interface ToServer {
  sessionUpdate: (session: Session) => void;
}
