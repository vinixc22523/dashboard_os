-- Rode este script no SQL Editor do seu projeto Supabase (Project > SQL Editor > New query).
-- Diferente do projeto original (Lovable Cloud), aqui NINGUÉM lê essas tabelas
-- direto do navegador: o Next.js sempre intermedia o acesso com a service
-- role key, que fica só no servidor. Por isso o RLS abaixo não libera leitura
-- pública nenhuma.

create extension if not exists pgcrypto;

create table if not exists public.pipefy_config (
  id uuid primary key default gen_random_uuid(),
  pipe_id text,
  singleton boolean not null default true unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pipefy_config enable row level security;
-- Sem policies para anon/authenticated: só a service role (usada pelo
-- servidor Next.js) consegue ler ou escrever aqui.

create table if not exists public.pipefy_snapshots (
  id uuid primary key default gen_random_uuid(),
  pipe_id text not null,
  pipe_name text,
  synced_at timestamptz not null default now(),
  source text not null default 'manual',
  status text not null default 'success',
  error_message text,
  kpis jsonb not null default '{}'::jsonb,
  phases jsonb not null default '[]'::jsonb,
  cards jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pipefy_snapshots_synced_at_idx
  on public.pipefy_snapshots (synced_at desc);

alter table public.pipefy_snapshots enable row level security;

-- Se preferir configurar o Pipe ID pelo banco em vez de variável de ambiente,
-- descomente a linha abaixo e troque pelo ID do seu pipe:
-- insert into public.pipefy_config (pipe_id) values ('SEU_PIPE_ID');
insert into public.pipefy_config (pipe_id) values (null);
