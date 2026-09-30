import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: "127.0.0.1", // IPv4 afdwingen
    allowedHosts: true,
    proxy: {
      "/socket.io": {
        target: "http://127.0.0.1:3000",
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true, // BELANGRIJK: Herschrijft de Origin header voor Expose tunnels!
      },
    },
  },
});
