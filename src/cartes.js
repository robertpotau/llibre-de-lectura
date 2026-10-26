// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Àlbum de cartes col·leccionables: una carta per cada paraula marcada del capítol.
// Es guanyen en superar el mini-repte (no es poden aconseguir només clicant al text) i es desen al navegador.
(function () {
  "use strict";

  const C = window.CAPITOL;
  const CLAU = "llibre.cartes.v1";
  const PREFIX = C.llibre + "." + C.capitol + ".";
  const MARCA = /\{([^|}]+)\|([^}]+)\}/g;
  const NIVELLS = [["facil", "Prudent"], ["normal", "Valent"], ["ric", "Temerari"]];

  const RARESA = ["Comuna", "Rara", "Èpica", "Llegendària"];
  const CATEGORIES = {
    nom:           { nom: "Nom" },
    verb:          { nom: "Verb" },
    adjectiu:      { nom: "Adjectiu" },
    adverbi:       { nom: "Adverbi" },
    frase_feta:    { nom: "Frase feta" },
    paraula_autor: { nom: "Paraula d'autor" },
    especial:      { nom: "Especial" },
  };
  const TIPUS_NOM = { vocabulari: "Vocabulari", frase_feta: "Frase feta", paraula_autor: "Paraula d'autor", verb: "Verb", especial: "Carta especial" };
  const MOTIUS = {
    ala: "🕊️", ampolla: "🧪", anell: "💍", arbre: "🌳", bec: "🦆", calavera: "💀", campana: "🔔", camí: "🛤️",
    carrer: "🏘️", casc: "⛑️", clau: "🔑", corona: "👑", dau: "🎲", engranatge: "⚙️", escala: "🧗", escut: "🛡️",
    espelma: "🕯️", espiral: "🌀", estrella: "⭐", estómac: "🤢", etiqueta: "🏷️", far: "🗼", flama: "🔥", flor: "🌸",
    foc: "🔥", fulles: "🍃", ganxo: "🎣", gemma: "💎", genoll: "🦵", globus: "🌍", gota: "💧", llampec: "⚡",
    llapis: "✏️", llibres: "📚", llum: "💡", lluna: "🌙", llàgrima: "😢", lupa: "🔍", mapa: "🗺️", martell: "🔨",
    maç: "🏑", mà: "✋", ocell: "🐦", ombra: "🌑", pa: "🍞", parlar: "💬", pastis: "🍰", pesa: "⚖️", peça: "🧩",
    pila: "🔋", pilota: "⚽", pinzell: "🖌️", ploma: "✒️", porta: "🚪", pot: "🥫", pou: "🕳️", ratpenat: "🦇",
    raïm: "🍇", regle: "📏", rellotge: "⏰", salt: "🤸", sol: "☀️", somriure: "😊", telescopi: "🔭", teules: "🏠",
    trompeta: "🎺", ull: "👁️", urpa: "🐾", vent: "💨", conill: "🐇",
    // capítol 2
    peu: "🦶", carta: "✉️", carro: "🛒", regal: "🎁", guant: "🧤", cocodril: "🐊", mar: "🌊", morsa: "🦭", hipopotam: "🦛", gat: "🐈", gos: "🐕",
  };
  const especialDe = (cap) => ({
    tipus: "especial", categoria: "especial", dificultat: 4, lema: cap.titol.ca, en: cap.titol.en,
    definicio: "Carta especial del capítol: has aconseguit totes les paraules marcades d'un dels nivells.",
    sinonim: "—", exemple: "Una carta especial de la història de l'Alícia: capítol " + (parseInt(String(cap.capitol).replace(/\D/g, ""), 10) || 1) + ".", carta: { motiu: "conill" },
  });
  const TOTS = window.CAPITOLS || { [C.capitol]: C };

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const reduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- col·lecció (localStorage) ---
  let col = {};
  try { col = JSON.parse(localStorage.getItem(CLAU) || "{}") || {}; } catch (e) { col = {}; }
  function desa() { try { localStorage.setItem(CLAU, JSON.stringify(col)); } catch (e) { /* sense desament */ } }
  const clau = (id) => PREFIX + id;
  const te = (id) => !!col[clau(id)];

  // --- catàleg ---
  // l'àlbum recull les cartes de tots els capítols; els premis del repte, només els del capítol que es llegeix
  const CATALEG = [];
  Object.keys(TOTS).sort().forEach((cid) => {
    const cap = TOTS[cid], pre = cap.llibre + "." + cap.capitol + ".";
    Object.keys(cap.glossari).forEach((id) => CATALEG.push({ id, key: pre + id, g: cap.glossari[id], cap: cid }));
    CATALEG.push({ id: "especial", key: pre + "especial", g: especialDe(cap), cap: cid });
  });
  const ESPECIAL = especialDe(C);
  const TOTAL = CATALEG.length;

  function idsNivell(n) {
    const ids = new Set();
    for (const p of C.paragrafs) {
      if (!p.ca) continue;
      for (const m of p.ca[n].matchAll(MARCA)) ids.add(m[2]);
    }
    return [...ids].filter((id) => C.glossari[id]);
  }
  const IDS_NIVELL = Object.fromEntries(NIVELLS.map(([n]) => [n, idsNivell(n)]));

  function estatCarta(key) {
    const c = col[key];
    if (!c) return "bloquejada";
    if (c.nou) return "nova";
    return (c.encerts || 0) >= 2 ? "dominada" : "vista";
  }
  const quantes = () => CATALEG.filter((x) => col[x.key]).length;
  const hiHaNoves = () => CATALEG.some((x) => col[x.key] && col[x.key].nou);

  // --- premis en acabar el repte ---
  function premis({ nivell, aparellades, sensePifia }) {
    const noves = [];
    const afegeix = (id, motiu) => {
      if (!C.glossari[id] || te(id)) return;
      col[clau(id)] = { t: Date.now(), nou: true, encerts: 0 };
      noves.push({ id, key: clau(id), g: C.glossari[id], motiu });
    };
    aparellades.forEach((id) => afegeix(id, "repte"));

    // paraules consultades durant la lectura (màxim 4)
    const consultades = [...(window.CONSULTADES || [])].filter((id) => C.glossari[id] && !te(id)).slice(0, 4);
    consultades.forEach((id) => afegeix(id, "consultada"));

    // una carta sorpresa del nivell que s'ha llegit
    const possibles = (IDS_NIVELL[nivell] || []).filter((id) => !te(id));
    if (possibles.length) afegeix(possibles[Math.floor(Math.random() * possibles.length)], "sorpresa");

    // encerts a la primera: a partir de 2 la carta queda «dominada»
    const dominades = [];
    sensePifia.forEach((id) => {
      const c = col[clau(id)];
      if (!c) return;
      const abans = (c.encerts || 0) >= 2;
      c.encerts = (c.encerts || 0) + 1;
      if (!abans && c.encerts >= 2) dominades.push(id);
    });

    // carta especial: tots els mots d'un nivell
    if (!te("especial") && NIVELLS.some(([n]) => IDS_NIVELL[n].every(te))) {
      col[clau("especial")] = { t: Date.now(), nou: true, encerts: 0 };
      noves.push({ id: "especial", key: clau("especial"), g: ESPECIAL, motiu: "especial" });
    }

    if (window.CONSULTADES) window.CONSULTADES.clear();
    desa();
    actualitzaComptador();
    noves.sort((a, b) => a.g.dificultat - b.g.dificultat);
    return { noves, dominades };
  }

  // --- so i espurnes (només després d'un gest de l'usuari) ---
  let audio = null;
  function so(raresa) {
    if (window.SONS && !window.SONS.actiu) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime;
      const notes = { 1: [523], 2: [523, 659], 3: [523, 659, 784], 4: [523, 659, 784, 1047, 1319] }[raresa] || [523];
      notes.forEach((f, i) => {
        const o = audio.createOscillator(), g = audio.createGain(), t = t0 + i * 0.09;
        o.type = "triangle";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o.connect(g).connect(audio.destination);
        o.start(t);
        o.stop(t + 0.65);
      });
    } catch (e) { /* sense so */ }
  }

  function espurnes(el, n) {
    if (reduit()) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "cc-espurna";
      s.textContent = "✦";
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 70;
      s.style.setProperty("--dx", Math.cos(a) * d + "px");
      s.style.setProperty("--dy", Math.sin(a) * d + "px");
      s.style.animationDelay = Math.random() * 0.15 + "s";
      el.appendChild(s);
      setTimeout(() => s.remove(), 1100);
    }
  }

  function parla(g, id) {
    if (window.VEU_CARTA && window.VEU_CARTA.parla(id)) return; // àudio real (Joana o Enric)
    if (!("speechSynthesis" in window)) return;
    const stop = document.getElementById("rep-stop");
    if (stop && !stop.disabled) stop.click();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(g.lema + ". " + g.exemple);
    u.lang = "ca-ES";
    const v = window.speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith("ca"));
    if (v) u.voice = v;
    u.rate = 0.95;
    u.volume = window.MUSICA ? window.MUSICA.volVeu : 1;
    window.speechSynthesis.speak(u);
  }

  // el tipus només es mostra si aporta alguna cosa respecte de la categoria
  function tipusVisible(g, cat) {
    const t = TIPUS_NOM[g.tipus] || "";
    return t === CATEGORIES[cat].nom || g.tipus === "especial" ? "" : t;
  }

  // --- component carta ---
  // mode: "album" (es gira per veure el significat) | "bloquejada" | "sobre" (coberta, es descobreix)
  function creaCarta(item, mode) {
    const g = item.g;
    const rar = g.dificultat;
    const cat = CATEGORIES[g.categoria] ? g.categoria : "nom";
    const el = document.createElement("div");
    el.className = `cc r${rar} cat-${cat}` + (mode === "bloquejada" ? " bloquejada" : "") + (mode === "sobre" ? " girada coberta" : "");
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    const motiu = MOTIUS[g.carta && g.carta.motiu] || "✨";
    const nova = mode === "album" && col[item.key] && col[item.key].nou;
    const dominada = mode === "album" && estatCarta(item.key) === "dominada";

    let davant, darrere;
    if (mode === "bloquejada") {
      davant = `<div class="cc-marc"><div class="cc-cap"><span class="cc-cat">${CATEGORIES[cat].nom}</span><span class="cc-gemmes">${"◆".repeat(rar)}</span></div>
        <div class="cc-art"><span class="cc-emoji cc-interrogant" aria-hidden="true">?</span></div>
        <div class="cc-nom">Encara no la tens</div><div class="cc-en">&nbsp;</div>
        <div class="cc-peu"><span>${RARESA[rar - 1]}</span><span></span></div></div>`;
      darrere = "";
      el.setAttribute("aria-label", `Carta per aconseguir: ${CATEGORIES[cat].nom}, ${RARESA[rar - 1]}`);
    } else {
      davant = `<div class="cc-marc"><div class="cc-cap"><span class="cc-cat">${CATEGORIES[cat].nom}</span><span class="cc-gemmes" aria-label="${RARESA[rar - 1]}">${"◆".repeat(rar)}</span></div>
        <div class="cc-art"><span class="cc-emoji" aria-hidden="true">${motiu}</span></div>
        <div class="cc-nom">${esc(g.lema)}</div><div class="cc-en">${esc(g.en)}</div>
        <div class="cc-peu"><span>${RARESA[rar - 1]}</span><span>${dominada ? "★ Dominada" : esc(tipusVisible(g, cat))}</span></div></div>`;
      darrere = mode === "sobre"
        ? `<div class="cc-coberta"><span>❦</span></div>`
        : `<div class="cc-dors"><div class="cc-dors-cap"><strong>${esc(g.lema)}</strong><span>${esc(TIPUS_NOM[g.tipus] || "")}</span></div>
            <dl><dt>Vol dir</dt><dd>${esc(g.definicio)}</dd>
            ${g.sinonim && g.sinonim !== "—" ? `<dt>Més senzill</dt><dd>${esc(g.sinonim)}</dd>` : ""}
            <dt>Exemple</dt><dd><em>${esc(g.exemple)}</em></dd>
            <dt>Original</dt><dd>${esc(g.en)}</dd></dl>
            <button type="button" class="cc-escolta" aria-label="Escolta la paraula">🔊 Escolta</button></div>`;
      el.setAttribute("aria-label", `Carta ${g.lema}, ${RARESA[rar - 1]}. Prem per ${mode === "sobre" ? "descobrir-la" : "girar-la"}.`);
    }
    el.innerHTML =
      `<div class="cc-inner">
         <div class="cc-cara cc-davant">${davant}<div class="cc-foil"></div><div class="cc-llum"></div><div class="cc-sheen"></div>${rar === 4 && mode !== "bloquejada" ? '<div class="cc-espurnes" aria-hidden="true"><i>✦</i><i>✦</i><i>✧</i><i>✦</i><i>✧</i></div>' : ""}</div>
         <div class="cc-cara cc-darrere">${darrere}</div>
       </div>
       ${nova ? '<span class="cc-nova">NOVA</span>' : ""}`;

    // inclinació 3D amb el ratolí
    if (mode !== "bloquejada" && !reduit()) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
        el.style.setProperty("--rx", ((0.5 - y) * 16).toFixed(2) + "deg");
        el.style.setProperty("--ry", ((x - 0.5) * 20).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--mx", ".5");
        el.style.setProperty("--my", ".5");
      });
    }

    if (mode === "album") {
      const gira = () => el.classList.toggle("girada");
      el.addEventListener("click", (e) => {
        if (e.target.closest(".cc-escolta")) { parla(g, item.id); return; }
        gira();
      });
      el.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === el) { e.preventDefault(); gira(); }
      });
    } else if (mode === "sobre") {
      const descobreix = () => {
        if (!el.classList.contains("coberta")) return;
        el.classList.remove("girada", "coberta");
        el.classList.add("revelada");
        so(rar);
        if (rar >= 3) espurnes(el, rar === 4 ? 16 : 9);
        el.setAttribute("aria-label", `Carta ${g.lema}, ${RARESA[rar - 1]}`);
        el.dispatchEvent(new CustomEvent("revelada", { bubbles: true }));
      };
      el.addEventListener("click", descobreix);
      el.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === el) { e.preventDefault(); descobreix(); }
      });
      el.descobreix = descobreix;
    }
    return el;
  }

  // --- diàleg genèric (àlbum i sobre) ---
  let obert = null;
  function obre(cl, html, titolId, bloquejat) {
    const fons = document.createElement("div");
    fons.className = "cc-fons " + cl;
    fons.setAttribute("role", "dialog");
    fons.setAttribute("aria-modal", "true");
    fons.setAttribute("aria-labelledby", titolId);
    fons.innerHTML = html;
    const abans = document.activeElement;
    document.body.appendChild(fons);
    document.body.style.overflow = "hidden";
    const tanca = () => {
      fons.remove();
      document.body.style.overflow = "";
      document.removeEventListener("keydown", tecles, true);
      obert = null;
      if (abans && abans.focus) abans.focus();
      if (fons.onTanca) fons.onTanca();
    };
    const tecles = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); if (fons.bloquejat) { e.preventDefault(); return; } tanca(); return; }
      if (e.key === "Tab") {
        const f = [...fons.querySelectorAll('button:not([disabled]), [tabindex="0"], input, select, textarea, summary')].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const primer = f[0], ultim = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primer) { e.preventDefault(); ultim.focus(); }
        else if (!e.shiftKey && document.activeElement === ultim) { e.preventDefault(); primer.focus(); }
      }
    };
    document.addEventListener("keydown", tecles, true);
    fons.tanca = tanca;
    fons.bloquejat = !!bloquejat;
    obert = fons;
    return fons;
  }

  // --- àlbum ---
  function obreAlbum(opts) {
    const alTancar = opts && typeof opts.alTancar === "function" ? opts.alTancar : null;
    if (obert) obert.tanca();
    const f = { raresa: new Set(), categoria: "", estat: "", text: "", ordre: "raresa", capitol: "" };
    const fons = obre("cc-album", `
      <div class="cc-panell">
        <header class="cc-capcalera">
          <div><h2 id="cc-album-titol">Àlbum de paraules</h2><p class="cc-comptador" id="cc-comptador-album"></p></div>
          <button type="button" class="cc-tanca" aria-label="Tanca l'àlbum">×</button>
        </header>
        <div class="cc-nivells" id="cc-nivells"></div>
        <div class="cc-filtres">
          <div class="cc-raresa" role="group" aria-label="Filtra per raresa">
            ${RARESA.map((r, i) => `<button type="button" class="cc-xip r${i + 1}" data-r="${i + 1}" aria-pressed="false">${"◆".repeat(i + 1)} ${r}</button>`).join("")}
          </div>
          ${Object.keys(TOTS).length > 1 ? `<label>Capítol
            <select id="cc-f-cap"><option value="">Tots</option>${Object.keys(TOTS).sort().map((k) => `<option value="${k}">${parseInt(k.replace(/\D/g, ""), 10)}. ${esc(TOTS[k].titol.ca)}</option>`).join("")}</select></label>` : ""}
          <label>Categoria
            <select id="cc-f-cat"><option value="">Totes</option>${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}">${v.nom}</option>`).join("")}</select></label>
          <label>Estat
            <select id="cc-f-estat"><option value="">Totes</option><option value="nova">Noves</option><option value="vista">Vistes</option><option value="dominada">Dominades</option><option value="bloquejada">Per aconseguir</option></select></label>
          <label>Ordena
            <select id="cc-f-ordre"><option value="raresa">Per raresa</option><option value="alfabet">Alfabètic</option><option value="recents">Més recents</option></select></label>
          <label class="cc-cerca">Cerca
            <input type="search" id="cc-f-text" placeholder="Una paraula…" autocomplete="off"></label>
        </div>
        <div class="cc-graella" id="cc-graella" aria-live="polite"></div>
        <details class="cc-copia">
          <summary>Còpia de seguretat de la col·lecció</summary>
          <p>Les cartes es guarden només en aquest navegador. Copia aquest codi per no perdre-les o per portar-les a un altre ordinador.</p>
          <textarea readonly id="cc-codi" rows="3"></textarea>
          <div class="cc-copia-accions"><button type="button" class="cc-boto" id="cc-copia">Copia el codi</button></div>
          <p>Per recuperar-les, enganxa un codi aquí:</p>
          <textarea id="cc-importa" rows="3" placeholder="LLC1.…"></textarea>
          <div class="cc-copia-accions"><button type="button" class="cc-boto" id="cc-carrega">Carrega les cartes</button><span id="cc-copia-msg" role="status"></span></div>
        </details>
      </div>`, "cc-album-titol");

    const graella = $("#cc-graella", fons);

    function passa(item) {
      const st = estatCarta(item.key);
      if (f.capitol && item.cap !== f.capitol) return false;
      if (f.raresa.size && !f.raresa.has(item.g.dificultat)) return false;
      if (f.categoria && item.g.categoria !== f.categoria) return false;
      if (f.estat && st !== f.estat) return false;
      if (f.text) {
        if (st === "bloquejada") return false;
        const t = f.text.toLowerCase();
        if (![item.g.lema, item.g.en, item.g.definicio, item.g.sinonim].some((x) => String(x).toLowerCase().includes(t))) return false;
      }
      return true;
    }

    function pintaGraella() {
      let llista = CATALEG.filter(passa);
      const collator = new Intl.Collator("ca");
      if (f.ordre === "alfabet") llista.sort((a, b) => collator.compare(a.g.lema, b.g.lema));
      else if (f.ordre === "recents") llista.sort((a, b) => ((col[b.key] || {}).t || 0) - ((col[a.key] || {}).t || 0));
      else llista.sort((a, b) => b.g.dificultat - a.g.dificultat || collator.compare(a.g.lema, b.g.lema));
      graella.innerHTML = "";
      if (!llista.length) {
        graella.innerHTML = `<p class="cc-buit">No hi ha cap carta amb aquests filtres.</p>`;
      }
      llista.forEach((it) => graella.appendChild(creaCarta(it, col[it.key] ? "album" : "bloquejada")));
      $("#cc-comptador-album", fons).textContent = `Tens ${quantes()} de ${TOTAL} cartes`;
      $("#cc-nivells", fons).innerHTML = NIVELLS.map(([n, nom]) => {
        const tot = IDS_NIVELL[n].length, tinc = IDS_NIVELL[n].filter(te).length;
        return `<div class="cc-nivell${tinc === tot ? " completat" : ""}"><span>${nom}</span><div class="cc-barra"><i style="width:${(100 * tinc / tot).toFixed(0)}%"></i></div><span>${tinc}/${tot}${tinc === tot ? " ✓" : ""}</span></div>`;
      }).join("") + `<p class="cc-nota">Completa tots els mots d'un nivell i guanyaràs una carta especial${te("especial") ? " (ja la tens!)" : ""}.</p>`;
      $("#cc-codi", fons).value = codi();
    }

    fons.addEventListener("click", (e) => {
      if (e.target === fons || e.target.closest(".cc-tanca")) fons.tanca();
      const x = e.target.closest(".cc-xip");
      if (x) {
        const r = Number(x.dataset.r);
        if (f.raresa.has(r)) f.raresa.delete(r); else f.raresa.add(r);
        x.setAttribute("aria-pressed", String(f.raresa.has(r)));
        pintaGraella();
      }
    });
    const selCap = $("#cc-f-cap", fons);
    if (selCap) selCap.addEventListener("change", (e) => { f.capitol = e.target.value; pintaGraella(); });
    $("#cc-f-cat", fons).addEventListener("change", (e) => { f.categoria = e.target.value; pintaGraella(); });
    $("#cc-f-estat", fons).addEventListener("change", (e) => { f.estat = e.target.value; pintaGraella(); });
    $("#cc-f-ordre", fons).addEventListener("change", (e) => { f.ordre = e.target.value; pintaGraella(); });
    $("#cc-f-text", fons).addEventListener("input", (e) => { f.text = e.target.value.trim(); pintaGraella(); });
    $("#cc-copia", fons).addEventListener("click", async () => {
      const t = $("#cc-codi", fons);
      t.select();
      try { await navigator.clipboard.writeText(t.value); $("#cc-copia-msg", fons).textContent = "Copiat!"; }
      catch (e) { document.execCommand && document.execCommand("copy"); $("#cc-copia-msg", fons).textContent = "Codi seleccionat: prem Ctrl+C."; }
    });
    $("#cc-carrega", fons).addEventListener("click", () => {
      const n = importa($("#cc-importa", fons).value);
      $("#cc-copia-msg", fons).textContent = n < 0 ? "Aquest codi no és vàlid." : n === 0 ? "No hi havia cartes noves." : `S'han afegit ${n} cartes.`;
      if (n > 0) { pintaGraella(); actualitzaComptador(); }
    });

    fons.onTanca = () => {
      // les cartes noves passen a «vistes» en tancar l'àlbum
      Object.values(col).forEach((c) => { c.nou = false; });
      desa();
      actualitzaComptador();
      if (alTancar) alTancar();
    };
    pintaGraella();
    $(".cc-tanca", fons).focus();
  }

  // --- còpia de seguretat ---
  function codi() {
    const json = JSON.stringify(col);
    return "LLC1." + btoa(unescape(encodeURIComponent(json)));
  }
  function importa(text) {
    try {
      const m = String(text).trim().match(/^LLC1\.([A-Za-z0-9+/=]+)$/);
      if (!m) return -1;
      const d = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
      if (!d || typeof d !== "object" || Array.isArray(d)) return -1;
      let n = 0;
      for (const [k, v] of Object.entries(d)) {
        if (typeof k !== "string" || !k.includes(".") || !v || typeof v !== "object") continue;
        const t = Number(v.t) || Date.now(), enc = Math.max(0, Math.min(99, Number(v.encerts) || 0));
        if (!col[k]) { col[k] = { t, nou: false, encerts: enc }; n++; }
        else { col[k].encerts = Math.max(col[k].encerts || 0, enc); col[k].t = Math.min(col[k].t || t, t); }
      }
      desa();
      return n;
    } catch (e) { return -1; }
  }

  // --- sobre: descobrir les cartes guanyades ---
  const MOTIU_TEXT = { repte: "Del repte", consultada: "Consultada", sorpresa: "Sorpresa!", especial: "Carta especial!" };

  function obreSobre(noves) {
    if (!noves || !noves.length) return;
    if (obert) obert.tanca();
    const fons = obre("cc-sobre", `
      <div class="cc-panell cc-panell-sobre">
        <h2 id="cc-sobre-titol">${noves.length === 1 ? "Carta nova!" : `${noves.length} cartes noves!`}</h2>
        <p class="cc-instruccio" id="cc-resta">Clica cada carta per descobrir-la. Fins que no les descobreixis totes no podràs continuar.</p>
        <div class="cc-fila" id="cc-fila"></div>
        <div class="cc-accions">
          <button type="button" class="cc-boto" id="cc-totes">Descobreix-les totes</button>
          <button type="button" class="cc-boto principal" id="cc-veure-album" disabled>Veure l'àlbum →</button>
        </div>
      </div>`, "cc-sobre-titol", true);
    const fila = $("#cc-fila", fons);
    noves.forEach((n) => {
      const cel = document.createElement("div");
      cel.className = "cc-cel";
      const carta = creaCarta(n, "sobre");
      cel.appendChild(carta);
      const peu = document.createElement("p");
      peu.className = "cc-motiu";
      peu.textContent = MOTIU_TEXT[n.motiu] || "";
      cel.appendChild(peu);
      fila.appendChild(cel);
    });
    $("#cc-totes", fons).addEventListener("click", () => {
      [...fila.querySelectorAll(".cc.coberta")].forEach((c, i) => setTimeout(() => c.descobreix(), i * 280));
    });
    // només es pot continuar quan totes les cartes són descobertes; després: àlbum i, en tancar-lo, biblioteca
    const botoAlbum = $("#cc-veure-album", fons), resta = $("#cc-resta", fons);
    const revisa = () => {
      const falten = fila.querySelectorAll(".cc.coberta").length;
      if (falten > 0) { resta.textContent = falten === 1 ? "Falta 1 carta per descobrir." : `Falten ${falten} cartes per descobrir.`; return; }
      resta.textContent = "Ja les tens totes! Ara veuràs com queden a l'àlbum.";
      $("#cc-totes", fons).disabled = true;
      botoAlbum.disabled = false;
      botoAlbum.classList.add("pulsa");
      botoAlbum.focus();
    };
    fila.addEventListener("revelada", revisa);
    botoAlbum.addEventListener("click", () => {
      if (botoAlbum.disabled) return;
      fons.bloquejat = false;
      fons.tanca();
      obreAlbum({ alTancar: () => { if (window.BIBLIOTECA && window.BIBLIOTECA.tornaBiblioteca) window.BIBLIOTECA.tornaBiblioteca(); } });
    });
    const primera = fila.querySelector(".cc");
    if (primera) primera.focus();
  }

  // --- botó de l'àlbum a la barra ---
  function actualitzaComptador() {
    document.querySelectorAll("[data-album]").forEach((b) => {
      const n = b.querySelector(".album-n");
      if (n) n.textContent = quantes() + "/" + TOTAL;
      b.classList.toggle("amb-noves", hiHaNoves());
    });
  }
  document.querySelectorAll("[data-album]").forEach((b) => b.addEventListener("click", obreAlbum));
  actualitzaComptador();

  window.CARTES = { premis, obreSobre, obreAlbum, te, quantes, total: TOTAL };
})();
