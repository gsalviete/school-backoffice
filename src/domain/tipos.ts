// Modelo de domínio da v1. Só os campos que o doc de produto pede — nada além (LGPD: dados de menores).

/** Data civil no fuso da escola, formato AAAA-MM-DD. */
export type DataCivil = string;
/** Mês de referência de uma mensalidade, formato AAAA-MM. */
export type Competencia = string;

export type Perfil = "professora" | "secretaria" | "direcao";

export interface Usuario {
  id: string;
  nome: string;
  perfil: Perfil;
}

export interface Turma {
  id: string;
  nome: string;
  professoraId: string;
}

export interface Aluno {
  id: string;
  nome: string;
  turmaId: string;
  responsavelNome: string;
  responsavelTelefone: string;
  ativo: boolean;
}

/** Uma chamada por turma por dia. Quem não está em `faltasAlunoIds` estava presente. */
export interface Chamada {
  turmaId: string;
  data: DataCivil;
  faltasAlunoIds: string[];
  registradaPor: string;
  /** Instante ISO 8601 da última gravação. */
  atualizadaEm: string;
}

export interface Mensalidade {
  id: string;
  alunoId: string;
  competencia: Competencia;
  /** Dinheiro sempre em centavos (inteiro). */
  valorCentavos: number;
  vencimento: DataCivil;
  pagaEm?: DataCivil;
  /** Instante ISO 8601 em que o pagamento foi registrado no app (para "pagas recentemente"). */
  pagamentoRegistradoEm?: string;
}
