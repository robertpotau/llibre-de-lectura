# Llibre de lectura — Biblioteca màgica

Joc de lectura per a alumnat de **1r i 2n d'ESO**: capítols de llibres clàssics en **domini públic**, traduïts al català i adaptats a tres nivells, amb veu, vocabulari marcat i cartes col·leccionables. La portada és una biblioteca en 3D plena de llibres.

**Versió actual: v1.0 (2026-10-24)** · de moment només hi ha el **capítol 1 d'*Alice's Adventures in Wonderland***, «Pel cau del conill».

> *English summary:* a Catalan-language reading game for lower-secondary students. Public-domain classics (starting with chapter 1 of *Alice's Adventures in Wonderland*), translated into Catalan in three levels, with narration (synthetic voices), highlighted vocabulary, mini-challenges and collectible word cards. Runs entirely in the browser, no server and no data collection. All rights reserved (see [LICENSE](LICENSE)).

## Què inclou

- **Tres nivells de text:** *Prudent* (frases més curtes i vocabulari molt habitual), *Valent* (la traducció de referència) i *Temerari* (vocabulari més ric, frases fetes i expressions literàries).
- **Lector en forma de llibre obert**, amb pàgines que es giren, text justificat, marcapàgines automàtic, mode «Text llarg» i vista d'una pàgina per a mòbil. Opció de tipografia per a lectors principiants.
- **Narració en veu alta** amb dues veus (Joana i Enric), amb **ressalt de la frase que sona**. Clic a una frase per saltar-hi. Control de volum de la veu independent del de la música.
- **Vocabulari marcat amb colors** i targetes de paraula (sinònim més senzill, exemple i botó per escoltar-la).
- **Mini-repte** al final del capítol, també en forma de llibre obert: cinc preguntes amb pistes i un joc per aparellar paraules.
- **Cartes col·leccionables** i àlbum: es guanyen amb els reptes i la lectura.
- **Música i so de pàgina** generats per codi, sense cap enregistrament de tercers.

## Com jugar

No cal instal·lar res ni tenir servidor:

1. Descarrega el repositori (o clona'l).
2. Obre **`index.html`** a l'arrel (o fes doble clic a **`Obrir el joc.bat`** a Windows). S'obre `src/index.html` al navegador.
3. Un navegador modern (Chrome, Edge, Firefox) és suficient. La música i la veu comencen amb el primer clic, com exigeixen els navegadors.

La biblioteca en 3D fa servir WebGL; si l'ordinador va lent, el joc ofereix el **mode lleuger**.

## Estructura

```
index.html          redirigeix a src/index.html
src/                el joc (HTML, CSS, JavaScript, tipografies i three.js)
audio/alice/c01/    narració (mp3): <nivell>/<fem|masc>/pNNN.mp3 i les cartes
LICENSE             drets i material de tercers
```

## Crèdits i material de tercers

- **Text original:** *Alice's Adventures in Wonderland*, de Lewis Carroll (1865), de domini públic; edició en anglès de [Project Gutenberg](https://www.gutenberg.org/) (ebook #11). La **traducció al català, les adaptacions per nivells, el glossari, els reptes i les cartes** són obra original de Robert Potau Nuñez (amb Claude Code, Anthropic), i estan sota la reserva de drets. El text està encara **en revisió (esborrany)**.
- **Veus:** les narracions són **veus sintètiques**, generades amb **Azure AI Speech** (Microsoft): `ca-ES-JoanaNeural` i `ca-ES-EnricNeural`. No són enregistraments de persones.
- **Tipografies** (llicència SIL Open Font 1.1, fitxers de llicència a `src/fonts/`): Merriweather, Alice i Andika.
- **three.js** (llicència MIT, `src/vendor/`).
- **Música i so de pàgina:** generats per codi en aquest joc.

## Llicència i ús

**© 2026 Robert Potau Nuñez. Tots els drets reservats.** Aquest no és programari de codi obert. Es pot veure el codi, però **no es permet copiar, modificar, redistribuir, tornar a publicar, extreure'n recursos ni fer-ne obres derivades** sense permís escrit, tampoc mitjançant eines automàtiques o assistents d'IA, ni usar-lo per entrenar models. Jugar-hi és gratuït i es pot fer servir als centres educatius si s'accedeix per la via oficial. Detall a [LICENSE](LICENSE) i als [Termes d'ús](https://robertpotau.github.io/termes.html).

Les traduccions, adaptacions i versions a mida (per exemple amb el logo d'un centre) són possibles **només com a encàrrec retribuït**, per correu.

## Contribucions

No s'accepten contribucions de codi ni de contingut sense acord previ. Si has trobat un error o tens una proposta, escriu per correu (vegeu més avall). Per a incidències de seguretat, mira [SECURITY.md](SECURITY.md).

## Contacte

Robert Potau Nuñez · robertpotau@gmail.com
