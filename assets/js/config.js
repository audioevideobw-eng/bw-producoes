/* =========================================================================
   CONFIGURAÇÃO DO SITE — BW PRODUÇÕES
   Este é o ÚNICO arquivo que você precisa editar para mudar contatos,
   links, vídeos, planilha do portfólio e métricas. Deixe "" para desligar.
   ========================================================================= */
window.BW_CONFIG = {

  /* ---- Contatos (aparecem no rodapé, no Contato e no botão do WhatsApp) ---- */
  whatsapp: "5531996983721",                 // só números com DDI e DDD. Ex.: "5531999999999"
  whatsapp_label: "(31) 99698-3721",           // como aparece escrito. Ex.: "(31) 99999-9999"
  whatsapp_msg: "Olá! Vim pelo site da BW Produções e quero um orçamento.",
  email: "audioevideobw@gmail.com",                    // ex.: "contato@bwproducoes.com.br"
  instagram: "audioevideobw",                // usuário sem @. Ex.: "bwproducoes"
  youtube: "",                  // link do canal. Ex.: "https://youtube.com/@bwproducoes"
  regiao: "Belo Horizonte, região metropolitana e Minas Gerais",                   // ex.: "Belo Horizonte e região"
  horario: "",                  // ex.: "Seg. a sex., 9h às 18h · eventos em qualquer dia"
  mapa_embed_url: "https://www.google.com/maps?q=Belo+Horizonte,+MG&z=9&output=embed",           // Google Maps > Compartilhar > Incorporar mapa > copie só o link do src

  /* ---- Showreel ---- */
  showreel_url: "https://www.instagram.com/reel/DfaktCgJ4dN/",             // YouTube, Vimeo ou Instagram (abre no botão de play)
  showreel_bg_mp4: "",          // opcional: vídeo MP4 curto e sem som para o fundo da página inicial

  /* ---- Portfólio editável por planilha ----
     Google Planilhas > Arquivo > Compartilhar > Publicar na Web > a aba > CSV > copie o link.
     Vazio = usa o arquivo data/portfolio.json */
  portfolio_csv_url: "",

  /* ---- Supabase (pedidos de orçamento) — mesmo projeto da plataforma Brightway ---- */
  supabase_url: "https://zdtnetplvdonogmdvarx.supabase.co",
  supabase_anon_key: "sb_publishable_qJ2mIx1hcn_ZH75-yxJiDA_OI-EHyIU",

  /* ---- Métricas ---- */
  ga4_id: ""                    // Google Analytics 4. Ex.: "G-XXXXXXXXXX"
};
