import { expect, test, type Page } from "@playwright/test";

// O servidor de teste roda com HOJE_FIXO=2026-10-07 (quarta) — ver playwright.config.ts.
// Estado em memória é compartilhado entre testes: cada teste usa turmas diferentes ou é robusto ao estado.

async function entrarComo(page: Page, nome: string) {
  await page.goto("/entrar");
  await page.getByRole("button", { name: nome }).click();
  await expect(page).not.toHaveURL(/\/entrar$/);
}

test.describe("chamada da professora", () => {
  test("professora de 1 turma entra direto na chamada", async ({ page }) => {
    await entrarComo(page, "Professora Eliane"); // P5 → T6
    await expect(page).toHaveURL(/\/chamada\/T6$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("1º ano B");
    await expect(page.getByText("quarta-feira, 7 de outubro")).toBeVisible();
  });

  test("turma de 20 alunos com 2 faltas: no máximo 4 toques", async ({ page }) => {
    await entrarComo(page, "Professora Fátima"); // P6 → T7, 20 alunos
    let toques = 0; // a partir da tela inicial do app — que já é a chamada (0 toques para abrir)
    await expect(page).toHaveURL(/\/chamada\/T7$/);

    const alunos = page.locator("[data-aluno-id]");
    await expect(alunos).toHaveCount(20);
    const presentes = page.locator('[data-aluno-id][aria-pressed="false"]');
    const ids = [
      await presentes.nth(0).getAttribute("data-aluno-id"),
      await presentes.nth(1).getAttribute("data-aluno-id"),
    ];
    for (const id of ids) {
      await page.locator(`[data-aluno-id="${id}"]`).click();
      toques++;
    }
    await page.getByRole("button", { name: "Salvar" }).click();
    toques++;

    await expect(page.getByText("Chamada salva")).toBeVisible();
    expect(toques).toBeLessThanOrEqual(4);
    for (const id of ids) {
      await expect(page.locator(`[data-aluno-id="${id}"]`)).toHaveAttribute("aria-pressed", "true");
    }
    // Persistiu no servidor: recarregar mantém as faltas.
    await page.reload();
    for (const id of ids) {
      await expect(page.locator(`[data-aluno-id="${id}"]`)).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("professora de 2 turmas vê só as suas, com status de hoje", async ({ page }) => {
    await entrarComo(page, "Professora Ana"); // P1 → T1 (feita hoje no seed), T2 (pendente)
    await expect(page).toHaveURL(/\/chamada$/);

    const cartoes = page.locator("[data-turma-id]");
    await expect(cartoes).toHaveCount(2);
    await expect(page.locator('[data-turma-id="T1"]')).toContainText("Feita ✓");
    await expect(page.locator('[data-turma-id="T2"]')).toContainText("Falta fazer");
    await expect(page.locator('[data-turma-id="T3"]')).toHaveCount(0);

    await page.locator('[data-turma-id="T2"]').click();
    await expect(page).toHaveURL(/\/chamada\/T2$/);
  });

  test("chamada da semana anterior é só leitura", async ({ page }) => {
    await entrarComo(page, "Professora Glória"); // P7 → T8
    await page.goto("/chamada/T8?data=2026-10-02");

    await expect(page.getByText("Só a secretaria pode alterar esta chamada")).toBeVisible();
    await expect(page.locator("[data-aluno-id]").first()).toBeDisabled();
    await expect(page.getByRole("button", { name: "Salvar" })).toHaveCount(0);
  });

  test("dia anterior da mesma semana pode ser corrigido", async ({ page }) => {
    await entrarComo(page, "Professora Glória");
    await page.goto("/chamada/T8");
    await page.getByRole("link", { name: "← Dia anterior" }).click();
    await expect(page).toHaveURL(/data=2026-10-06/);
    await expect(page.locator("[data-aluno-id]").first()).toBeEnabled();
    await expect(page.getByRole("button", { name: "Salvar" })).toBeVisible();
  });

  test("professora não abre turma de outra", async ({ page }) => {
    await entrarComo(page, "Professora Glória");
    await page.goto("/chamada/T1");
    await expect(page).toHaveURL(/\/chamada\/T8$/);
  });

  test("falha de conexão ao salvar mantém as marcações", async ({ page }) => {
    await entrarComo(page, "Professora Helena"); // P8 → T9
    await expect(page).toHaveURL(/\/chamada\/T9$/);

    const bloquear = (route: import("@playwright/test").Route) =>
      route.request().method() === "POST" ? route.abort("internetdisconnected") : route.continue();
    await page.route("**/chamada/**", bloquear);

    const presentes = page.locator('[data-aluno-id][aria-pressed="false"]');
    const ids = [
      await presentes.nth(0).getAttribute("data-aluno-id"),
      await presentes.nth(1).getAttribute("data-aluno-id"),
    ];
    for (const id of ids) await page.locator(`[data-aluno-id="${id}"]`).click();
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Não conseguimos salvar. Verifique a internet e tente de novo.")).toBeVisible();
    for (const id of ids) {
      await expect(page.locator(`[data-aluno-id="${id}"]`)).toHaveAttribute("aria-pressed", "true");
    }

    await page.unroute("**/chamada/**", bloquear);
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    await expect(page.getByText("Chamada salva")).toBeVisible();
  });
});
