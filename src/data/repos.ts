import type { Aluno, Chamada, DataCivil, Mensalidade, Turma, Usuario } from "@/domain/tipos";

// Interfaces de acesso a dados. As telas falam só com elas — nunca com uma implementação.
// Fase 1 (POC): implementação em memória (./memory). Fase 2: Prisma/Postgres, sem tocar nas telas.
// Tudo assíncrono desde já, para a troca não mudar assinaturas.

export interface UsuarioRepo {
  listar(): Promise<Usuario[]>;
  buscar(id: string): Promise<Usuario | undefined>;
}

export interface TurmaRepo {
  listar(): Promise<Turma[]>;
  listarPorProfessora(professoraId: string): Promise<Turma[]>;
  buscar(id: string): Promise<Turma | undefined>;
}

export interface AlunoRepo {
  listar(): Promise<Aluno[]>;
  listarAtivosPorTurma(turmaId: string): Promise<Aluno[]>;
  buscar(id: string): Promise<Aluno | undefined>;
}

export interface ChamadaRepo {
  /** Chamadas com data entre `inicio` e `fim`, inclusive. */
  listarPorPeriodo(inicio: DataCivil, fim: DataCivil): Promise<Chamada[]>;
  buscar(turmaId: string, data: DataCivil): Promise<Chamada | undefined>;
  /** Grava a chamada da turma no dia, substituindo a existente (uma por turma por dia). */
  salvar(chamada: Chamada): Promise<void>;
}

export interface MensalidadeRepo {
  listar(): Promise<Mensalidade[]>;
}

export interface Repos {
  usuarios: UsuarioRepo;
  turmas: TurmaRepo;
  alunos: AlunoRepo;
  chamadas: ChamadaRepo;
  mensalidades: MensalidadeRepo;
}
