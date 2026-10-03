import { expect, test } from "@playwright/test";

const TRINTA_DIAS_EM_S = 30 * 24 * 60 * 60;

test.describe("entrar como (sessão simulada)", () => {
  test("lembra a usuária após fechar e reabrir", async ({ page, context }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/entrar$/);
    await page.getByRole("button", { name: "Professora Ana" }).click();
    await expect(page).toHaveURL(/\/chamada$/);

    // "Fechar e reabrir": nova aba no mesmo contexto (mesmos cookies).
    await page.close();
    const reaberta = await context.newPage();
    await reaberta.goto("/");
    await expect(reaberta).toHaveURL(/\/chamada$/);
    await expect(reaberta.getByRole("button", { name: "Professora Ana" })).toHaveCount(0);

    const sessao = (await context.cookies()).find((c) => c.name === "sessao");
    expect(sessao?.httpOnly).toBe(true);
    expect(sessao!.expires - Date.now() / 1000).toBeGreaterThanOrEqual(TRINTA_DIAS_EM_S);
  });

  test("professora não acessa rotas de secretaria", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByRole("button", { name: "Professora Ana" }).click();
    await expect(page).toHaveURL(/\/chamada$/);

    for (const rota of ["/mensalidades", "/hoje"]) {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/chamada$/);
      await expect(page.locator("body")).not.toContainText("Mensalidade");
    }
  });

  test("secretaria e direção entram na tela Hoje", async ({ page }) => {
    for (const nome of ["Secretaria", "Direção"]) {
      await page.goto("/entrar");
      await page.getByRole("button", { name: nome, exact: true }).click();
      await expect(page).toHaveURL(/\/hoje$/);
      await page.getByRole("button", { name: "Sair" }).click();
      await expect(page).toHaveURL(/\/entrar$/);
    }
  });

  test("sair volta para a tela de entrada", async ({ page, context }) => {
    await page.goto("/entrar");
    await page.getByRole("button", { name: "Professora Ana" }).click();
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
    expect((await context.cookies()).find((c) => c.name === "sessao")).toBeUndefined();

    await page.goto("/chamada");
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("cookie adulterado não dá acesso", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "sessao", value: "lixo", url: baseURL! }]);
    await page.goto("/hoje");
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("mostra o aviso de versão de teste", async ({ page }) => {
    await page.goto("/entrar");
    await expect(page.getByText("Versão de teste")).toBeVisible();
  });
});
