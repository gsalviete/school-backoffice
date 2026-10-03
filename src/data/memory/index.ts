import type { Repos } from "../repos";
import type { DadosSeed } from "./seed";

// Implementação em memória dos repositórios (POC).
// O estado vive no processo do servidor e SOME a cada restart/deploy — aceitável só para teste com usuárias.

export function criarReposEmMemoria(dados: DadosSeed): Repos {
  return {
    usuarios: {
      listar: async () => [...dados.usuarios],
      buscar: async (id) => dados.usuarios.find((u) => u.id === id),
    },
    turmas: {
      listar: async () => [...dados.turmas],
      listarPorProfessora: async (professoraId) => dados.turmas.filter((t) => t.professoraId === professoraId),
      buscar: async (id) => dados.turmas.find((t) => t.id === id),
    },
    alunos: {
      listar: async () => [...dados.alunos],
      listarAtivosPorTurma: async (turmaId) => dados.alunos.filter((a) => a.turmaId === turmaId && a.ativo),
    },
    chamadas: {
      listarPorPeriodo: async (inicio, fim) => dados.chamadas.filter((c) => c.data >= inicio && c.data <= fim),
      buscar: async (turmaId, data) => dados.chamadas.find((c) => c.turmaId === turmaId && c.data === data),
      salvar: async (chamada) => {
        const i = dados.chamadas.findIndex((c) => c.turmaId === chamada.turmaId && c.data === chamada.data);
        if (i >= 0) dados.chamadas[i] = chamada;
        else dados.chamadas.push(chamada);
      },
    },
    mensalidades: {
      listar: async () => [...dados.mensalidades],
    },
  };
}
