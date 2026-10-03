import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  // Professoras usam o celular; o celular é o alvo principal dos e2e. A tela Hoje (secretaria/direção)
  // roda também no desktop, e antes dos demais: ela confere o seed intacto, os outros gravam chamadas.
  projects: [
    { name: "hoje-celular", testMatch: "hoje.spec.ts", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "hoje-desktop", testMatch: "hoje.spec.ts", use: { ...devices["Desktop Chrome"] } },
    {
      name: "celular",
      testIgnore: "hoje.spec.ts",
      dependencies: ["hoje-celular", "hoje-desktop"],
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/entrar`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Data congelada (quarta-feira) para os testes não dependerem do dia em que rodam.
    env: { HOJE_FIXO: "2026-10-07" },
  },
});
