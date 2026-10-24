// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Música generativa del joc: 7 peces tranquil·les compostes per codi (cap fitxer d'àudio de tercers).
//   · 1 per a la biblioteca («Llum de vela entre prestatges»)
//   · 5 per a la lectura (van rotant, mai la mateixa dues vegades seguides)
//   · 1 per a l'àlbum i els sobres de cartes («Tresor de paraules»)
// Cada peça té una tonalitat, una progressió d'acords i uns instruments; en cada compàs el codi genera
// l'arpegi, la melodia i els espurnejos amb una mica d'atzar (sempre amb notes que sonen bé amb l'acord),
// de manera que la peça no sona mai idèntica. Una peça té 8 cicles de 4 compassos (~2 min) i els instruments
// hi entren i en surten perquè tingui forma. Mentre sona la veu del dictat, la música baixa de volum.
(function () {
  "use strict";

  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- teoria ----------
  const ACORDS = {
    M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], six: [0, 4, 7, 9],
    add9: [0, 4, 7, 14], sus2: [0, 2, 7], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14], dom7: [0, 4, 7, 10],
  };
  const PENTA = { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] };

  // arrel = classe de to de la tonalitat (0 = do); prog = 4 acords [desplaçament, tipus] respecte de l'arrel
  const PECES = {
    biblioteca: {
      titol: "Llum de vela entre prestatges", arrel: 2, mode: "major", bpm: 56,
      prog: [[0, "M7"], [9, "m7"], [5, "M7"], [7, "sus2"]],
      arpegi: { tipus: "caixa", patro: "a", oct: 12, prob: 0.86 },
      melodia: { tipus: "caixa", prob: 0.6, lo: 74, hi: 86 },
      espurneig: { tipus: "campana", prob: 0.2 },
      pad: 1.0, baix: 0.9, reverb: 0.55,
    },
    lectura1: {
      titol: "Riba i sol de tarda", arrel: 0, mode: "major", bpm: 60,
      prog: [[0, "M7"], [9, "m7"], [5, "M7"], [7, "six"]],
      arpegi: { tipus: "piano", patro: "b", oct: 12, prob: 0.9 },
      melodia: { tipus: "piano", prob: 0.55, lo: 72, hi: 84 },
      espurneig: { tipus: "campana", prob: 0.05 },
      pad: 0.9, baix: 1.0, reverb: 0.4,
    },
    lectura2: {
      titol: "Pluja suau al vidre", arrel: 9, mode: "minor", bpm: 52,
      prog: [[0, "m9"], [8, "M7"], [3, "M7"], [10, "add9"]],
      arpegi: { tipus: "piano", patro: "c", oct: 12, prob: 0.85 },
      melodia: { tipus: "caixa", prob: 0.5, lo: 72, hi: 86 },
      espurneig: { tipus: "campana", prob: 0.1 },
      pad: 1.0, baix: 0.9, reverb: 0.6,
    },
    lectura3: {
      titol: "Bosc de matinada", arrel: 5, mode: "major", bpm: 64,
      prog: [[0, "M7"], [9, "m7"], [5, "M7"], [7, "add9"]],
      arpegi: { tipus: "caixa", patro: "b", oct: 12, prob: 0.9 },
      melodia: { tipus: "celesta", prob: 0.5, lo: 74, hi: 88 },
      espurneig: { tipus: "campana", prob: 0.12 },
      pad: 0.8, baix: 0.8, reverb: 0.5,
    },
    lectura4: {
      titol: "Conte per adormir-se", arrel: 7, mode: "major", bpm: 50,
      prog: [[0, "M7"], [9, "m7"], [5, "M7"], [7, "six"]],
      arpegi: { tipus: "caixa", patro: "c", oct: 12, prob: 0.8 },
      melodia: { tipus: "caixa", prob: 0.6, lo: 71, hi: 83 },
      espurneig: { tipus: "campana", prob: 0.06 },
      pad: 1.1, baix: 1.0, reverb: 0.55,
    },
    lectura5: {
      titol: "Núvols lents", arrel: 4, mode: "minor", bpm: 56,
      prog: [[0, "m9"], [8, "maj9"], [3, "M7"], [10, "sus2"]],
      arpegi: { tipus: "celesta", patro: "a", oct: 12, prob: 0.75 },
      melodia: { tipus: "piano", prob: 0.45, lo: 71, hi: 84 },
      espurneig: { tipus: "campana", prob: 0.1 },
      pad: 1.1, baix: 0.9, reverb: 0.65,
    },
    cartes: {
      titol: "Tresor de paraules", arrel: 8, mode: "major", bpm: 72,
      prog: [[0, "M7"], [9, "m7"], [5, "M7"], [7, "six"]],
      arpegi: { tipus: "celesta", patro: "a", oct: 12, prob: 0.92 },
      melodia: { tipus: "celesta", prob: 0.65, lo: 76, hi: 90 },
      espurneig: { tipus: "campana", prob: 0.3 },
      pad: 0.7, baix: 0.7, reverb: 0.5,
    },
  };
  const LECTURA = ["lectura1", "lectura2", "lectura3", "lectura4", "lectura5"];
  const CICLES = 8; // cicles de 4 compassos per peça
  // quins instruments hi ha a cada cicle (la peça respira: entra, es fa plena, i s'apaga)
  const FORMA = [
    { pad: 1, baix: 1, esp: 1 },
    { pad: 1, baix: 1, arp: 1, esp: 1 },
    { pad: 1, baix: 1, arp: 1, mel: 1 },
    { pad: 1, baix: 1, arp: 1, mel: 1, esp: 1 },
    { pad: 1, baix: 1, arp: 1, mel: 1 },
    { pad: 1, baix: 1, arp: 1, mel: 1, esp: 1 },
    { pad: 1, arp: 1 },
    { pad: 1, esp: 1 },
  ];
  const PATRONS = { a: [0, 1, 2, 3, 2, 1, 2, 1], b: [0, -1, 2, -1, 1, -1, 3, -1], c: [0, 2, 3, 2, 1, 3, 2, 1] }; // -1 = silenci

  // ---------- instruments (sintetitzats) ----------
  // parcials: [múltiple de la freqüència, amplitud, durada de caiguda en s]
  const PERFILS = {
    caixa: { p: [[1, 1, 1.5], [2, 0.28, 0.8], [4.02, 0.1, 0.35], [6, 0.04, 0.2]], atac: 0.004, vol: 0.2, lp: 0, send: 0.7 },
    piano: { p: [[1, 1, 2.0], [2.003, 0.42, 1.3], [3.01, 0.2, 0.8], [4.02, 0.09, 0.5], [5.04, 0.04, 0.3]], atac: 0.007, vol: 0.19, lp: 3000, send: 0.5 },
    celesta: { p: [[1, 1, 1.2], [3, 0.22, 0.6], [5, 0.08, 0.3], [2.76, 0.1, 0.4]], atac: 0.003, vol: 0.17, lp: 0, send: 0.8 },
    campana: { p: [[1, 1, 2.6], [2.76, 0.3, 1.4], [5.4, 0.1, 0.6]], atac: 0.004, vol: 0.09, lp: 0, send: 1.0 },
    baix: { p: [[1, 1, 3.0], [2, 0.16, 1.2]], atac: 0.04, vol: 0.34, lp: 0, send: 0.25 },
  };

  function creaIR(ctx, segons) {
    const sr = ctx.sampleRate, n = Math.floor(sr * segons), b = ctx.createBuffer(2, n, sr), rnd = mulberry(99);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let y = 0;
      for (let i = 0; i < n; i++) { y = y * 0.62 + (rnd() * 2 - 1) * 0.38; d[i] = y * Math.pow(1 - i / n, 2.8); }
    }
    return b;
  }

  // una "sortida" per peça: sec -> bus ; send -> reverb compartit -> bus
  function creaSortida(ctx, desti, reverbMix) {
    const bus = ctx.createGain(); bus.gain.value = 0;
    const sec = ctx.createGain(); sec.gain.value = 1;
    const conv = ctx.createConvolver(); conv.buffer = creaIR(ctx, 3.6);
    const wet = ctx.createGain(); wet.gain.value = reverbMix;
    const send = ctx.createGain(); send.gain.value = 1;
    sec.connect(bus); send.connect(conv); conv.connect(wet); wet.connect(bus); bus.connect(desti);
    return { bus, sec, send };
  }

  function notaPlana(ctx, out, tipus, t, midi, vel, hum) {
    const P = PERFILS[tipus], f = mtof(midi), t0 = t + (hum || 0);
    const g = ctx.createGain(), env = Math.max(0.05, vel);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(P.vol * env, t0 + P.atac);
    let fin = t0;
    P.p.forEach(([m, a, d]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * m;
      og.gain.setValueAtTime(a, t0);
      og.gain.setTargetAtTime(0.0001, t0 + P.atac, d / 3);
      o.connect(og).connect(g);
      o.start(t0); o.stop(t0 + P.atac + d * 3.2); fin = Math.max(fin, t0 + P.atac + d * 3.2);
    });
    let sortida = g;
    if (P.lp) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(P.lp, f * 6); g.connect(lp); sortida = lp; }
    sortida.connect(out.sec);
    const s = ctx.createGain(); s.gain.value = P.send; sortida.connect(s).connect(out.send);
  }

  function notaPad(ctx, out, t, midi, durada, nivell) {
    const f = mtof(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 850; lp.Q.value = 0.4;
    const pic = 0.05 * nivell;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pic, t + 1.6);
    g.gain.setValueAtTime(pic, t + Math.max(1.7, durada - 1.0));
    g.gain.linearRampToValueAtTime(0.0001, t + durada + 1.8);
    [-5, 5].forEach((cents) => {
      const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f; o.detune.value = cents;
      o.connect(g); o.start(t); o.stop(t + durada + 2);
    });
    g.connect(lp); lp.connect(out.sec);
    const s = ctx.createGain(); s.gain.value = 0.6; lp.connect(s).connect(out.send);
  }

  // ---------- composició d'un compàs ----------
  // estat: guarda la melodia entre compassos (cada peça en té un de propi)
  function programaCompas(ctx, out, peca, bar, t, estat) {
    const rnd = mulberry(estat.llavor * 7919 + bar * 104729 + 17);
    const beat = 60 / peca.bpm, cicle = Math.min(CICLES - 1, Math.floor(bar / 4));
    const forma = FORMA[cicle], [desp, tipus] = peca.prog[bar % 4];
    const arrelPc = (peca.arrel + desp) % 12, arrel = 48 + arrelPc, iv = ACORDS[tipus];
    const pcs = iv.map((x) => (arrel + x) % 12);
    const penta = PENTA[peca.mode].map((x) => (peca.arrel + x) % 12);
    const hum = () => (rnd() - 0.5) * 0.024;

    if (forma.pad) iv.slice(0, 4).forEach((x, i) => notaPad(ctx, out, t + i * 0.05, arrel + x, 4 * beat, peca.pad));
    if (forma.baix) {
      notaPlana(ctx, out, "baix", t, arrel - 12, 0.9 * peca.baix, 0);
      if (rnd() < 0.4) notaPlana(ctx, out, "baix", t + 2 * beat, arrel - 12 + 7, 0.55 * peca.baix, hum());
    }
    if (forma.arp) {
      const patro = PATRONS[peca.arpegi.patro], tons = iv.slice(0, 4);
      patro.forEach((k, i) => {
        if (k < 0 || rnd() > peca.arpegi.prob) return;
        const m = arrel + peca.arpegi.oct + tons[k % tons.length];
        notaPlana(ctx, out, peca.arpegi.tipus, t + i * 0.5 * beat, m, 0.45 + rnd() * 0.3 + (i % 4 === 0 ? 0.12 : 0), hum());
      });
    }
    if (forma.mel) {
      const { lo, hi, tipus: tm, prob } = peca.melodia;
      // només notes de la pentatònica que no quedin a mig to de cap nota de l'acord (així mai grinyolen)
      const xoca = (pc) => pcs.some((c) => { const d = Math.abs(pc - c) % 12; return Math.min(d, 12 - d) === 1; });
      const set = []; for (let m = lo; m <= hi; m++) if (penta.includes(m % 12) && !xoca(m % 12)) set.push(m);
      const mig = estat.mid == null ? (lo + hi) / 2 : estat.mid;
      estat.idx = set.reduce((best, m, j) => (Math.abs(m - mig) < Math.abs(set[best] - mig) ? j : best), 0);
      [[0, 0.85], [1, 0.3], [2, 0.65], [3, 0.3]].forEach(([b, p], k) => {
        if (rnd() > p * prob * 1.4) return;
        let idx = estat.idx + [-2, -1, -1, 0, 1, 1, 2][Math.floor(rnd() * 7)];
        idx = Math.max(0, Math.min(set.length - 1, idx));
        if (k === 0) { // al primer temps, la nota més propera que sigui de l'acord
          for (let d = 0; d <= 2; d++) {
            const c = [idx - d, idx + d].find((j) => j >= 0 && j < set.length && pcs.includes(set[j] % 12));
            if (c != null) { idx = c; break; }
          }
        }
        estat.idx = idx; estat.mid = set[idx];
        notaPlana(ctx, out, tm, t + b * beat, set[idx], 0.5 + rnd() * 0.3, hum());
      });
    }
    if (forma.esp) {
      const { tipus: te, prob } = peca.espurneig;
      const alts = []; for (let m = 84; m <= 98; m++) if (penta.includes(m % 12) && !pcs.some((c) => { const d = Math.abs(m % 12 - c) % 12; return Math.min(d, 12 - d) === 1; })) alts.push(m);
      for (let i = 0; i < 8; i++) if (rnd() < prob) notaPlana(ctx, out, te, t + i * 0.5 * beat + rnd() * 0.3, alts[Math.floor(rnd() * alts.length)], 0.35 + rnd() * 0.35, 0);
    }
  }

  // ---------- reproductor ----------
  const pref = (k, d) => { try { const v = localStorage.getItem("llibre." + k); return v === null ? d : v; } catch (e) { return d; } };
  const desaPref = (k, v) => { try { localStorage.setItem("llibre." + k, v); } catch (e) { /* sense desament */ } };

  const llegeixVol = (k, d) => { const v = parseFloat(pref(k, String(d))); return isFinite(v) ? Math.max(0, Math.min(1, v)) : d; };
  const M = { actiu: pref("musica", "1") === "1", ctx: null, mestre: null, duck: null, zona: null, pista: null, ultimLectura: null,
    vol: llegeixVol("volMusica", 0.5), volVeu: llegeixVol("volVeu", 1) };
  window.MUSICA = M;

  function assegura() {
    if (M.ctx) { if (M.ctx.state === "suspended") M.ctx.resume(); return M.ctx; }
    const c = new (window.AudioContext || window.webkitAudioContext)();
    M.ctx = c;
    M.duck = c.createGain();
    M.mestre = c.createGain(); M.mestre.gain.value = M.vol;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    M.duck.connect(M.mestre); M.mestre.connect(comp); comp.connect(c.destination);
    return c;
  }

  function engega(nom, fadeS) {
    const c = assegura(), peca = PECES[nom], out = creaSortida(c, M.duck, peca.reverb);
    const st = { nom, peca, out, bar: 0, t: c.currentTime + 0.4, viu: true, estat: { llavor: (Math.random() * 1e6) | 0 }, timer: 0 };
    const total = CICLES * 4;
    out.bus.gain.setValueAtTime(0.0001, c.currentTime);
    out.bus.gain.linearRampToValueAtTime(1, c.currentTime + fadeS);
    const tick = () => {
      if (!st.viu) return;
      const beatSeg = 60 / peca.bpm;
      while (st.viu && st.t < c.currentTime + 1.6) {
        if (st.bar >= total) { // fi de la peça: a la lectura, passa a la següent; la resta tornen a començar
          st.viu = false; clearInterval(st.timer);
          if (M.pista === st && M.zona === "lectura") canviaPeca(triaLectura(), 5);
          else if (M.pista === st) canviaPeca(M.zona, 4);
          return;
        }
        programaCompas(c, out, peca, st.bar, st.t, st.estat);
        st.t += 4 * beatSeg; st.bar++;
      }
    };
    st.timer = setInterval(tick, 250); tick();
    return st;
  }

  function atura(st, fadeS) {
    if (!st) return;
    st.viu = false; clearInterval(st.timer);
    const c = M.ctx, g = st.out.bus.gain, ara = c.currentTime;
    g.cancelScheduledValues(ara); g.setValueAtTime(Math.max(0.0001, g.value), ara);
    g.linearRampToValueAtTime(0.0001, ara + fadeS);
    setTimeout(() => { try { st.out.bus.disconnect(); } catch (e) { /* ja desconnectat */ } }, (fadeS + 6) * 1000);
  }

  function triaLectura() {
    const opcions = LECTURA.filter((n) => n !== M.ultimLectura);
    return opcions[Math.floor(Math.random() * opcions.length)];
  }
  function canviaPeca(nom, fadeS) {
    if (nom === "lectura") nom = triaLectura();
    if (PECES[nom] == null) return;
    if (LECTURA.includes(nom)) M.ultimLectura = nom;
    const vella = M.pista;
    atura(vella, fadeS);
    M.pista = M.actiu ? engega(nom, fadeS) : null;
    if (M.pista) M.titol = PECES[nom].titol;
  }

  function zonaActual() {
    if (document.querySelector(".cc-fons")) return "cartes";
    return document.body.dataset.mode === "lectura" ? "lectura" : "biblioteca";
  }
  function actualitzaZona(forca) {
    const z = zonaActual(), abans = M.zona;
    if (!forca && z === abans) return;
    M.zona = z;
    if (!M.ctx || !M.actiu) return;
    // en tornar de l'àlbum a la lectura es continua amb la peça que sonava, no se'n tria una altra
    const lectura = abans === "cartes" && M.ultimLectura ? M.ultimLectura : "lectura";
    canviaPeca(z === "cartes" ? "cartes" : z === "lectura" ? lectura : "biblioteca", 3);
  }

  // la música baixa mentre parla el dictat
  setInterval(() => {
    if (!M.ctx || !M.duck) return;
    const parla = !!(window.speechSynthesis && window.speechSynthesis.speaking) || !!(window.VEU_AUDIO && window.VEU_AUDIO.sona());
    const objectiu = parla ? 0.3 : 1;
    M.duck.gain.setTargetAtTime(objectiu, M.ctx.currentTime, 0.4);
  }, 400);
  document.addEventListener("visibilitychange", () => {
    if (!M.ctx) return;
    if (document.hidden) M.ctx.suspend(); else if (M.actiu) M.ctx.resume();
  });

  // ---------- botons ----------
  function pintaBotons() {
    document.querySelectorAll("[data-musica]").forEach((b) => {
      b.classList.toggle("off", !M.actiu);
      b.setAttribute("aria-pressed", String(M.actiu));
      b.setAttribute("aria-label", M.actiu ? "Atura la música" : "Posa la música");
      b.title = M.actiu ? "Música: activada (clica per aturar-la)" : "Música: aturada (clica per posar-la)";
    });
  }
  // controls de volum (música i veu són independents; a la veu s'aplica el volum nou quan es deixa anar el control)
  M.posaVolMusica = (v) => {
    M.vol = Math.max(0, Math.min(1, v)); desaPref("volMusica", String(M.vol));
    if (M.mestre) M.mestre.gain.setTargetAtTime(M.vol, M.ctx.currentTime, 0.05);
  };
  M.posaVolVeu = (v) => { M.volVeu = Math.max(0, Math.min(1, v)); desaPref("volVeu", String(M.volVeu)); if (window.VEU_AUDIO) window.VEU_AUDIO.volum(M.volVeu); }; // l'àudio real canvia de volum a l'instant
  function iniciaVolums() {
    const sm = document.getElementById("vol-musica"), sv = document.getElementById("vol-veu"), btn = document.getElementById("rep-volums"), panell = document.getElementById("volums");
    if (!sm || !sv || !btn || !panell) return;
    const pinta = () => {
      sm.value = Math.round(M.vol * 100); sv.value = Math.round(M.volVeu * 100);
      document.getElementById("vol-musica-n").textContent = sm.value; document.getElementById("vol-veu-n").textContent = sv.value;
    };
    pinta();
    sm.addEventListener("input", () => { M.posaVolMusica(sm.value / 100); pinta(); });
    sv.addEventListener("input", () => { M.posaVolVeu(sv.value / 100); pinta(); });
    sv.addEventListener("change", () => document.dispatchEvent(new Event("volum-veu")));
    btn.addEventListener("click", () => { panell.hidden = !panell.hidden; btn.setAttribute("aria-expanded", String(!panell.hidden)); });
    document.addEventListener("pointerdown", (e) => { if (!panell.hidden && !e.target.closest("#volums, #rep-volums")) { panell.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panell.hidden) { panell.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
  }
  M.commuta = () => {
    M.actiu = !M.actiu; desaPref("musica", M.actiu ? "1" : "0");
    if (M.actiu) { assegura(); actualitzaZona(true); } else if (M.pista) { atura(M.pista, 1.2); M.pista = null; }
    pintaBotons();
  };
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("[data-musica]")) M.commuta(); });

  // La música s'engega sola en obrir el joc. Els navegadors no deixen sonar res fins que hi ha un primer gest
  // (clic, tecla o toc), així que la peça es prepara de seguida i comença a sonar en aquell primer gest.
  const desbloqueja = () => { if (M.actiu && M.ctx && M.ctx.state === "suspended") M.ctx.resume(); };
  ["pointerdown", "keydown", "touchstart", "click"].forEach((ev) => document.addEventListener(ev, desbloqueja, true));
  function engegaInicial() {
    if (!M.actiu) return;
    M.zona = zonaActual();
    assegura();
    canviaPeca(M.zona === "cartes" ? "cartes" : M.zona === "lectura" ? "lectura" : "biblioteca", 4);
  }

  let tZona = 0;
  const obs = new MutationObserver(() => { clearTimeout(tZona); tZona = setTimeout(() => actualitzaZona(false), 200); });
  const arrenca = () => {
    M.zona = zonaActual();
    iniciaVolums();
    engegaInicial();
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-mode"], childList: true });
    pintaBotons();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrenca); else arrenca();

  // ---------- eines (proves i mostres) ----------
  M.peces = PECES;
  // Renderitza `segons` d'una peça sense connectar-la als altaveus (per escoltar-la o desar-la): Promise<AudioBuffer>
  M.renderitza = (nom, segons, sr, cicleInicial) => {
    const peca = PECES[nom], oc = new OfflineAudioContext(2, Math.ceil(segons * sr), sr);
    const mest = oc.createGain(); mest.gain.value = M.vol;
    const comp = oc.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    mest.connect(comp); comp.connect(oc.destination);
    const out = creaSortida(oc, mest, peca.reverb); out.bus.gain.value = 1;
    const estat = { llavor: 4242 }, beatSeg = 60 / peca.bpm;
    let t = 0.2, bar = (cicleInicial || 0) * 4;
    while (t < segons) { programaCompas(oc, out, peca, bar, t, estat); t += 4 * beatSeg; bar++; }
    return oc.startRendering();
  };
})();
