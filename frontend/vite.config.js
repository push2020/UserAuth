import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080, // 👈 Change to your desired port
    host: "localhost", // optional: you can set '0.0.0.0' to expose on LAN
  },
});
