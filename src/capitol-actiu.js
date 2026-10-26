// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Tria el capítol que es llegeix (window.CAPITOL) entre els carregats a window.CAPITOLS (data-cNN.js).
// Ordre: ?cap=c02 a l'adreça, després l'última tria desada (llibre.capitol) i, si no hi és, el primer capítol.
(function () {
  "use strict";
  const tots = window.CAPITOLS || {};
  const ids = Object.keys(tots).sort();
  let triat = null;
  const q = /[?&]cap=(c\d+)/.exec(location.search);
  if (q) triat = q[1];
  if (!triat) { try { triat = localStorage.getItem("llibre.capitol"); } catch (e) { /* sense desament */ } }
  if (!tots[triat]) triat = ids[0];
  window.CAPITOL = tots[triat];
  window.CAPITOLS_IDS = ids;
})();
