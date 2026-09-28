-- ============================================================
-- M.D Criações — Migração 06: Financeiro e Chamados
-- Rode depois dos scripts anteriores (setup, 02, 03, 04, 05).
-- ============================================================

-- ---------------------------------------------------------------
-- VENDAS (ganhos)
-- ---------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clients(id) on delete set null,
  servico text,
  valor numeric not null default 0,
  data date,
  vencimento date,
  forma_pagamento text,
  valor_pago numeric not null default 0,
  status text not null default 'pendente' check (status in ('pendente','cancelado')),
  created_at timestamptz default now()
);
alter table public.sales enable row level security;

drop policy if exists "sales_marketing_all" on public.sales;
create policy "sales_marketing_all" on public.sales
  for all using (public.is_marketing()) with check (public.is_marketing());

drop policy if exists "sales_client_select" on public.sales;
create policy "sales_client_select" on public.sales
  for select using (cliente_id = public.my_client_id());

-- Pagamentos recebidos de cada venda (histórico)
create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  valor numeric not null default 0,
  data date,
  created_at timestamptz default now()
);
alter table public.sale_payments enable row level security;

drop policy if exists "sale_payments_marketing_all" on public.sale_payments;
create policy "sale_payments_marketing_all" on public.sale_payments
  for all using (public.is_marketing()) with check (public.is_marketing());

drop policy if exists "sale_payments_client_select" on public.sale_payments;
create policy "sale_payments_client_select" on public.sale_payments
  for select using (sale_id in (select id from public.sales where cliente_id = public.my_client_id()));

-- ---------------------------------------------------------------
-- GASTOS (só Marketing — nunca visível ao Cliente)
-- ---------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text,
  valor numeric not null default 0,
  data date,
  forma_pagamento text,
  observacao text,
  created_at timestamptz default now()
);
alter table public.expenses enable row level security;

drop policy if exists "expenses_marketing_all" on public.expenses;
create policy "expenses_marketing_all" on public.expenses
  for all using (public.is_marketing()) with check (public.is_marketing());

-- ---------------------------------------------------------------
-- CHAMADOS
-- ---------------------------------------------------------------
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clients(id) on delete set null,
  titulo text not null,
  descricao text,
  categoria text,
  prioridade text not null default 'Normal' check (prioridade in ('Baixa','Normal','Alta','Urgente')),
  status text not null default 'aberto' check (status in ('aberto','em_analise','em_desenvolvimento','aguardando_cliente','resolvido','fechado')),
  created_at timestamptz default now()
);
alter table public.tickets enable row level security;

drop policy if exists "tickets_staff_all" on public.tickets;
create policy "tickets_staff_all" on public.tickets
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "tickets_client_select" on public.tickets;
create policy "tickets_client_select" on public.tickets
  for select using (cliente_id = public.my_client_id());

drop policy if exists "tickets_client_insert" on public.tickets;
create policy "tickets_client_insert" on public.tickets
  for insert with check (cliente_id = public.my_client_id());

-- Comunicação do chamado
create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  autor text not null,
  texto text not null,
  created_at timestamptz default now()
);
alter table public.ticket_comments enable row level security;

drop policy if exists "ticket_comments_staff_all" on public.ticket_comments;
create policy "ticket_comments_staff_all" on public.ticket_comments
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "ticket_comments_client_select" on public.ticket_comments;
create policy "ticket_comments_client_select" on public.ticket_comments
  for select using (ticket_id in (select id from public.tickets where cliente_id = public.my_client_id()));

drop policy if exists "ticket_comments_client_insert" on public.ticket_comments;
create policy "ticket_comments_client_insert" on public.ticket_comments
  for insert with check (
    autor = 'Cliente'
    and ticket_id in (select id from public.tickets where cliente_id = public.my_client_id())
  );
