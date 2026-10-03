import { hoje } from "@/lib/relogio";
import { criarReposEmMemoria } from "./memory";
import { criarSeed } from "./memory/seed";
import type { Repos } from "./repos";

// Único ponto de troca de implementação. Na fase 2 este arquivo passa a devolver os repositórios Prisma.

const global = globalThis as typeof globalThis & { __repos?: Repos };

export function repos(): Repos {
  // Guardado em globalThis para sobreviver ao hot reload do `next dev`.
  global.__repos ??= criarReposEmMemoria(criarSeed(hoje()));
  return global.__repos;
}

export type { Repos } from "./repos";
