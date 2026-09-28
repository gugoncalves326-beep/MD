-- ============================================================
-- M.D Criações — Migração 02: Leads e Clientes
-- Rode este script no SQL Editor do Supabase (depois do
-- supabase-setup.sql). Pode rodar de novo sem problema.
-- ============================================================

create extension if not exists pgcrypto;

-- Função auxiliar: o usuário atual é do Marketing?
create or replace function public.is_marketing()
returns boolean
language sql stable
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'marketing'
  );
$$;

-- ---------------------------------------------------------------
-- LEADS
-- ---------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  whatsapp text,
  email text,
  servico text,
  orcamento text,
  prazo text,
  mensagem text,
  origem text default 'Site',
  status text not null default 'novo'
    check (status in ('novo','contato','negociacao','proposta','fechado','perdido')),
  created_at timestamptz default now()
);

alter table public.leads enable row level security;

-- Qualquer visitante (mesmo sem login) pode CRIAR um lead pelo
-- formulário público de orçamento do site.
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert" on public.leads
  for insert
  with check (true);

-- Só o Marketing lê, atualiza ou apaga leads.
drop policy if exists "leads_marketing_select" on public.leads;
create policy "leads_marketing_select" on public.leads
  for select using (public.is_marketing());

drop policy if exists "leads_marketing_update" on public.leads;
create policy "leads_marketing_update" on public.leads
  for update using (public.is_marketing());

drop policy if exists "leads_marketing_delete" on public.leads;
create policy "leads_marketing_delete" on public.leads
  for delete using (public.is_marketing());

-- ---------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  whatsapp text,
  email text,
  cidade text,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;

-- Só o Marketing cria, lê, atualiza ou apaga clientes (por enquanto;
-- quando o Cliente ganhar acesso ao próprio registro, adicionamos uma
-- policy extra de leitura restrita a ele mesmo).
drop policy if exists "clients_marketing_all" on public.clients;
create policy "clients_marketing_all" on public.clients
  for all using (public.is_marketing()) with check (public.is_marketing());

-- O próprio Cliente pode ler (só ler) o seu próprio registro, comparando
-- o e-mail da conta logada — é assim que o nome dele aparece certinho
-- em "Meu Projeto" e "Minhas Propostas".
drop policy if exists "clients_self_select" on public.clients;
create policy "clients_self_select" on public.clients
  for select using (lower(email) = lower(auth.jwt() ->> 'email'));
