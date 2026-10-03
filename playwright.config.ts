import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  // Professoras usam o celular; o celular é o alvo principal dos e2e.
  projects: [{ name: "celular", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/entrar`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
