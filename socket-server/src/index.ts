import { validZone, validCoordinates, nextZoneStatus } from "../../shared/gameZone";
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ToServer, ToClient } from "./types";
import {
  getSession,
  findPlayerSession,
  sessions,
  isUsernameTaken,
  addPlayer,
  updatePlayerLocation,
  removePlayerFromAllSessions,
} from "./sessionStore";

const httpServer = createServer();

const io = new Server<ToServer, ToClient>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  allowEIO3: true,
});

io.on("connection", (socket) => {
  console.log(`Client verbonden via socket: ${socket.id}`);

  socket.on("checkSessionStatus", (code, callback) => {
    const session = getSession(code);
    if (!session) {
      return callback({ exists: false, hasHunter: false });
    }
    const hasHunter = session.players.some((p) => p.role === "hunter");
    callback({ exists: true, hasHunter });
  });

  socket.on("joinSession", ({ code, username, role }, callback) => {
    if (typeof code !== "string" || !/^[A-Za-z0-9-]{3,20}$/.test(code)) return callback({ success: false, message: "Gebruik een sessiecode van 3–20 letters, cijfers of streepjes." });
    let session = getSession(code);
    if (!session && role === "hunter") {
      session = { code: code.toUpperCase(), isStarted: false, players: [] };
      Object.defineProperty(sessions, session.code, { value: session, enumerable: true, configurable: true, writable: true });
    }
    if (!session) return callback({ success: false, message: "Sessie niet gevonden. Laat de host eerst als hunter deelnemen." });

    if (typeof username !== "string" || !username.trim() || username.trim().length > 40 || !["runner", "hunter"].includes(role)) {
      return callback({ success: false, message: "Ongeldige naam of rol." });
    }
    if (findPlayerSession(socket.id)) return callback({ success: false, message: "Je zit al in een sessie." });

    if (session.eliminatedNames?.includes(username.trim().toLowerCase())) return callback({ success: false, message: "Je bent uitgeschakeld in deze sessie." });
    if (isUsernameTaken(session, username)) {
      return callback({
        success: false,
        message: `De naam "${username}" is al in gebruik. Kies een andere naam.`,
      });
    }

    socket.join(session.code);
    const newPlayer = addPlayer(session, socket.id, username, role);
    const name = newPlayer.username.toLowerCase();
    if (session.zoneWarnings && Object.hasOwn(session.zoneWarnings, name)) newPlayer.zoneStatus = session.zoneWarnings[name];

    callback({
      success: true,
      message: `Gejoind aan ${session.code}!`,
      session,
    });
    io.to(session.code).emit("sessionUpdate", session);
  });

  socket.on("setGameZone", (zone, callback) => {
    const session = findPlayerSession(socket.id);
    const host = session?.players.find((p) => p.id === socket.id);
    if (!session || !host?.isHost || session.isStarted || !validZone(zone)) {
      return callback({ success: false, message: "Alleen de host kan vóór de start een geldige zone kiezen (maximaal 0,2 graden per zijde)." });
    }
    session.zone = { south: zone.south, west: zone.west, north: zone.north, east: zone.east };
    io.to(session.code).emit("sessionUpdate", session);
    callback({ success: true, message: "Spelzone opgeslagen.", session });
  });

  socket.on("startGame", (callback) => {
    const session = findPlayerSession(socket.id);
    if (!session?.zone || !session.players.find((p) => p.id === socket.id)?.isHost || session.isStarted) {
      return callback({ success: false, message: "Alleen de host kan het spel starten, na het kiezen van een zone." });
    }
    session.isStarted = true;
    for (const player of session.players) {
      if (player.role === "runner" && player.location && !player.eliminated) {
        player.zoneStatus = nextZoneStatus(session.zone, player.location, undefined, Date.now());
        session.zoneWarnings ??= {};
        Object.defineProperty(session.zoneWarnings, player.username.toLowerCase(), { value: player.zoneStatus, enumerable: true, configurable: true, writable: true });
        io.to(player.id).emit("zoneStatus", player.zoneStatus);
      }
    }
    io.to(session.code).emit("sessionUpdate", session);
    callback({ success: true, message: "Het spel is gestart.", session });
  });

  socket.on("updateLocation", (coords) => {
    if (!validCoordinates(coords)) return;
    const session = findPlayerSession(socket.id);
    if (!session) return;

    updatePlayerLocation(socket.id, coords);
    const player = session.players.find((p) => p.id === socket.id);

    if (player?.eliminated) return;
    if (player && player.role === "runner") {
      if (session.isStarted && session.zone) {
        const previous = player.zoneStatus;
        player.zoneStatus = nextZoneStatus(session.zone, coords, previous, Date.now());
        session.zoneWarnings ??= {};
        Object.defineProperty(session.zoneWarnings, player.username.toLowerCase(), { value: player.zoneStatus, enumerable: true, configurable: true, writable: true });
        if (player.zoneStatus.exceeded) eliminatePlayer(session, player);
        socket.emit("zoneStatus", player.zoneStatus);
        if (previous?.outside !== player.zoneStatus.outside || previous?.exceeded !== player.zoneStatus.exceeded) {
          io.to(session.code).emit("sessionUpdate", session);
        }
      }
      if (player.eliminated) return;
      io.to(session.code).emit("runnerLocationUpdate", {
        runnerName: player.username,
        location: coords,
      });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client verbroken (${socket.id}). Reden: ${reason}`);
    const updates = removePlayerFromAllSessions(socket.id);
    updates.forEach(({ session }) => {
      io.to(session.code).emit("sessionUpdate", session);
    });
  });
});

function eliminatePlayer(session: import("./types").Session, player: import("./types").Player) {
  player.eliminated = true;
  session.eliminatedNames ??= [];
  const name = player.username.toLowerCase();
  if (!session.eliminatedNames.includes(name)) session.eliminatedNames.push(name);
}

// Deadlines continue even if a runner stops sending location updates.
setInterval(() => {
  for (const session of Object.values(sessions)) {
    for (const [name, status] of Object.entries(session.zoneWarnings ?? {})) {
      if (status.outside && !status.exceeded && status.deadline !== null && Date.now() >= status.deadline) {
        status.exceeded = true;
        status.serverNow = Date.now();
        const player = session.players.find((p) => p.username.toLowerCase() === name);
        if (player) {
          player.zoneStatus = status;
          eliminatePlayer(session, player);
          io.to(player.id).emit("zoneStatus", status);
        } else {
          session.eliminatedNames ??= [];
          if (!session.eliminatedNames.includes(name)) session.eliminatedNames.push(name);
        }
        io.to(session.code).emit("sessionUpdate", session);
      }
    }
  }
}, 200).unref();

httpServer.listen(Number(process.env.PORT || 3000), () => {
  console.log("Socket.IO server running on http://localhost:3000");
});
