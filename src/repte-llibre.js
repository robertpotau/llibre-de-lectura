// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Repte final del llibre: 12 preguntes, una de cada capítol d'Alícia. Mateixes regles que el mini-repte
// (sense puntuació, pistes en dos nivells) i, en acabar, la pantalla «Has acabat el llibre!» amb la carta especial.
// S'obre des del final del repte del capítol 12 (repte.js) amb window.REPTE_LLIBRE.obre().
(function () {
  "use strict";
  if (!window.CAPITOLS || !window.CAPITOLS.c12) return;

  const CLAU_FET = "llibre.repte.llibre";
  const Q = [
    { cap: 1, e: "Què hi havia escrit a l'ampolleta que l'Alícia va trobar a la sala?", o: ["BEU-ME", "MENJA'M", "OBRE'M"],
      p: ["Recorda la tauleta de vidre i la clau d'or.", "És una ordre per beure."] },
    { cap: 2, e: "Per què es forma el bassal on neda l'Alícia?", o: ["Perquè l'Alícia plora quan és gegant", "Perquè plou a dins de la sala", "Perquè el Conill vessa una galleda"],
      p: ["Pensa en el títol del capítol 2.", "El bassal és fet de llàgrimes."] },
    { cap: 3, e: "Com s'acaba la cursa Caucus del Dodo?", o: ["Tothom guanya i tothom ha de tenir premi", "Guanya el Ratolí", "Ningú no arriba a la meta"],
      p: ["El títol diu que és una cursa sense guanyador…", "…o potser amb massa guanyadors: l'Alícia ha de repartir confits a tothom."] },
    { cap: 4, e: "Qui surt volant per la xemeneia de la casa del Conill?", o: ["En Bill, el llangardaix", "En Pat, el jardiner", "El cadell gegant"],
      p: ["L'Alícia li dona una puntada de peu des de dins.", "Surt volant com un coet, i després el reanimen dos cobais."] },
    { cap: 5, e: "Què fa servir l'Alícia per canviar de mida després de parlar amb l'Eruga?", o: ["Dos trossos del bolet", "Una ampolleta", "Uns pastissets"],
      p: ["L'Eruga li parla d'«un costat» i de «l'altre costat».", "És el lloc on seia l'Eruga, fumant."] },
    { cap: 6, e: "En què es converteix el nadó de la Duquessa?", o: ["En un porc", "En un gat", "En un llangardaix"],
      p: ["Mira com se li arromanga el nas.", "Quan l'Alícia el deixa a terra, se'n va trotant cap al bosc i grunyint."] },
    { cap: 7, e: "Per què al berenar de bojos sempre és l'hora del te?", o: ["Perquè el Temps s'ha enfadat amb el Barretaire", "Perquè el rellotge no té agulles", "Perquè la Llebre de Març ho ha manat"],
      p: ["El Barretaire va cantar al concert de la Reina.", "La Reina va dir que «matava el temps», i des d'aleshores sempre són les sis."] },
    { cap: 8, e: "Amb què es juga a croquet al jardí de la Reina?", o: ["Amb flamencs i eriçons", "Amb pals de fusta i pilotes", "Amb cartes i daus"],
      p: ["Tot el que hi ha al camp és viu.", "Els macs són ocells rosats, i les boles s'enrotllen i fugen."] },
    { cap: 9, e: "Com en deien, del mestre de la Falsa Tortuga?", o: ["El Closca", "El Grifó", "El Congre"],
      p: ["Era una tortuga vella.", "Els feia treballar el cap, que també es diu…"] },
    { cap: 10, e: "Quin ball ensenyen la Falsa Tortuga i el Grifó a l'Alícia?", o: ["La Contradansa dels Llamàntols", "Un vals de meduses", "Una dansa de cargols"],
      p: ["Es balla a la platja i després es llancen animals mar endins.", "La parella de cada ballarí és un crustaci amb pinces."] },
    { cap: 11, e: "Qui és el primer testimoni del judici?", o: ["El Barretaire", "La cuinera", "L'Alícia"],
      p: ["Entra amb una tassa de te i pa amb mantega.", "Ven barrets, i el Rei diu que n'ha robat un."] },
    { cap: 12, e: "Com s'acaba tota l'aventura?", o: ["L'Alícia es desperta a la riba, amb la seva germana", "L'Alícia es queda a viure amb la Reina", "L'Alícia es torna petita per sempre"],
      p: ["Les cartes volen cap a ella i…", "…tot havia estat un somni curiós."] },
  ];

  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const baralla = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const fet = () => { try { return localStorage.getItem(CLAU_FET) === "1"; } catch (e) { return false; } };
  const marcaFet = () => { try { localStorage.setItem(CLAU_FET, "1"); } catch (e) { /* sense desament */ } };

  let fons = null, s = null, abansFocus = null;

  function tanca() {
    if (!fons) return;
    fons.remove(); fons = null;
    document.removeEventListener("keydown", tecla, true);
    if (abansFocus && abansFocus.focus) abansFocus.focus();
  }
  function tecla(e) { if (e.key === "Escape" && fons) { e.preventDefault(); e.stopPropagation(); tanca(); } }

  function posa(html) {
    const caixa = fons.querySelector(".rl-caixa");
    caixa.innerHTML = `<button type="button" class="rl-tanca" aria-label="Tanca el repte final">✕</button>${html}`;
    caixa.querySelector(".rl-tanca").addEventListener("click", tanca);
    const h = caixa.querySelector("h2");
    if (h) { h.tabIndex = -1; h.focus(); }
  }

  function pintaInici() {
    posa(`<p class="rl-trofeu" aria-hidden="true">🏆</p>
      <h2 id="rl-titol">Repte final del llibre</h2>
      <p>Has arribat al final de les aventures de l'Alícia! Ara, 12 preguntes: una de cada capítol.</p>
      <p class="rl-petit">Sense puntuació: si t'equivoques, torna-ho a provar. Tens pistes.</p>
      ${fet() ? '<p class="rl-fet">✓ Ja l\'has superat. Pots tornar-lo a fer quan vulguis.</p>' : ""}
      <div class="rl-accions"><button type="button" class="repte-boto principal gran" id="rl-comenca">Comença</button></div>`);
    fons.querySelector("#rl-comenca").addEventListener("click", () => { s = { i: 0, pista: 0, ok: false, ordre: Q.map((q) => baralla(q.o.map((t, k) => ({ t, k })))) }; pintaPregunta(); });
  }

  function pintaPregunta() {
    const q = Q[s.i];
    const punts = Q.map((_, k) => `<span class="rl-punt${k < s.i ? " fet" : k === s.i ? " ara" : ""}"></span>`).join("");
    posa(`<div class="rl-punts" aria-hidden="true">${punts}</div>
      <h2 id="rl-titol">Pregunta ${s.i + 1} de ${Q.length} <span class="rl-cap">· Capítol ${q.cap}</span></h2>
      <p class="rl-enunciat">${esc(q.e)}</p>
      <div class="rl-opcions">${s.ordre[s.i].map((o) => `<button type="button" class="opcio rl-opcio" data-k="${o.k}">${esc(o.t)}</button>`).join("")}</div>
      <p class="rl-feedback" role="status"></p>
      <div class="rl-accions">
        <button type="button" class="repte-boto" id="rl-pista">💡 Dona'm una pista</button>
        <button type="button" class="repte-boto principal" id="rl-seguent" hidden>${s.i === Q.length - 1 ? "Acaba →" : "Següent →"}</button>
      </div>`);
    const fb = fons.querySelector(".rl-feedback");
    fons.querySelectorAll(".rl-opcio").forEach((b) => b.addEventListener("click", () => {
      if (s.ok) return;
      if (b.dataset.k === "0") {
        s.ok = true;
        b.classList.add("correcta");
        fb.className = "rl-feedback ok"; fb.textContent = "Molt bé!";
        fons.querySelector("#rl-pista").hidden = true;
        const seg = fons.querySelector("#rl-seguent"); seg.hidden = false; seg.focus();
      } else {
        b.classList.add("incorrecta"); b.disabled = true;
        fb.className = "rl-feedback ko"; fb.textContent = "Torna-ho a provar. " + q.p[Math.min(s.pista, 1)];
        s.pista = Math.min(s.pista + 1, 2);
      }
    }));
    fons.querySelector("#rl-pista").addEventListener("click", () => {
      fb.className = "rl-feedback pista"; fb.textContent = "💡 " + q.p[Math.min(s.pista, 1)];
      s.pista = Math.min(s.pista + 1, 2);
    });
    fons.querySelector("#rl-seguent").addEventListener("click", () => {
      s.i++; s.pista = 0; s.ok = false;
      if (s.i < Q.length) pintaPregunta(); else pintaFinal();
    });
  }

  function pintaFinal() {
    marcaFet();
    const noves = window.CARTES && window.CARTES.premiLlibre ? window.CARTES.premiLlibre() : [];
    const guspires = Array.from({ length: 18 }, (_, i) => `<i style="--a:${(i * 20)}deg;--d:${(1.2 + (i % 4) * 0.3).toFixed(1)}s">✦</i>`).join("");
    posa(`<div class="rl-guspires" aria-hidden="true">${guspires}</div>
      <p class="rl-trofeu" aria-hidden="true">📖✨</p>
      <h2 id="rl-titol">Has acabat el llibre!</h2>
      <p>Has llegit totes les aventures de l'Alícia al País de les Meravelles i has superat el repte final. Enhorabona!</p>
      <p class="rl-petit">«I com aplegaria al seu voltant altres criatures, i els faria brillar els ulls amb moltes històries estranyes…»</p>
      <div class="rl-accions">
        ${noves.length ? '<button type="button" class="repte-cta" id="rl-carta">🎁 Descobreix la carta del llibre</button>' : '<p class="rl-fet">✓ Ja tens la carta del llibre a l\'àlbum.</p>'}
        ${window.CARTES ? '<button type="button" class="repte-boto" id="rl-album">🃏 Obre l\'àlbum</button>' : ""}
        <button type="button" class="repte-boto" id="rl-tanca2">Tanca</button>
      </div>`);
    const bc = fons.querySelector("#rl-carta");
    if (bc) bc.addEventListener("click", () => { tanca(); window.CARTES.obreSobre(noves); });
    const ba = fons.querySelector("#rl-album");
    if (ba) ba.addEventListener("click", () => { tanca(); window.CARTES.obreAlbum(); });
    fons.querySelector("#rl-tanca2").addEventListener("click", tanca);
  }

  function obre() {
    if (fons) return;
    abansFocus = document.activeElement;
    fons = document.createElement("div");
    fons.className = "rl-fons";
    fons.innerHTML = `<div class="rl-caixa" role="dialog" aria-modal="true" aria-labelledby="rl-titol"></div>`;
    fons.addEventListener("click", (e) => { if (e.target === fons) tanca(); });
    document.body.appendChild(fons);
    document.addEventListener("keydown", tecla, true);
    pintaInici();
  }

  window.REPTE_LLIBRE = { obre, fet };
})();
