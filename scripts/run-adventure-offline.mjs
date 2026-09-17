import { spawn } from "node:child_process";
import { resolve } from "node:path";
const child = spawn(
  process.execPath,
  [
    resolve("node_modules/@playwright/test/cli.js"),
    "test",
    "--project=adventure-offline",
  ],
  {
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      E2E_PREVIEW: "1",
      E2E_BASE_URL: "http://127.0.0.1:4179",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
