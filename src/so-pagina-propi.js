// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// So de passar pàgina generat per codi (propi, sense fitxers d'àudio ni drets de tercers).
// Estructura, d'una pàgina que es gira i aterra (~0,6 s):
//   1) fregadissa de paper: soroll brillant que va pujant
//   2) un petit cruixit quan la fulla es desenganxa
//   3) el cop principal de la pàgina en aterrar (cos mitjà) amb dos o tres rebots que s'esvaeixen
//   4) una cua molt suau
// Cada variant canvia tots els temps, nivells i freqüències una mica, perquè no soni mai igual.
// Ús: GENERA_SO_PAGINA(sampleRate, nVariants) -> Promise<AudioBuffer[]>
(function () {
  "use strict";

  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function renderVariant(sr, seed, durada) {
    const rnd = mulberry(seed);
    const jit = (x, p) => x * (1 + (rnd() * 2 - 1) * p); // x ± p (relatiu)
    const c = new OfflineAudioContext(1, Math.ceil(sr * durada), sr);
    const sortida = c.createGain();
    const suavitza = c.createBiquadFilter(); suavitza.type = "lowpass"; suavitza.frequency.value = 4800; // sense brillantor de plàstic: el paper gruixut és més mat
    sortida.connect(suavitza).connect(c.destination);

    // una "veu": soroll blanc → passabanda (+ passaaltes) → envolupant (atac lineal, caiguda exponencial)
    function veu({ t, atac, cai, g, f, q, hp }) {
      const n = Math.ceil(sr * (atac + cai * 1.2 + 0.05));
      const b = c.createBuffer(1, n, sr), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = rnd() * 2 - 1;
      const s = c.createBufferSource(); s.buffer = b;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q;
      let cadena = s.connect(bp);
      if (hp) { const h = c.createBiquadFilter(); h.type = "highpass"; h.frequency.value = hp; cadena = cadena.connect(h); }
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(g, t + atac);
      gn.gain.setTargetAtTime(0.0001, t + atac, cai / 3.5);
      cadena.connect(gn).connect(sortida);
      s.start(t);
    }

    // 1) fregadissa: soroll brillant que puja, amb petits cruixits de fibra al damunt
    const tFrega = jit(0.25, 0.08);
    veu({ t: 0.0, atac: tFrega, cai: 0.04, g: jit(0.24, 0.15), f: jit(1700, 0.12), q: 0.45, hp: 450 });
    for (let i = 0; i < 4; i++) { // cruixits petits escampats
      veu({ t: rnd() * tFrega, atac: 0.007, cai: 0.03, g: jit(0.22, 0.4), f: jit(1500, 0.25), q: 0.7, hp: 600 });
    }
    // 2) cruixit en desenganxar-se la fulla
    const tCruix = tFrega + jit(0.02, 0.2);
    veu({ t: tCruix, atac: 0.012, cai: 0.05, g: jit(1.0, 0.12), f: jit(1500, 0.1), q: 0.6, hp: 500 });
    // 2b) dos tocs petits abans del cop
    veu({ t: tCruix + jit(0.065, 0.2), atac: 0.008, cai: 0.035, g: jit(0.6, 0.25), f: jit(1400, 0.15), q: 0.7, hp: 500 });
    veu({ t: tCruix + jit(0.09, 0.15), atac: 0.008, cai: 0.03, g: jit(0.5, 0.25), f: jit(1300, 0.15), q: 0.7, hp: 500 });
    // 2c) remor mitjana entre el cruixit i el cop (la fulla encara es mou)
    veu({ t: tCruix + 0.01, atac: 0.03, cai: 0.12, g: jit(0.5, 0.2), f: jit(1200, 0.1), q: 0.55, hp: 400 });
    // 3) el cop principal: cos mitjà (1–2 kHz) + una mica de brillantor
    const tCop = tCruix + jit(0.105, 0.08);
    veu({ t: tCop, atac: 0.009, cai: 0.09, g: jit(2.9, 0.1), f: jit(1000, 0.1), q: 0.75, hp: 300 });
    veu({ t: tCop, atac: 0.006, cai: 0.04, g: jit(0.22, 0.15), f: jit(2000, 0.15), q: 0.6, hp: 900 });
    // 3b) rebots que s'esvaeixen
    [[0.035, 1.7, 1.35], [0.06, 1.0, 1.5], [0.085, 1.2, 1.7], [0.11, 0.85, 1.9], [0.14, 0.6, 2.1]].forEach(([dt, gg, ff]) => {
      veu({ t: tCop + jit(dt, 0.12), atac: 0.006, cai: 0.035, g: jit(gg, 0.2), f: jit(1000 * ff, 0.1), q: 0.75, hp: 450 });
    });
    // 4) cua suau
    veu({ t: tCop + 0.1, atac: 0.04, cai: 0.14, g: jit(0.5, 0.15), f: jit(2400, 0.1), q: 0.6, hp: 1000 });

    return c.startRendering().then((b) => {
      // normalitza el nivell (pic ≈ 0,8) i fa una fosa de 8 ms al final i 1 ms al principi
      const d = b.getChannelData(0); let pic = 0;
      for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pic) pic = a; }
      const k = pic > 0 ? 0.8 / pic : 1, fin = Math.floor(sr * 0.008), ini = Math.floor(sr * 0.001);
      for (let i = 0; i < d.length; i++) {
        let g = k;
        if (i < ini) g *= i / ini;
        if (i > d.length - fin) g *= (d.length - i) / fin;
        d[i] *= g;
      }
      return b;
    });
  }

  window.GENERA_SO_PAGINA = function (sr, n, durada) {
    const v = [];
    for (let i = 0; i < (n || 6); i++) v.push(renderVariant(sr || 44100, 1234 + i * 977, durada || 0.62));
    return Promise.all(v);
  };
})();
