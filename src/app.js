// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Lector: nivells, paraules de colors, targeta de paraula i dictat amb la veu del navegador.
// La veu definitiva (mp3 pregenerats masculí/femení) es fa a la fase 2.
(function () {
  "use strict";

  const C = window.CAPITOL;
  const TIPUS = {
    vocabulari:    { nom: "Vocabulari",      cls: "t-voc" },
    frase_feta:    { nom: "Frase feta",      cls: "t-frase" },
    paraula_autor: { nom: "Paraula d'autor", cls: "t-autor" },
    verb:          { nom: "Verb",            cls: "t-verb" },
  };
  const RARESA = ["Comuna", "Rara", "Èpica", "Llegendària"];
  const MARCA = /\{([^|}]+)\|([^}]+)\}/g;
  const LLISTA = C.paragrafs.filter((p) => p.tipus !== "separador");

  const $ = (id) => document.getElementById(id);
  const estat = { nivell: "normal", mostraEN: false };

  // --- desament local (pot fallar en finestres privades) ---
  function llegir(clau, defecte) {
    try { return localStorage.getItem("llibre." + clau) ?? defecte; } catch (e) { return defecte; }
  }
  function desar(clau, valor) {
    try { localStorage.setItem("llibre." + clau, valor); } catch (e) { /* sense desament */ }
  }

  function escapa(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function html(text) {
    return escapa(text).replace(MARCA, (_, visible, id) => {
      const g = C.glossari[id];
      const cls = g ? (TIPUS[g.tipus] || TIPUS.vocabulari).cls : "t-voc";
      return `<button class="w ${cls}" type="button" data-id="${id}">${visible}</button>`;
    });
  }

  function textPla(text) {
    return text.replace(MARCA, "$1");
  }

  // Reparteix un paràgraf (amb marques {lema|id}) en frases amb el MATEIX criteri que tools/genera_veu_c01.js, però tornant el text cru
  // perquè les paraules marcades no es trenquin. Es busca el tall sobre el text net i es porta de tornada al text cru.
  const perVeu = (t) => t.replace(/[^\s]+/g, (tok) => { const l = tok.replace(/[^A-Za-zÀ-ÿ]/g, ""); return l.length >= 2 && l === l.toUpperCase() ? tok.toLowerCase() : tok; });
  function frasesCrues(cru) {
    const mapa = []; let net = "";
    for (let i = 0; i < cru.length;) {
      if (cru[i] === "{") {
        const j = cru.indexOf("}", i), lema = cru.slice(i + 1, j).split("|")[0];
        for (let k = 0; k < lema.length; k++) { mapa.push(i); net += lema[k]; }
        i = j + 1;
      } else { mapa.push(i); net += cru[i]; i++; }
    }
    const re = /(?<=[.!?…][»”"')]*)\s+(?=[A-ZÀ-ÚÇ«“"(¡¿])/g, netV = perVeu(net), sortida = [];
    let ini = 0, m;
    while ((m = re.exec(netV))) { sortida.push(cru.slice(ini, mapa[m.index])); ini = mapa[m.index + m[0].length]; }
    sortida.push(cru.slice(ini));
    return sortida.map((s) => s.trim()).filter(Boolean);
  }

  // --- pintat ---
  function pinta() {
    $("llibre-titol").textContent = "Alice's Adventures in Wonderland · Capítol 1";
    $("capitol-titol").textContent = C.titol.ca;
    $("peu").textContent = "Text original de Lewis Carroll (1865), domini públic. Traducció i adaptació en català: © 2026 Robert Potau Nuñez, tots els drets reservats (feta amb ajuda d'IA; esborrany en revisió). Veus sintètiques generades amb Azure AI Speech (Microsoft)." + (window.JOC ? " " + window.JOC.text : "");

    const cont = $("text");
    cont.innerHTML = "";
    for (const p of C.paragrafs) {
      if (p.tipus === "separador") {
        const sep = document.createElement("p");
        sep.className = "separador";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "✦  ✦  ✦";
        cont.appendChild(sep);
        continue;
      }
      const sec = document.createElement("section");
      sec.className = "par";
      sec.dataset.id = p.id;
      // si hi ha àudio, el paràgraf es reparteix en frases (les mateixes que el generador d'àudio) per poder ressaltar la que sona
      let cos = html(p.ca[estat.nivell]);
      const dadesAudio = window.AUDIO_C01 && window.AUDIO_C01[estat.nivell] && window.AUDIO_C01[estat.nivell].fem && window.AUDIO_C01[estat.nivell].fem[p.id];
      if (dadesAudio) {
        const fr = frasesCrues(p.ca[estat.nivell]);
        if (fr.length === dadesAudio.f.length) cos = fr.map((x, k) => `<span class="fr" data-f="${k}">${html(x)}</span>`).join(" ");
      }
      let h = `<p class="ca" lang="ca">${cos}</p>`;
      if (estat.mostraEN) h += `<p class="en" lang="en">${escapa(p.en)}</p>`;
      sec.innerHTML = h;
      cont.appendChild(sec);
    }

    document.querySelectorAll(".nivell").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.nivell === estat.nivell)));
    tancaCarta();
    marcaPosicio();
    if (window.LECTOR) window.LECTOR.refresca();
  }

  // --- targeta de paraula ---
  let paraulaActual = null, paraulaActualId = null;

  function obreCarta(boto) {
    const g = C.glossari[boto.dataset.id];
    if (!g) return;
    paraulaActual = g;
    paraulaActualId = boto.dataset.id;
    // les paraules consultades donen opció a una carta extra en acabar el repte
    (window.CONSULTADES = window.CONSULTADES || new Set()).add(boto.dataset.id);
    const carta = $("carta");
    carta.className = "carta r" + g.dificultat;
    $("carta-paraula").textContent = g.lema;
    $("carta-raresa").textContent = "◆".repeat(g.dificultat) + " " + RARESA[g.dificultat - 1];
    $("carta-tipus").textContent = (TIPUS[g.tipus] || TIPUS.vocabulari).nom;
    $("carta-categoria").textContent = g.categoria.replace("_", " ");
    $("carta-definicio").textContent = g.definicio;
    $("carta-sinonim").textContent = g.sinonim;
    $("carta-exemple").textContent = g.exemple;
    $("carta-en").textContent = g.en;
    carta.hidden = false;

    // posició: sota la paraula si hi cap, i dins de la finestra
    const r = boto.getBoundingClientRect();
    const w = carta.offsetWidth, h = carta.offsetHeight;
    const esq = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
    let dalt = r.bottom + 10;
    if (dalt + h > window.innerHeight - 12) dalt = Math.max(12, r.top - h - 10);
    carta.style.left = esq + "px";
    carta.style.top = dalt + "px";
  }

  function tancaCarta() {
    $("carta").hidden = true;
    paraulaActual = null;
  }

  // --- veu del navegador (provisional) ---
  const tts = "speechSynthesis" in window ? window.speechSynthesis : null;
  let veuCatalana = null;
  let avisVeuMostrat = false;

  function triaVeu() {
    if (!tts) return;
    veuCatalana = tts.getVoices().find((v) => v.lang.toLowerCase().startsWith("ca")) || null;
  }
  if (tts) {
    triaVeu();
    tts.addEventListener("voiceschanged", triaVeu);
  }

  let avisTimer = null;
  function avis(missatge) {
    const a = $("avis");
    a.textContent = missatge;
    a.hidden = false;
    clearTimeout(avisTimer);
    avisTimer = setTimeout(() => { a.hidden = true; }, 5000);
  }

  function creaVeu(text) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ca-ES";
    if (veuCatalana) u.voice = veuCatalana;
    else if (!avisVeuMostrat) {
      avisVeuMostrat = true;
      avis("Aquest ordinador no té veu catalana; sona amb la veu per defecte. L'àudio definitiu serà d'alta qualitat.");
    }
    u.rate = 0.95;
    u.volume = window.MUSICA ? window.MUSICA.volVeu : 1; // volum de la veu: independent del de la música
    return u;
  }

  // --- reproductor: llegeix des d'un paràgraf i continua fins al final ---
  // estat: "inicial" (res començat) | "sona" | "pausa" | "aturat" (aturat, amb el paràgraf marcat)
  const rep = { i: -1, token: 0, estat: "inicial", mode: "tts" }; // mode: "mp3" (àudio real) | "tts" (veu del navegador, de reserva)

  // --- àudio real: mp3 d'Azure (Joana = "fem", Enric = "masc") pregenerats; src/audio-c01.js diu quins paràgrafs en tenen ---
  const so = new Audio();
  so.preload = "auto";
  const AUDIO = window.AUDIO_C01 || {};
  const teAudio = (i) => !!(AUDIO[estat.nivell] && AUDIO[estat.nivell][estat.veuGen] && AUDIO[estat.nivell][estat.veuGen][LLISTA[i].id]);
  const volumVeu = () => (window.MUSICA ? window.MUSICA.volVeu : 1);
  // la música i els controls de volum fan servir això: el volum de la veu s'aplica a l'instant
  // àudio de les cartes (paraula + exemple): un reproductor a part, perquè no trepitgi el del capítol
  const soCarta = new Audio();
  window.VEU_AUDIO = { volum: (v) => { so.volume = v; soCarta.volume = v; }, sona: () => (!so.paused && !so.ended) || (!soCarta.paused && !soCarta.ended) };
  // retorna true si ha pogut reproduir l'mp3 de la carta (si no, qui crida fa servir la veu del navegador)
  window.VEU_CARTA = {
    parla(id) {
      const A = window.AUDIO_CARTES;
      if (!id || !A || !A[estat.veuGen] || !A[estat.veuGen].includes(id)) return false;
      soCarta.pause();
      atura();
      soCarta.src = "../audio/alice/" + (C.capitol || "c01") + "/cartes/" + estat.veuGen + "/" + id + ".mp3";
      soCarta.volume = volumVeu();
      const p = soCarta.play();
      if (p && p.catch) p.catch(() => {});
      return true;
    },
    atura() { soCarta.pause(); },
  };

  // --- ressaltat de la frase que sona (a totes les còpies del paràgraf: text d'origen i pàgines del lector) ---
  let frAra = -1, rafFrase = 0;
  function marcaFrase(k) {
    if (k === frAra) return;
    frAra = k;
    document.querySelectorAll(".fr.ara").forEach((e) => e.classList.remove("ara"));
    if (k < 0 || rep.i < 0) return;
    document.querySelectorAll(`.par[data-id="${LLISTA[rep.i].id}"] .fr[data-f="${k}"]`).forEach((e) => e.classList.add("ara"));
  }
  // calcula la frase segons el temps de l'àudio i la marca
  function actualitzaFrase() {
    if (rep.estat !== "sona" || rep.mode !== "mp3" || rep.i < 0) return false; // en pausa es queda marcada; en aturar-se es neteja
    const d = AUDIO[estat.nivell] && AUDIO[estat.nivell][estat.veuGen] && AUDIO[estat.nivell][estat.veuGen][LLISTA[rep.i].id];
    if (d) {
      const t = so.currentTime;
      let k = d.f.findIndex(([a, b]) => t >= a && t < b);
      if (k < 0 && t >= d.f[d.f.length - 1][1]) k = d.f.length - 1;
      marcaFrase(k);
    }
    return true;
  }
  // bucle fi (animació) per canvis ràpids; l'esdeveniment timeupdate de sota el cobreix quan el navegador pausa les animacions (pestanya amagada)
  function bucleFrase() {
    cancelAnimationFrame(rafFrase);
    if (actualitzaFrase()) rafFrase = requestAnimationFrame(bucleFrase);
  }
  so.addEventListener("timeupdate", actualitzaFrase);
  so.addEventListener("seeked", actualitzaFrase);
  const aturaFrase = () => { cancelAnimationFrame(rafFrase); marcaFrase(-1); };

  function actualitzaReproductor() {
    const e = rep.estat;
    $("rep-play").disabled = e === "sona";
    $("rep-pausa").disabled = e !== "sona";
    $("rep-stop").disabled = e !== "sona" && e !== "pausa";
    $("rep-play").setAttribute("aria-label", e === "pausa" ? "Continua" : e === "aturat" ? "Torna a llegir el paràgraf" : "Escolta");
    $("rep-play").title = e === "pausa" ? "Continua" : e === "aturat" ? "Torna a llegir aquest paràgraf" : "Escolta";
    const pos = " · paràgraf " + (rep.i + 1) + " de " + LLISTA.length;
    $("rep-text").textContent =
      e === "sona" ? "Sona" + pos
        : e === "pausa" ? "En pausa" + pos
          : e === "aturat" ? "Aturat" + pos
            : "Escolta el capítol";
    $("reproductor").dataset.estat = e;
  }

  // marca el paràgraf actual: «sona» mentre es llegeix o està en pausa, «marcat» quan s'ha aturat
  function marcaPosicio() {
    document.querySelectorAll(".par.sona, .par.marcat").forEach((x) => x.classList.remove("sona", "marcat"));
    if (rep.estat === "inicial" || rep.i < 0) return;
    // pot haver-hi diverses còpies del paràgraf (text d'origen i pàgines del lector paginat)
    document.querySelectorAll(`.par[data-id="${LLISTA[rep.i].id}"]`)
      .forEach((e) => e.classList.add(rep.estat === "aturat" ? "marcat" : "sona"));
  }

  function mostraParagraf(id) {
    if (window.LECTOR && window.LECTOR.actiu()) { window.LECTOR.mostraParagraf(id); return; }
    const e = document.querySelector(`.par[data-id="${id}"]`);
    if (!e) return;
    const r = e.getBoundingClientRect();
    const dalt = document.querySelector(".barra").offsetHeight;
    if (r.top < dalt + 8 || r.bottom > window.innerHeight - 90) {
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      e.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "center" });
    }
  }

  // veu del navegador: en deixar anar el control de volum de la veu, el paràgraf que sona es torna a començar amb el volum nou
  // (amb l'àudio real el volum s'aplica a l'instant, via VEU_AUDIO.volum)
  document.addEventListener("volum-veu", () => { if (rep.estat === "sona" && rep.mode === "tts") llegeix(rep.i); });

  // llegeix amb l'àudio real si el paràgraf en té; si no, amb la veu del navegador
  function llegeix(i) {
    if (teAudio(i)) llegeixAudio(i); else llegeixNavegador(i);
  }

  // desDe: segon on començar (per saltar a una frase concreta)
  function llegeixAudio(i, desDe) {
    if (tts) tts.cancel();
    so.pause();
    aturaFrase();
    const token = ++rep.token;
    rep.i = i;
    rep.estat = "sona";
    rep.mode = "mp3";
    const p = LLISTA[i];
    marcaPosicio();
    mostraParagraf(p.id);
    actualitzaReproductor();
    so.onended = () => {
      if (token !== rep.token) return; // l'han aturat o s'ha començat un altre
      if (i + 1 < LLISTA.length) llegeix(i + 1); else acabat();
    };
    so.onerror = () => { if (token === rep.token) llegeixNavegador(i); }; // si falta el fitxer, es llegeix amb la veu del navegador
    so.src = "../audio/alice/" + (C.capitol || "c01") + "/" + estat.nivell + "/" + estat.veuGen + "/" + p.id + ".mp3";
    so.volume = volumVeu();
    if (desDe > 0) so.addEventListener("loadedmetadata", () => { if (token === rep.token) so.currentTime = desDe; }, { once: true });
    const prometensa = so.play();
    if (prometensa && prometensa.catch) prometensa.catch(() => { if (token === rep.token) atura(); });
    bucleFrase();
  }

  function llegeixNavegador(i) {
    if (!tts) { avis("Aquest navegador no té veu i aquest paràgraf encara no té àudio."); atura(); return; }
    so.pause();
    aturaFrase();
    tts.cancel();
    const token = ++rep.token;
    rep.i = i;
    rep.estat = "sona";
    rep.mode = "tts";
    const p = LLISTA[i];
    marcaPosicio();
    mostraParagraf(p.id);
    actualitzaReproductor();
    const final = () => {
      if (token !== rep.token) return; // l'han aturat o s'ha començat un altre
      if (i + 1 < LLISTA.length) llegeix(i + 1); else acabat();
    };
    const u = creaVeu(textPla(p.ca[estat.nivell]));
    u.onend = final;
    u.onerror = final;
    tts.speak(u);
  }

  // Stop: el paràgraf queda marcat i el ▶ el torna a llegir des del principi
  function atura() {
    rep.token++;
    aturaFrase();
    so.pause();
    if (tts) tts.cancel();
    rep.estat = rep.i >= 0 ? "aturat" : "inicial";
    marcaPosicio();
    actualitzaReproductor();
  }

  // s'ha arribat al final del capítol: es torna a l'estat inicial
  function acabat() {
    rep.token++;
    aturaFrase();
    rep.estat = "inicial";
    rep.i = -1;
    marcaPosicio();
    actualitzaReproductor();
  }

  function primerVisible() {
    if (window.LECTOR && window.LECTOR.actiu()) {
      const id = window.LECTOR.primerParagrafVisible();
      const k = LLISTA.findIndex((p) => p.id === id);
      return k >= 0 ? k : 0;
    }
    const dalt = document.querySelector(".barra").offsetHeight + 8;
    for (let k = 0; k < LLISTA.length; k++) {
      const e = document.querySelector(`.par[data-id="${LLISTA[k].id}"]`);
      if (e && e.getBoundingClientRect().bottom > dalt) return k;
    }
    return 0;
  }

  function sinoVeu() {
    if (tts || Object.keys(AUDIO).length) return false;
    avis("Aquest navegador no té veu. L'àudio definitiu arribarà a la fase 2.");
    return true;
  }

  // ⏸ Pausa
  function pausa() {
    if (sinoVeu() || rep.estat !== "sona") return;
    if (rep.mode === "mp3") so.pause(); else tts.pause();
    rep.estat = "pausa";
    marcaPosicio();
    actualitzaReproductor();
  }

  // ▶ Play: continua si està en pausa; si s'havia aturat, torna a llegir el paràgraf marcat; si no, comença
  function reprodueix() {
    if (sinoVeu()) return;
    if (rep.estat === "pausa" && rep.mode === "mp3") {
      rep.estat = "sona";
      marcaPosicio();
      actualitzaReproductor();
      const p = so.play();
      if (p && p.catch) p.catch(() => llegeix(rep.i));
      bucleFrase();
    } else if (rep.estat === "pausa") {
      tts.resume();
      rep.estat = "sona";
      marcaPosicio();
      actualitzaReproductor();
      // alguns navegadors perden la veu en reprendre: si és així, repeteix el paràgraf
      const token = rep.token;
      setTimeout(() => {
        if (token === rep.token && rep.estat === "sona" && !tts.speaking) llegeix(rep.i);
      }, 400);
    } else if (rep.estat === "aturat") {
      llegeix(rep.i);
    } else if (rep.estat === "inicial") {
      llegeix(primerVisible());
    }
  }

  // barra d'espai i clic sobre el paràgraf que sona: pausa / continua
  function alterna() {
    if (rep.estat === "sona") pausa(); else reprodueix();
  }

  // --- esdeveniments ---
  document.addEventListener("click", (e) => {
    const boto = e.target.closest(".w");
    if (boto) {
      e.stopPropagation();
      const lema = (C.glossari[boto.dataset.id] || {}).lema;
      if (paraulaActual && !$("carta").hidden && $("carta-paraula").textContent === lema) tancaCarta();
      else obreCarta(boto);
      return;
    }
    if (e.target.closest("#carta")) return;
    tancaCarta();
    const ca = e.target.closest(".par .ca");
    if (ca) {
      const id = ca.parentElement.dataset.id;
      const k = LLISTA.findIndex((p) => p.id === id);
      // clic a una frase amb àudio: hi salta (si és la que sona, fa pausa / continua)
      const fr = e.target.closest(".fr");
      if (fr && teAudio(k)) {
        const fk = +fr.dataset.f, temps = AUDIO[estat.nivell][estat.veuGen][id].f[fk];
        if (rep.i === k && rep.mode === "mp3" && (rep.estat === "sona" || rep.estat === "pausa")) {
          if (frAra === fk) alterna();
          else { so.currentTime = temps[0]; marcaFrase(fk); if (rep.estat === "pausa") reprodueix(); }
        } else llegeixAudio(k, temps[0]);
        return;
      }
      if ((rep.estat === "sona" || rep.estat === "pausa") && rep.i === k) alterna();
      else llegeix(k);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") tancaCarta();
    // barra d'espai = pausa/continua, si no s'està en un botó ni en una casella
    if (e.code === "Space" && document.body.dataset.mode !== "biblioteca" && !document.querySelector(".cc-fons") && !(e.target.closest && e.target.closest("button, input, select, textarea, a, summary, [role=\"button\"]"))) {
      e.preventDefault();
      alterna();
    }
  });

  $("rep-play").addEventListener("click", reprodueix);
  $("rep-pausa").addEventListener("click", pausa);
  $("rep-stop").addEventListener("click", atura);

  document.querySelectorAll(".nivell").forEach((b) =>
    b.addEventListener("click", () => {
      atura();
      estat.nivell = b.dataset.nivell;
      desar("nivell", estat.nivell);
      pinta();
    }));

  $("mostra-en").addEventListener("change", (e) => {
    estat.mostraEN = e.target.checked;
    desar("en", estat.mostraEN ? "1" : "0");
    pinta();
  });

  $("lletra-facil").addEventListener("change", (e) => {
    document.body.classList.toggle("lletra-facil", e.target.checked);
    desar("lletra-facil", e.target.checked ? "1" : "0");
    if (window.LECTOR) window.LECTOR.refresca();
  });

  document.querySelector(".carta-tanca").addEventListener("click", tancaCarta);

  $("carta-escolta").addEventListener("click", () => {
    if (!paraulaActual) return;
    if (window.VEU_CARTA.parla(paraulaActualId)) return; // àudio real
    if (!tts) return;
    atura();
    tts.speak(creaVeu(paraulaActual.lema + ". " + paraulaActual.exemple));
  });

  // narrador: Joana (fem) o Enric (masc); botons dins del panell de volums
  function pintaNarrador() {
    document.querySelectorAll("[data-veu-gen]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.veuGen === estat.veuGen)));
  }
  document.querySelectorAll("[data-veu-gen]").forEach((b) => b.addEventListener("click", () => {
    if (estat.veuGen === b.dataset.veuGen) return;
    estat.veuGen = b.dataset.veuGen;
    desar("veuGen", estat.veuGen);
    pintaNarrador();
    if (rep.estat === "sona" && teAudio(rep.i)) llegeix(rep.i); // si sona, continua amb la veu nova des del principi del paràgraf
  }));

  // --- inici ---
  estat.veuGen = llegir("veuGen", "fem") === "masc" ? "masc" : "fem";
  pintaNarrador();
  const nivellDesat = llegir("nivell", "normal");
  if (C.paragrafs[0].ca[nivellDesat]) estat.nivell = nivellDesat;
  estat.mostraEN = llegir("en", "0") === "1";
  $("mostra-en").checked = estat.mostraEN;
  const lletraFacil = llegir("lletra-facil", "0") === "1";
  $("lletra-facil").checked = lletraFacil;
  document.body.classList.toggle("lletra-facil", lletraFacil);
  pinta();
  actualitzaReproductor();
})();
