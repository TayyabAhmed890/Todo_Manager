import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

const firebaseEnvironmentKeys = [
  "API_KEY",
  "AUTH_DOMAIN",
  "PROJECT_ID",
  "STORAGE_BUCKET",
  "MESSAGING_SENDER_ID",
  "APP_ID",
  "MEASUREMENT_ID"
];

// Expose only the Firebase web-app settings required by the browser SDK.
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const define = Object.fromEntries(
    firebaseEnvironmentKeys.map((key) => [
      `process.env.${key}`,
      JSON.stringify(environment[key] || "")
    ])
  );

  return {
    define,
    server: {
      open: "/components/login/index.html"
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), "main/index.html"),
          login: resolve(process.cwd(), "components/login/index.html"),
          register: resolve(process.cwd(), "components/register/index.html")
        }
      }
    }
  };
});
