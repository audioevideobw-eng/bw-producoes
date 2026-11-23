-- =====================================================================
-- BW Produções · 003 — LIMITES DO FORMULÁRIO E REGRAS DOS ORÇAMENTOS (23/11/2026, Claude)
-- Rodar no Supabase → SQL Editor → New query → colar TUDO → Run. Pode rodar mais de uma vez. Não apaga dados.
--
-- Por quê (análise de segurança de 23/11):
--  1. O limite antigo era só "5 pedidos por e-mail por hora". Trocando o e-mail a cada envio, um robô podia
--     mandar pedidos sem parar — e cada pedido dispara 2 e-mails pelo Gmail da BW (para a BW e a resposta
--     automática para o endereço digitado). Isso usava o Gmail da BW para mandar e-mail a qualquer pessoa e
--     podia estourar o limite do Gmail (500/dia), que também é usado pelos avisos da Brightway.
--     Agora: por e-mail 3/hora e 5/dia; no site inteiro 20/hora e 60/dia (no máximo ~120 e-mails/dia).
--  2. As regras "equipe lê/atualiza orçamentos" do arquivo 001 deixavam QUALQUER conta logada ler os pedidos
--     (o banco é o mesmo da Brightway, onde qualquer pessoa cria conta). Foram trocadas no banco em 13/11
--     (Brightway: docs/sql/2026-11-13-isolamento-usuarios.sql); este arquivo registra a regra certa aqui também
--     e o 001 não mexe mais nelas (rodar o 001 de novo não reabre a brecha).
-- =====================================================================

-- ---------- 1. limites do formulário ----------
create or replace function public.orcamentos_limite()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  por_email_hora int; por_email_dia int; site_hora int; site_dia int;
begin
  select count(*) filter (where lower(email) = lower(new.email) and created_at > now() - interval '1 hour'),
         count(*) filter (where lower(email) = lower(new.email) and created_at > now() - interval '1 day'),
         count(*) filter (where created_at > now() - interval '1 hour'),
         count(*)
    into por_email_hora, por_email_dia, site_hora, site_dia
    from public.orcamentos
   where created_at > now() - interval '1 day';

  if por_email_hora >= 3 or por_email_dia >= 5 then
    raise exception 'Muitos pedidos em sequência. Tente mais tarde.';
  end if;
  if site_hora >= 20 or site_dia >= 60 then
    raise exception 'Recebemos muitos pedidos agora. Tente de novo mais tarde ou fale pelo WhatsApp.';
  end if;
  return new;
end $$;

drop trigger if exists orcamentos_limite_trg on public.orcamentos;
create trigger orcamentos_limite_trg
  before insert on public.orcamentos
  for each row execute function public.orcamentos_limite();

create index if not exists orcamentos_email_idx on public.orcamentos (lower(email), created_at desc);

-- ---------- 2. quem lê e quem altera: só a administração da BW ----------
alter table public.orcamentos enable row level security;
drop policy if exists "equipe le orcamentos"       on public.orcamentos;
drop policy if exists "equipe atualiza orcamentos" on public.orcamentos;
create policy "equipe le orcamentos" on public.orcamentos for select to authenticated
  using (public.is_bw_admin());
create policy "equipe atualiza orcamentos" on public.orcamentos for update to authenticated
  using (public.is_bw_admin()) with check (public.is_bw_admin());

-- ---------- conferência (deve mostrar 3 regras: insere = site; lê e atualiza = is_bw_admin) ----------
select policyname, cmd, roles::text, qual, with_check
  from pg_policies where schemaname = 'public' and tablename = 'orcamentos' order by cmd;
