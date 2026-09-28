-- ============================================================
-- M.D Criações — Migração 07: Arquivos, Histórico, Aprovação do
-- projeto, Automação da proposta, Briefing, Conteúdo editável e
-- Usuários. Rode depois das migrações 02 a 06. Pode rodar de novo.
-- ============================================================

-- As funções de cargo passam a ser SECURITY DEFINER (leem o próprio
-- cargo sem cair em recursão de RLS na tabela profiles).
create or replace function public.is_marketing()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'marketing');
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('marketing','programador'));
$$;

-- Marketing enxerga a lista de usuários (tela "Usuários")
drop policy if exists "profiles_marketing_select" on public.profiles;
create policy "profiles_marketing_select" on public.profiles
  for select using (public.is_marketing());

-- ---------------------------------------------------------------
-- BRIEFING completo (guardado em JSON dentro do projeto)
-- ---------------------------------------------------------------
alter table public.projects add column if not exists briefing jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------
-- HISTÓRICO DE AÇÕES
-- ---------------------------------------------------------------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  user_role text,
  acao text not null,
  entidade text,
  entidade_id uuid,
  detalhe text,
  project_id uuid,
  created_at timestamptz default now()
);
create index if not exists activity_log_created_idx on public.activity_log (created_at desc);
alter table public.activity_log enable row level security;

drop policy if exists "activity_insert_self" on public.activity_log;
create policy "activity_insert_self" on public.activity_log
  for insert with check (lower(user_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "activity_select_marketing" on public.activity_log;
create policy "activity_select_marketing" on public.activity_log
  for select using (public.is_marketing());

-- O Programador vê só o histórico técnico (nunca valores financeiros)
drop policy if exists "activity_select_programador" on public.activity_log;
create policy "activity_select_programador" on public.activity_log
  for select using (public.is_staff() and entidade in ('projeto','tarefa','arquivo','chamado'));

-- ---------------------------------------------------------------
-- ARQUIVOS DO PROJETO (cliente / interno / final)
-- ---------------------------------------------------------------
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  categoria text not null check (categoria in ('cliente','interno','final')),
  nome text not null,
  path text not null,
  tamanho bigint,
  autor text,
  created_at timestamptz default now()
);
alter table public.project_files enable row level security;

drop policy if exists "pfiles_staff_all" on public.project_files;
create policy "pfiles_staff_all" on public.project_files
  for all using (public.is_staff()) with check (public.is_staff());

-- Cliente vê os próprios envios e os arquivos finais; NUNCA os internos.
drop policy if exists "pfiles_client_select" on public.project_files;
create policy "pfiles_client_select" on public.project_files
  for select using (
    categoria in ('cliente','final')
    and project_id in (select id from public.projects where cliente_id = public.my_client_id())
  );

drop policy if exists "pfiles_client_insert" on public.project_files;
create policy "pfiles_client_insert" on public.project_files
  for insert with check (
    categoria = 'cliente'
    and project_id in (select id from public.projects where cliente_id = public.my_client_id())
  );

-- Bucket privado (limite de 20 MB por arquivo)
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 20971520)
on conflict (id) do update set file_size_limit = excluded.file_size_limit, public = false;

-- Caminho dos arquivos: {id-do-projeto}/{categoria}/{arquivo}
drop policy if exists "pf_staff_all" on storage.objects;
create policy "pf_staff_all" on storage.objects for all
  using (bucket_id = 'project-files' and public.is_staff())
  with check (bucket_id = 'project-files' and public.is_staff());

drop policy if exists "pf_client_select" on storage.objects;
create policy "pf_client_select" on storage.objects for select
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.project_files f
      join public.projects p on p.id = f.project_id
      where f.path = storage.objects.name
        and f.categoria in ('cliente','final')
        and p.cliente_id = public.my_client_id()
    )
  );

drop policy if exists "pf_client_insert" on storage.objects;
create policy "pf_client_insert" on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[2] = 'cliente'
    and (storage.foldername(name))[1] in (
      select id::text from public.projects where cliente_id = public.my_client_id()
    )
  );

-- ---------------------------------------------------------------
-- APROVAÇÃO DO PROJETO PELO CLIENTE
-- ---------------------------------------------------------------
create or replace function public.client_respond_project(
  p_id uuid,
  p_action text,
  p_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
  v_proj record;
begin
  v_client := public.my_client_id();
  if v_client is null then raise exception 'Não autorizado'; end if;

  select * into v_proj from public.projects where id = p_id and cliente_id = v_client;
  if not found then raise exception 'Projeto não encontrado para este cliente'; end if;

  if v_proj.status not in ('aguardando_revisao','aguardando_aprovacao') then
    raise exception 'Este projeto não está aguardando a sua revisão';
  end if;

  if p_action = 'aprovar' then
    update public.projects set status = 'publicacao' where id = p_id;
    insert into public.project_comments (project_id, autor, texto, interno)
      values (p_id, 'Cliente', 'Projeto aprovado pelo cliente.', false);
    insert into public.activity_log (user_email, user_role, acao, entidade, entidade_id, detalhe, project_id)
      values (auth.jwt() ->> 'email', 'cliente', 'Cliente aprovou o projeto', 'projeto', p_id, v_proj.nome, p_id);

  elsif p_action = 'alterar' then
    if p_message is null or length(trim(p_message)) = 0 then
      raise exception 'Descreva o que deseja alterar';
    end if;
    update public.projects set status = 'alteracoes_solicitadas' where id = p_id;
    insert into public.project_comments (project_id, autor, texto, interno)
      values (p_id, 'Cliente', p_message, false);
    insert into public.tickets (cliente_id, titulo, descricao, categoria, prioridade)
      values (v_client, 'Alterações solicitadas: ' || v_proj.nome, p_message, 'Alteração', 'Normal');
    insert into public.activity_log (user_email, user_role, acao, entidade, entidade_id, detalhe, project_id)
      values (auth.jwt() ->> 'email', 'cliente', 'Cliente solicitou alterações', 'projeto', p_id, v_proj.nome, p_id);

  else
    raise exception 'Ação inválida';
  end if;
end;
$$;
grant execute on function public.client_respond_project(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------
-- AUTOMAÇÃO: proposta aceita -> cria a venda e o projeto sozinhos
-- ---------------------------------------------------------------
alter table public.proposals add column if not exists auto_created boolean not null default false;

create or replace function public.on_proposal_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric;
  v_desc text;
  v_client text;
  v_project uuid;
begin
  if new.status = 'aceita' and old.status is distinct from 'aceita' and not coalesce(old.auto_created, false) then
    select coalesce(sum(qtd * valor), 0), string_agg(servico, ', ')
      into v_total, v_desc
      from public.proposal_items where proposal_id = new.id;
    v_total := greatest(0, v_total - coalesce(new.desconto, 0));
    select nome into v_client from public.clients where id = new.cliente_id;

    insert into public.sales (cliente_id, servico, valor, data, forma_pagamento)
      values (new.cliente_id, coalesce(v_desc, 'Proposta aceita'), v_total, current_date, new.forma_pagamento);

    insert into public.projects (nome, cliente_id, servico, valor, status)
      values (coalesce(split_part(v_desc, ', ', 1), 'Novo projeto') || ' — ' || coalesce(v_client, ''),
              new.cliente_id, v_desc, v_total, 'novo_pedido')
      returning id into v_project;

    insert into public.activity_log (user_email, user_role, acao, entidade, entidade_id, detalhe, project_id)
      values ('sistema', 'sistema', 'Proposta aceita: venda e projeto criados automaticamente', 'proposta', new.id, v_client, v_project);

    new.auto_created := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proposal_accepted on public.proposals;
create trigger trg_proposal_accepted
  before update of status on public.proposals
  for each row execute function public.on_proposal_accepted();

-- ---------------------------------------------------------------
-- CONTEÚDO EDITÁVEL DO SITE
-- ---------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text
);
alter table public.site_settings enable row level security;
drop policy if exists "settings_public_select" on public.site_settings;
create policy "settings_public_select" on public.site_settings for select using (true);
drop policy if exists "settings_marketing_all" on public.site_settings;
create policy "settings_marketing_all" on public.site_settings
  for all using (public.is_marketing()) with check (public.is_marketing());

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz default now()
);
alter table public.services enable row level security;
drop policy if exists "services_public_select" on public.services;
create policy "services_public_select" on public.services for select using (ativo = true);
drop policy if exists "services_marketing_all" on public.services;
create policy "services_marketing_all" on public.services
  for all using (public.is_marketing()) with check (public.is_marketing());

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  autor text,
  ativo boolean not null default true,
  created_at timestamptz default now()
);
alter table public.testimonials enable row level security;
drop policy if exists "testimonials_public_select" on public.testimonials;
create policy "testimonials_public_select" on public.testimonials for select using (ativo = true);
drop policy if exists "testimonials_marketing_all" on public.testimonials;
create policy "testimonials_marketing_all" on public.testimonials
  for all using (public.is_marketing()) with check (public.is_marketing());

-- Valores iniciais (só entram se ainda não existirem)
insert into public.site_settings (key, value) values
  ('whatsapp', '5531984225360'),
  ('email', 'gugoncalves326@gmail.com'),
  ('instagram', 'm.d.criacoes_')
on conflict (key) do nothing;

insert into public.services (nome, descricao, ordem)
select * from (values
  ('Landing Page', 'Página única focada em conversão para uma campanha ou captura de leads.', 1),
  ('Site institucional', 'Apresenta sua empresa, serviços e diferenciais com navegação completa.', 2),
  ('Delivery para lojas', 'Catálogo online com pedidos recebidos direto na plataforma do lojista — pagamento combinado na entrega, sem cobrança online.', 3),
  ('Página de vendas', 'Estrutura longa e persuasiva para converter visitantes em compradores.', 4),
  ('Site personalizado', 'Projeto sob medida quando o que você precisa foge do padrão.', 5),
  ('Manutenção e alterações', 'Ajustes e suporte contínuo depois que o site está no ar.', 6)
) as v(nome, descricao, ordem)
where not exists (select 1 from public.services);
