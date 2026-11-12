// =====================================================================
// Edge Function: novo-orcamento
// Disparada pelo Database Webhook do Supabase a cada INSERT em public.orcamentos.
// 1) Avisa você no celular (ntfy e/ou WhatsApp via CallMeBot)
// 2) Manda e-mail para você com os dados do pedido (Resend)
// 3) Manda resposta automática para o cliente (Resend)
// 4) Marca o pedido como notificado
//
// Segredos (Supabase > Edge Functions > Secrets):
//   WEBHOOK_SECRET      senha que o webhook envia no cabeçalho x-webhook-secret
//   E-MAIL — use UMA das opções:
//   a) Gmail (sem domínio próprio):
//      GMAIL_USER          ex.: audioevideobw@gmail.com
//      GMAIL_APP_PASSWORD  senha de app de 16 letras (Conta Google > Segurança > Senhas de app)
//   b) Resend (com domínio próprio verificado):
//      RESEND_API_KEY      chave da Resend (resend.com)
//      EMAIL_FROM          remetente verificado. Ex.: "BW Produções <contato@bwproducoes.com.br>"
//   EMAIL_DONO          seu e-mail, para receber os pedidos
//   NTFY_TOPIC          (opcional) tópico do app ntfy. Ex.: "bw-orcamentos-8f3k2"
//   NTFY_TOKEN          (recomendado) token de acesso da sua conta ntfy.sh (evita erro 429)
//   CALLMEBOT_PHONE     (opcional) seu WhatsApp com DDI. Ex.: "5531999999999"
//   CALLMEBOT_APIKEY    (opcional) chave que o CallMeBot manda para você
//   WHATSAPP_BW         (opcional) WhatsApp da BW para o botão do e-mail do cliente
//   PRAZO_RESPOSTA      (opcional) Ex.: "até 24 horas úteis"
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente.
// =====================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

type Pedido = {
  id: string; created_at: string; nome: string; email: string; whatsapp?: string;
  tipo?: string; data_evento?: string | null; mensagem?: string | null; pagina?: string | null;
};

const env = (k: string) => Deno.env.get(k) ?? "";
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const dataBR = (d?: string | null) => (d ? d.split("-").reverse().join("/") : "a definir");
const soNumeros = (s?: string) => String(s ?? "").replace(/\D/g, "");

async function enviarEmail(para: string, assunto: string, html: string, responderPara?: string) {
  if (!para) return "pulado";
  const gUser = env("GMAIL_USER"), gPass = env("GMAIL_APP_PASSWORD").replace(/\s/g, "");
  if (gUser && gPass) {
    const smtp = new SMTPClient({ connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gUser, password: gPass } } });
    try {
      await smtp.send({ from: `BW Produções <${gUser}>`, to: para, subject: assunto, html, content: "auto", ...(responderPara ? { replyTo: responderPara } : {}) });
      return "ok (gmail)";
    } finally {
      await smtp.close();
    }
  }
  const key = env("RESEND_API_KEY"), from = env("EMAIL_FROM");
  if (!key || !from) return "pulado";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [para], subject: assunto, html, ...(responderPara ? { reply_to: responderPara } : {}) }),
  });
  return r.ok ? "ok (resend)" : `erro ${r.status}: ${await r.text()}`;
}

async function avisarCelular(p: Pedido) {
  const texto = `Novo orçamento: ${p.nome} · ${p.tipo ?? ""} · ${dataBR(p.data_evento)} · ${p.whatsapp ?? ""}`;
  const res: string[] = [];
  const topico = env("NTFY_TOPIC");
  if (topico) {
    const wa = soNumeros(p.whatsapp);
    // Formato JSON: aceita acentos no título e na mensagem.
    const r = await fetch("https://ntfy.sh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Com token, o limite é da sua conta ntfy (servidores compartilhados recebem erro 429 sem conta).
        ...(env("NTFY_TOKEN") ? { Authorization: `Bearer ${env("NTFY_TOKEN")}` } : {}),
      },
      body: JSON.stringify({
        topic: topico,
        title: "BW Produções — novo orçamento",
        message: `${texto}\n${p.email}${p.mensagem ? "\n\n" + p.mensagem.slice(0, 500) : ""}`,
        priority: 4,
        tags: ["movie_camera"],
        ...(wa ? { click: `https://wa.me/55${wa.replace(/^55/, "")}` } : {}),
      }),
    });
    res.push(`ntfy ${r.status}`);
  }
  const fone = env("CALLMEBOT_PHONE"), apikey = env("CALLMEBOT_APIKEY");
  if (fone && apikey) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${fone}&apikey=${apikey}&text=${encodeURIComponent(texto)}`;
    const r = await fetch(url);
    res.push(`whatsapp ${r.status}`);
  }
  return res.join(", ") || "pulado";
}

function moldura(conteudo: string) {
  return `<div style="background:#030303;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#161616;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden">
    <div style="padding:22px 28px;border-bottom:3px solid #857B40">
      <span style="font-size:18px;font-weight:800;letter-spacing:.18em;color:#FAF9F7">BW PRODUÇÕES</span>
    </div>
    <div style="padding:28px;color:#E4E1DA;font-size:15px;line-height:1.6">${conteudo}</div>
    <div style="padding:16px 28px;background:#0E0E0E;color:#A3A3A3;font-size:12px">Áudio &amp; Vídeo · Eventos · Transmissões ao vivo · Fotografia</div>
  </div></div>`;
}

function emailDono(p: Pedido) {
  const wa = soNumeros(p.whatsapp);
  const linhas = [["Nome", p.nome], ["E-mail", p.email], ["WhatsApp", p.whatsapp], ["Tipo", p.tipo], ["Data do evento", dataBR(p.data_evento)], ["Recebido em", new Date(p.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })]]
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#A3A3A3;white-space:nowrap">${k}</td><td style="padding:6px 0;color:#FAF9F7">${esc(v)}</td></tr>`).join("");
  return moldura(`<h1 style="margin:0 0 16px;font-size:22px;color:#FAF9F7">Novo pedido de orçamento</h1>
    <table style="border-collapse:collapse;font-size:15px">${linhas}</table>
    ${p.mensagem ? `<p style="margin:18px 0 0;padding:14px;border-radius:10px;background:#0E0E0E;color:#E4E1DA">${esc(p.mensagem).replace(/\n/g, "<br>")}</p>` : ""}
    ${wa ? `<p style="margin:22px 0 0"><a href="https://wa.me/55${wa.replace(/^55/, "")}" style="display:inline-block;background:#857B40;color:#030303;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">Responder no WhatsApp</a></p>` : ""}`);
}

function emailCliente(p: Pedido) {
  const primeiro = esc(p.nome.split(" ")[0]);
  const prazo = esc(env("PRAZO_RESPOSTA") || "em breve");
  const wa = soNumeros(env("WHATSAPP_BW"));
  return moldura(`<h1 style="margin:0 0 14px;font-size:22px;color:#FAF9F7">Recebemos seu pedido, ${primeiro}!</h1>
    <p style="margin:0 0 14px">Obrigado por falar com a BW Produções. Seu pedido de <b style="color:#FAF9F7">${esc(p.tipo ?? "orçamento")}</b>
    ${p.data_evento ? ` para <b style="color:#FAF9F7">${dataBR(p.data_evento)}</b>` : ""} chegou certinho e vamos responder ${prazo}.</p>
    <p style="margin:0 0 14px">Se quiser adiantar, mande o local do evento, o número de convidados e onde ele vai ser transmitido.</p>
    ${wa ? `<p style="margin:22px 0 0"><a href="https://wa.me/${wa}" style="display:inline-block;background:#857B40;color:#030303;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">Falar no WhatsApp</a></p>` : ""}
    <p style="margin:22px 0 0;color:#A3A3A3;font-size:13px">Este é um e-mail automático. Você pode responder a ele normalmente.</p>`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("método não permitido", { status: 405 });
  const segredo = env("WEBHOOK_SECRET");
  const recebido = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("x-webhook-secret");
  if (!segredo || recebido !== segredo) return new Response("não autorizado", { status: 401 });

  const corpo = await req.json().catch(() => null);
  const p: Pedido | undefined = corpo?.record;
  if (!p?.id || corpo?.type !== "INSERT" || corpo?.table !== "orcamentos") return new Response("ignorado", { status: 200 });

  const celular = await avisarCelular(p).catch((e) => `erro ${e}`);
  const dono = await enviarEmail(env("EMAIL_DONO"), `Novo orçamento: ${p.nome} — ${p.tipo ?? ""}`, emailDono(p), p.email).catch((e) => `erro ${e}`);
  const cliente = await enviarEmail(p.email, "Recebemos seu pedido — BW Produções", emailCliente(p), env("EMAIL_DONO") || undefined).catch((e) => `erro ${e}`);

  const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  await sb.from("orcamentos").update({ notificado: true }).eq("id", p.id);

  const resultado = { celular, dono, cliente };
  console.log("novo-orcamento", p.id, resultado);
  return new Response(JSON.stringify(resultado), { headers: { "Content-Type": "application/json" } });
});
