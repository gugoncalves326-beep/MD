-- ============================================================
-- M.D Criações — Configuração inicial de autenticação e papéis
-- Rode este script inteiro no SQL Editor do Supabase (Run).
-- ============================================================

-- Tabela de perfis (1 linha por usuário autenticado)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'cliente' check (role in ('cliente','marketing','programador')),
  nome text,
  created_at timestamptz default now()
);

-- Função que roda toda vez que alguém cria uma conta (signup)
-- Define automaticamente o cargo certo com base no e-mail.
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
    coalesce(new.raw_user_meta_data->>'nome','')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Segurança em nível de linha (RLS): cada pessoa só lê/edita o próprio perfil
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- (Sem policy de update: ninguém edita o próprio cargo pelo app.)
revoke update on public.profiles from anon, authenticated;

-- IMPORTANTE: a coluna "role" só é definida pelo trigger acima (no cadastro),
-- nunca pelo próprio usuário — isso é o que garante que ninguém consiga se
-- promover a Marketing/Programador editando dados pelo próprio app.
