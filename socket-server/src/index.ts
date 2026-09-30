import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ToServer, ToClient } from "./types";
import {
  getSession,
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

  socket.on("joinSession", ({ code, username, role }, callback) => {
    const session = getSession(code);

    if (!session) {
      return callback({
        success: false,
        message: "Sessie niet gevonden. Gebruik CATCH123",
      });
    }

    if (session.isStarted) {
      return callback({ success: false, message: "Het spel is al begonnen!" });
    }

    if (isUsernameTaken(session, username)) {
      return callback({
        success: false,
        message: `De naam "${username}" is al in gebruik. Kies een andere naam.`,
      });
    }

    socket.join(session.code);
    const newPlayer = addPlayer(session, socket.id, username, role);

    callback({
      success: true,
      message: `Gejoind aan ${session.code}!`,
      session,
    });
    io.to(session.code).emit("sessionUpdate", session);
  });

  socket.on("updateLocation", (coords) => {
    updatePlayerLocation(socket.id, coords);

    const session = getSession("CATCH123");
    if (!session) return;

    const player = session.players.find((p) => p.id === socket.id);

    if (player && player.role === "runner") {
      console.log(`[GPS] Runner ${player.username} stuurt locatie:`, coords);
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

httpServer.listen(3000, () => {
  console.log("Socket.IO server running on http://localhost:3000");
});
