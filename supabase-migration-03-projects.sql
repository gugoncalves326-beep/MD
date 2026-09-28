-- ============================================================
-- M.D Criações — Migração 03: Projetos, Tarefas e Comentários
-- Rode depois de supabase-setup.sql e da migração 02.
-- ============================================================

-- Função auxiliar: o usuário é da equipe (marketing ou programador)?
create or replace function public.is_staff()
returns boolean
language sql stable
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('marketing','programador')
  );
$$;

-- Função auxiliar: id do cliente que corresponde ao e-mail logado
-- (é assim que um Cliente vê "o próprio" projeto, sem precisar escolher).
create or replace function public.my_client_id()
returns uuid
language sql stable
as $$
  select id from public.clients
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;

-- ---------------------------------------------------------------
-- PROJETOS
-- ---------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cliente_id uuid references public.clients(id) on delete set null,
  servico text,
  valor numeric default 0,
  entrada numeric default 0,
  prazo date,
  status text not null default 'novo_pedido' check (status in (
    'novo_pedido','aguardando_info','briefing_completo','enviado_programacao',
    'em_desenvolvimento','aguardando_revisao','alteracoes_solicitadas',
    'aguardando_aprovacao','publicacao','concluido'
  )),
  objetivo text default '',
  estrutura text default '',
  solicitacoes text default '',
  created_at timestamptz default now()
);
alter table public.projects enable row level security;

drop policy if exists "projects_staff_all" on public.projects;
create policy "projects_staff_all" on public.projects
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "projects_client_select" on public.projects;
create policy "projects_client_select" on public.projects
  for select using (cliente_id = public.my_client_id());

-- ---------------------------------------------------------------
-- TAREFAS
-- ---------------------------------------------------------------
create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  nome text not null,
  status text not null default 'a_fazer' check (status in ('a_fazer','em_andamento','bloqueada','concluida')),
  created_at timestamptz default now()
);
alter table public.project_tasks enable row level security;

drop policy if exists "tasks_staff_all" on public.project_tasks;
create policy "tasks_staff_all" on public.project_tasks
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "tasks_client_select" on public.project_tasks;
create policy "tasks_client_select" on public.project_tasks
  for select using (project_id in (select id from public.projects where cliente_id = public.my_client_id()));

-- ---------------------------------------------------------------
-- COMENTÁRIOS
-- ---------------------------------------------------------------
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  autor text not null,
  texto text not null,
  interno boolean not null default false,
  created_at timestamptz default now()
);
alter table public.project_comments enable row level security;

drop policy if exists "comments_staff_all" on public.project_comments;
create policy "comments_staff_all" on public.project_comments
  for all using (public.is_staff()) with check (public.is_staff());

-- Cliente só vê comentários NÃO internos do próprio projeto...
drop policy if exists "comments_client_select" on public.project_comments;
create policy "comments_client_select" on public.project_comments
  for select using (
    interno = false
    and project_id in (select id from public.projects where cliente_id = public.my_client_id())
  );

-- ...e só consegue escrever comentários NÃO internos no próprio projeto.
drop policy if exists "comments_client_insert" on public.project_comments;
create policy "comments_client_insert" on public.project_comments
  for insert with check (
    interno = false
    and project_id in (select id from public.projects where cliente_id = public.my_client_id())
  );
