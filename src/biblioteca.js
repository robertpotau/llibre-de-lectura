// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Biblioteca 3D (three.js) amb versió lleugera en 2D.
// Portada del joc: estanteries plenes de llibres; el d'Alícia s'obre i dona pas al lector.
(function () {
  "use strict";

  const body = document.body;
  const $ = (id) => document.getElementById(id);
  const reduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a, b, k) => a + (b - a) * k;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  // Llibres de la biblioteca. Només Alícia és jugable; la resta són «Aviat».
  const LLIBRES = [
    { id: "alice",    titol: "Alice's Adventures in Wonderland", curt: "Alice",         autor: "Lewis Carroll",   color: "#274d7a", emoji: "🐇", disponible: true },
    { id: "peterpan", titol: "Peter Pan",                         curt: "Peter Pan",     autor: "J. M. Barrie",    color: "#1c5a5a", emoji: "⭐" },
    { id: "oz",       titol: "The Wonderful Wizard of Oz",        curt: "Wizard of Oz",  autor: "L. Frank Baum",   color: "#1f6a45", emoji: "🌪️" },
    { id: "jungle",   titol: "The Jungle Book",                   curt: "Jungle Book",   autor: "Rudyard Kipling", color: "#7a4a1d", emoji: "🐯" },
    { id: "treasure", titol: "Treasure Island",                   curt: "Treasure Island", autor: "R. L. Stevenson", color: "#6b2326", emoji: "🗺️" },
    { id: "willows",  titol: "The Wind in the Willows",           curt: "Willows",       autor: "Kenneth Grahame", color: "#4a6a2a", emoji: "🐸" },
    { id: "nesbit",   titol: "Five Children and It",              curt: "Five Children", autor: "E. Nesbit",       color: "#5e3a78", emoji: "✨" },
  ];
  const ORDRE_3D = ["oz", "jungle", "peterpan", "alice", "treasure", "willows", "nesbit"]; // Alícia al mig
  const PER_ID = Object.fromEntries(LLIBRES.map((l) => [l.id, l]));

  // --- preferències ---
  const pref = (k, d) => { try { const v = localStorage.getItem("llibre." + k); return v === null ? d : v; } catch (e) { return d; } };
  const desaPref = (k, v) => { try { localStorage.setItem("llibre." + k, v); } catch (e) { /* sense desament */ } };

  // --- sons (sintètics: sorolls filtrats; es creen només després d'un gest de l'usuari) ---
  const SONS = { actiu: pref("so", "1") === "1", ctx: null };
  window.SONS = SONS;
  function audioCtx() {
    SONS.ctx = SONS.ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (SONS.ctx.state === "suspended") SONS.ctx.resume();
    return SONS.ctx;
  }
  function soroll(durada, f0, f1, vol, tipus) {
    if (!SONS.actiu) return;
    try {
      const c = audioCtx();
      const n = Math.floor(c.sampleRate * durada);
      const buf = c.createBuffer(1, n, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2) * Math.min(1, i / (c.sampleRate * 0.01));
      const src = c.createBufferSource();
      src.buffer = buf;
      const fl = c.createBiquadFilter();
      fl.type = tipus || "bandpass";
      fl.frequency.setValueAtTime(f0, c.currentTime);
      fl.frequency.exponentialRampToValueAtTime(f1, c.currentTime + durada);
      fl.Q.value = 0.9;
      const g = c.createGain();
      g.gain.value = vol;
      src.connect(fl).connect(g).connect(c.destination);
      src.start();
    } catch (e) { /* sense so */ }
  }
  function tum() {
    if (!SONS.actiu) return;
    try {
      const c = audioCtx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = "sine";
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.2);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.26);
    } catch (e) { /* sense so */ }
  }
  const soPagina = (dir) => { if (SONS.pagina) SONS.pagina(dir, true); }; // el so nou (so-pagina-propi.js), també en obrir i tancar el llibre
  // Passar pàgina (també el fa servir el lector paginat). Tres capes, cadascuna amb una mica d'atzar perquè
  // no soni mai igual: el buf d'aire de la pàgina, els cruixits de la fibra del paper i el copet quan aterra.
  // So de pàgina propi: so-pagina-propi.js en genera unes quantes variants (cap fitxer d'àudio de tercers) i se'n tria una a l'atzar
  // a cada gir, amb una mica de variació de velocitat. Mentre no estan llestes (o si falla), sona el sintètic de sota.
  let variantsPagina = null, carregantPagina = false;
  function carregaPagina() {
    if (carregantPagina || !window.GENERA_SO_PAGINA) return;
    carregantPagina = true;
    try {
      window.GENERA_SO_PAGINA(48000, 6).then((v) => { variantsPagina = v; }).catch(() => { /* es queda el sintètic */ });
    } catch (e) { /* es queda el sintètic */ }
  }
  carregaPagina(); // les variants es generen en un context offline: no cal esperar cap gest de l'usuari
  function sonaPagina(dir, curt) {
    const c = audioCtx(), src = c.createBufferSource(), g = c.createGain();
    src.buffer = variantsPagina[Math.floor(Math.random() * variantsPagina.length)];
    src.playbackRate.value = (curt ? 1.25 : 1) * (0.95 + Math.random() * 0.1);
    g.gain.value = 0.7;
    let sortida = g;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = ((dir || 1) > 0 ? 0.25 : -0.25) * (0.6 + Math.random() * 0.8); g.connect(p); sortida = p; }
    src.connect(g); sortida.connect(c.destination);
    src.start();
  }
  SONS.pagina = (dir, curt) => {
    if (!SONS.actiu) return;
    if (variantsPagina) { try { sonaPagina(dir, curt); return; } catch (e) { /* cau al sintètic */ } }
    carregaPagina();
    try {
      const c = audioCtx(), t0 = c.currentTime + 0.01;
      const k = curt ? 0.45 : 1, dur = 0.8 * k, sr = c.sampleRate;
      const sol = (x) => x * (0.85 + Math.random() * 0.3);
      const pan = c.createStereoPanner ? c.createStereoPanner() : null;
      const sortida = c.createGain();
      sortida.gain.value = 1;
      if (pan) {
        const a = (dir || 1) > 0 ? 0.4 : -0.4;
        pan.pan.setValueAtTime(a, t0);
        pan.pan.linearRampToValueAtTime(-a, t0 + dur * 0.8);
        sortida.connect(pan).connect(c.destination);
      } else sortida.connect(c.destination);

      // 1) buf d'aire: soroll rosat que puja i baixa mentre el filtre s'obre
      const n1 = Math.floor(sr * dur), b1 = c.createBuffer(1, n1, sr), d1 = b1.getChannelData(0);
      let b0 = 0, bb = 0;
      for (let i = 0; i < n1; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.97 * b0 + 0.03 * w; bb = 0.8 * bb + 0.2 * w;
        const x = i / n1;
        d1[i] = (bb * 0.7 + b0 * 6) * Math.pow(Math.sin(Math.PI * Math.pow(x, 0.75)), 1.6);
      }
      const s1 = c.createBufferSource(); s1.buffer = b1;
      const f1 = c.createBiquadFilter(); f1.type = "bandpass"; f1.Q.value = 0.6;
      f1.frequency.setValueAtTime(sol(700), t0);
      f1.frequency.exponentialRampToValueAtTime(sol(3200), t0 + dur * 0.55);
      f1.frequency.exponentialRampToValueAtTime(sol(1200), t0 + dur);
      const g1 = c.createGain(); g1.gain.value = 0.55;
      s1.connect(f1).connect(g1).connect(sortida); s1.start(t0);

      // 2) cruixits: impulsos curts i dispersos, sobretot al principi i al mig del moviment
      const n2 = n1, b2 = c.createBuffer(1, n2, sr), d2 = b2.getChannelData(0);
      for (let i = 0; i < n2; i++) {
        const x = i / n2;
        const dens = 0.0016 * (1.6 * Math.exp(-Math.pow((x - 0.12) / 0.12, 2)) + Math.exp(-Math.pow((x - 0.5) / 0.2, 2)));
        if (Math.random() < dens) {
          const amp = Math.pow(Math.random(), 2) * 1.6, len = 2 + Math.floor(Math.random() * 28);
          for (let j = 0; j < len && i + j < n2; j++) d2[i + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j / (len * 0.35));
        }
      }
      const s2 = c.createBufferSource(); s2.buffer = b2;
      const f2 = c.createBiquadFilter(); f2.type = "highpass"; f2.frequency.value = 1800;
      const g2 = c.createGain(); g2.gain.value = 0.32;
      s2.connect(f2).connect(g2).connect(sortida); s2.start(t0);

      // 3) copet suau quan la pàgina arriba a l'altra banda
      const tc = t0 + dur * 0.86, nc = Math.floor(sr * 0.1), bc = c.createBuffer(1, nc, sr), dc = bc.getChannelData(0);
      for (let i = 0; i < nc; i++) dc[i] = (Math.random() * 2 - 1) * Math.exp(-i / (nc * 0.18));
      const s3 = c.createBufferSource(); s3.buffer = bc;
      const f3 = c.createBiquadFilter(); f3.type = "lowpass"; f3.frequency.value = sol(520);
      const g3 = c.createGain(); g3.gain.value = 0.5;
      s3.connect(f3).connect(g3).connect(sortida); s3.start(tc);
      const o = c.createOscillator(), go = c.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(sol(130), tc); o.frequency.exponentialRampToValueAtTime(60, tc + 0.09);
      go.gain.setValueAtTime(0.0001, tc); go.gain.exponentialRampToValueAtTime(0.1, tc + 0.008); go.gain.exponentialRampToValueAtTime(0.0001, tc + 0.11);
      o.connect(go).connect(sortida); o.start(tc); o.stop(tc + 0.14);
    } catch (e) { /* sense so */ }
  };
  const soLlisca = () => soroll(0.36, 700, 380, 0.14, "lowpass");
  const soObre = () => { soroll(0.5, 320, 900, 0.22, "lowpass"); tum(); };

  // ====================================================================
  //  ESCENA 3D
  // ====================================================================
  function creaEscena(canvas, cb) {
    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120c08);
    scene.fog = new THREE.Fog(0x120c08, 7, 15);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 40);

    // estat de la càmera (la llegeix el bucle de dibuix)
    const CAM_Z = 3.35;
    const vista = { z: CAM_Z, y: 1.6, ly: 1.5, pes: 1, x: 0, objX: 0 };
    const MAX_X = 2.1;
    const pointer = { x: 0, y: 0, cx: 0, cy: 0, dins: false };
    let rnd = (function (s) { return function () { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(20261022);
    const rr = (a, b) => a + rnd() * (b - a);

    // ---------- textures procedurals ----------
    function canvasTex(w, h, dibuixa, rep) {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      dibuixa(c.getContext("2d"), w, h);
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
      return t;
    }
    const texFusta = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#7a4e2c"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        g.strokeStyle = `rgba(${rnd() < 0.5 ? "40,20,8" : "170,120,70"},${rr(0.05, 0.28)})`;
        g.lineWidth = rr(0.6, 3);
        const x = rr(0, w);
        g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rr(-8, 8), h * 0.3, x + rr(-8, 8), h * 0.7, x + rr(-6, 6), h); g.stroke();
      }
    }, [1, 1]);
    const texPaper = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#3b1d20"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(190,140,80,.22)"; g.lineWidth = 2;
      for (let y = -64; y < h + 64; y += 64) for (let x = -64; x < w + 64; x += 64) {
        g.beginPath(); g.moveTo(x + 32, y); g.lineTo(x + 64, y + 32); g.lineTo(x + 32, y + 64); g.lineTo(x, y + 32); g.closePath(); g.stroke();
        g.fillStyle = "rgba(190,140,80,.18)"; g.beginPath(); g.arc(x + 32, y + 32, 6, 0, 7); g.fill();
      }
    }, [5, 3]);
    const texTerra = canvasTex(512, 512, (g, w, h) => {
      for (let i = 0; i < 8; i++) {
        g.fillStyle = `hsl(${rr(24, 32)},${rr(35, 50)}%,${rr(22, 30)}%)`;
        g.fillRect(0, i * 64, w, 63);
        for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(20,10,4,${rr(0.05, 0.2)})`; g.beginPath(); const y = i * 64 + rr(2, 60); g.moveTo(rr(0, w), y); g.lineTo(rr(0, w), y + rr(-2, 2)); g.stroke(); }
        g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, i * 64 + 62, w, 2);
      }
    }, [4, 3]);
    const texCantell = canvasTex(64, 128, (g, w, h) => {
      g.fillStyle = "#efe2c0"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(120,95,50,${rr(0.08, 0.25)})`; g.fillRect(0, y, w, 1); }
    });
    const texBrillant = canvasTex(128, 128, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,230,170,.5)"); r.addColorStop(1, "rgba(255,200,120,0)");
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
    const texRaig = canvasTex(64, 256, (g, w, h) => {
      const v = g.createLinearGradient(0, 0, 0, h);
      v.addColorStop(0, "rgba(255,225,160,.9)"); v.addColorStop(1, "rgba(255,225,160,0)");
      g.fillStyle = v; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "destination-in";
      const hx = g.createLinearGradient(0, 0, w, 0);
      hx.addColorStop(0, "rgba(0,0,0,0)"); hx.addColorStop(0.5, "rgba(0,0,0,1)"); hx.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = hx; g.fillRect(0, 0, w, h);
    });

    // ---------- sala ----------
    const UNIT_W = 2.3, FONS = 0.45, PLANKA = 0.06;
    const yTop = (i) => 0.12 + 0.62 * i;
    const matFusta = new THREE.MeshStandardMaterial({ map: texFusta, roughness: 0.78 });
    const matFustaFosca = new THREE.MeshStandardMaterial({ map: texFusta, color: 0x8a6a55, roughness: 0.9 });
    const sala = new THREE.Group();
    scene.add(sala);

    const paret = new THREE.Mesh(new THREE.PlaneGeometry(18, 5.2), new THREE.MeshStandardMaterial({ map: texPaper, roughness: 0.95 }));
    paret.position.set(0, 2.6, -FONS - 0.02);
    paret.receiveShadow = true;
    sala.add(paret);
    const terra = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), new THREE.MeshStandardMaterial({ map: texTerra, roughness: 0.6 }));
    terra.rotation.x = -Math.PI / 2;
    terra.position.set(0, 0, 4);
    terra.receiveShadow = true;
    sala.add(terra);
    const sostre = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 1 }));
    sostre.rotation.x = Math.PI / 2;
    sostre.position.set(0, 4.6, 4);
    sala.add(sostre);

    const box = (w, h, d, mat, x, y, z, ombra) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      if (ombra !== false) { m.castShadow = true; m.receiveShadow = true; }
      return m;
    };

    function creaMoble(cx) {
      const g = new THREE.Group();
      g.add(box(UNIT_W, 3.3, 0.04, matFustaFosca, cx, 1.65, -FONS + 0.02, false));
      g.add(box(0.07, 3.4, FONS, matFusta, cx - UNIT_W / 2, 1.7, -FONS / 2));
      g.add(box(0.07, 3.4, FONS, matFusta, cx + UNIT_W / 2, 1.7, -FONS / 2));
      for (let i = 0; i <= 5; i++) g.add(box(UNIT_W, PLANKA, FONS, matFusta, cx, yTop(i) - PLANKA / 2, -FONS / 2));
      g.add(box(UNIT_W + 0.16, 0.14, FONS + 0.12, matFusta, cx, 3.34, -FONS / 2 + 0.04));
      g.add(box(UNIT_W + 0.1, 0.12, FONS + 0.06, matFustaFosca, cx, 0.06, -FONS / 2 + 0.03));
      sala.add(g);
    }
    [-UNIT_W - 0.07, 0, UNIT_W + 0.07].forEach(creaMoble);

    // ---------- llibres de farciment (instanciats) ----------
    const PALETA = ["#5a2a27", "#2f4a3b", "#2c3e5c", "#6b4a2b", "#4a2c4f", "#7a6a3a", "#8a3b2a", "#264a50", "#3a3a46", "#a0773a", "#6e2f3f", "#3f5a2c"];
    const dades = [];
    const reservaCentre = { fila: 2, x0: -0.58, x1: 0.58 }; // zona on van els llibres jugables
    [-UNIT_W - 0.07, 0, UNIT_W + 0.07].forEach((cx, u) => {
      const inner = UNIT_W - 0.07 - 0.02;
      for (let fila = 0; fila < 5; fila++) {
        let x = cx - inner / 2 + 0.02;
        const xFi = cx + inner / 2 - 0.02;
        while (x < xFi - 0.05) {
          if (u === 1 && fila === reservaCentre.fila && x > reservaCentre.x0 - 0.04 && x < reservaCentre.x1) { x = reservaCentre.x1; continue; }
          if (rnd() < 0.07) { x += rr(0.08, 0.18); continue; } // buit
          const t = rr(0.045, 0.11), h = rr(0.3, 0.52), d = rr(0.24, 0.32);
          if (x + t > xFi) break;
          dades.push({ x: x + t / 2, y: yTop(fila) + h / 2, z: -d / 2 + rr(-0.025, 0.015), sx: t, sy: h, sz: d, c: PALETA[Math.floor(rnd() * PALETA.length)], a: rnd() < 0.7 });
          x += t + rr(0.0, 0.006);
        }
      }
    });
    const geoCub = new THREE.BoxGeometry(1, 1, 1);
    const instLlibres = new THREE.InstancedMesh(geoCub, new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.04 }), dades.length);
    const bandes = dades.filter((d) => d.a);
    const instBandes = new THREE.InstancedMesh(geoCub, new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.35, metalness: 0.6 }), bandes.length * 2);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
    dades.forEach((d, i) => {
      m4.compose(p.set(d.x, d.y, d.z), q.identity(), s.set(d.sx, d.sy, d.sz));
      instLlibres.setMatrixAt(i, m4);
      instLlibres.setColorAt(i, col.set(d.c));
    });
    bandes.forEach((d, i) => {
      [0.36, -0.34].forEach((f, k) => {
        m4.compose(p.set(d.x, d.y + d.sy * f, d.z + d.sz / 2 + 0.001), q.identity(), s.set(d.sx * 1.02, 0.022, 0.004));
        instBandes.setMatrixAt(i * 2 + k, m4);
      });
    });
    instLlibres.castShadow = instLlibres.receiveShadow = true;
    sala.add(instLlibres, instBandes);

    // ---------- llibres jugables ----------
    const W = 0.38, H = 0.56, CT = 0.012;
    const llibres = {};
    const meshosRay = [];

    function textCoberta(def) {
      return canvasTex(512, 720, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, w, h);
        gr.addColorStop(0, def.color); gr.addColorStop(1, "#0d0a08");
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = "rgba(255,255,255,.04)";
        for (let i = 0; i < 600; i++) g.fillRect(rr(0, w), rr(0, h), rr(1, 3), rr(1, 3));
        g.strokeStyle = "#e0b653"; g.lineWidth = 6; g.strokeRect(30, 30, w - 60, h - 60);
        g.lineWidth = 2; g.strokeRect(44, 44, w - 88, h - 88);
        g.fillStyle = "#e0b653"; g.textAlign = "center";
        g.font = "56px 'Alice', Georgia, serif";
        g.fillText("❦", w / 2, 112);
        g.fillText("❦", w / 2, h - 70);
        g.font = "120px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
        g.fillText(def.emoji, w / 2, 290);
        const paraules = def.titol.split(" ");
        const linies = []; let l = "";
        g.font = "52px 'Alice', Georgia, serif";
        paraules.forEach((pw) => { const t = l ? l + " " + pw : pw; if (g.measureText(t).width > w - 140 && l) { linies.push(l); l = pw; } else l = t; });
        linies.push(l);
        const y0 = 400 + (4 - linies.length) * 14;
        linies.forEach((ln, i) => g.fillText(ln, w / 2, y0 + i * 60));
        g.font = "italic 26px 'Merriweather', Georgia, serif";
        g.fillStyle = "#f1dfa8";
        g.fillText(def.autor, w / 2, h - 118);
      });
    }
    function textLlom(def) {
      return canvasTex(140, 720, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, w, 0);
        gr.addColorStop(0, "#0d0a08"); gr.addColorStop(0.5, def.color); gr.addColorStop(1, "#0d0a08");
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = "#e0b653";
        [34, 44, h - 44, h - 34].forEach((y) => g.fillRect(8, y, w - 16, y % 10 === 4 ? 6 : 3));
        g.save();
        g.translate(w / 2, h / 2);
        g.rotate(-Math.PI / 2);
        g.textAlign = "center"; g.textBaseline = "middle";
        let px = 60;
        g.font = `${px}px 'Alice', Georgia, serif`;
        while (g.measureText(def.curt).width > h - 200 && px > 20) { px -= 2; g.font = `${px}px 'Alice', Georgia, serif`; }
        g.fillStyle = "#f1d68a";
        g.fillText(def.curt, 0, 0);
        g.restore();
        g.font = "34px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
        g.textAlign = "center";
        g.fillText(def.emoji, w / 2, h - 80);
      });
    }
    function textPagina(tipus, def) {
      return canvasTex(256, 360, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, w, 0);
        const esquerra = tipus.startsWith("e");
        gr.addColorStop(esquerra ? 1 : 0, "rgba(120,85,40,.35)"); gr.addColorStop(esquerra ? 0.82 : 0.18, "rgba(244,232,204,1)"); gr.addColorStop(esquerra ? 0 : 1, "rgba(238,224,190,1)");
        g.fillStyle = "#f2e6c6"; g.fillRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = "#3b2b1b"; g.textAlign = "center";
        const linies = (y0, n, x0 = 30, x1 = w - 30) => { for (let i = 0; i < n; i++) { g.fillStyle = "rgba(60,45,30,.55)"; g.fillRect(x0, y0 + i * 11, (x1 - x0) * (i === n - 1 ? rr(0.3, 0.7) : rr(0.88, 1)), 3); } };
        if (tipus === "d0") {            // mig títol
          g.font = "26px 'Alice', Georgia, serif"; g.fillText(def.titol, w / 2, 150, w - 40);
          g.font = "italic 14px 'Merriweather', Georgia, serif"; g.fillText(def.autor, w / 2, 190);
        } else if (tipus === "d1") {     // portada interior
          g.font = "90px 'Segoe UI Emoji','Apple Color Emoji',sans-serif"; g.fillText(def.emoji, w / 2, 190);
          g.font = "22px 'Alice', Georgia, serif"; g.fillStyle = "#6b4a1d"; g.fillText("❦", w / 2, 250);
        } else if (tipus === "d2") {     // dedicatòria
          g.font = "italic 16px 'Merriweather', Georgia, serif"; g.fillText("Un capítol per llegir,", w / 2, 150); g.fillText("escoltar i col·leccionar", w / 2, 176);
        } else if (tipus === "dTitol" || tipus.startsWith("e")) { // primera pàgina del capítol (el revers de cada fulla: queda a l'esquerra en obrir-se)
          g.font = "11px 'Merriweather', Georgia, serif"; g.fillText("CAPÍTOL 1", w / 2, 52);
          g.font = "27px 'Alice', Georgia, serif"; g.fillText("Pel cau del conill", w / 2, 92, w - 40);
          g.fillStyle = "#b9892f"; g.font = "18px 'Alice', Georgia, serif"; g.fillText("❦", w / 2, 118);
          g.fillStyle = "#3b2b1b"; g.font = "42px 'Alice', Georgia, serif"; g.textAlign = "left"; g.fillText("L", 30, 164);
          linies(140, 2, 62); linies(162, 14);
        } else {                          // pàgina dreta: la continuació del text (simulat)
          linies(40, 22);
        }
      });
    }

    function creaLlibre(def, t) {
      const g = new THREE.Group();
      const mCob = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.55, metalness: 0.05 });
      const mPortada = new THREE.MeshStandardMaterial({ map: textCoberta(def), roughness: 0.55 });
      const mLlom = new THREE.MeshStandardMaterial({ map: textLlom(def), roughness: 0.55 });
      const mPaper = new THREE.MeshStandardMaterial({ color: 0xf1e4c3, roughness: 0.9 });
      const mCantell = new THREE.MeshStandardMaterial({ map: texCantell, roughness: 0.9 });
      const mGarda = new THREE.MeshStandardMaterial({ color: 0x8a7240, roughness: 0.9 });
      const mDretaTitol = new THREE.MeshStandardMaterial({ map: textPagina("dText", def), roughness: 0.9 });

      const pag = new THREE.Mesh(new THREE.BoxGeometry(W - CT - 0.005, H - 0.02, t - 2 * CT - 0.004), [mCantell, mPaper, mCantell, mCantell, mDretaTitol, mPaper]);
      pag.position.x = (CT - 0.005) / 2;
      const dors = new THREE.Mesh(new THREE.BoxGeometry(W, H, CT), mCob);
      dors.position.z = -(t / 2 - CT / 2);
      const llom = new THREE.Mesh(new THREE.BoxGeometry(CT, H, t), [mCob, mLlom, mCob, mCob, mCob, mCob]);
      llom.position.x = -W / 2 + CT / 2;
      const pivot = new THREE.Group();
      pivot.position.set(-W / 2, 0, t / 2 - CT / 2);
      const davant = new THREE.Mesh(new THREE.BoxGeometry(W, H, CT), [mCob, mCob, mCob, mCob, mPortada, mGarda]);
      davant.position.x = W / 2;
      pivot.add(davant);
      g.add(pag, dors, llom, pivot);

      // fulls que es giren en obrir el llibre
      const fulls = [];
      ["0", "1", "2"].forEach((k, i) => {
        const fp = new THREE.Group();
        fp.position.set(-W / 2 + CT, 0, t / 2 - CT + 0.003 - i * 0.0015); // per sobre de la pàgina de sota (si no, es barallaven al mateix pla)
        const full = new THREE.Mesh(new THREE.BoxGeometry(W - CT - 0.012, H - 0.03, 0.002), [mPaper, mPaper, mPaper, mPaper,
          new THREE.MeshStandardMaterial({ map: textPagina("d" + k, def), roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ map: textPagina("e" + k, def), roughness: 0.9 })]);
        full.position.x = (W - CT - 0.012) / 2;
        fp.add(full);
        g.add(fp);
        fulls.push({ pivot: fp, final: -(2.62 - 0.07 * (i + 1)) });
      });

      g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      return { g, pivot, fulls, mats: [mCob, mPortada, mLlom], t };
    }

    // col·loca els 7 llibres al centre del moble central
    (function () {
      const gruixos = ORDRE_3D.map(() => rr(0.095, 0.125));
      const total = gruixos.reduce((a, b) => a + b + 0.014, 0);
      let x = -total / 2;
      ORDRE_3D.forEach((id, i) => {
        const def = PER_ID[id], t = gruixos[i];
        const L = creaLlibre(def, t);
        L.def = def;
        L.baseX = x + t / 2;
        L.baseY = yTop(2) + H / 2;
        L.baseZ = 0.05 - W / 2;
        L.g.position.set(L.baseX, L.baseY, L.baseZ);
        L.g.rotation.y = Math.PI / 2;
        L.pull = 0; L.lliure = false;
        x += t + 0.014;
        L.g.traverse((m) => { if (m.isMesh) { m.userData.llibre = L; meshosRay.push(m); } });
        sala.add(L.g);
        llibres[id] = L;
      });
    })();

    // ---------- moble de l'àlbum (fitxer de cartes) ----------
    const cabinet = new THREE.Group();
    const matCaixo = new THREE.MeshStandardMaterial({ color: 0xb88950, map: texFusta, roughness: 0.6 });
    const matManeta = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.7, roughness: 0.3 });
    const cuerpo = box(0.95, 1.1, 0.5, matFustaFosca, 0, 0.61, 0);
    cabinet.add(cuerpo);
    const calaixos = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const cal = box(0.28, 0.23, 0.03, matCaixo.clone(), -0.3 + c * 0.3, 0.2 + r * 0.26 + 0.18, 0.26);
      const man = box(0.09, 0.02, 0.02, matManeta, -0.3 + c * 0.3, 0.2 + r * 0.26 + 0.17, 0.285, false);
      const etq = box(0.12, 0.05, 0.005, new THREE.MeshStandardMaterial({ color: 0xf1e4c3, roughness: 0.9 }), -0.3 + c * 0.3, 0.2 + r * 0.26 + 0.24, 0.277, false);
      cabinet.add(cal, man, etq);
      calaixos.push(cal);
    }
    const placa = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.03), new THREE.MeshStandardMaterial({
      roughness: 0.4, metalness: 0.5,
      map: canvasTex(310, 70, (g, w, h) => {
        g.fillStyle = "#8a6a2a"; g.fillRect(0, 0, w, h);
        g.strokeStyle = "#f1d68a"; g.lineWidth = 3; g.strokeRect(5, 5, w - 10, h - 10);
        g.fillStyle = "#f8e7b0"; g.font = "30px 'Alice', Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText("Àlbum de paraules", w / 2, h / 2 + 2);
      }),
    }));
    placa.position.set(0, 1.26, 0.27);
    placa.castShadow = true;
    cabinet.add(placa);
    cabinet.position.set(1.1, 0, 0.95);
    cabinet.rotation.y = -0.3;
    cabinet.traverse((m) => { if (m.isMesh) { m.userData.cabinet = true; meshosRay.push(m); } });
    sala.add(cabinet);
    let cabinetPull = 0;

    // ---------- taula amb espelma ----------
    const taula = new THREE.Group();
    taula.add(box(1.0, 0.06, 0.6, matFusta, 0, 0.82, 0));
    [[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].forEach(([x, z]) => taula.add(box(0.06, 0.8, 0.06, matFusta, x, 0.4, z)));
    [[0.34, 0.06, 0.24, 0x7a2f2f, 0.25], [0.3, 0.055, 0.22, 0x2f5a46, -0.12], [0.26, 0.05, 0.2, 0x35507a, 0.08]].forEach(([w, h, d, c, r], i) => {
      const b = box(w, h, d, new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }), -0.18, 0.85 + h / 2 + i * 0.058, 0.02);
      b.rotation.y = r;
      taula.add(b);
    });
    const peu = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.03, 20), matManeta);
    peu.position.set(0.25, 0.865, 0.05);
    const espelma = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xf3e8cf, roughness: 0.8 }));
    espelma.position.set(0.25, 0.99, 0.05);
    const flama = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffc066 }));
    flama.scale.set(0.7, 1.7, 0.7);
    flama.position.set(0.25, 1.13, 0.05);
    const resplend = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillant, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
    resplend.scale.set(0.55, 0.55, 1);
    resplend.position.set(0.25, 1.13, 0.05);
    taula.add(peu, espelma, flama, resplend);
    taula.position.set(-1.35, 0, 1.0);
    taula.rotation.y = 0.18;
    sala.add(taula);

    // ---------- llums ----------
    scene.add(new THREE.HemisphereLight(0xffe0b0, 0x2a1a10, 0.5));
    const sol = new THREE.SpotLight(0xffd8a0, 1.2, 14, 0.7, 0.55);
    sol.position.set(3.2, 4.2, 3.6);
    sol.target.position.set(0, 1.6, 0);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    sol.shadow.bias = -0.0006;
    scene.add(sol, sol.target);
    const llumEsp = new THREE.PointLight(0xffa850, 1.1, 4.5);
    llumEsp.position.set(-1.1, 1.35, 1.05);
    scene.add(llumEsp);
    const llumFred = new THREE.DirectionalLight(0x8aa4ff, 0.25);
    llumFred.position.set(-4, 2.5, 2);
    scene.add(llumFred);
    const llumHeroi = new THREE.PointLight(0xffe2b0, 0, 6);
    llumHeroi.position.set(0.5, 2.4, 2.8);
    scene.add(llumHeroi);

    // raigs de llum i pols
    const raigs = [];
    [[1.6, 2.1, 1.1, 0.5, 0.9], [0.4, 2.3, 1.0, 0.45, 0.7], [-0.8, 2.2, 1.2, 0.4, 0.55]].forEach(([x, y, z, ampl, op]) => {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(ampl, 5), new THREE.MeshBasicMaterial({ map: texRaig, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.1 * op }));
      r.position.set(x, y, z);
      r.rotation.z = 0.45;
      r.userData.op = 0.1 * op;
      scene.add(r);
      raigs.push(r);
    });
    const NP = 220;
    const posPols = new Float32Array(NP * 3), baseP = [];
    for (let i = 0; i < NP; i++) {
      baseP.push([rr(-3.2, 3.2), rr(0.4, 3.6), rr(-0.1, 3.0), rnd() * 6.28, rr(0.2, 0.6)]);
      posPols.set([baseP[i][0], baseP[i][1], baseP[i][2]], i * 3);
    }
    const geoPols = new THREE.BufferGeometry();
    geoPols.setAttribute("position", new THREE.BufferAttribute(posPols, 3));
    const pols = new THREE.Points(geoPols, new THREE.PointsMaterial({ map: texBrillant, size: 0.05, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(pols);

    // lluernes: llumetes verd-grogues que voltegen lentament i s'encenen i s'apaguen cadascuna al seu ritme
    const lluernes = [];
    for (let i = 0; i < 34; i++) {
      const verd = rnd() < 0.55;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillant, color: verd ? 0xc8ff7a : 0xffe08a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const mida = rr(0.4, 0.8);
      sp.scale.set(mida, mida, 1);
      lluernes.push({ sp, mida, c: [rr(-3.4, 3.4), rr(0.5, 3.4), rr(0.1, 3.1)], r: [rr(0.25, 0.8), rr(0.15, 0.5), rr(0.2, 0.6)], v: [rr(0.12, 0.34), rr(0.1, 0.28), rr(0.1, 0.3)], f: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], ritme: rr(0.35, 0.9), fase: rnd() * 6.28 });
      scene.add(sp);
    }

    // ---------- interacció ----------
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let sobre = null;           // {tipus: 'llibre'|'cabinet', L}
    let focusId = null;          // llibre ressaltat des del teclat
    let ocupada = false;         // animació en marxa o àlbum obert
    let arrossega = null;

    function actualitzaHover() {
      if (ocupada) { sobre = null; return; }
      ndc.set(pointer.x, pointer.y);
      raycaster.setFromCamera(ndc, camera);
      const hit = pointer.dins ? raycaster.intersectObjects(meshosRay, false)[0] : null;
      let nou = null;
      if (hit) nou = hit.object.userData.cabinet ? { tipus: "cabinet" } : { tipus: "llibre", L: hit.object.userData.llibre };
      const canvia = (nou && nou.tipus) !== (sobre && sobre.tipus) || (nou && sobre && nou.L !== sobre.L);
      sobre = nou;
      if (canvia) cb.hover(sobre ? (sobre.tipus === "cabinet" ? { tipus: "cabinet" } : { tipus: "llibre", def: sobre.L.def }) : null);
      canvas.style.cursor = sobre ? "pointer" : arrossega ? "grabbing" : "grab";
    }

    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.cx = e.clientX; pointer.cy = e.clientY;
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointer.dins = true;
      if (arrossega) {
        const dx = e.clientX - arrossega.x;
        if (Math.abs(e.clientX - arrossega.x0) > 5) arrossega.mogut = true;
        vista.objX = Math.max(-MAX_X, Math.min(MAX_X, arrossega.objX0 - (e.clientX - arrossega.x0) * 0.006));
        arrossega.x = e.clientX;
      }
      cb.mou(e.clientX, e.clientY);
    });
    canvas.addEventListener("pointerleave", () => { pointer.dins = false; });
    canvas.addEventListener("pointerdown", (e) => {
      arrossega = { x: e.clientX, x0: e.clientX, objX0: vista.objX, mogut: false };
      try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* res */ }
    });
    canvas.addEventListener("pointerup", (e) => {
      const a = arrossega;
      arrossega = null;
      if (!a || a.mogut || ocupada) return;
      // el punter ha pogut canviar entre pointermove i pointerup (tàctil)
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointer.dins = true;
      actualitzaHover();
      if (!sobre) return;
      if (sobre.tipus === "cabinet") cb.album();
      else cb.clic(sobre.L.def);
    });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (ocupada) return;
      vista.objX = Math.max(-MAX_X, Math.min(MAX_X, vista.objX + (e.deltaX + e.deltaY) * 0.0025));
    }, { passive: false });

    // ---------- animacions ----------
    let salta = false;
    const eased = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    function tw(ms, fn, ease) {
      const f = ease || eased;
      return new Promise((res) => {
        const t0 = performance.now();
        const durada = ms * (window.__bibLent || 1); // __bibLent: només per fer proves a càmera lenta
        (function pas(now) {
          if (salta || ms <= 0) { fn(1); res(); return; }
          const k = Math.min(1, (now - t0) / durada);
          fn(f(k));
          if (k < 1) requestAnimationFrame(pas); else res();
        })(t0);
      });
    }

    let heroi = null; // {L, p0, p1, S}
    function escalaHeroi() {
      const dist = 2.0;
      const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist, visW = visH * camera.aspect;
      return Math.max(1.2, Math.min((0.72 * visH) / H, (0.88 * visW) / (1.9 * W)));
    }

    async function obre(id) {
      const L = llibres[id];
      salta = false; ocupada = true; sobre = null; cb.hover(null);
      L.lliure = true;
      const g = L.g, p0 = g.position.clone();
      const rapid = reduit();
      soLlisca();
      await tw(rapid ? 0 : 380, (k) => { g.position.z = p0.z + 0.42 * k; });
      const p1 = g.position.clone();
      const S = escalaHeroi();
      heroi = { L, p0, p1, S };
      const x0 = vista.x, z0 = vista.z, y0 = vista.y, ly0 = vista.ly;
      await tw(rapid ? 0 : 850, (k) => {
        g.position.set(lerp(p1.x, 0, k), lerp(p1.y, 1.5, k), lerp(p1.z, 1.3, k));
        g.rotation.y = lerp(Math.PI / 2, 0, k);
        g.rotation.x = lerp(0, -0.22, k);
        g.scale.setScalar(lerp(1, S, k));
        vista.x = lerp(x0, 0, k); vista.objX = vista.x;
        vista.z = lerp(z0, 3.3, k); vista.y = lerp(y0, 1.55, k); vista.ly = lerp(ly0, 1.45, k);
        vista.pes = 1 - k;
        llumHeroi.intensity = 1.0 * k;
      });
      soObre();
      await tw(rapid ? 0 : 750, (k) => { L.pivot.rotation.y = -2.62 * k; g.position.x = (W / 2) * S * k; });
      await Promise.all(L.fulls.map((f, i) => espera(salta || rapid ? 0 : i * 230).then(() => {
        if (!salta && !rapid) soPagina(1);
        return tw(rapid ? 0 : 520, (k) => { f.pivot.rotation.y = f.final * k; });
      })));
      await espera(salta || rapid ? 0 : 160);
    }

    async function torna() {
      if (!heroi) { ocupada = false; return; }
      const { L, p0, p1, S } = heroi;
      const g = L.g, rapid = reduit();
      salta = false;
      const x1 = g.position.x;
      await Promise.all(L.fulls.map((f, i) => espera(rapid ? 0 : (2 - i) * 120).then(() => {
        if (!rapid) soPagina(-1);
        return tw(rapid ? 0 : 380, (k) => { f.pivot.rotation.y = f.final * (1 - k); });
      })));
      await tw(rapid ? 0 : 520, (k) => { L.pivot.rotation.y = -2.62 * (1 - k); g.position.x = lerp(x1, 0, k); });
      tum();
      const cz = vista.z, cy = vista.y, cly = vista.ly;
      await tw(rapid ? 0 : 800, (k) => {
        g.position.set(lerp(0, p1.x, k), lerp(1.5, p1.y, k), lerp(1.3, p1.z, k));
        g.rotation.y = lerp(0, Math.PI / 2, k);
        g.rotation.x = lerp(-0.22, 0, k);
        g.scale.setScalar(lerp(S, 1, k));
        vista.z = lerp(cz, CAM_Z, k); vista.y = lerp(cy, 1.6, k); vista.ly = lerp(cly, 1.5, k);
        vista.pes = k;
        llumHeroi.intensity = 1.0 * (1 - k);
      });
      soLlisca();
      await tw(rapid ? 0 : 320, (k) => { g.position.z = lerp(p1.z, p0.z, k); });
      g.position.copy(p0);
      L.lliure = false; heroi = null; ocupada = false;
    }

    // ---------- bucle ----------
    let raf = 0, actiu = false, fpsN = 0, fpsT0 = 0, fpsAvisat = false;
    function resize() {
      const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    function frame(now) {
      if (!actiu) return;
      raf = requestAnimationFrame(frame);
      const t = now / 1000;
      const mou = !reduit();

      // càmera: desplaçament lateral + lleu paral·laxi amb el ratolí
      if (!heroi) vista.x += (vista.objX - vista.x) * 0.08;
      const px = mou ? pointer.x * 0.22 * vista.pes : 0, py = mou ? pointer.y * 0.1 * vista.pes : 0;
      camera.position.set(vista.x + px, vista.y + py, vista.z);
      camera.lookAt(vista.x * 0.92 + px * 0.3, vista.ly, 0);

      if (mou) {
        const f = 1 + Math.sin(t * 9.1) * 0.06 + Math.sin(t * 23.3) * 0.04 + Math.sin(t * 3.7) * 0.05;
        llumEsp.intensity = 1.1 * f;
        flama.scale.set(0.7 * (0.95 + 0.08 * Math.sin(t * 17)), 1.7 * f, 0.7);
        resplend.material.opacity = 0.75 + 0.2 * f;
        const a = geoPols.attributes.position;
        for (let i = 0; i < NP; i++) {
          const b = baseP[i];
          a.setXYZ(i, b[0] + Math.sin(t * 0.25 * b[4] + b[3]) * 0.25, b[1] + Math.sin(t * 0.18 * b[4] + b[3] * 2) * 0.18, b[2] + Math.cos(t * 0.2 * b[4] + b[3]) * 0.2);
        }
        a.needsUpdate = true;
        lluernes.forEach((l) => {
          const p = l.sp.position;
          p.set(l.c[0] + Math.sin(t * l.v[0] + l.f[0]) * l.r[0], l.c[1] + Math.sin(t * l.v[1] + l.f[1]) * l.r[1], l.c[2] + Math.cos(t * l.v[2] + l.f[2]) * l.r[2]);
          // llum que es va encenent i apagant (esvaeix del tot entre pulsacions)
          const k = Math.max(0, Math.sin(t * l.ritme + l.fase));
          const ll = Math.pow(k, 2.2);
          l.sp.material.opacity = ll;
          const m = l.mida * (0.55 + 0.6 * ll);
          l.sp.scale.set(m, m, 1);
        });
        raigs.forEach((r, i) => { r.material.opacity = r.userData.op * (0.8 + 0.2 * Math.sin(t * 0.5 + i)); });
      }

      actualitzaHover();
      cabinetPull += (((sobre && sobre.tipus === "cabinet") ? 1 : 0) - cabinetPull) * 0.2;
      calaixos.forEach((c) => { c.material.emissive.setRGB(0.35 * cabinetPull, 0.22 * cabinetPull, 0.05 * cabinetPull); });

      Object.values(llibres).forEach((L) => {
        if (L.lliure) return;
        const objectiu = (sobre && sobre.tipus === "llibre" && sobre.L === L) || focusId === L.def.id ? 1 : 0;
        L.pull += (objectiu - L.pull) * 0.2;
        L.g.position.z = L.baseZ + 0.11 * L.pull;
        const pols = L.def.disponible && !objectiu ? 0.08 + 0.07 * Math.sin(t * 2.2) : 0;
        L.mats.forEach((m) => { m.emissive.setRGB(1, 0.78, 0.35); m.emissiveIntensity = Math.max(pols, 0.3 * L.pull); });
      });

      renderer.render(scene, camera);

      // si va molt lent, ho diem (una sola vegada)
      if (!fpsAvisat) {
        if (!fpsT0) { fpsT0 = now; fpsN = 0; }
        fpsN++;
        if (now - fpsT0 > 3000) {
          if (fpsN / ((now - fpsT0) / 1000) < 20) cb.lent();
          fpsAvisat = true;
        }
      }
    }
    function inicia() {
      if (actiu) return;
      actiu = true;
      resize();
      raf = requestAnimationFrame(frame);
    }
    function atura() { actiu = false; cancelAnimationFrame(raf); }

    return {
      inicia, atura, resize, obre, torna,
      salta: () => { salta = true; },
      ocupada: (v) => { ocupada = v; },
      destaca: (id) => { focusId = id; },
      pan: (d) => { vista.objX = Math.max(-MAX_X, Math.min(MAX_X, vista.objX + d)); },
      pocPes: () => heroi,
    };
  }

  // ====================================================================
  //  INTERFÍCIE: modes, HUD, transicions
  // ====================================================================
  const bib = $("biblioteca");
  const canvas = $("bib-canvas");
  const fosc = $("fosc");
  const tip = $("bib-tip");
  let escena = null;
  let animant = false;

  function webglOk() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }
  function ambAlbumObert() { return !!document.querySelector(".cc-fons"); }

  async function fonsOn() { fosc.classList.add("on"); await espera(reduit() ? 0 : 460); }
  async function fonsOff() { fosc.classList.remove("on"); await espera(reduit() ? 0 : 460); }

  function mostraTip(info, x, y) {
    if (!info) { tip.hidden = true; return; }
    if (info.tipus === "cabinet") {
      const n = window.CARTES ? window.CARTES.quantes() + "/" + window.CARTES.total : "";
      tip.innerHTML = `<strong>Àlbum de paraules</strong><span>Les teves cartes ${n}</span>`;
    } else {
      const d = info.def;
      tip.innerHTML = `<strong>${d.titol}</strong><span>${d.autor}</span><em class="${d.disponible ? "ok" : ""}">${d.disponible ? "Clica per llegir el capítol 1" : "Aviat"}</em>`;
    }
    tip.hidden = false;
    posicionaTip(x, y);
  }
  function posicionaTip(x, y) {
    if (tip.hidden) return;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(window.innerWidth - w - 10, Math.max(10, x + 16)) + "px";
    tip.style.top = Math.min(window.innerHeight - h - 10, Math.max(10, y + 18)) + "px";
  }

  // --- llista accessible / versió 2D ---
  function construeixLlista() {
    const ul = $("bib-llista");
    ul.innerHTML = "";
    const farcit = () => `<span class="bib-farcit" aria-hidden="true" style="height:${150 + Math.floor(Math.random() * 90)}px;background:${["#5a2a27", "#2f4a3b", "#2c3e5c", "#6b4a2b", "#4a2c4f", "#7a6a3a"][Math.floor(Math.random() * 6)]}"></span>`;
    const ordre = ["alice", ...ORDRE_3D.filter((i) => i !== "alice")];
    const items = ordre.map((id) => PER_ID[id]);
    items.forEach((d, i) => {
      const li = document.createElement("li");
      li.innerHTML = (i % 3 === 0 ? farcit() + farcit() : farcit());
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bib-llom" + (d.disponible ? " disponible" : "");
      b.dataset.id = d.id;
      b.style.setProperty("--color", d.color);
      b.style.height = 200 + (i % 3) * 14 + "px";
      b.setAttribute("aria-label", d.disponible ? `Llegeix ${d.titol} de ${d.autor}` : `${d.titol} de ${d.autor}: aviat`);
      b.innerHTML = `<span class="bib-llom-text">${d.curt}</span><span class="bib-llom-emoji" aria-hidden="true">${d.emoji}</span>${d.disponible ? "" : '<span class="bib-aviat">Aviat</span>'}`;
      b.addEventListener("click", () => clicLlibre(d));
      b.addEventListener("focus", () => escena && escena.destaca(d.id));
      b.addEventListener("blur", () => escena && escena.destaca(null));
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  function avisAviat(def) {
    const a = $("bib-avis");
    a.textContent = `«${def.titol}» arribarà aviat. De moment, pots llegir Alícia!`;
    a.hidden = false;
    clearTimeout(avisAviat.t);
    avisAviat.t = setTimeout(() => { a.hidden = true; }, 3200);
  }

  async function clicLlibre(def) {
    if (animant) return;
    if (!def.disponible) { avisAviat(def); return; }
    animant = true;
    bib.classList.add("animant");
    if (bib.classList.contains("mode-3d") && escena) {
      await Promise.race([escena.obre(def.id), new Promise((r) => { window.__bibSalta = r; })]).catch(() => {});
      window.__bibSalta = null;
    }
    await fonsOn();
    posaMode("lectura");
    window.scrollTo(0, 0);
    await fonsOff();
    animant = false;
    bib.classList.remove("animant");
  }

  function posaMode(m) {
    body.dataset.mode = m;
    if (m === "biblioteca") {
      if (escena && bib.classList.contains("mode-3d")) { escena.inicia(); escena.resize(); }
    } else if (escena) escena.atura();
  }

  async function tornaBiblioteca() {
    if (animant) return;
    animant = true;
    // atura l'àudio del capítol
    const stop = $("rep-stop");
    if (stop && !stop.disabled) stop.click();
    await fonsOn();
    posaMode("biblioteca");
    bib.classList.add("animant");
    await fonsOff();
    if (escena && bib.classList.contains("mode-3d")) await escena.torna();
    bib.classList.remove("animant");
    animant = false;
  }

  // --- canvi de mode 3D / lleuger ---
  function posaVista(mode3d) {
    bib.classList.toggle("mode-3d", mode3d);
    bib.classList.toggle("mode-2d", !mode3d);
    $("bib-mode").textContent = mode3d ? "Mode lleuger" : "Mode 3D";
    $("bib-mode").setAttribute("aria-label", mode3d ? "Canvia a la versió lleugera, sense 3D" : "Canvia a la versió 3D");
    $("bib-nav").hidden = !mode3d;
    if (mode3d && escena) { escena.inicia(); escena.resize(); }
    if (!mode3d && escena) escena.atura();
  }

  const ultimPunter = { x: 0, y: 0 };
  function iniciaEscena() {
    if (escena) return true;
    try {
      escena = creaEscena(canvas, {
        hover: (info) => mostraTip(info, ultimPunter.x, ultimPunter.y),
        mou: (x, y) => { ultimPunter.x = x; ultimPunter.y = y; posicionaTip(x, y); },
        clic: (def) => clicLlibre(def),
        album: () => { if (window.CARTES) window.CARTES.obreAlbum(); },
        lent: () => {
          const a = $("bib-avis");
          a.innerHTML = 'Sembla que aquest ordinador va una mica lent. <button type="button" id="bib-lent-si">Passa al mode lleuger</button>';
          a.hidden = false;
          $("bib-lent-si").addEventListener("click", () => { a.hidden = true; canviaMode(false); });
          setTimeout(() => { a.hidden = true; }, 9000);
        },
      });
      return true;
    } catch (e) {
      console.warn("No s'ha pogut crear l'escena 3D:", e);
      escena = null;
      return false;
    }
  }

  function canviaMode(mode3d) {
    if (mode3d && !(window.THREE && webglOk() && iniciaEscena())) {
      const a = $("bib-avis");
      a.textContent = "Aquest navegador no pot mostrar la biblioteca en 3D.";
      a.hidden = false;
      setTimeout(() => { a.hidden = true; }, 3500);
      mode3d = false;
    }
    desaPref("mode", mode3d ? "3d" : "lleuger");
    posaVista(mode3d);
  }

  // --- esdeveniments de la interfície ---
  $("bib-mode").addEventListener("click", () => canviaMode(!bib.classList.contains("mode-3d")));
  $("bib-esq").addEventListener("click", () => escena && escena.pan(-0.9));
  $("bib-dre").addEventListener("click", () => escena && escena.pan(0.9));
  $("btn-biblioteca").addEventListener("click", tornaBiblioteca);
  const botoSo = $("bib-so");
  function pintaSo() {
    botoSo.textContent = SONS.actiu ? "🔊" : "🔇";
    botoSo.setAttribute("aria-label", SONS.actiu ? "Silencia els sons" : "Activa els sons");
    botoSo.setAttribute("aria-pressed", String(!SONS.actiu));
  }
  botoSo.addEventListener("click", () => { SONS.actiu = !SONS.actiu; desaPref("so", SONS.actiu ? "1" : "0"); pintaSo(); });
  pintaSo();

  document.addEventListener("keydown", (e) => {
    if (body.dataset.mode !== "biblioteca" || ambAlbumObert()) return;
    if (animant && (e.key === "Escape" || e.key === "Enter" || e.key === " ")) {
      if (escena) escena.salta();
      if (window.__bibSalta) window.__bibSalta();
      return;
    }
    if (e.key === "ArrowLeft" && escena && bib.classList.contains("mode-3d")) { escena.pan(-0.5); }
    if (e.key === "ArrowRight" && escena && bib.classList.contains("mode-3d")) { escena.pan(0.5); }
  });
  bib.addEventListener("pointerdown", () => { if (animant) { if (escena) escena.salta(); if (window.__bibSalta) window.__bibSalta(); } }, true);
  window.addEventListener("resize", () => { if (escena) escena.resize(); });

  // --- inici ---
  construeixLlista();
  window.BIBLIOTECA = { obreLectura: () => posaMode("lectura"), tornaBiblioteca };

  async function inicia() {
    const directe = location.hash === "#lectura"; // enllaç directe al lector (útil per a proves)
    body.dataset.mode = "biblioteca";
    let vol3d = pref("mode", "") ? pref("mode", "") === "3d" : (webglOk() && !!window.THREE && (navigator.hardwareConcurrency || 4) > 2);
    if (vol3d) {
      try {
        if (document.fonts && document.fonts.load) {
          await Promise.race([
            Promise.all([document.fonts.load("40px Alice"), document.fonts.load("20px Merriweather"), document.fonts.load("italic 20px Merriweather")]),
            espera(1500),
          ]);
        }
      } catch (e) { /* continuem igualment */ }
      vol3d = webglOk() && !!window.THREE && iniciaEscena();
    }
    posaVista(vol3d);
    if (directe) posaMode("lectura");
  }
  inicia();
})();
