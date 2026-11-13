# Registre de canvis

Format: `vMAJOR.MINOR.PATCH`. Cada canvi publicat puja la versió.

## v1.5.2 — 2026-11-13

- **9 cartes noves de frase feta** al Príncep: ben mirat, no tenir ni cèntim (c101); de cop, per fi (c104); tenir barra, a bots i barrals, fer un cop de cua, de debò (c106); plorar sobre la llet vessada (c107). Total: 269 cartes, 19 de frase feta.
- Lliçons per fer els capítols bé a la primera: `docs/NOU-CAPITOL.md` (última secció).

## v1.5.1 — 2026-11-13

- **Temerari enriquit** a tots els capítols d'*El Príncep Feliç* (c101–c108): vocabulari i sintaxi més rics en 10–19 paràgrafs per capítol (`tools/princep/cNNN_ric.py`); Prudent i Valent no canvien.
- **Revisió gramatical dels 8 capítols** (agents Haiku + verificació manual contra l'original): «Era daurada de cap a peus», concordances, preposicions, accents i una mala traducció («com t'anava»).
- **Cartes noves de frase feta**: de cap a peus, anar de dret al gra, a mitja veu (c101), ni piu, com soques (c108). Total: 260 cartes al llibre.
- **Animació d'obertura** també per al llibre del Príncep des del prestatge 3D (abans només s'animava el llibre actiu).
- **Publicat** a la còpia pública i a la web (Biblioteca màgica), amb els dos llibres; encara sense àudio al Príncep.

## v1.5 — 2026-11-13

- **Segon llibre: *El Príncep Feliç i altres contes*** (Oscar Wilde, Gutenberg #902, domini públic): 8 capítols en tres nivells (c101–c108: El Príncep Feliç en 2 parts, El Rossinyol i la Rosa, El Gegant Egoista, El Fidel Amic en 2 parts, El Coet Extraordinari en 2 parts), amb glossari/cartes (≈300 paraules en total), repte per capítol (5 preguntes + aparellar 6/8/8), **repte final del llibre** (8 preguntes) i carta especial del llibre. **Sense àudio encara** (es llegeix amb la veu del navegador). Esborrany pendent de revisió.
- **Il·lustracions de Walter Crane i G. P. Jacomb-Hood (1888, domini públic)** a l'obertura de cada capítol.
- **Fase 0 multillibre**: `src/llibres.js` (manifest), selecció de llibre amb `?llibre=princep` (o des del prestatge 3D), capítols carregats per llibre, claus de desament separades per llibre, «Capítol N» per camp `numero`. Alícia no canvia.
- El selector de capítol manté el mode de lectura en canviar de capítol.
- Eines noves: `tools/genera_capitol.py <llibre> <cap>` i `tools/princep/`.

## v1.4 — 2026-11-06

- **Àudio dels capítols 5, 6 i 7** (Joana i Enric, F0, 48 kbps): 1.560 mp3 de text i 538 de cartes. Ara tenen àudio real els capítols 1 a 7; els 8 a 12, a partir del desembre (quota F0).

## v1.3 — 2026-11-06

- **Tot el llibre en text: capítols 4 a 12** d'*Alice's Adventures in Wonderland* en tres nivells, amb glossari (≈80–95 paraules per capítol), repte (5 preguntes + aparellar 6/8/8) i cartes. Poemes en versions rimades pròpies i jocs de paraules adaptats al català (llista a `docs/PLA-ACABAR-ALICIA.md` i als `CANVIS_*`). Esborrany pendent de revisió.
- **Àudio** del capítol 4 generat (Joana i Enric, F0, ara a 48 kbps). Els capítols 5–12 es generen per tandes (quota F0 mensual); mentrestant es llegeixen amb la veu del navegador.
- **Gravats de John Tenniel** (1865, domini públic) a l'obertura de cada capítol.
- **Repte final del llibre** (12 preguntes, una per capítol) i pantalla «Has acabat el llibre!» amb una carta especial nova a l'àlbum.
- Capítol 2: «Duquesa» corregit a «Duquessa» (text i àudio d'aquell paràgraf).
- La biblioteca indica «tots els capítols».

## v1.2 — 2026-11-01

- **Capítol 3** (*Una cursa sense guanyador*, la cursa Caucus i la història del Ratolí): traducció en tres nivells (48 paràgrafs, un poema), glossari de 87 paraules (inclosos tres jocs de paraules adaptats: «sec», «tenir cua» i «no / nus»), repte (5 preguntes + aparellar 6/8/8) i cartes. **Àudio generat** amb Joana i Enric (F0).
- Pronunciacions noves per a Edwin, Morcar, Stigand, Canterbury i Atheling.
- La biblioteca indica «capítols 1, 2 i 3».

## v1.1 — 2026-10-26

- **Capítol 2** (*Un bassal de llàgrimes*): traducció en tres nivells, glossari de 96 paraules, repte (5 preguntes + aparellar) i 97 cartes. **Àudio generat** (Joana i Enric, F0): 156 mp3 de text + 192 de cartes. La frase en francès es diu en català («On és la meva gata?»).
- **Selector de capítol** a la barra; l'àlbum recull les cartes de tots els capítols (filtre per capítol).
- Suport per a **poemes** (versos amb salts de línia).
- **Arxivador de l'àlbum** a la biblioteca: la caixa ara arriba fins a dalt i conté el calaix superior i la placa «Àlbum de paraules» (abans en sobresortien).
- Eines per capítol (`--cap`, `build_audio_data.js cNN`) i guies a `docs/`.

## v1.0 — 2026-10-24

Primera versió numerada. Capítol 1 d'*Alice's Adventures in Wonderland* en català.

- **Contingut:** tres nivells (Prudent, Valent, Temerari), glossari de 107 paraules, mini-repte (5 preguntes amb pistes i aparellar paraules) i àlbum de 108 cartes.
- **Lector:** llibre obert de dues pàgines amb gir 3D, text justificat, marcapàgines automàtic, mode «Text llarg» i vista d'una pàgina per a mòbil.
- **Mini-repte** en forma de llibre obert (pregunta a l'esquerra, respostes a la dreta) que gira la fulla entre vistes; el sobre de cartes s'ha de descobrir sencer abans de continuar.
- **Narració** en tres nivells i dues veus sintètiques (Joana i Enric, Azure AI Speech), amb ressalt de la frase que sona i àudio de cada carta.
- **Música generativa** (7 peces) i **so de pàgina** generats per codi.
- **Biblioteca 3D** amb lluernes i obertura del llibre coherent amb el lector.
- **Drets i versió:** `LICENSE`, avís de drets al codi, peu legal i número de versió visibles.
