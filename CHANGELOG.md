# Registre de canvis

Format: `vMAJOR.MINOR.PATCH`. Cada canvi publicat puja la versió.

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
