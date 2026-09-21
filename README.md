# Dashboard OS — Ordem de Serviço (Pipefy)

Dashboard de ordens de serviço sincronizado com o Pipefy, construído do zero (Next.js + Supabase + Vercel), sem depender de nenhuma plataforma de IA. Você é dono do código, da conta de hospedagem e do banco de dados.

## Como o sistema funciona

- O Next.js roda um servidor próprio (não é um site estático). Ele busca os cards do Pipefy via GraphQL, calcula os indicadores (MTTR, MTBF, disponibilidade, atrasos, downtime) e salva um "snapshot" no Postgres do Supabase.
- Ninguém acessa o Pipefy nem o Supabase direto do navegador. O navegador só fala com o próprio Next.js, que usa a `service role key` do Supabase por trás dos panos. Isso corrige um problema de segurança que existia no projeto original (lá, o banco era lido publicamente por qualquer pessoa com a URL).
- A busca dos cards no Pipefy pagina corretamente (`cards(first: 50, after: $cursor)` em loop até `hasNextPage = false`), corrigindo o bug do projeto original que trazia só os primeiros 50 cards de cada fase.
- Existem duas formas de atualizar os dados:
  1. **Automática**: uma rotina agendada (`/api/cron`) roda uma vez por dia às 03:00 (America/Sao_Paulo) através do Vercel Cron. É isso que garante que, ao abrir o painel de qualquer computador, os dados já estão lá, sem precisar clicar em nada.
  2. **Manual**: o botão "Atualizar agora" no topo do painel dispara uma sincronização na hora.
- Sem Pipe ID e token configurados, o painel mostra dados de demonstração automaticamente, para você conseguir ver a interface funcionando antes de configurar a integração real.

## Passo a passo para colocar no ar

### 1. Criar um projeto Supabase (seu, independente)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Crie um novo projeto (New Project). Guarde a senha do banco em local seguro.
3. Em **Project Settings > API**, copie:
   - `Project URL` → vai virar `SUPABASE_URL`
   - `service_role` key (em "Project API keys", **não** a `anon`/`public`) → vai virar `SUPABASE_SERVICE_ROLE_KEY`
4. Abra **SQL Editor > New query**, cole o conteúdo do arquivo `supabase/schema.sql` deste projeto e execute. Isso cria as tabelas `pipefy_config` e `pipefy_snapshots`.

### 2. Gerar o token do Pipefy

1. No Pipefy, vá em **Configurações pessoais > Tokens de acesso pessoal** e crie um novo token.
2. Pegue o ID do pipe que você quer sincronizar: abra o pipe no navegador e copie o número que aparece na URL (`https://app.pipefy.com/pipes/XXXXXXX`).

### 3. Rodar localmente (opcional, para testar antes do deploy)

```sh
npm install
cp .env.example .env.local
# edite .env.local com os valores reais
npm run dev
```

Abra `http://localhost:3000`. Sem preencher o `.env.local`, o painel já funciona em modo demonstração.

### 4. Colocar em produção com a Vercel (para funcionar de qualquer computador)

1. Suba este projeto para um repositório no GitHub (crie um repositório vazio e faça `git push`).
2. Crie uma conta em [vercel.com](https://vercel.com) (dá para entrar direto com a conta do GitHub).
3. Clique em **Add New > Project**, selecione o repositório e importe.
4. Em **Environment Variables**, adicione as mesmas variáveis do `.env.example`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PIPEFY_PIPE_ID`
   - `PIPEFY_API_TOKEN`
   - `SYNC_SECRET` (qualquer string aleatória longa)
   - `CRON_SECRET` (outra string aleatória longa)
5. Clique em **Deploy**. Ao final, a Vercel te dá uma URL pública (`https://seu-projeto.vercel.app`), acessível de qualquer computador.
6. O `vercel.json` já registra o cron diário (`0 6 * * *` em UTC = 03:00 em America/Sao_Paulo, que não tem horário de verão). A Vercel ativa isso automaticamente no deploy; confira em **Project > Settings > Cron Jobs**.
7. Assim que o deploy terminar, entre no painel e clique em **Atualizar agora** uma vez, para gerar o primeiro snapshot. Dali em diante, a rotina diária mantém tudo atualizado sozinha.

### 5. Confirmar que funciona de outro computador

Abra a URL da Vercel em qualquer dispositivo, sem estar logado em nada. O painel deve carregar os dados reais direto, sem pedir configuração — porque quem guarda a chave e sincroniza é o servidor, não o navegador de quem está olhando.

## Estrutura do projeto

```
src/
  app/                    → páginas (painel, chamados, técnicos, relatórios) e rotas de API
    api/sync/route.ts     → sincronização manual (botão "Atualizar agora")
    api/cron/route.ts     → sincronização automática diária (chamada pela Vercel)
  components/             → componentes de interface (cards, gráficos, tabelas)
  lib/
    pipefy.ts             → integração com a API GraphQL do Pipefy (com paginação)
    kpis.ts                → cálculo de MTTR, MTBF, disponibilidade, downtime
    dashboard-data.ts     → busca o snapshot mais recente / decide modo demo
    supabase-admin.ts     → cliente Supabase (só usado no servidor)
    demo.ts               → gerador de dados de demonstração
supabase/schema.sql       → script para criar as tabelas no seu Supabase
vercel.json               → configuração do cron diário
```

## Por que essas escolhas de tecnologia

- **Next.js**: framework React com servidor embutido, então dá para ter páginas e rotas de API no mesmo projeto, sem precisar montar um backend separado.
- **Supabase**: só Postgres gerenciado + client JS, sem nenhum recurso de IA. Alternativa: rodar Postgres você mesmo (Docker, Railway, Neon) e trocar só o `lib/supabase-admin.ts`.
- **Vercel**: hospedagem gratuita para projetos Next.js, com cron jobs nativos. Alternativa: qualquer VPS com Node.js e um cron do sistema operacional chamando `/api/cron` via `curl`.

Nenhuma dessas peças é uma ferramenta de "geração de app por IA" como o Lovable: são serviços de infraestrutura (hospedagem e banco de dados) comuns no mercado, e o código-fonte é seu, versionado no seu GitHub.
