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
    frame.classList.remove("foto");
    galeria.lista = [];
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
  /* Vídeos: data/youtube.json (atualizado sozinho pelo GitHub Actions a partir do canal).
     Fotos: tabela portfolio_fotos + Storage "portfolio" no Supabase (enviadas pelo admin.html). */
  var ICONE_PLAY = '<path d="M8 5v14l11-7z"/>';
  var ICONE_FOTO = '<path d="M3 7h3l2-3h8l2 3h3v13H3z"/><circle cx="12" cy="13" r="4"/>';
  var CATEGORIA = { eventos: "Eventos", corporativo: "Corporativo", shows: "Shows", ensaios: "Ensaios", outros: "Fotografia" };

  function urlStorage(caminho) {
    if (!caminho) return "";
    if (/^https?:/.test(caminho)) return caminho;
    return String(C.supabase_url || "").replace(/\/$/, "") + "/storage/v1/object/public/portfolio/" + caminho.split("/").map(encodeURIComponent).join("/");
  }
  var _sb = null;
  function supa() {
    if (_sb) return _sb;
    if (!window.supabase || !C.supabase_url || !C.supabase_anon_key) return null;
    _sb = window.supabase.createClient(C.supabase_url, C.supabase_anon_key, { auth: { persistSession: false } });
    return _sb;
  }
  function esperarSupabase(ms) {
    return new Promise(function (ok) {
      var t0 = Date.now();
      (function checa() {
        if (window.supabase || Date.now() - t0 > ms) return ok();
        setTimeout(checa, 60);
      })();
    });
  }
  function carregarVideos() {
    return fetch("data/youtube.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : { videos: [] }; })
      .then(function (d) {
        return (d.videos || []).filter(function (v) { return v.id; }).map(function (v) {
          return { tipo: "video", titulo: v.titulo || "Vídeo", legenda: v.short ? "Short · YouTube" : "YouTube", capa: v.capa || ("https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg"),
            url: v.short ? "https://www.youtube.com/shorts/" + v.id : "https://www.youtube.com/watch?v=" + v.id, id: v.id, short: !!v.short, data: v.publicado || "" };
        });
      }).catch(function () { return []; });
  }
  function carregarFotos() {
    return esperarSupabase(4000).then(function () {
      var sb = supa();
      if (!sb) return [];
      return sb.from("portfolio_fotos").select("id,titulo,legenda,categoria,caminho,miniatura,largura,altura,destaque,ordem,created_at")
        .eq("publicado", true).order("destaque", { ascending: false }).order("ordem", { ascending: true }).order("created_at", { ascending: false })
        .then(function (r) {
          if (r.error) return [];
          return (r.data || []).map(function (f) {
            return { tipo: "foto", titulo: f.titulo || CATEGORIA[f.categoria] || "Fotografia", legenda: f.legenda || CATEGORIA[f.categoria] || "",
              capa: urlStorage(f.miniatura || f.caminho), grande: urlStorage(f.caminho), destaque: f.destaque, data: f.created_at || "" };
          });
        });
    }).catch(function () { return []; });
  }
  function intercalar(a, b) {
    var out = [], i = 0;
    while (i < a.length || i < b.length) { if (i < a.length) out.push(a[i]); if (i < b.length) out.push(b[i]); i++; }
    return out;
  }

  function svg(paths, size, cor) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + cor + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function card(p, aoClicar) {
    var art = document.createElement("article");
    art.className = "pf-card pf-" + p.tipo;
    art.style.cssText = "border-radius:20px;overflow:hidden;background:#161616;border:1px solid rgba(250,249,247,0.08);display:flex;flex-direction:column";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pf-cover";
    btn.setAttribute("aria-label", (p.tipo === "video" ? "Assistir: " : "Ampliar foto: ") + p.titulo);
    btn.innerHTML =
      (p.capa ? '<img src="' + esc(p.capa) + '" alt="" loading="lazy" decoding="async">' : "") +
      '<span class="pf-tag">' + (p.tipo === "video" ? "Vídeo" : "Fotografia") + "</span>" +
      '<span class="pf-play">' + svg(p.tipo === "video" ? ICONE_PLAY : ICONE_FOTO, 24, "#030303") + "</span>";
    btn.addEventListener("click", aoClicar);
    var info = document.createElement("div");
    info.style.cssText = "padding:20px 22px 24px;display:flex;flex-direction:column;gap:6px";
    info.innerHTML = '<h3 style="margin:0;font-family:Montserrat,sans-serif;font-weight:700;font-size:18px;line-height:1.3;color:#FAF9F7">' + esc(p.titulo) + "</h3>" +
      (p.legenda ? '<span style="font-size:14px;color:#A3A3A3">' + esc(p.legenda) + "</span>" : "");
    art.appendChild(btn); art.appendChild(info);
    return art;
  }

  /* Galeria de fotos (tela cheia, com anterior/próxima) */
  var galeria = { lista: [], i: 0 };
  function mostrarFoto() {
    var f = galeria.lista[galeria.i];
    var frame = $(".player-frame", player);
    frame.innerHTML = '<img src="' + esc(f.grande || f.capa) + '" alt="' + esc(f.titulo) + '">' +
      (galeria.lista.length > 1 ? '<button type="button" class="gal-nav gal-prev" aria-label="Foto anterior">‹</button><button type="button" class="gal-nav gal-next" aria-label="Próxima foto">›</button>' : "") +
      '<span class="gal-cap">' + esc(f.titulo) + (f.legenda ? " · " + esc(f.legenda) : "") + '<b>' + (galeria.i + 1) + " / " + galeria.lista.length + "</b></span>";
    var pv = $(".gal-prev", frame), nx = $(".gal-next", frame);
    if (pv) pv.addEventListener("click", function (e) { e.stopPropagation(); passoFoto(-1); });
    if (nx) nx.addEventListener("click", function (e) { e.stopPropagation(); passoFoto(1); });
  }
  function passoFoto(d) {
    if (!galeria.lista.length) return;
    galeria.i = (galeria.i + d + galeria.lista.length) % galeria.lista.length;
    mostrarFoto();
  }
  function abrirGaleria(lista, i) {
    player = player || $("#player");
    if (!player) return;
    galeria.lista = lista; galeria.i = i;
    var frame = $(".player-frame", player);
    frame.classList.remove("vertical");
    frame.classList.add("foto");
    mostrarFoto();
    ultimoFoco = document.activeElement;
    player.hidden = false;
    document.body.style.overflow = "hidden";
    $(".player-close", player).focus();
    track("ver_foto", { titulo: lista[i].titulo });
  }
  document.addEventListener("keydown", function (ev) {
    if (!player || player.hidden || !galeria.lista.length || !$(".player-frame.foto", player)) return;
    if (ev.key === "ArrowLeft") passoFoto(-1);
    if (ev.key === "ArrowRight") passoFoto(1);
  });

  function destaqueVideo(videos) {
    var sr = $("#showreel");
    if (!sr) return;
    var v = videos.filter(function (x) { return !x.short; })[0] || videos[0];
    var secao = sr.closest("section");
    if (!v) { if (secao) secao.hidden = true; return; }
    var img = document.createElement("img");
    img.src = "https://i.ytimg.com/vi/" + v.id + "/maxresdefault.jpg";
    img.onerror = function () { img.onerror = null; img.src = v.capa; };
    img.alt = "";
    img.className = "sr-capa";
    sr.insertBefore(img, sr.firstChild);
    var tit = $(".sr-titulo", sr), sub = $(".sr-sub", sr);
    if (tit) tit.textContent = v.titulo;
    if (sub) sub.textContent = "Último vídeo do canal · toca aqui no site";
    sr.setAttribute("aria-label", "Assistir: " + v.titulo);
    sr.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopImmediatePropagation(); abrirPlayer(v.url, v.titulo); }, true);
  }

  function iniciarPortfolio() {
    var grid = $("#pf-grid");
    var sr = $("#showreel");
    if (!grid && !sr) return;
    var passo = grid ? (parseInt(grid.dataset.limit, 10) || 9) : 9;
    var mais = $("#pf-more");
    var filtro = "todos", limite = passo, videos = [], fotos = [];

    function desenhar() {
      if (!grid) return;
      var lista = filtro === "video" ? videos : filtro === "foto" ? fotos : intercalar(videos, fotos);
      grid.innerHTML = "";
      lista.slice(0, limite).forEach(function (p) {
        grid.appendChild(card(p, function () {
          if (p.tipo === "video") abrirPlayer(p.url, p.titulo);
          else abrirGaleria(fotos, fotos.indexOf(p));
        }));
      });
      if (!lista.length) grid.innerHTML = '<p class="pf-empty">' + (filtro === "foto" ? "Em breve, novas fotografias por aqui." : filtro === "video" ? "Em breve, novos vídeos por aqui." : "Em breve, novos trabalhos por aqui.") + "</p>";
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

    if (grid) grid.innerHTML = '<p class="pf-empty">Carregando trabalhos…</p>';
    carregarVideos().then(function (v) {
      videos = v;
      destaqueVideo(videos);
      desenhar();
      return carregarFotos();
    }).then(function (f) { fotos = f || []; desenhar(); });
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
