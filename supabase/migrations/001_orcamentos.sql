-- =====================================================================
-- BW Produções — pedidos de orçamento do site
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
-- Usa o MESMO projeto da plataforma Brightway. Não altera nenhuma tabela existente.
-- =====================================================================

create table if not exists public.orcamentos (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  nome         text not null check (char_length(nome) between 2 and 120),
  email        text not null check (char_length(email) between 5 and 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  whatsapp     text check (char_length(whatsapp) <= 20),
  tipo         text check (char_length(tipo) <= 60),
  data_evento  date,
  mensagem     text check (char_length(mensagem) <= 3000),
  origem       text not null default 'site' check (char_length(origem) <= 30),
  pagina       text check (char_length(pagina) <= 120),
  user_agent   text check (char_length(user_agent) <= 250),
  -- controle interno (preenchido por você ou pela plataforma, nunca pelo site)
  status       text not null default 'novo' check (status in ('novo','em contato','proposta enviada','fechado','perdido')),
  notificado   boolean not null default false,
  observacoes  text
);

create index if not exists orcamentos_created_at_idx on public.orcamentos (created_at desc);
create index if not exists orcamentos_status_idx on public.orcamentos (status);

-- Segurança: o site (chave pública) só pode INSERIR. Ninguém de fora lê, edita ou apaga.
alter table public.orcamentos enable row level security;

drop policy if exists "site insere orcamento" on public.orcamentos;
create policy "site insere orcamento"
  on public.orcamentos for insert
  to anon
  with check (status = 'novo' and notificado = false and observacoes is null and origem = 'site');

-- QUEM LÊ E ALTERA os pedidos: só a administração da BW (is_bw_admin) — regra criada no 003_limites_e_regras.sql.
-- (23/11/2026) Antes este arquivo criava as regras com "using (true)": QUALQUER conta logada da Brightway (onde qualquer
-- pessoa cria conta) lia e alterava os pedidos. Este arquivo não cria nem apaga mais essas regras — rodá-lo de novo não reabre a brecha.

-- Limite contra spam (versão de 2026-11-12). A versão atual, com limite também por dia e no site inteiro, está no 003.
create or replace function public.orcamentos_limite()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.orcamentos
      where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Muitos pedidos em sequência. Tente mais tarde.';
  end if;
  return new;
end $$;

drop trigger if exists orcamentos_limite_trg on public.orcamentos;
create trigger orcamentos_limite_trg
  before insert on public.orcamentos
  for each row execute function public.orcamentos_limite();
