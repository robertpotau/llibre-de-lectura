// © 2026 Robert Potau Nuñez. Tots els drets reservats / All rights reserved. Vegeu LICENSE.
// Manifest dels llibres jugables i selecció del llibre actiu (?llibre=princep, o l'última tria desada a llibre.actiu).
// Cada llibre té els seus capítols amb ids únics (Alícia c01–c12, El Príncep Feliç c101–c108) perquè les claus
// de localStorage (cartes, marcapàgines, reptes) no es barregin. Només es carreguen les dades del llibre actiu.
(function () {
  "use strict";
  const seq = (ini, n) => Array.from({ length: n }, (_, i) => "c" + String(ini + i).padStart(2, "0"));
  const LLIBRES = {
    alice: {
      id: "alice",
      titolEn: "Alice's Adventures in Wonderland",
      titolCa: "Alícia al País de les Meravelles",
      autor: "Lewis Carroll",
      capitols: seq(1, 12),
      audio: "../audio/alice/",
      credit: "Text original de Lewis Carroll (1865), domini públic.",
      creditGravat: "Gravat de John Tenniel (1865), domini públic.",
      protagonista: "l'Alícia",
      especial: {
        definicio: "Carta del llibre complet: has llegit totes les aventures de l'Alícia i has superat el repte final.",
        exemple: "Enhorabona! Has arribat al final del llibre.",
      },
    },
    princep: {
      id: "princep",
      titolEn: "The Happy Prince and Other Tales",
      titolCa: "El Príncep Feliç i altres contes",
      autor: "Oscar Wilde",
      capitols: seq(101, 8),
      audio: "../audio/princep/",
      credit: "Text original d'Oscar Wilde (1888), domini públic.",
      creditGravat: "Il·lustració de Walter Crane o de George Percy Jacomb-Hood (1888), domini públic.",
      protagonista: "l'Oreneta",
      especial: {
        definicio: "Carta del llibre complet: has llegit tots els contes d'Oscar Wilde i has superat el repte final.",
        exemple: "Enhorabona! Has arribat al final del llibre.",
      },
      // repte final del llibre (src/repte-llibre.js): una pregunta per capítol; la primera opció és la correcta (es barregen en mostrar-les)
      repteFinal: {
        intro: "Has arribat al final d'El Príncep Feliç i altres contes! Ara, 8 preguntes: una de cada capítol.",
        final: "Has llegit els cinc contes d'Oscar Wilde d'aquest llibre i has superat el repte final. Enhorabona!",
        cita: "«Has triat bé: aquest ocellet cantarà per sempre, i el Príncep Feliç em lloarà.»",
        preguntes: [
          { cap: 1, e: "Què porta l'Oreneta a la casa pobra de la modista?", o: ["El gran robí de l'espasa del Príncep", "Un safir dels ulls del Príncep", "Una làmina d'or de la capa"],
            p: ["Pensa en què havia al capdamunt de l'espasa.", "És una pedra preciosa vermella."] },
          { cap: 2, e: "Què fa l'Oreneta quan veu que el Príncep s'ha quedat cec?", o: ["Es queda amb ell per sempre", "Se'n va a Egipte", "Busca un altre amic"],
            p: ["El Príncep li demana que se'n vagi, però ella no l'escolta.", "Dorm als peus de l'estàtua."] },
          { cap: 3, e: "Com aconsegueix el Rossinyol que floreixi la rosa vermella?", o: ["Canta tota la nit amb el pit contra una espina", "Rega el rosal amb aigua del riu", "Demana ajuda a la Lluna"],
            p: ["El Rosal li va dir una manera «terrible».", "La rosa es tenyeix amb la sang del seu cor."] },
          { cap: 4, e: "Què passa al jardí del Gegant quan hi tornen els nens?", o: ["Hi torna la Primavera", "Hi cau una gran tempesta", "S'hi congela l'estany"],
            p: ["Els nens s'han esmunyit per un forat de la paret.", "Els arbres floreixen i els ocells canten."] },
          { cap: 5, e: "Què demana el Moliner a en Hans a canvi de «regalar-li» el carretó?", o: ["Un post, flors i moltes feines", "Els seus botons de plata", "La seva caseta"],
            p: ["Primer el post, després les flors.", "Sempre diu que l'amistat ho ha de compartir tot."] },
          { cap: 6, e: "Què li passa a en Hans la nit de la tempesta?", o: ["Es perd a la landa i s'ofega", "Arriba a casa del Metge i guanya un premi", "Es queda a casa del Moliner"],
            p: ["Va a buscar el Metge sense llanterna.", "No pot seguir el cavall del Metge."] },
          { cap: 7, e: "Què passa amb el Coet durant els focs artificials?", o: ["No es pot encendre perquè està moll de tant plorar", "Vola més amunt que tots els altres", "S'ofereix al Rei com a regal"],
            p: ["Plorava tant que se li va mullar la pólvora.", "Tots els seus parents van pujar al cel."] },
          { cap: 8, e: "Com s'acaba la història del Coet?", o: ["Explota sense que ningú el vegi", "Torna a la Cort", "El Príncep el guarda"],
            p: ["Dos nens el posen al foc.", "No el veu ni el sent ningú, ni tan sols els nens, que dormen."] },
        ],
      },
    },
  };
  let triat = null;
  const q = /[?&]llibre=([a-z]+)/.exec(location.search);
  if (q) triat = q[1];
  if (!LLIBRES[triat]) { try { triat = localStorage.getItem("llibre.actiu"); } catch (e) { /* sense desament */ } }
  if (!LLIBRES[triat]) triat = "alice";
  if (q) { try { localStorage.setItem("llibre.actiu", triat); } catch (e) { /* sense desament */ } }
  const L = LLIBRES[triat];
  L.ultim = L.capitols[L.capitols.length - 1];
  window.LLIBRES = LLIBRES;
  window.LLIBRE = L;
  // els scripts de dades i d'àudio del llibre actiu es carreguen en ordre, abans de capitol-actiu.js
  window.carregaScripts = (prefix) => L.capitols.forEach((c) => document.write('<script src="' + prefix + c + '.js"><\/script>'));
})();
