-- ============================================================
-- M.D Criações — Migração 08: Gustavo também é Admin + trava do cargo
-- Rode depois da migração 07. Pode rodar de novo sem problema.
-- ============================================================

-- 1) Os dois e-mails da equipe passam a ser Marketing/Admin
--    (Admin enxerga tudo que o Programador enxerga, e mais).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, nome)
  values (
    new.id,
    new.email,
    case
      when lower(new.email) in ('gugoncalves326@gmail.com', 'luanhenriquepassos09@gmail.com') then 'marketing'
      else 'cliente'
    end,
    coalesce(new.raw_user_meta_data->>'nome', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2) Quem já tem conta é atualizado agora
update public.profiles
   set role = 'marketing'
 where lower(email) in ('gugoncalves326@gmail.com', 'luanhenriquepassos09@gmail.com');

-- 3) CORREÇÃO DE SEGURANÇA: antes, cada usuário podia editar a própria
--    linha de perfil — inclusive a coluna "role" — e se promover a admin
--    chamando a API direto. Agora ninguém edita perfis pelo app.
drop policy if exists "profiles_update_own_no_role" on public.profiles;
revoke update on public.profiles from anon, authenticated;
