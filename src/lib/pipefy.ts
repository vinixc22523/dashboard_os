import "server-only";
import type { PipefyCard, PipefyLabel, PipefyPhase } from "./types";

const PIPEFY_ENDPOINT = "https://api.pipefy.com/graphql";

// Busca só a lista de fases e a contagem de cards de cada uma (consulta leve).
const PIPE_PHASES_QUERY = `
query PipePhases($id: ID!) {
  pipe(id: $id) {
    id
    name
    phases {
      id
      name
      done
      cards_count
    }
  }
}`;

// Busca uma página de cards de UMA fase por vez. Isso é o que corrige o bug
// do projeto original: lá a consulta trazia só os primeiros 50 cards de cada
// fase e nunca seguia para a próxima página (sem usar "after"/"hasNextPage"),
// então fases com mais de 50 cards perdiam a maior parte do histórico.
const PHASE_CARDS_QUERY = `
query PhaseCards($id: ID!, $cursor: String) {
  phase(id: $id) {
    cards(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          createdAt
          due_date
          finished_at
          current_phase { id name }
          labels { id name color }
          fields { name value }
        }
      }
    }
  }
}`;

type RawNode = {
  id: string;
  title: string;
  createdAt: string;
  due_date: string | null;
  finished_at: string | null;
  current_phase: { id: string; name: string } | null;
  labels: PipefyLabel[] | null;
  fields: { name: string; value: string | null }[] | null;
};

type RawPhaseSummary = {
  id: string;
  name: string;
  done: boolean;
  cards_count: number;
};

async function pipefyRequest<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(PIPEFY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    // Nunca cachear: o snapshot em memória sempre precisa ser o mais recente.
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pipefy respondeu ${response.status}: ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).join(" | ").slice(0, 300));
  }
  if (!payload.data) throw new Error("Resposta vazia do Pipefy.");
  return payload.data;
}

// Limite de segurança para não rodar para sempre em um pipe gigante ou mal configurado.
const MAX_CARDS_PER_PHASE = 5000;
// Pausa curta entre páginas para não estourar o limite de uso da API do Pipefy.
const PAGE_DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type PhaseCardsResponse = {
  phase: {
    cards: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: { node: RawNode }[];
    };
  } | null;
};

async function fetchAllCardsForPhase(
  token: string,
  phase: RawPhaseSummary,
): Promise<PipefyCard[]> {
  const cards: PipefyCard[] = [];
  let cursor: string | null = null;
  const now = Date.now();

  do {
    const data: PhaseCardsResponse = await pipefyRequest<PhaseCardsResponse>(
      token,
      PHASE_CARDS_QUERY,
      { id: phase.id, cursor },
    );

    const pageCards = data.phase?.cards;
    if (!pageCards) break;

    for (const edge of pageCards.edges) {
      const node = edge.node;
      const done = Boolean(phase.done || node.finished_at);
      const due = node.due_date ? new Date(node.due_date).getTime() : null;
      cards.push({
        id: node.id,
        title: node.title,
        phaseId: node.current_phase?.id ?? phase.id,
        phaseName: node.current_phase?.name ?? phase.name,
        labels: node.labels ?? [],
        fields: (node.fields ?? [])
          .filter((f) => f.value)
          .map((f) => ({ name: f.name, value: String(f.value) })),
        createdAt: node.createdAt,
        dueDate: node.due_date,
        finishedAt: node.finished_at,
        done,
        late: !done && due !== null && due < now,
      });
    }

    cursor = pageCards.pageInfo.hasNextPage ? pageCards.pageInfo.endCursor : null;
    if (cursor) await sleep(PAGE_DELAY_MS);
  } while (cursor && cards.length < MAX_CARDS_PER_PHASE);

  return cards;
}

export async function fetchPipeSnapshot(
  pipeId: string,
  token: string,
): Promise<{ pipeName: string | null; phases: PipefyPhase[]; cards: PipefyCard[] }> {
  const data = await pipefyRequest<{
    pipe: { id: string; name: string; phases: RawPhaseSummary[] } | null;
  }>(token, PIPE_PHASES_QUERY, { id: pipeId });

  const pipe = data.pipe;
  if (!pipe) throw new Error("Pipe não encontrado. Confira o Pipe ID e as permissões do token.");

  const phases: PipefyPhase[] = [];
  const cards: PipefyCard[] = [];

  // Uma fase por vez, cada uma paginando até o fim. Sequencial de propósito:
  // evita disparar dezenas de requisições simultâneas contra a API do Pipefy.
  for (const phase of pipe.phases ?? []) {
    const phaseCards = await fetchAllCardsForPhase(token, phase);
    phases.push({
      id: phase.id,
      name: phase.name,
      done: Boolean(phase.done),
      cardsCount: phase.cards_count ?? phaseCards.length,
    });
    cards.push(...phaseCards);
  }

  return { pipeName: pipe.name ?? null, phases, cards };
}
