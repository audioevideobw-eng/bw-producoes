# Site BW Produções — guia de instalação

Site estático (HTML, CSS e JavaScript), feito para o **GitHub Pages**. Os pedidos de orçamento ficam salvos no **Supabase da plataforma Brightway**, e as automações avisam você no celular e respondem o cliente por e-mail.

```
index.html, sobre.html, servicos.html, portfolio.html, contato.html, 404.html
assets/js/config.js        ← o ÚNICO arquivo que você edita no dia a dia
assets/js/site.js          ← lógica do site (não precisa mexer)
assets/css/site.css        ← estilos compartilhados
assets/img/                ← logos, favicons e imagem de compartilhamento
data/portfolio.json        ← portfólio, quando não houver planilha
data/modelo-planilha-portfolio.csv   ← modelo da planilha do portfólio
supabase/migrations/001_orcamentos.sql   ← cria a tabela de pedidos
supabase/functions/novo-orcamento/index.ts  ← automação: avisos e e-mails
sitemap.xml, robots.txt    ← SEO
```

---

## 1. Publicar no GitHub Pages (10 min)

1. No GitHub, crie um repositório novo chamado **`bw-producoes`**, público, na conta `audioevideobw-eng`.
2. Clique em **Add file › Upload files**, arraste **todo o conteúdo desta pasta** (não a pasta em si) e clique em **Commit changes**.
3. Vá em **Settings › Pages**. Em *Source*, escolha **Deploy from a branch**, depois **main** e **/(root)**, e clique em **Save**.
4. Em 1 ou 2 minutos o site fica no ar em: `https://audioevideobw-eng.github.io/bw-producoes/`

> Se usar outro nome de repositório ou um domínio próprio, troque o endereço `https://audioevideobw-eng.github.io/bw-producoes` nestes arquivos: os 6 `.html` (procure por `og:url` e `canonical`), `sitemap.xml` e `robots.txt`.

**Domínio próprio (opcional):** em *Settings › Pages › Custom domain*, digite `www.seudominio.com.br`. No painel do seu domínio, crie um registro **CNAME** de `www` apontando para `audioevideobw-eng.github.io`.

---

## 2. Preencher seus dados — `assets/js/config.js`

Abra o arquivo no GitHub (ícone de lápis), preencha entre as aspas e salve:

| Campo | Exemplo |
| --- | --- |
| `whatsapp` | `5531999999999` (DDI + DDD + número, só números) |
| `whatsapp_label` | `(31) 99999-9999` |
| `email` | `contato@bwproducoes.com.br` |
| `instagram` | `bwproducoes` |
| `youtube` | `https://youtube.com/@bwproducoes` |
| `regiao` | `Belo Horizonte e região` |
| `horario` | `Seg. a sex., 9h às 18h · eventos em qualquer dia` |
| `mapa_embed_url` | No Google Maps: Compartilhar › Incorporar mapa › copie só o endereço que está dentro de `src="..."` |
| `showreel_url` | Link do YouTube, Vimeo ou Instagram (post ou reel) |
| `showreel_bg_mp4` | Opcional: um MP4 curto (10 a 20 s, sem som, até ~8 MB) para o fundo da página inicial. Suba em `assets/video/` e coloque `assets/video/showreel.mp4` |
| `ga4_id` | Passo 6 |

Os campos vazios continuam aparecendo no site como `[marcador]`. Os botões de WhatsApp levam para a página de contato até o número ser preenchido.

**Textos que ainda estão como marcador direto no HTML** (edite no próprio arquivo, procurando por `[`):
- Números do Início e do Sobre: `[20]+`, `[25–30]`, `[000]`, `[00]`.
- Clientes e depoimentos (Início).
- Nome do fundador e da equipe (Sobre).
- `[Valores sob consulta]` (Serviços).
- Etiquetas de foto, como `[FOTO DO FUNDADOR…]`. Para colocar uma foto real, troque o bloco por `<img src="assets/img/sua-foto.jpg" alt="descrição" style="width:100%;border-radius:22px;aspect-ratio:4/3;object-fit:cover">`.

---

## 3. Portfólio editável sem código

Você pode escolher uma de duas formas.

**A) Planilha Google (recomendado)**
1. Crie uma planilha com as colunas do modelo `data/modelo-planilha-portfolio.csv`. Dá para importar esse arquivo direto: Arquivo › Importar.
2. Cada linha é um trabalho:

| Coluna | O que colocar |
| --- | --- |
| `titulo` | Nome do evento |
| `cliente`, `ano` | Opcionais |
| `tipo` | `transmissao`, `corporativo`, `show`, `aftermovie` ou `fotografia` |
| `video_url` | Link do YouTube, Vimeo ou Instagram (reel ou post). Abre dentro do site. |
| `capa_url` | Link de uma imagem de capa (opcional). Sem capa, aparece o fundo de pontinhos da marca. |
| `link` | Para fotografia: link da galeria (Google Fotos, Drive etc.) |
| `destaque` | `sim` para aparecer na página inicial |
| `ordem` | 1, 2, 3… (menor aparece primeiro) |
| `publicado` | `sim` para mostrar; deixe vazio para esconder sem apagar |

3. Arquivo › Compartilhar › **Publicar na Web**. Escolha a aba e o formato **CSV**, clique em Publicar e copie o link.
4. Cole o link em `portfolio_csv_url` no `config.js`. Daí em diante, editou a planilha, o site atualiza sozinho (o Google leva até 5 minutos).

**B) Arquivo** — edite `data/portfolio.json` no GitHub, com os mesmos campos.

> **Sobre os vídeos do Instagram:** o Instagram só mostra posts e reels de **contas públicas**. Na grade, a capa só aparece se você colocar um `capa_url`; o Instagram não fornece a capa automaticamente.

---

## 4. Banco de dados dos pedidos (Supabase) — 5 min

O `config.js` já vem com o endereço e a chave pública do mesmo projeto Supabase da plataforma Brightway. Essa chave é feita para ficar no site e só permite o que as regras de segurança deixam.

1. Entre no Supabase, abra o projeto da plataforma, vá em **SQL Editor › New query**, cole o conteúdo de `supabase/migrations/001_orcamentos.sql` e clique em **Run**.
2. Isso cria a tabela **`orcamentos`** com estas regras:
   - o site **só consegue inserir** pedidos; ninguém de fora lê, altera ou apaga;
   - usuários **logados** na plataforma podem ver e atualizar os pedidos (status: novo, em contato, proposta enviada, fechado, perdido);
   - limite de 5 pedidos por e-mail por hora, contra spam.
3. Para testar: envie um pedido pelo site e veja a linha nova em **Table Editor › orcamentos**.

Nenhuma tabela da plataforma é alterada. Para ver os pedidos dentro da plataforma Brightway, peça à ferramenta que gera a plataforma uma tela que leia a tabela `orcamentos`.

---

## 5. Automações: aviso no celular e resposta automática

A função `novo-orcamento` roda no Supabase a cada pedido novo:
- avisa **você no celular** (app ntfy e/ou WhatsApp);
- manda **e-mail para você** com os dados e um botão para responder no WhatsApp;
- manda a **resposta automática** para o cliente.

### 5.1 Aviso no celular (escolha um ou os dois, ambos grátis)

- **App ntfy (recomendado):**
  1. Instale o app **ntfy** (Android ou iPhone).
  2. Toque em **+** e assine um tópico com nome difícil de adivinhar, por exemplo `bw-orcamentos-8f3k2`.
  3. Esse nome vai no segredo `NTFY_TOPIC`. Tocar na notificação abre o WhatsApp do cliente.
- **WhatsApp via CallMeBot:**
  1. Siga as instruções em callmebot.com (WhatsApp API): você manda uma mensagem para o número deles e recebe uma *apikey*.
  2. Ela vai em `CALLMEBOT_APIKEY`, e o seu número em `CALLMEBOT_PHONE`.

### 5.2 E-mails (Resend — grátis até 3.000 e-mails/mês)
1. Crie uma conta em resend.com, clique em **API Keys › Create** e copie a chave (`RESEND_API_KEY`).
2. **Para mandar a resposta automática aos clientes, o domínio precisa estar verificado** (Domains › Add domain, depois os registros DNS indicados).
   - Sem domínio próprio, a Resend só entrega para o seu próprio e-mail: você recebe os avisos, mas o cliente não recebe a confirmação.
   - Nesse caso, o site já mostra a confirmação na tela, junto com o botão do WhatsApp.

### 5.3 Publicar a função
Pelo painel (sem instalar nada):
1. Supabase › **Edge Functions › Deploy a new function › Via Editor**, com o nome `novo-orcamento`.
2. Cole o conteúdo de `supabase/functions/novo-orcamento/index.ts` e clique em **Deploy**.
3. Em **Function details**, desligue **Enforce JWT verification**. Quem protege a função é o segredo do webhook.
4. Em **Edge Functions › Secrets**, crie:

| Segredo | Valor |
| --- | --- |
| `WEBHOOK_SECRET` | uma senha longa inventada por você |
| `RESEND_API_KEY` | chave da Resend |
| `EMAIL_FROM` | `BW Produções <contato@seudominio.com.br>` |
| `EMAIL_DONO` | seu e-mail |
| `NTFY_TOPIC` | o tópico do app ntfy |
| `CALLMEBOT_PHONE` / `CALLMEBOT_APIKEY` | opcionais |
| `WHATSAPP_BW` | WhatsApp da BW (botão do e-mail do cliente) |
| `PRAZO_RESPOSTA` | ex.: `em até 24 horas úteis` |

Pelo terminal, se preferir: `supabase functions deploy novo-orcamento --no-verify-jwt` e depois `supabase secrets set NOME=valor`.

### 5.4 Ligar a função à tabela (Database Webhook)
1. Supabase › **Database › Webhooks › Create a new hook**.
2. Preencha:
   - **Name:** `orcamento-novo`
   - **Table:** `orcamentos`
   - **Events:** só **Insert**
   - **Type:** Supabase Edge Functions, função `novo-orcamento`, método POST
   - **HTTP Headers:** acrescente `x-webhook-secret` com o mesmo valor de `WEBHOOK_SECRET`
3. Clique em **Create webhook**.

Teste mandando um pedido pelo site. Em segundos chega o aviso no celular e os e-mails, e a coluna `notificado` fica `true`. Se algo falhar, veja **Edge Functions › novo-orcamento › Logs**.

---

## 6. Métricas e SEO

**Google Analytics 4**
1. Em analytics.google.com, crie uma propriedade e um fluxo **Web** com o endereço do site.
2. Copie o ID `G-XXXXXXXXXX` para `ga4_id` no `config.js`.
3. Eventos já enviados:

| Evento | Quando |
| --- | --- |
| `generate_lead` | pedido de orçamento enviado |
| `click_whatsapp` | clique em qualquer botão do WhatsApp |
| `play_video` | vídeo aberto no site |
| `filtro_portfolio` | filtro do portfólio usado |

Em GA4 › Admin › Eventos, marque `generate_lead` como **evento-chave** (conversão).

**Google Search Console**
1. Adicione o site em search.google.com/search-console.
2. Verifique pela tag HTML: cole a tag no `<head>` do `index.html`.
3. Envie o sitemap: `https://SEU-ENDERECO/sitemap.xml`.

**Já incluído nas páginas:**
- título e descrição de cada página, além do endereço oficial (canonical);
- imagem de compartilhamento (`assets/img/og-image.jpg`), que é a prévia ao mandar o link no WhatsApp, Instagram ou LinkedIn;
- dados estruturados de empresa (Schema.org), favicons e página 404;
- acessibilidade: link "pular para o conteúdo", campos com rótulo e navegação por teclado no player.

---

## 7. Checklist antes de divulgar
- [ ] `config.js` preenchido (WhatsApp, e-mail, Instagram, região, showreel)
- [ ] Marcadores `[ ]` trocados nos HTML (números, clientes, equipe, depoimentos)
- [ ] Portfólio com pelo menos 6 trabalhos e `destaque = sim` em 6
- [ ] SQL rodado e um pedido de teste aparecendo na tabela
- [ ] Função publicada, segredos criados, webhook ligado e aviso chegando no celular
- [ ] Endereço final atualizado no `sitemap.xml`, `robots.txt` e nas tags `og:url` e `canonical`
- [ ] GA4 ligado e `generate_lead` marcado como conversão
- [ ] Testado no celular: menu, botões, formulário e vídeos
