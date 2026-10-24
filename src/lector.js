// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Lector paginat: el capítol es reparteix en pàgines (columnes CSS) i es passen amb una animació de pàgina.
// Reutilitza el text, les paraules marcades i el dictat de app.js; el mode «llarg» (desplaçament) es manté com a alternativa.
(function () {
  "use strict";

  const body = document.body;
  const $ = (id) => document.getElementById(id);
  const C = window.CAPITOL;
  const reduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const LLISTA = C.paragrafs.filter((p) => p.tipus !== "separador");

  const pref = (k, d) => { try { const v = localStorage.getItem("llibre." + k); return v === null ? d : v; } catch (e) { return d; } };
  const desaPref = (k, v) => { try { localStorage.setItem("llibre." + k, v); } catch (e) { /* sense desament */ } };

  const lector = $("lector");
  const slots = $("slots");
  const slotEsq = $("slot-esq");
  const slotDre = $("slot-dre");
  const repteVista = $("repte-vista");
  const mesura = $("mesura");
  const progres = $("lector-progres");

  // E: estat de la paginació
  const E = { spread: true, PW: 540, H: 640, p: 40, cw: 460, g: 80, hc: 560, N: 1, nVistes: 2, vista: 0, anim: false, mapa: {}, mode: pref("lector", "pagines") === "llarg" ? "llarg" : "pagines" };

  const actiu = () => body.dataset.mode === "lectura" && body.dataset.lector === "pagines";
  const unitats = () => (E.spread ? 2 : 1);
  const esRepte = () => E.vista === E.nVistes - 1;

  // ---------- contingut ----------
  // Text d'origen: el que ja ha pintat app.js (en un contenidor amagat). Es torna a llegir cada vegada
  // perquè porta l'estat actual del paràgraf que sona.
  function htmlFlux() {
    return `<header class="pg-cap"><p class="llibre-titol">${esc($("llibre-titol").textContent)}</p><h1>${esc($("capitol-titol").textContent)}</h1><p class="ornament" aria-hidden="true">❦</p></header>` +
      $("text").innerHTML +
      `<p class="peu">${esc($("peu").textContent)}</p>`;
  }

  function calculaMides() {
    const barra = (document.querySelector(".barra") || {}).offsetHeight || 70;
    const w = document.documentElement.clientWidth || window.innerWidth, h = document.documentElement.clientHeight || window.innerHeight;
    E.spread = w >= 880;
    E.p = E.spread ? 40 : 22;
    E.H = Math.max(300, Math.min(780, h - barra - (E.spread ? 150 : 205))); // espai per al progrés i el reproductor
    E.PW = E.spread ? Math.min(540, Math.floor((w - 150) / 2)) : Math.min(560, w - 52);
    E.cw = E.PW - 2 * E.p;
    E.g = 2 * E.p;
    E.hc = E.H - 34 - 50;
    const s = lector.style;
    s.setProperty("--pw", E.PW + "px");
    s.setProperty("--h", E.H + "px");
    s.setProperty("--p", E.p + "px");
    s.setProperty("--cw", E.cw + "px");
    s.setProperty("--g", E.g + "px");
    s.setProperty("--hc", E.hc + "px");
    s.setProperty("--n", E.spread ? 2 : 1);
    s.setProperty("--barra-h", barra + "px");
    lector.classList.toggle("un", !E.spread);
    mesura.style.cssText = `--pw:${E.PW}px;--cw:${E.cw}px;--g:${E.g}px;--hc:${E.hc}px;`;
  }

  // mesura quantes pàgines fa el text i en quina pàgina cau cada paràgraf
  function pagina() {
    mesura.innerHTML = `<div class="pg-text"><div class="pg-flux">${htmlFlux()}</div></div>`;
    const flux = mesura.querySelector(".pg-flux");
    const f0 = flux.getBoundingClientRect().left;
    let N = Math.round((flux.scrollWidth + E.g) / E.PW);
    E.mapa = {};
    flux.querySelectorAll(".par[data-id]").forEach((el) => {
      const r = el.getClientRects();
      if (!r.length) return;
      const ini = Math.max(0, Math.floor((r[0].left - f0 + 2) / E.PW));
      const fi = Math.max(0, Math.floor((r[r.length - 1].left - f0 + 2) / E.PW));
      E.mapa[el.dataset.id] = { ini, fi };
      N = Math.max(N, fi + 1);
    });
    E.N = Math.max(1, N);
    E.nVistes = Math.ceil(E.N / unitats()) + 1; // l'última vista és el mini-repte
    mesura.innerHTML = "";
  }

  function construeixPagina(idx, costat) {
    const d = document.createElement("div");
    d.className = "pg " + costat;
    if (idx >= E.N) { d.classList.add("buida"); return d; }
    d.innerHTML = `<div class="pg-text"><div class="pg-flux" style="transform:translateX(${-idx * E.PW}px)">${htmlFlux()}</div></div><span class="pg-num">${idx + 1}</span>`;
    return d;
  }

  // ---------- estat estàtic ----------
  function mostra(v) {
    E.vista = Math.max(0, Math.min(E.nVistes - 1, v));
    const repte = esRepte();
    slots.hidden = repte;
    repteVista.hidden = !repte;
    if (!repte) {
      if (E.spread) {
        slotEsq.replaceChildren(construeixPagina(2 * E.vista, "esq"));
        slotDre.replaceChildren(construeixPagina(2 * E.vista + 1, "dre"));
      } else {
        slotDre.replaceChildren(construeixPagina(E.vista, "sola"));
      }
    }
    actualitzaUI();
  }

  function actualitzaUI() {
    const u = unitats();
    let t;
    if (esRepte()) t = "Mini-repte del capítol";
    else if (E.spread) t = `Pàgines ${2 * E.vista + 1}${2 * E.vista + 2 <= E.N ? "–" + (2 * E.vista + 2) : ""} de ${E.N}`;
    else t = `Pàgina ${E.vista + 1} de ${E.N}`;
    progres.querySelector(".lp-text").textContent = t;
    clearTimeout(E.tMarca); E.tMarca = setTimeout(desaMarca, 400);
    const frac = esRepte() ? 1 : Math.min(1, (E.vista * u + u) / E.N);
    progres.querySelector(".lp-barra i").style.width = (frac * 100).toFixed(1) + "%";
    const primera = E.vista === 0, ultima = esRepte();
    document.querySelectorAll(".lp-anterior, #fletxa-esq, #zona-esq").forEach((b) => { b.disabled = primera; });
    document.querySelectorAll(".lp-seguent, #fletxa-dre, #zona-dre").forEach((b) => { b.disabled = ultima; });
  }

  // ---------- animació de pàgina ----------
  // dir: +1 endavant, -1 enrere (el so es mou d'un costat a l'altre); curt: lliscament sense pàgina 3D
  function soPagina(dir, curt) { try { if (window.SONS && window.SONS.pagina) window.SONS.pagina(dir, curt); } catch (e) { /* sense so */ } }

  function anima(el, transformFinal, ms) {
    return new Promise((res) => {
      let fet = false;
      const acaba = () => { if (!fet) { fet = true; viu = false; slots.style.setProperty("--o-dre", 0); slots.style.setProperty("--o-esq", 0); res(); } };
      const durada = ms * (window.__bibLent || 1); // __bibLent: càmera lenta per fer proves
      el.style.transition = `transform ${durada}ms cubic-bezier(.45,.05,.25,1)`;
      const dir = el.classList.contains("dre") ? 1 : -1;
      let viu = true;
      const segueix = () => {
        if (!viu) return;
        let p = 0;
        try { p = Math.acos(Math.max(-1, Math.min(1, new DOMMatrix(getComputedStyle(el).transform).m11))) / Math.PI; } catch (e) { /* sense matriu */ }
        const s = Math.sin(p * Math.PI);
        el.style.setProperty("--s", s.toFixed(3));
        const rev = (1 - p) * s, aterra = p * s; // ombra a la pàgina que es destapa i a la que cobreix
        slots.style.setProperty("--o-dre", (dir > 0 ? rev : aterra).toFixed(3));
        slots.style.setProperty("--o-esq", (dir > 0 ? aterra : rev).toFixed(3));
        requestAnimationFrame(segueix);
      };
      if (!reduit()) requestAnimationFrame(segueix);
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = transformFinal; }));
      el.addEventListener("transitionend", (e) => { if (e.target === el && e.propertyName === "transform") acaba(); }); // només la fulla (no els botons de dins)
      setTimeout(acaba, durada + 250);
    });
  }

  function creaFulla(cost, davant, darrere) {
    const f = document.createElement("div");
    f.className = "fulla " + cost;
    const a = document.createElement("div"); a.className = "cara davant"; a.appendChild(davant);
    const b = document.createElement("div"); b.className = "cara darrere"; b.appendChild(darrere);
    f.append(a, b);
    return f;
  }

  async function gira(dir) {
    if (E.anim || !actiu()) return;
    const nova = E.vista + dir;
    if (nova < 0 || nova >= E.nVistes) return;
    E.anim = true;
    try {
      const entraRepte = nova === E.nVistes - 1, surtRepte = E.vista === E.nVistes - 1;
      soPagina(dir, entraRepte || surtRepte || reduit() || !E.spread);
      if (entraRepte || surtRepte || reduit()) {
        // canvi sense pàgina 3D: fosa ràpida
        lector.classList.add("fon");
        await new Promise((r) => setTimeout(r, reduit() ? 0 : 160));
        mostra(nova);
        lector.classList.remove("fon");
      } else if (E.spread) {
        const v = E.vista;
        if (dir > 0) {
          const fulla = creaFulla("dre", construeixPagina(2 * v + 1, "dre"), construeixPagina(2 * nova, "esq"));
          slots.appendChild(fulla);
          slotDre.replaceChildren(construeixPagina(2 * nova + 1, "dre"));
          await anima(fulla, "rotateY(-180deg)", 750);
          slotEsq.replaceChildren(construeixPagina(2 * nova, "esq"));
          fulla.remove();
        } else {
          const fulla = creaFulla("esq", construeixPagina(2 * v, "esq"), construeixPagina(2 * nova + 1, "dre"));
          slots.appendChild(fulla);
          slotEsq.replaceChildren(construeixPagina(2 * nova, "esq"));
          await anima(fulla, "rotateY(180deg)", 750);
          slotDre.replaceChildren(construeixPagina(2 * nova + 1, "dre"));
          fulla.remove();
        }
        E.vista = nova;
        actualitzaUI();
      } else {
        // una sola pàgina: la nova entra lliscant pel costat
        const entrant = construeixPagina(nova, "sola");
        entrant.classList.add(dir > 0 ? "entra-dre" : "entra-esq");
        slotDre.replaceChildren(entrant);
        await new Promise((r) => setTimeout(r, 320));
        E.vista = nova;
        actualitzaUI();
      }
    } finally {
      E.anim = false;
    }
  }

  function vesA(v) {
    if (E.anim) return;
    v = Math.max(0, Math.min(E.nVistes - 1, v));
    if (v === E.vista) return;
    if (Math.abs(v - E.vista) === 1) gira(v - E.vista);
    else { soPagina(v > E.vista ? 1 : -1, true); mostra(v); }
  }

  // ---------- refresc (canvi de nivell, mida, tipografia...) ----------
  function ancoraActual() {
    if (!E.mapa || !Object.keys(E.mapa).length) return null;
    if (esRepte()) return "repte";
    const primera = E.vista * unitats();
    const p = LLISTA.find((x) => E.mapa[x.id] && E.mapa[x.id].fi >= primera);
    return p ? p.id : null;
  }

  function refresca() {
    if (!actiu()) return;
    const ancora = ancoraActual();
    calculaMides();
    pagina();
    let v = 0;
    if (ancora === "repte") v = E.nVistes - 1;
    else if (ancora && E.mapa[ancora]) v = Math.floor(E.mapa[ancora].ini / unitats());
    E.anim = false;
    document.querySelectorAll(".fulla").forEach((f) => f.remove());
    lector.classList.remove("fon");
    mostra(v);
    restauraMarca();
  }

  // ---------- API per a app.js / repte.js ----------
  function mostraParagraf(id) {
    if (!actiu() || E.anim) return;
    const m = E.mapa[id];
    if (!m || esRepte()) { if (esRepte() && m) mostra(Math.floor(m.ini / unitats())); return; }
    const primera = E.vista * unitats(), darrera = primera + unitats() - 1;
    if (m.ini >= primera && m.ini <= darrera) return;
    vesA(Math.floor(m.ini / unitats()));
  }
  function primerParagrafVisible() {
    if (!actiu() || esRepte()) return null;
    const primera = E.vista * unitats(), darrera = primera + unitats() - 1;
    const p = LLISTA.find((x) => E.mapa[x.id] && E.mapa[x.id].fi >= primera && E.mapa[x.id].ini <= darrera);
    return p ? p.id : null;
  }
  const vesAlPrincipi = () => vesA(0);

  // ---------- marcapàgines: recorda la lectura entre visites ----------
  const CLAU_MARCA = "marca." + C.capitol;
  const cinta = document.createElement("div");
  cinta.className = "cinta"; cinta.hidden = true; cinta.setAttribute("aria-hidden", "true");
  $("llibre-obert").appendChild(cinta);
  let marcaFeta = false;
  const llegeixMarca = () => pref(CLAU_MARCA, "");
  function desaMarca() {
    if (!actiu() || esRepte() || !E.mapa || !Object.keys(E.mapa).length) return;
    const primera = E.vista * unitats(), darrera = primera + unitats() - 1;
    const pp = LLISTA.find((x) => E.mapa[x.id] && E.mapa[x.id].ini >= primera && E.mapa[x.id].ini <= darrera);
    const id = pp ? pp.id : primerParagrafVisible();
    if (!id) return;
    if (E.vista === 0) { try { localStorage.removeItem("llibre." + CLAU_MARCA); } catch (e) { /* sense desament */ } cinta.hidden = true; return; }
    desaPref(CLAU_MARCA, id);
    cinta.hidden = false;
  }
  function restauraMarca() {
    if (marcaFeta || !actiu() || !E.nVistes || !Object.keys(E.mapa).length) return;
    marcaFeta = true;
    const id = llegeixMarca();
    if (!id || !E.mapa[id]) return;
    const v = Math.floor(E.mapa[id].ini / unitats());
    if (v <= 0 || v >= E.nVistes - 1) return;
    mostra(v);
    cinta.hidden = false;
    const av = document.createElement("div");
    av.className = "marca-av"; av.setAttribute("role", "status");
    av.innerHTML = '<span>Has tornat on ho vas deixar.</span><button type="button">Torna al principi</button>';
    av.querySelector("button").addEventListener("click", () => { av.remove(); vesA(0); });
    document.body.appendChild(av);
    setTimeout(() => av.remove(), 9000);
  }

  // ---------- mode pàgines / llarg ----------
  function posaMode(m) {
    E.mode = m;
    body.dataset.lector = m;
    desaPref("lector", m);
    const boto = $("btn-lector");
    if (boto) {
      boto.textContent = m === "pagines" ? "📜 Text llarg" : "📖 Pàgines";
      boto.title = m === "pagines" ? "Mostra el capítol en una sola columna, amb desplaçament" : "Mostra el capítol en pàgines";
    }
    // el repte viu dins del llibre (pàgines) o al final del text (llarg)
    const repte = $("repte");
    if (m === "pagines") repteVista.appendChild(repte);
    else {
      const peu = $("peu");
      peu.parentNode.insertBefore(repte, peu);
    }
    if (m === "pagines") refresca();
    else window.scrollTo(0, 0);
  }

  // ---------- esdeveniments ----------
  $("fletxa-esq").addEventListener("click", () => gira(-1));
  $("fletxa-dre").addEventListener("click", () => gira(1));
  $("zona-esq").addEventListener("click", () => gira(-1));
  $("zona-dre").addEventListener("click", () => gira(1));
  document.querySelectorAll(".lp-anterior").forEach((b) => b.addEventListener("click", () => gira(-1)));
  document.querySelectorAll(".lp-seguent").forEach((b) => b.addEventListener("click", () => gira(1)));
  $("btn-lector").addEventListener("click", () => posaMode(E.mode === "pagines" ? "llarg" : "pagines"));

  document.addEventListener("keydown", (e) => {
    if (!actiu() || document.querySelector(".cc-fons")) return;
    if (e.target.closest && e.target.closest("input, select, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); gira(1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); gira(-1); }
    else if (e.key === "Home") { e.preventDefault(); vesA(0); }
    else if (e.key === "End") { e.preventDefault(); vesA(E.nVistes - 1); }
  });

  // arrossegar horitzontalment (ratolí o dit) per passar pàgina
  let arrossega = null;
  const obert = $("llibre-obert");
  obert.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || esRepte() || e.target.closest("button, a, input, summary")) return;
    arrossega = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  window.addEventListener("pointerup", (e) => {
    if (!arrossega) return;
    const a = arrossega;
    arrossega = null;
    const dx = e.clientX - a.x, dy = e.clientY - a.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && performance.now() - a.t < 900) gira(dx < 0 ? 1 : -1);
  });
  // roda del ratolí
  let roda = false;
  obert.addEventListener("wheel", (e) => {
    if (esRepte() || (Math.abs(e.deltaY) < 15 && Math.abs(e.deltaX) < 15)) return;
    e.preventDefault();
    if (roda) return;
    roda = true;
    setTimeout(() => { roda = false; }, 700);
    gira((e.deltaY || e.deltaX) > 0 ? 1 : -1);
  }, { passive: false });

  let t = 0;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(refresca, 160); });
  if (document.fonts) {
    document.fonts.addEventListener("loadingdone", () => { clearTimeout(t); t = setTimeout(refresca, 60); });
    document.fonts.ready.then(() => refresca());
  }
  // quan es passa de la biblioteca al lector cal repaginar (abans no hi havia mides)
  new MutationObserver(() => { if (actiu()) refresca(); }).observe(body, { attributes: true, attributeFilter: ["data-mode"] });

  // gira una fulla dins del mini-repte: el clon és la pàgina dreta d'abans (davant) i, al revers, hi apareix la nova pàgina esquerra
  function girRepte(clonDre, rp, clonEsqAntic) {
    const esq = rp.querySelector(".rp-esq");
    if (!esq || !E.spread || reduit()) return Promise.resolve();
    const fulla = document.createElement("div");
    fulla.className = "fulla dre rp-fulla";
    const davant = document.createElement("div"); davant.className = "cara davant";
    const darrere = document.createElement("div"); darrere.className = "cara darrere";
    clonDre.classList.add("rp-clon"); davant.appendChild(clonDre);
    const clonEsq = esq.cloneNode(true); clonEsq.classList.add("rp-clon"); darrere.appendChild(clonEsq);
    fulla.append(davant, darrere);
    esq.style.visibility = "hidden";
    let sota = null;
    if (clonEsqAntic) { sota = clonEsqAntic; sota.classList.add("rp-sota"); rp.appendChild(sota); }
    rp.appendChild(fulla);
    soPagina(1, false);
    return anima(fulla, "rotateY(-180deg)", 750).then(() => { esq.style.visibility = ""; fulla.remove(); if (sota) sota.remove(); });
  }

  window.LECTOR = { refresca, actiu, mostraParagraf, primerParagrafVisible, vesAlPrincipi, gira, girRepte, spread: () => E.spread };
  posaMode(E.mode);
})();
