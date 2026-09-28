-- ============================================================
-- M.D Criações — Migração 09: Segurança
--  1) Cargo de admin só vale com o e-mail CONFIRMADO
--  2) Leads só podem ser criados por usuário logado
--  3) Funções (RPC) fechadas para visitantes
-- Rode depois da migração 08. Pode rodar de novo sem problema.
-- ============================================================

-- ---------------------------------------------------------------
-- 1) E-mail confirmado
-- ---------------------------------------------------------------
-- O cargo de Marketing/Admin é dado pelo e-mail. Para ninguém conseguir
-- "cadastrar o e-mail de outra pessoa" e virar admin, o cargo só é
-- concedido quando o e-mail está CONFIRMADO, e só vale enquanto estiver.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, nome)
  values (
    new.id,
    new.email,
    case
      when new.email_confirmed_at is not null
       and lower(new.email) in ('gugoncalves326@gmail.com', 'luanhenriquepassos09@gmail.com')
      then 'marketing'
      else 'cliente'
    end,
    coalesce(new.raw_user_meta_data->>'nome', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Quando o e-mail é confirmado (clique no link), promove os e-mails da equipe
create or replace function public.promote_confirmed_admin()
returns trigger as $$
begin
  if new.email_confirmed_at is not null
     and lower(new.email) in ('gugoncalves326@gmail.com', 'luanhenriquepassos09@gmail.com') then
    update public.profiles set role = 'marketing' where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.promote_confirmed_admin();

-- As checagens de cargo passam a exigir e-mail confirmado
create or replace function public.is_marketing()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.role = 'marketing' and u.email_confirmed_at is not null
  );
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.role in ('marketing','programador') and u.email_confirmed_at is not null
  );
$$;

-- ---------------------------------------------------------------
-- 2) Leads: só usuário logado, com o PRÓPRIO e-mail
-- ---------------------------------------------------------------
drop policy if exists "leads_public_insert" on public.leads;
revoke insert on public.leads from anon;

-- Limite: no máximo 10 pedidos por dia por conta (contra spam)
create or replace function public.my_leads_last_day()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.leads
  where lower(email) = lower(auth.jwt() ->> 'email')
    and created_at > now() - interval '1 day';
$$;

drop policy if exists "leads_client_insert" on public.leads;
create policy "leads_client_insert" on public.leads
  for insert to authenticated
  with check (
    lower(email) = lower(auth.jwt() ->> 'email')
    and status = 'novo'
    and public.my_leads_last_day() < 10
  );

-- A equipe (Marketing/Admin) continua podendo cadastrar qualquer lead
drop policy if exists "leads_marketing_insert" on public.leads;
create policy "leads_marketing_insert" on public.leads
  for insert to authenticated
  with check (public.is_marketing());

-- ---------------------------------------------------------------
-- 3) Funções que o Cliente chama: só usuários logados
-- ---------------------------------------------------------------
revoke execute on function public.client_respond_proposal(uuid, text, text) from public, anon;
grant  execute on function public.client_respond_proposal(uuid, text, text) to authenticated;
revoke execute on function public.client_respond_project(uuid, text, text) from public, anon;
grant  execute on function public.client_respond_project(uuid, text, text) to authenticated;
