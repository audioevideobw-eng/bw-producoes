-- =====================================================================
-- BW Produções — fotos do portfólio (painel de upload do site)
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
-- Não altera nenhuma tabela da plataforma Brightway.
-- =====================================================================

-- 1) Quem pode administrar o portfólio (só e-mails desta lista)
create table if not exists public.bw_admins (
  email text primary key
);
insert into public.bw_admins (email) values ('audioevideobw@gmail.com')
on conflict (email) do nothing;
alter table public.bw_admins enable row level security;  -- ninguém lê de fora

create or replace function public.is_bw_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bw_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_bw_admin() to anon, authenticated;

-- 2) Tabela das fotos
create table if not exists public.portfolio_fotos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  titulo      text not null default '' check (char_length(titulo) <= 120),
  legenda     text not null default '' check (char_length(legenda) <= 160),  -- cliente · local · ano
  categoria   text not null default 'eventos' check (categoria in ('eventos','corporativo','shows','ensaios','outros')),
  caminho     text not null,          -- arquivo grande no Storage (portfolio/...)
  miniatura   text not null,          -- arquivo pequeno no Storage
  largura     int,
  altura      int,
  destaque    boolean not null default false,
  publicado   boolean not null default true,
  ordem       int not null default 0
);
create index if not exists portfolio_fotos_ordem_idx on public.portfolio_fotos (destaque desc, ordem, created_at desc);

alter table public.portfolio_fotos enable row level security;

drop policy if exists "todos veem fotos publicadas" on public.portfolio_fotos;
create policy "todos veem fotos publicadas"
  on public.portfolio_fotos for select
  to anon, authenticated
  using (publicado or public.is_bw_admin());

drop policy if exists "admin insere fotos" on public.portfolio_fotos;
create policy "admin insere fotos"
  on public.portfolio_fotos for insert to authenticated
  with check (public.is_bw_admin());

drop policy if exists "admin edita fotos" on public.portfolio_fotos;
create policy "admin edita fotos"
  on public.portfolio_fotos for update to authenticated
  using (public.is_bw_admin()) with check (public.is_bw_admin());

drop policy if exists "admin apaga fotos" on public.portfolio_fotos;
create policy "admin apaga fotos"
  on public.portfolio_fotos for delete to authenticated
  using (public.is_bw_admin());

-- 3) Pasta pública de arquivos (Storage)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 15728640, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "bw admin envia fotos" on storage.objects;
create policy "bw admin envia fotos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and public.is_bw_admin());

drop policy if exists "bw admin altera fotos" on storage.objects;
create policy "bw admin altera fotos"
  on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and public.is_bw_admin());

drop policy if exists "bw admin apaga fotos" on storage.objects;
create policy "bw admin apaga fotos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and public.is_bw_admin());
