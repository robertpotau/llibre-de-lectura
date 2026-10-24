// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Mini-repte del final del capítol: 5 preguntes de comprensió + aparellar vocabulari.
// Sense puntuacions: cada resposta diu «molt bé» o «torna-ho a provar» amb una pista.
(function () {
  "use strict";

  const C = window.CAPITOL;
  const R = C.reptes;
  const arrel = document.getElementById("repte");
  if (!R || !arrel) return;

  const MARCA = /\{([^|}]+)\|([^}]+)\}/g;
  const LLISTA = C.paragrafs.filter((p) => p.tipus !== "separador");
  const CLAU_FET = "llibre.repte." + C.capitol;

  const s = { vista: "inici", q: 0, resolta: false, seleccio: [], errors: 0, parells: null, pista: 0, ultim: "", girar: false };

  function nivell() {
    const b = document.querySelector('.nivell[aria-pressed="true"]');
    return b ? b.dataset.nivell : "normal";
  }
  function llegirFet() { try { return localStorage.getItem(CLAU_FET) === "1"; } catch (e) { return false; } }
  function desarFet() { try { localStorage.setItem(CLAU_FET, "1"); } catch (e) { /* sense desament */ } }

  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function baralla(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }
  function textParagraf(id) {
    const p = C.paragrafs.find((x) => x.id === id);
    return p && p.ca ? p.ca[nivell()].replace(MARCA, "$1") : "";
  }
  function numParagraf(id) { return LLISTA.findIndex((p) => p.id === id) + 1; }

  // --- pintat de cada vista ---
  function pinta() {
    if (s.vista === "inici") return pintaInici();
    if (s.vista === "pregunta") return pintaPregunta();
    if (s.vista === "aparellar") return pintaAparellar();
    return pintaFinal();
  }

  // el repte es mostra com un llibre obert (esquerra: pregunta; dreta: respostes) quan el lector té dues pàgines
  const enLlibre = () => !!(window.LECTOR && window.LECTOR.actiu() && window.LECTOR.spread && window.LECTOR.spread() && arrel.closest("#repte-vista") && !arrel.closest("#repte-vista").hidden);
  const enfocaTitol = () => { const h = arrel.querySelector("[data-enfoca]"); if (h) h.focus({ preventScroll: true }); };
  const pujaAlRepte = () => { if (!(window.LECTOR && window.LECTOR.actiu())) arrel.scrollIntoView({ behavior: "smooth", block: "start" }); };

  function posa(esq, dre, enfoca) {
    const girar = s.girar && enLlibre();
    s.girar = false;
    const abans = girar ? arrel.querySelector(".rp-dre") : null;
    const clon = abans ? abans.cloneNode(true) : null;
    const abansEsq = girar ? arrel.querySelector(".rp-esq") : null;
    const clonEsq = abansEsq ? abansEsq.cloneNode(true) : null; // la pàgina esquerra d'abans es queda a sota mentre gira la fulla
    arrel.innerHTML = `<div class="rp"><section class="rp-pg rp-esq">${esq}</section><section class="rp-pg rp-dre">${dre}</section></div>`;
    if (clon && window.LECTOR.girRepte) {
      // la pàgina dreta d'abans gira cap a l'esquerra i, al revers, hi apareix la pregunta nova
      window.LECTOR.girRepte(clon, arrel.querySelector(".rp"), clonEsq).then(() => { if (enfoca) enfocaTitol(); });
    } else if (enfoca) enfocaTitol();
  }

  function pintaInici() {
    posa(
      `<h2 id="repte-titol" tabindex="-1" data-enfoca>Mini-repte</h2>
       <p>${R.preguntes.length} preguntes i un joc per aparellar paraules. No hi ha puntuació: només cal fer-ho bé, i si et despistes tens una pista.</p>
       ${llegirFet() ? '<p class="repte-fet">✓ Ja has superat aquest repte. Pots tornar-lo a fer quan vulguis.</p>' : ""}`,
      `<div class="rp-centre"><button class="repte-boto principal gran" type="button" id="r-comenca">Comença el repte</button></div>`);
    document.getElementById("r-comenca").addEventListener("click", () => {
      Object.assign(s, { vista: "pregunta", q: 0, resolta: false, seleccio: [], errors: 0, pista: 0, ultim: "", girar: true });
      pinta();
      pujaAlRepte();
    });
  }

  // ---- preguntes ----
  function puntets() {
    return `<ol class="repte-progres" aria-label="Progrés">` +
      R.preguntes.map((_, i) =>
        `<li class="${i < s.q ? "feta" : i === s.q ? "actual" : ""}" aria-current="${i === s.q ? "step" : "false"}"></li>`).join("") +
      `<li class="${s.vista === "aparellar" ? "actual" : ""}" title="Aparellar paraules"></li></ol>`;
  }

  function pintaPregunta() {
    const q = R.preguntes[s.q];
    let cos = "", instruccio = "";
    if (q.tipus === "opcions" || q.tipus === "qui_ho_diu") {
      s.ordre = s.ordre && s.ordre.q === s.q ? s.ordre : { q: s.q, v: baralla(q.opcions.map((t, i) => ({ t, i }))) };
      cos = `<div class="repte-opcions">` +
        s.ordre.v.map((o) => `<button type="button" class="opcio" data-i="${o.i}">${esc(o.t)}</button>`).join("") + `</div>`;
    } else if (q.tipus === "vertader_fals") {
      cos = `<div class="repte-opcions dues">
        <button type="button" class="opcio" data-v="1">Vertader</button>
        <button type="button" class="opcio" data-v="0">Fals</button></div>`;
    } else if (q.tipus === "ordenar") {
      if (!s.ordre || s.ordre.q !== s.q) {
        let v;
        do { v = baralla(q.elements.map((t, i) => ({ t, i }))); }
        while (q.elements.length > 1 && v.every((o, k) => o.i === k));
        s.ordre = { q: s.q, v };
      }
      instruccio = `<p class="repte-instruccio">Clica els fets en l'ordre en què passen.</p>`;
      cos = `<div class="repte-opcions">` +
        s.ordre.v.map((o) => {
          const pos = s.seleccio.indexOf(o.i);
          return `<button type="button" class="opcio ordre${pos >= 0 ? " triada" : ""}" data-i="${o.i}" ${pos >= 0 ? "disabled" : ""}>` +
            `<span class="num">${pos >= 0 ? pos + 1 : ""}</span>${esc(o.t)}</button>`;
        }).join("") + `</div>
        <button type="button" class="repte-boto petit" id="r-esborra" ${s.seleccio.length ? "" : "disabled"}>Torna a començar</button>`;
    }
    posa(
      `${puntets()}
       <h2 id="repte-titol" tabindex="-1" data-enfoca>Pregunta ${s.q + 1} de ${R.preguntes.length}</h2>
       <p class="repte-enunciat">${esc(q.enunciat)}</p>
       ${instruccio}
       <div class="repte-feedback" role="status" aria-live="polite"></div>
       <button type="button" class="repte-boto petit" id="r-pista">💡 Dona'm una pista</button>`,
      `${cos}
       <button type="button" class="repte-boto principal" id="r-seguent" hidden>${s.q + 1 < R.preguntes.length ? "Següent →" : "Ara, les paraules →"}</button>`, false);

    arrel.querySelectorAll(".opcio").forEach((b) => b.addEventListener("click", () => respon(b)));
    const esb = document.getElementById("r-esborra");
    if (esb) esb.addEventListener("click", () => { s.seleccio = []; pintaPregunta(); });
    document.getElementById("r-pista").addEventListener("click", () => mostraPista(q));
    if (s.ultim && !s.resolta) { const f = arrel.querySelector(".repte-feedback"); f.className = "repte-feedback ko"; f.innerHTML = s.ultim; }
    document.getElementById("r-seguent").addEventListener("click", () => {
      s.resolta = false;
      s.seleccio = [];
      s.pista = 0;
      s.ultim = "";
      s.girar = true; // en passar a la pregunta següent es gira la pàgina
      if (s.q + 1 < R.preguntes.length) { s.q++; s.ordre = null; pintaPregunta(); }
      else { s.vista = "aparellar"; s.parells = null; pinta(); }
      pujaAlRepte();
    });
  }

  // pistes progressives: cada error o cada clic a «Pista» en destapa una de més clara (q.pistes, o q.indici si n'hi ha una)
  function textPista(q, nivellPista) {
    const llista = q.pistes && q.pistes.length ? q.pistes : [q.indici || ""];
    return llista[Math.min(Math.max(nivellPista, 1), llista.length) - 1];
  }
  function llistaParagrafs(q) {
    if (!q.paragrafs || !q.paragrafs.length) return "";
    return `<details><summary>On ho trobo al capítol?</summary><ul class="repte-cites">` + q.paragrafs.map((id, i) =>
      `<li><strong>${esc(q.elements ? q.elements[i] : "")}</strong> · paràgraf ${numParagraf(id)}<p class="repte-cita">${esc(textParagraf(id))}</p></li>`).join("") + `</ul></details>`;
  }
  function mostraPista(q) {
    if (s.resolta) return;
    s.pista++;
    const f = arrel.querySelector(".repte-feedback");
    s.ultim = `<strong>💡 Pista:</strong> ${esc(textPista(q, s.pista))}` + (s.pista >= 2 ? llistaParagrafs(q) : "");
    f.className = "repte-feedback pista";
    f.innerHTML = s.ultim;
  }

  function feedback(ok, q, extra) {
    const f = arrel.querySelector(".repte-feedback");
    if (ok) {
      f.className = "repte-feedback ok";
      f.innerHTML = "<strong>Molt bé!</strong>";
      return;
    }
    s.errors++;
    s.pista++;
    let h = `<strong>Torna-ho a provar.</strong> ${extra ? esc(extra) + " " : ""}${esc(textPista(q, s.pista))}`;
    if (q.tipus === "ordenar" && s.pista >= 2) h += llistaParagrafs(q);
    if (q.paragraf) {
      h += `<details><summary>Repassa el paràgraf ${numParagraf(q.paragraf)}</summary>
        <p class="repte-cita">${esc(textParagraf(q.paragraf))}</p></details>`;
    }
    s.ultim = h;
    f.className = "repte-feedback ko";
    f.innerHTML = h;
  }

  function resolt(q) {
    s.resolta = true;
    arrel.querySelectorAll(".opcio").forEach((b) => { b.disabled = true; });
    const sg = document.getElementById("r-seguent");
    sg.hidden = false;
    sg.focus({ preventScroll: true });
    const esb = document.getElementById("r-esborra");
    if (esb) esb.hidden = true;
  }

  function respon(b) {
    if (s.resolta) return;
    const q = R.preguntes[s.q];
    if (q.tipus === "opcions" || q.tipus === "qui_ho_diu") {
      const ok = Number(b.dataset.i) === q.correcta;
      b.classList.add(ok ? "ok" : "ko");
      feedback(ok, q);
      if (ok) resolt(q); else b.disabled = true;
    } else if (q.tipus === "vertader_fals") {
      const ok = (b.dataset.v === "1") === q.correcta;
      b.classList.add(ok ? "ok" : "ko");
      feedback(ok, q);
      if (ok) resolt(q); else b.disabled = true;
    } else if (q.tipus === "ordenar") {
      s.seleccio.push(Number(b.dataset.i));
      b.classList.add("triada");
      b.disabled = true;
      b.querySelector(".num").textContent = s.seleccio.length;
      const esb = document.getElementById("r-esborra");
      if (esb) esb.disabled = false;
      if (s.seleccio.length === q.elements.length) {
        const ok = s.seleccio.every((v, k) => v === q.ordre_correcte[k]);
        let bons = 0;
        while (bons < s.seleccio.length && s.seleccio[bons] === q.ordre_correcte[bons]) bons++;
        const extra = bons > 0
          ? (bons === 1 ? "El primer fet és correcte" : "Els primers " + bons + " fets són correctes") + ": el deixo marcat."
          : "El primer fet no és correcte.";
        feedback(ok, q, ok ? "" : extra);
        s.bons = bons;
        if (ok) {
          arrel.querySelectorAll(".opcio").forEach((x) => x.classList.add("ok"));
          resolt(q);
        } else {
          arrel.querySelectorAll(".opcio").forEach((x) => x.classList.add("ko"));
          setTimeout(() => { if (s.vista === "pregunta" && !s.resolta) { s.seleccio = s.seleccio.slice(0, s.bons || 0); pintaPregunta(); } }, 2200);
        }
      }
    }
  }

  // ---- aparellar vocabulari ----
  function pintaAparellar() {
    const ids = (R.aparellar[nivell()] || []).filter((id) => C.glossari[id]);
    if (!s.parells || s.parells.nivell !== nivell()) {
      s.parells = {
        nivell: nivell(),
        ids,
        paraules: baralla(ids),
        significats: baralla(ids),
        fets: new Set(),
        errors: new Set(),
        triada: null,
      };
    }
    const p = s.parells;
    posa(
      `${puntets()}
       <h2 id="repte-titol" tabindex="-1" data-enfoca>Aparella les paraules</h2>
       <p class="repte-enunciat">Clica una paraula i després el significat que li correspon.</p>
       <div class="repte-parells"><div class="col">${p.paraules.map((id) => boto("w", id, esc(C.glossari[id].lema))).join("")}</div></div>`,
      `<div class="repte-parells"><div class="col">${p.significats.map((id) => boto("m", id, esc(C.glossari[id].definicio))).join("")}</div></div>
       <div class="repte-feedback" role="status" aria-live="polite"></div>
       <button type="button" class="repte-boto principal" id="r-acaba" ${p.fets.size === p.ids.length ? "" : "hidden"}>Acaba el repte →</button>`, false);

    function boto(tipus, id, text) {
      const fet = p.fets.has(id);
      const triada = p.triada && p.triada.tipus === tipus && p.triada.id === id;
      return `<button type="button" class="parell ${tipus}${fet ? " ok" : ""}${triada ? " triada" : ""}" data-t="${tipus}" data-id="${id}" ${fet ? "disabled" : ""}>${text}</button>`;
    }
    arrel.querySelectorAll(".parell").forEach((b) => b.addEventListener("click", () => clicParell(b)));
    document.getElementById("r-acaba").addEventListener("click", () => {
      s.vista = "final";
      desarFet();
      s.premis = window.CARTES
        ? window.CARTES.premis({
            nivell: p.nivell,
            aparellades: p.ids,
            sensePifia: p.ids.filter((id) => !p.errors.has(id)),
          })
        : null;
      s.girar = true;
      pinta();
      pujaAlRepte();
    });
  }

  function clicParell(b) {
    const p = s.parells;
    const tipus = b.dataset.t, id = b.dataset.id;
    const f = arrel.querySelector(".repte-feedback");
    if (!p.triada || p.triada.tipus === tipus) {
      // primera tria, o canvi de tria dins la mateixa columna
      p.triada = p.triada && p.triada.tipus === tipus && p.triada.id === id ? null : { tipus, id };
      pintaAparellar();
      return;
    }
    // tria a l'altra columna: comprovem la parella
    if (p.triada.id === id) {
      p.fets.add(id);
      p.triada = null;
      pintaAparellar();
      const ff = arrel.querySelector(".repte-feedback");
      ff.className = "repte-feedback ok";
      ff.innerHTML = p.fets.size === p.ids.length ? "<strong>Molt bé! Les has aparellat totes.</strong>" : "<strong>Molt bé!</strong>";
    } else {
      const anterior = arrel.querySelector(`.parell[data-t="${p.triada.tipus}"][data-id="${p.triada.id}"]`);
      b.classList.add("ko");
      p.errors.add(id);
      p.errors.add(p.triada.id);
      if (anterior) anterior.classList.add("ko");
      f.className = "repte-feedback ko";
      f.innerHTML = "<strong>Torna-ho a provar.</strong> Aquesta parella no encaixa.";
      s.errors++;
      p.triada = null;
      setTimeout(() => { if (s.vista === "aparellar") { const fb = arrel.querySelector(".repte-feedback").innerHTML; pintaAparellar(); const nf = arrel.querySelector(".repte-feedback"); nf.className = "repte-feedback ko"; nf.innerHTML = fb; } }, 700);
    }
  }

  // ---- final ----
  function resumCartes() {
    if (!window.CARTES || !s.premis) return "";
    const n = s.premis.noves.length, d = s.premis.dominades.length;
    let h = "";
    if (n) {
      const q = s.premis.noves.some((x) => x.motiu === "especial") ? " Inclosa una carta especial!" : "";
      h += `<p class="repte-cartes"><strong>Has guanyat ${n} ${n === 1 ? "carta nova" : "cartes noves"}.</strong>${q}</p>`;
    } else {
      h += `<p class="repte-cartes">Ja tenies les cartes d'aquestes paraules. Prova un altre nivell per aconseguir-ne de noves.</p>`;
    }
    if (d) h += `<p class="repte-cartes">★ ${d === 1 ? "Una carta ha quedat" : d + " cartes han quedat"} dominada${d === 1 ? "" : "es"}!</p>`;
    return h;
  }

  // botó gran i cridaner al mig: l'alumne ha de veure clarament que hi ha de fer clic per guanyar les cartes
  function ctaCartes(n) {
    const colors = ["#ffd24a", "#ff8ad8", "#7fe3ff", "#9dff8a", "#ffb35c"];
    const guspires = Array.from({ length: 14 }, (_, i) => {
      const ang = (i / 14) * 6.283 + (i % 2) * 0.25, r = 52 + (i % 3) * 7;
      return `<i style="--x:${(50 + Math.cos(ang) * r).toFixed(1)}%;--y:${(50 + Math.sin(ang) * r * 0.9).toFixed(1)}%;--c:${colors[i % colors.length]};--d:${(1.4 + (i % 5) * 0.35).toFixed(2)}s;--r:${(i * 0.23).toFixed(2)}s">${i % 3 ? "✦" : "✧"}</i>`;
    }).join("");
    return `<div class="repte-cta-bloc">
      <p class="repte-cta-text">${n === 1 ? "Tens <strong>1 carta nova</strong> esperant-te!" : `Tens <strong>${n} cartes noves</strong> esperant-te!`}</p>
      <div class="repte-cta-marc"><span class="repte-cta-guspires" aria-hidden="true">${guspires}</span>
      <button type="button" class="repte-cta" id="r-sobre">🎁 Descobreix les teves cartes</button></div>
      <p class="repte-cta-pista">Clica el botó per guanyar-les i afegir-les a l'àlbum</p>
    </div>`;
  }

  function pintaFinal() {
    const ids = s.parells ? s.parells.ids : [];
    posa(
      `<h2 id="repte-titol" tabindex="-1" data-enfoca>Vas bé! 🎉</h2>
       <p>Has completat el mini-repte d'aquest capítol.</p>
       ${ids.length ? `<p class="repte-instruccio">Paraules que has aparellat:</p>
         <ul class="repte-etiquetes">${ids.map((id) => `<li>${esc(C.glossari[id].lema)}</li>`).join("")}</ul>
         ` : ""}
       ${resumCartes()}`,
      `${s.premis && s.premis.noves.length ? ctaCartes(s.premis.noves.length) : ""}
       <div class="repte-accions">
         ${window.CARTES ? "<button type=\"button\" class=\"repte-boto\" id=\"r-album\">🃏 Obre l'àlbum</button>" : ""}
         <button type="button" class="repte-boto${s.premis && s.premis.noves.length ? "" : " principal"}" id="r-repeteix">Torna-ho a fer</button>
         <button type="button" class="repte-boto" id="r-dalt">Torna al principi del capítol</button>
       </div>`, true);
    const bs = document.getElementById("r-sobre");
    if (bs) bs.addEventListener("click", () => {
      // les cartes només es descobreixen una vegada: el botó desapareix i la llista es consumeix
      const noves = s.premis.noves;
      s.premis.noves = [];
      const bloc = bs.closest(".repte-cta-bloc");
      if (bloc) bloc.remove();
      window.CARTES.obreSobre(noves);
    });
    const ba = document.getElementById("r-album");
    if (ba) ba.addEventListener("click", () => window.CARTES.obreAlbum());
    document.getElementById("r-repeteix").addEventListener("click", () => { s.vista = "inici"; s.premis = null; s.girar = true; pinta(); });
    document.getElementById("r-dalt").addEventListener("click", () => {
      if (window.LECTOR && window.LECTOR.actiu()) window.LECTOR.vesAlPrincipi();
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // en canviar de nivell, el repte torna a l'inici (les paraules d'aparellar depenen del nivell)
  document.querySelectorAll(".nivell").forEach((b) =>
    b.addEventListener("click", () => { s.vista = "inici"; s.parells = null; s.ordre = null; s.premis = null; pinta(); }));

  pinta();
})();
