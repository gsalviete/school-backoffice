import { expect, test, type Page } from "@playwright/test";

// O servidor de teste roda com HOJE_FIXO=2026-10-07 (quarta). No seed, T1, T3 e T4 já fizeram a chamada
// hoje; em T1 faltou T1-09 (Miguel Pereira). Estes testes só leem — rodam antes dos que gravam chamadas
// (ver projetos em playwright.config.ts), então o seed está intacto.

async function entrarComo(page: Page, nome: string) {
  await page.goto("/entrar");
  await page.getByRole("button", { name: nome, exact: true }).click();
  await expect(page).not.toHaveURL(/\/entrar$/);
}

const secao = (page: Page, nome: string) => page.getByRole("region", { name: nome });

async function conferirTelaHoje(page: Page) {
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.getByText("quarta-feira, 7 de outubro")).toBeVisible();

  const feitas = secao(page, "Já fizeram a chamada — quem faltou hoje");
  await expect(feitas.locator("[data-turma-id]")).toHaveCount(3);
  for (const id of ["T1", "T3", "T4"]) await expect(feitas.locator(`[data-turma-id="${id}"]`)).toBeVisible();
  await expect(feitas.locator('[data-turma-id="T1"]')).toContainText("Miguel Pereira");
  await expect(feitas.locator('[data-turma-id="T3"]')).toContainText("Ninguém faltou");

  const pendentes = secao(page, "Ainda não fizeram a chamada");
  await expect(pendentes.locator("[data-turma-id]")).toHaveCount(7);
  // Com o nome da professora: T2 é da Professora Ana.
  await expect(pendentes.locator('[data-turma-id="T2"]')).toContainText("Professora Ana");

  await expect(secao(page, "Muitas faltas este mês (5 ou mais)")).toBeVisible();

  // Uma coluna no celular, duas no desktop — e nunca rolagem horizontal.
  const xPendentes = (await pendentes.boundingBox())!.x;
  const xFeitas = (await feitas.boundingBox())!.x;
  if (page.viewportSize()!.width >= 900) expect(xFeitas).toBeGreaterThan(xPendentes);
  else expect(xFeitas).toBe(xPendentes);
  const largura = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(largura[0]).toBeLessThanOrEqual(largura[1]!);
}

test.describe("tela Hoje", () => {
  test("secretária vê faltas de 3 turmas e 7 pendentes", async ({ page }) => {
    await entrarComo(page, "Secretaria");
    await conferirTelaHoje(page);
  });

  test("direção vê a mesma tela", async ({ page }) => {
    await entrarComo(page, "Direção");
    await conferirTelaHoje(page);
  });

  test("professora não acessa /hoje", async ({ page }) => {
    await entrarComo(page, "Professora Ana");
    await page.goto("/hoje");
    await expect(page).toHaveURL(/\/chamada$/);
  });

  test("telefone do responsável só aparece ao tocar no aluno", async ({ page }) => {
    await entrarComo(page, "Secretaria");
    const aluno = page.locator('[data-aluno-id="T1-09"]');
    await expect(aluno).toBeVisible();
    // Nada de telefone na página nem no payload enviado com ela.
    expect(await page.content()).not.toMatch(/\(11\) 90000-\d{4}/);

    await aluno.click();
    await expect(aluno).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: /\(11\) 90000-0\d{3}/ })).toBeVisible();
    await expect(page.getByText(/Responsável: .+ Pereira/)).toBeVisible();
  });
});
