-- ============================================================
-- M.D Criações — Migração 10: Fotos no portfólio
-- Rode depois da migração 09. Pode rodar de novo sem problema.
-- ============================================================

-- Foto de capa + galeria de fotos de cada trabalho
alter table public.portfolio add column if not exists imagem_path text;
alter table public.portfolio add column if not exists galeria jsonb not null default '[]'::jsonb;

-- Bucket PÚBLICO (o portfólio aparece para qualquer visitante do site).
-- Só aceita imagens comuns (sem SVG, que pode carregar código) e até 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images', 'portfolio-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Qualquer pessoa VÊ as fotos (pelo link público); só o Marketing/Admin
-- envia, troca ou apaga.
drop policy if exists "pimg_marketing_all" on storage.objects;
create policy "pimg_marketing_all" on storage.objects for all
  using (bucket_id = 'portfolio-images' and public.is_marketing())
  with check (bucket_id = 'portfolio-images' and public.is_marketing());
