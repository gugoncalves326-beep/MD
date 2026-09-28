-- ============================================================
-- M.D Criações — Migração 04: Propostas
-- Rode depois dos scripts anteriores (setup, 02, 03).
-- ============================================================

-- ---------------------------------------------------------------
-- PROPOSTAS
-- ---------------------------------------------------------------
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clients(id) on delete set null,
  forma_pagamento text,
  prazo text,
  validade date,
  desconto numeric default 0,
  observacoes text,
  status text not null default 'rascunho'
    check (status in ('rascunho','enviada','aguardando','aceita','recusada','expirada')),
  created_at timestamptz default now()
);
alter table public.proposals enable row level security;

drop policy if exists "proposals_staff_all" on public.proposals;
create policy "proposals_staff_all" on public.proposals
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "proposals_client_select" on public.proposals;
create policy "proposals_client_select" on public.proposals
  for select using (cliente_id = public.my_client_id());

-- Note: o Cliente NÃO tem policy de update direta nesta tabela.
-- As respostas dele (aceitar/recusar/solicitar alteração) passam pela
-- função client_respond_proposal() abaixo, que valida as regras antes
-- de mudar o status — assim ele não consegue alterar valores, itens
-- ou outros campos por fora da regra de negócio.

-- ---------------------------------------------------------------
-- ITENS DA PROPOSTA
-- ---------------------------------------------------------------
create table if not exists public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals(id) on delete cascade,
  servico text not null,
  qtd numeric not null default 1,
  valor numeric not null default 0,
  created_at timestamptz default now()
);
alter table public.proposal_items enable row level security;

drop policy if exists "proposal_items_staff_all" on public.proposal_items;
create policy "proposal_items_staff_all" on public.proposal_items
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "proposal_items_client_select" on public.proposal_items;
create policy "proposal_items_client_select" on public.proposal_items
  for select using (proposal_id in (select id from public.proposals where cliente_id = public.my_client_id()));

-- ---------------------------------------------------------------
-- COMENTÁRIOS / NEGOCIAÇÃO DA PROPOSTA
-- ---------------------------------------------------------------
create table if not exists public.proposal_comments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals(id) on delete cascade,
  autor text not null,
  texto text not null,
  created_at timestamptz default now()
);
alter table public.proposal_comments enable row level security;

drop policy if exists "proposal_comments_staff_all" on public.proposal_comments;
create policy "proposal_comments_staff_all" on public.proposal_comments
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "proposal_comments_client_select" on public.proposal_comments;
create policy "proposal_comments_client_select" on public.proposal_comments
  for select using (proposal_id in (select id from public.proposals where cliente_id = public.my_client_id()));

drop policy if exists "proposal_comments_client_insert" on public.proposal_comments;
create policy "proposal_comments_client_insert" on public.proposal_comments
  for insert with check (
    autor = 'Cliente'
    and proposal_id in (select id from public.proposals where cliente_id = public.my_client_id())
  );

-- ---------------------------------------------------------------
-- FUNÇÃO: o Cliente aceita / recusa / solicita alteração
-- ---------------------------------------------------------------
create or replace function public.client_respond_proposal(
  p_id uuid,
  p_new_status text,
  p_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_current_status text;
  v_proposal_client uuid;
begin
  v_client_id := public.my_client_id();
  if v_client_id is null then
    raise exception 'Não autorizado';
  end if;

  select status, cliente_id into v_current_status, v_proposal_client
  from public.proposals where id = p_id;

  if v_proposal_client is null or v_proposal_client <> v_client_id then
    raise exception 'Proposta não encontrada para este cliente';
  end if;

  if v_current_status not in ('enviada','aguardando') then
    raise exception 'Esta proposta não pode mais ser respondida';
  end if;

  if p_new_status not in ('aceita','recusada','aguardando') then
    raise exception 'Status inválido';
  end if;

  update public.proposals set status = p_new_status where id = p_id;

  if p_message is not null and length(trim(p_message)) > 0 then
    insert into public.proposal_comments (proposal_id, autor, texto)
    values (p_id, 'Cliente', p_message);
  end if;
end;
$$;

grant execute on function public.client_respond_proposal(uuid, text, text) to authenticated;
