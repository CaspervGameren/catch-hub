import { createServer } from "node:http";
import { Server } from "socket.io";
import { ToClient, ToServer } from "./types";
import {
  getSession,
  isUsernameTaken,
  addPlayer,
  updatePlayerLocation,
  removePlayerFromAllSessions,
} from "./sessionStore";

const httpServer = createServer();

const io = new Server<ToClient, ToServer>(httpServer, {
  cors: { origin: "http://localhost:5173" },
  pingTimeout: 5000,
  pingInterval: 10000,
});

io.on("connection", (socket) => {
  console.log(`Client verbonden: ${socket.id}`);

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
  });

  socket.on("disconnect", () => {
    const updates = removePlayerFromAllSessions(socket.id);
    updates.forEach(({ session }) => {
      io.to(session.code).emit("sessionUpdate", session);
    });
  });
});

httpServer.listen(3000, () => {
  console.log("Socket.IO server running on http://localhost:3000");
});
