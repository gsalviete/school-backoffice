import { expect, test, type Page } from "@playwright/test";

// Servidor com HOJE_FIXO=2026-10-07: setembro em aberto já venceu (dia 10), outubro ainda não.
// Cada teste marca a primeira linha do momento, então não depende do que os outros gravaram.

async function entrarComo(page: Page, nome: string) {
  await page.goto("/entrar");
  await page.getByRole("button", { name: nome, exact: true }).click();
  await expect(page).not.toHaveURL(/\/entrar$/);
}

async function abrirMensalidades(page: Page) {
  await entrarComo(page, "Secretaria");
  await page.getByRole("link", { name: "Mensalidades" }).click();
  await expect(page).toHaveURL(/\/mensalidades$/);
}

const emAberto = (page: Page) => page.locator('[data-lista="em-aberto"] > li');
const linhaEmAberto = (page: Page, id: string) => page.locator(`[data-lista="em-aberto"] [data-mensalidade-id="${id}"]`);

async function marcarPrimeira(page: Page): Promise<string> {
  const primeira = emAberto(page).first();
  const id = (await primeira.getAttribute("data-mensalidade-id"))!;
  await primeira.getByRole("button", { name: "Marcar como paga" }).click(); // toque 1
  await expect(primeira.getByLabel("Data do pagamento")).toHaveValue("2026-10-07"); // padrão: hoje
  await primeira.getByRole("button", { name: "Confirmar" }).click(); // toque 2
  await expect(page.getByText("Pagamento registrado")).toBeVisible();
  return id;
}

test.describe("tela Mensalidades", () => {
  test("atrasadas aparecem primeiro com 'em atraso há X dias'", async ({ page }) => {
    await abrirMensalidades(page);
    const situacoes = await emAberto(page).allInnerTexts();
    expect(situacoes.length).toBeGreaterThan(0);
    expect(situacoes[0]).toMatch(/Em atraso há \d+ dias/);
    expect(situacoes[0]).toContain("R$");
    expect(situacoes.at(-1)).toContain("Vence dia 10");
    const primeiraNoPrazo = situacoes.findIndex((s) => s.includes("Vence dia"));
    expect(situacoes.slice(primeiraNoPrazo).some((s) => s.includes("Em atraso"))).toBe(false);
    // Entre as atrasadas, a mais antiga primeiro.
    const dias = situacoes.flatMap((s) => s.match(/Em atraso há (\d+) dia/)?.[1] ?? []).map(Number);
    expect(dias).toEqual([...dias].sort((a, b) => b - a));
  });

  test("marcar paga em 2 toques (Marcar paga → Confirmar com data de hoje)", async ({ page }) => {
    await abrirMensalidades(page);
    const id = await marcarPrimeira(page);
    await expect(linhaEmAberto(page, id)).toHaveCount(0);
    await expect(page.getByRole("status").getByRole("button", { name: "Desfazer" })).toBeVisible();
  });

  test("desfazer pagamento recém-marcado", async ({ page }) => {
    await abrirMensalidades(page);
    const id = await marcarPrimeira(page);
    await page.getByRole("status").getByRole("button", { name: "Desfazer" }).click();
    await expect(page.getByText("Pagamento desfeito")).toBeVisible();
    await expect(linhaEmAberto(page, id)).toHaveCount(1);
  });

  test("desfazer pela seção 'Pagas recentemente'", async ({ page }) => {
    await abrirMensalidades(page);
    const id = await marcarPrimeira(page);
    await page.getByText(/Pagas recentemente/).click();
    const paga = page.locator(`[data-lista="pagas"] [data-mensalidade-id="${id}"]`);
    await expect(paga).toContainText("Paga em 07/10/2026");
    await paga.getByRole("button", { name: "Desfazer" }).click();
    await expect(linhaEmAberto(page, id)).toHaveCount(1);
  });

  test("busca por nome do aluno", async ({ page }) => {
    await abrirMensalidades(page);
    const nome = (await emAberto(page).first().locator("strong").innerText()).trim();
    await page.getByLabel("Buscar aluno").fill(nome.split(" ")[0]!.toLowerCase());
    const textos = await emAberto(page).allInnerTexts();
    expect(textos.length).toBeGreaterThan(0);
    expect(textos.every((t) => t.toLowerCase().includes(nome.split(" ")[0]!.toLowerCase()))).toBe(true);
  });

  test("professora não vê mensalidades", async ({ page }) => {
    await entrarComo(page, "Professora Ana");
    await expect(page.getByRole("link", { name: "Mensalidades" })).toHaveCount(0);
    await page.goto("/mensalidades");
    await expect(page).toHaveURL(/\/chamada$/);
    await expect(page.locator("body")).not.toContainText("Mensalidade");
    await expect(page.locator("body")).not.toContainText("R$");
  });
});
