// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Constant única de la versió del joc (regles: claude-projects/GAMES-TEMPLATE/DRETS-I-VERSIONS.md, apartat B).
window.JOC = { nom: "Llibre de lectura", versio: "1.7.0", data: "2026-11-14", text: "v1.7.0 — 2026-11-14" };
document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-versio]").forEach((e) => { e.textContent = window.JOC.text; }));
