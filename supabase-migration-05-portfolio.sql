-- ============================================================
-- M.D Criações — Migração 05: Portfólio administrável
-- Rode depois dos scripts anteriores (setup, 02, 03, 04).
-- ============================================================

create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cliente_nome text,
  categoria text,
  descricao text,
  tecnologias text,
  link text,
  data date,
  destaque boolean not null default false,
  exibir_publico boolean not null default false,
  cor text default '#6C2BD9',
  created_at timestamptz default now()
);
alter table public.portfolio enable row level security;

-- Marketing cria, edita, apaga e vê tudo (inclusive o que ainda não
-- está publicado no site).
drop policy if exists "portfolio_marketing_all" on public.portfolio;
create policy "portfolio_marketing_all" on public.portfolio
  for all using (public.is_marketing()) with check (public.is_marketing());

-- QUALQUER visitante do site (sem precisar estar logado) só vê os
-- trabalhos marcados como "Exibir no site".
drop policy if exists "portfolio_public_select" on public.portfolio;
create policy "portfolio_public_select" on public.portfolio
  for select using (exibir_publico = true);
