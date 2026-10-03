import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react 7.x quebra no ESLint 10 ao detectar a versão do React ("detect" chama
  // context.getFilename, removido). Versão fixa evita a detecção.
  { settings: { react: { version: "19.3" } } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);
