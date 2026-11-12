/* BW Produções — lógica do site.
   Contatos, portfólio dinâmico, player de vídeo, formulário (Supabase), métricas. */
(function () {
  "use strict";
  var C = window.BW_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------ MÉTRICAS (GA4) */
  function track(evento, params) {
    if (typeof window.gtag === "function") window.gtag("event", evento, params || {});
  }
  if (C.ga4_id) {
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.ga4_id);
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", C.ga4_id);
  }

  /* ------------------------------------------------------------ CONTATOS */
  function waLink(msg) {
    if (!C.whatsapp) return null;
    return "https://wa.me/" + String(C.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(msg || C.whatsapp_msg || "");
  }
  var LINKS = {
    whatsapp: function () { return waLink(); },
    email: function () { return C.email ? "mailto:" + C.email : null; },
    instagram: function () { return C.instagram ? "https://instagram.com/" + String(C.instagram).replace(/^@/, "") : null; },
    youtube: function () { return C.youtube || null; },
    tiktok: function () { return C.tiktok ? "https://www.tiktok.com/@" + String(C.tiktok).replace(/^@/, "") : null; },
    mapa: function () { return C.regiao ? "https://www.google.com/maps/search/" + encodeURIComponent(C.regiao) : null; }
  };
  var TEXTOS = {
    whatsapp_label: C.whatsapp_label,
    email: C.email,
    instagram_label: C.instagram ? "@" + String(C.instagram).replace(/^@/, "") : "",
    regiao: C.regiao,
    horario: C.horario
  };
  function aplicarContatos() {
    $$("[data-cfg]").forEach(function (el) {
      var v = TEXTOS[el.getAttribute("data-cfg")];
      if (v) el.textContent = v;
    });
    $$("[data-link]").forEach(function (a) {
      var fn = LINKS[a.getAttribute("data-link")];
      var url = fn && fn();
      if (url) {
        a.href = url;
        if (/^https?:/.test(url)) { a.target = "_blank"; a.rel = "noopener"; } else { a.removeAttribute("target"); }
      } else {
        a.removeAttribute("target");
        a.href = "contato.html";
      }
    });
    $$(".js-wa").forEach(function (a) {
      var url = waLink();
      a.href = url || "contato.html";
      if (url) { a.target = "_blank"; a.rel = "noopener"; }
    });
    $$("[data-ga]").forEach(function (a) {
      a.addEventListener("click", function () { track(a.getAttribute("data-ga"), { pagina: document.body.dataset.page }); });
    });
    var mapa = $("#mapa");
    if (mapa && C.mapa_embed_url) {
      mapa.innerHTML = "";
      var f = document.createElement("iframe");
      f.src = C.mapa_embed_url;
      f.title = "Mapa da região de atendimento";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;filter:grayscale(1) invert(.92) contrast(.9)";
      mapa.appendChild(f);
    }
  }

  /* ------------------------------------------------------------ VÍDEO DE FUNDO */
  function videoDeFundo() {
    var hero = $("#hero");
    if (!hero || !C.showreel_bg_mp4) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var v = document.createElement("video");
    v.className = "hero-video";
    v.src = C.showreel_bg_mp4;
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute("aria-hidden", "true");
    hero.insertBefore(v, hero.firstChild);
    var etiqueta = $$("span", hero).filter(function (s) { return /SHOWREEL/.test(s.textContent); })[0];
    if (etiqueta) etiqueta.remove();
  }

  /* ------------------------------------------------------------ PLAYER */
  function embedDe(url) {
    if (!url) return null;
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/)))
      return { src: "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&rel=0", vertical: /shorts\//.test(url) };
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
      return { src: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1", vertical: false };
    if ((m = url.match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/([\w-]+)/)))
      return { src: "https://www.instagram.com/p/" + m[1] + "/embed", vertical: true };
    if (/\.(mp4|webm)(\?|$)/i.test(url)) return { video: url, vertical: false };
    if (/\.(jpe?g|png|webp)(\?|$)/i.test(url)) return { img: url, vertical: false };
    return null;
  }
  var player = null, ultimoFoco = null;
  function abrirPlayer(url, titulo) {
    var e = embedDe(url);
    if (!e) { if (url) window.open(url, "_blank", "noopener"); return; }
    player = player || $("#player");
    if (!player) return;
    var frame = $(".player-frame", player);
    frame.innerHTML = "";
    frame.classList.toggle("vertical", !!e.vertical);
    var el;
    if (e.src) {
      el = document.createElement("iframe");
      el.src = e.src;
      el.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
      el.allowFullscreen = true;
      el.title = titulo || "Vídeo";
    } else if (e.video) {
      el = document.createElement("video");
      el.src = e.video; el.controls = true; el.autoplay = true;
    } else {
      el = document.createElement("img");
      el.src = e.img; el.alt = titulo || "";
    }
    frame.appendChild(el);
    ultimoFoco = document.activeElement;
    player.hidden = false;
    document.body.style.overflow = "hidden";
    $(".player-close", player).focus();
    track("play_video", { titulo: titulo || "", url: url });
  }
  function fecharPlayer() {
    if (!player || player.hidden) return;
    $(".player-frame", player).innerHTML = "";
    player.hidden = true;
    document.body.style.overflow = "";
    if (ultimoFoco) ultimoFoco.focus();
  }
  function ligarPlayer() {
    player = $("#player");
    if (!player) return;
    $(".player-close", player).addEventListener("click", fecharPlayer);
    player.addEventListener("click", function (ev) { if (ev.target === player) fecharPlayer(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") fecharPlayer(); });
    $$(".js-showreel").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        if (C.showreel_url) abrirPlayer(C.showreel_url, "Showreel BW Produções");
      });
    });
  }

  /* ------------------------------------------------------------ PORTFÓLIO */
  var ROTULO = { transmissao: "Transmissão ao vivo", corporativo: "Corporativo", show: "Show", aftermovie: "Aftermovie", fotografia: "Fotografia" };
  var ICONE_PLAY = '<path d="M8 5v14l11-7z"/>';
  var ICONE_FOTO = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';

  function normalizarTipo(t) {
    t = String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (/transm|ao vivo|live/.test(t)) return "transmissao";
    if (/corpor|conven|empresa/.test(t)) return "corporativo";
    if (/show|musica|banda/.test(t)) return "show";
    if (/after|teaser|video/.test(t)) return "aftermovie";
    if (/foto|ensaio/.test(t)) return "fotografia";
    return "transmissao";
  }
  function sim(v) { return /^(sim|s|x|1|true|yes)$/i.test(String(v || "").trim()); }

  function parseCSV(txt) {
    var linhas = [], campo = "", linha = [], aspas = false;
    for (var i = 0; i < txt.length; i++) {
      var c = txt[i];
      if (aspas) {
        if (c === '"' && txt[i + 1] === '"') { campo += '"'; i++; }
        else if (c === '"') aspas = false;
        else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === ",") { linha.push(campo); campo = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && txt[i + 1] === "\n") i++;
        linha.push(campo); linhas.push(linha); linha = []; campo = "";
      } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    var cab = (linhas.shift() || []).map(function (h) { return h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_"); });
    return linhas.filter(function (l) { return l.some(function (x) { return x.trim(); }); }).map(function (l) {
      var o = {}; cab.forEach(function (h, k) { o[h] = (l[k] || "").trim(); }); return o;
    });
  }

  function carregarPortfolio() {
    var fonte = C.portfolio_csv_url
      ? fetch(C.portfolio_csv_url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw r; return r.text(); }).then(parseCSV)
      : fetch("data/portfolio.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw r; return r.json(); });
    return fonte.then(function (lista) {
      return lista.map(function (p, i) {
        return {
          titulo: p.titulo || "Trabalho", cliente: p.cliente || "", ano: p.ano || "",
          tipo: normalizarTipo(p.tipo), video: p.video_url || p.video || "", capa: p.capa_url || p.capa || "",
          link: p.link || p.galeria || "", destaque: p.destaque === true || sim(p.destaque),
          ordem: parseFloat(p.ordem) || 1000 + i, publicado: p.publicado === undefined || p.publicado === "" || p.publicado === true || sim(p.publicado)
        };
      }).filter(function (p) { return p.publicado; }).sort(function (a, b) { return a.ordem - b.ordem; });
    });
  }

  function svg(paths, size, cor) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + cor + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function card(p) {
    var art = document.createElement("article");
    art.className = "pf-card";
    art.dataset.tipo = p.tipo;
    art.style.cssText = "border-radius:20px;overflow:hidden;background:#161616;border:1px solid rgba(250,249,247,0.08);display:flex;flex-direction:column";
    var temVideo = !!p.video, alvo = p.video || p.link || p.capa;
    var btn = document.createElement(alvo ? "button" : "div");
    btn.className = "pf-cover";
    if (alvo) { btn.type = "button"; btn.setAttribute("aria-label", (temVideo ? "Assistir " : "Ver ") + p.titulo); }
    btn.innerHTML =
      (p.capa ? '<img src="' + esc(p.capa) + '" alt="" loading="lazy">' : "") +
      '<span style="position:absolute;left:16px;top:16px;padding:6px 12px;border-radius:999px;background:#857B40;color:#030303;font-family:Montserrat,sans-serif;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">' + esc(ROTULO[p.tipo]) + "</span>" +
      (alvo ? '<span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(250,249,247,.92);display:inline-flex;align-items:center;justify-content:center">' + svg(temVideo ? ICONE_PLAY : ICONE_FOTO, 24, "#030303") + "</span>" : "");
    if (alvo) btn.addEventListener("click", function () {
      if (p.video) abrirPlayer(p.video, p.titulo);
      else if (p.link) window.open(p.link, "_blank", "noopener");
      else abrirPlayer(p.capa, p.titulo);
    });
    var info = document.createElement("div");
    info.style.cssText = "padding:20px 22px 24px;display:flex;flex-direction:column;gap:6px";
    info.innerHTML = '<h3 style="margin:0;font-family:Montserrat,sans-serif;font-weight:700;font-size:18px;color:#FAF9F7">' + esc(p.titulo) + "</h3>" +
      '<span style="font-size:14px;color:#A3A3A3">' + esc([p.cliente, p.ano].filter(Boolean).join(" · ")) + "</span>";
    art.appendChild(btn); art.appendChild(info);
    return art;
  }

  var ESTILO_ATIVO = "background: rgba(133,123,64,0.12); border: 2px solid #857B40; color: #FAF9F7; box-shadow: 0 0 24px rgba(133,123,64,0.25)";
  var ESTILO_INATIVO = "background: #161616; border: 1px solid rgba(250,249,247,0.1); color: #D6D3CD; box-shadow: none";
  function estiloFiltro(b, ativo) {
    var base = "min-height: 104px; border-radius: 18px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 600; ";
    b.setAttribute("style", base + (ativo ? ESTILO_ATIVO : ESTILO_INATIVO));
    b.setAttribute("aria-pressed", ativo ? "true" : "false");
    var ic = b.querySelector("span");
    if (ic) ic.style.color = ativo ? "#857B40" : "#A3A3A3";
  }

  function iniciarPortfolio() {
    var grid = $("#pf-grid");
    if (!grid) return;
    var passo = parseInt(grid.dataset.limit, 10) || 9;
    var naHome = document.body.dataset.page === "index";
    var mais = $("#pf-more");
    var filtro = "todos", limite = passo, todos = [];

    function desenhar() {
      var lista = todos.filter(function (p) { return filtro === "todos" || p.tipo === filtro; });
      if (naHome && filtro === "todos") {
        lista = lista.filter(function (p) { return p.destaque; }).concat(lista.filter(function (p) { return !p.destaque; }));
      }
      grid.innerHTML = "";
      lista.slice(0, limite).forEach(function (p) { grid.appendChild(card(p)); });
      if (!lista.length) grid.innerHTML = '<p class="pf-empty">Em breve, trabalhos desta categoria.</p>';
      if (mais) mais.hidden = lista.length <= limite;
    }
    $$(".pf-filter").forEach(function (b) {
      b.addEventListener("click", function () {
        filtro = b.dataset.filter;
        limite = passo;
        $$(".pf-filter").forEach(function (x) { estiloFiltro(x, x === b); });
        desenhar();
        track("filtro_portfolio", { tipo: filtro });
      });
    });
    if (mais) mais.addEventListener("click", function () { limite += passo; desenhar(); });

    carregarPortfolio().then(function (lista) {
      todos = lista;
      if (todos.length) desenhar();
    }).catch(function () { /* sem dados: mantém os cards de exemplo do HTML */ });
  }

  /* ------------------------------------------------------------ FORMULÁRIO */
  function iniciarFormulario() {
    var form = $("#form-orcamento");
    if (!form) return;
    var status = $("#form-status");
    var botao = form.querySelector('button[type="submit"]');
    var abertoEm = Date.now();
    var tel = form.elements.whatsapp;
    if (tel) tel.addEventListener("input", function () {
      var v = tel.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
      else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
      tel.value = v;
    });
    function msg(t, tipo, html) {
      status.className = "form-status " + (tipo || "");
      if (html) status.innerHTML = t; else status.textContent = t;
    }
    function waResumo(d) {
      return waLink("Olá! Quero um orçamento.\nNome: " + d.nome + "\nTipo: " + d.tipo + (d.data_evento ? "\nData: " + d.data_evento.split("-").reverse().join("/") : "") + (d.mensagem ? "\n" + d.mensagem : ""));
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      $$(".campo-erro", form).forEach(function (x) { x.classList.remove("campo-erro"); });
      var d = {
        nome: form.elements.nome.value.trim(),
        email: form.elements.email.value.trim(),
        whatsapp: form.elements.whatsapp.value.trim(),
        tipo: form.elements.tipo.value,
        data_evento: form.elements.data_evento.value || null,
        mensagem: form.elements.mensagem.value.trim()
      };
      var faltando = [];
      if (d.nome.length < 2) faltando.push("nome");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) faltando.push("email");
      if (d.whatsapp.replace(/\D/g, "").length < 10) faltando.push("whatsapp");
      if (faltando.length) {
        faltando.forEach(function (n) { form.elements[n].classList.add("campo-erro"); });
        form.elements[faltando[0]].focus();
        msg("Confira " + faltando.map(function (n) { return { nome: "o nome", email: "o e-mail", whatsapp: "o WhatsApp com DDD" }[n]; }).join(", ") + ".", "erro");
        return;
      }
      if (form.elements.empresa_site.value || Date.now() - abertoEm < 2500) {
        msg("Pedido enviado! Em breve entramos em contato.", "ok"); form.reset(); return; // robô: finge sucesso
      }
      if (!window.supabase || !C.supabase_url || !C.supabase_anon_key) {
        var w = waResumo(d);
        msg("Não foi possível enviar agora." + (w ? ' <a href="' + w + '" target="_blank" rel="noopener" style="color:#C9C2A0;text-decoration:underline">Envie pelo WhatsApp</a>.' : ""), "erro", true);
        return;
      }
      botao.disabled = true;
      msg("Enviando…");
      var sb = window.supabase.createClient(C.supabase_url, C.supabase_anon_key, { auth: { persistSession: false } });
      sb.from("orcamentos").insert([{
        nome: d.nome, email: d.email, whatsapp: d.whatsapp, tipo: d.tipo, data_evento: d.data_evento,
        mensagem: d.mensagem || null, origem: "site", pagina: location.pathname, user_agent: navigator.userAgent.slice(0, 250)
      }]).then(function (r) {
        botao.disabled = false;
        if (r.error) throw r.error;
        form.reset();
        abertoEm = Date.now();
        var w = waResumo(d);
        msg("Pedido recebido, " + esc(d.nome.split(" ")[0]) + "! Você vai receber a confirmação no e-mail e respondemos em breve." +
          (w ? ' Se preferir, <a href="' + w + '" target="_blank" rel="noopener" style="color:#C9C2A0;text-decoration:underline">chame no WhatsApp</a>.' : ""), "ok", true);
        track("generate_lead", { tipo: d.tipo });
      }).catch(function () {
        botao.disabled = false;
        var w = waResumo(d);
        msg("Não conseguimos registrar o pedido agora." + (w ? ' <a href="' + w + '" target="_blank" rel="noopener" style="color:#C9C2A0;text-decoration:underline">Envie pelo WhatsApp</a>, é rapidinho.' : " Tente de novo em instantes."), "erro", true);
      });
    });
  }

  /* ------------------------------------------------------------ INÍCIO */
  function iniciar() {
    aplicarContatos();
    videoDeFundo();
    ligarPlayer();
    iniciarPortfolio();
    iniciarFormulario();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
