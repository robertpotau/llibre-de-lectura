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
    justso: {
      id: "justso",
      titolEn: "Just So Stories",
      titolCa: "Contes perquè sí",
      autor: "Rudyard Kipling",
      capitols: seq(201, 13),
      audio: "../audio/justso/",
      credit: "Text original de Rudyard Kipling (1902), domini públic.",
      creditGravat: "Il·lustració de Joseph M. Gleeson (1912) o dibuix del mateix Rudyard Kipling (1902), domini públic.",
      protagonista: "l'Elefantet",
      motiuEspecial: "elefant",
      especial: {
        definicio: "Carta del llibre complet: has llegit tots els contes de Kipling i has superat el repte final.",
        exemple: "Enhorabona! Has arribat al final del llibre.",
      },
      // repte final del llibre: una pregunta per capítol; la primera opció és la correcta (es barregen en mostrar-les)
      repteFinal: {
        intro: "Has arribat al final dels Contes perquè sí! Ara, 13 preguntes: una de cada capítol.",
        final: "Has llegit tots els contes de Kipling d'aquest llibre i has superat el repte final. Enhorabona, oh, Tresor meu!",
        cita: "«Soc el Gat que va tot sol, i tots els llocs són iguals per a mi.»",
        preguntes: [
          { cap: 1, e: "Què posa el Mariner a la gola de la Balena perquè no pugui empassar-se ningú més?", o: ["Una reixa feta amb la bassa i lligada amb els tirants", "La seva navalla", "Un tros de vela"],
            p: ["Ho fa amb la navalla, però no és la navalla.", "Per això les balenes d'avui només mengen peixets."] },
          { cap: 2, e: "Per què el Camell acaba amb una gepa?", o: ["Perquè no vol treballar i només diu «Gep!»", "Perquè menja massa", "Perquè el Cavall li dona un cop"],
            p: ["El Geni de Tots els Deserts li ho demana tres vegades.", "La gepa li permet treballar tres dies sense menjar."] },
          { cap: 3, e: "Com es venja el parsi del Rinoceront que li va menjar el pastís?", o: ["Li omple la pell de molles de pastís", "Li amaga el barret", "Li llança pedres"],
            p: ["El Rinoceront s'havia tret la pell per banyar-se.", "Les molles li piquen tant que la pell se li arruga."] },
          { cap: 4, e: "Com s'allarga el nas de l'Elefantet?", o: ["El Cocodril l'estira des del riu Limpopo", "Hi creix sol a poc a poc", "Un ocell li estira mentre dorm"],
            p: ["Ell volia saber què sopa el Cocodril.", "La Serp Pitó de Roca Bicolor l'ajuda a estirar cap enrere."] },
          { cap: 5, e: "Per què el Vell Cangur té les potes del darrere tan fortes i la cua tan llarga?", o: ["Perquè en Dingo l'empaita tot el dia i ha de saltar", "Perquè neda molt", "Perquè s'enfila als arbres"],
            p: ["Ell volia ser diferent de tots els altres animals.", "Al riu Wollgong no hi havia cap pont."] },
          { cap: 6, e: "Què fan l'Eriçó i la Tortuga per enganyar el Jaguar Pintat?", o: ["Aprenen l'un de l'altra i es tornen armadillos", "Se'n van a viure a una altra selva", "S'amaguen dins el riu"],
            p: ["L'Eriçó aprèn a nedar i la Tortuga, a cargolar-se.", "Al final tots dos tenen escates."] },
          { cap: 7, e: "Per què la tribu creu que l'Home Foraster ha fet mal a en Tegumai?", o: ["Pel dibuix que la Taffy envia a la seva mare", "Perquè l'han vist amb una llança", "Perquè no parla la seva llengua"],
            p: ["La Taffy volia demanar una llança nova per al seu pare.", "Els dibuixos no sempre s'entenen bé."] },
          { cap: 8, e: "Què inventen la Taffy i el seu pare en aquest conte?", o: ["Les lletres, dibuixant els sons", "Els números", "La pintura de colors"],
            p: ["La primera és la boca oberta de la carpa: «a».", "Al final en surt un collaret amb totes."] },
          { cap: 9, e: "Què va dir el Mag Més Antic a cada animal al Primer Començament?", o: ["Que jugués a ser el que havia de ser", "Que se n'anés a dormir", "Que obeís en Pau Amma"],
            p: ["A l'Elefant li va dir que jugués a ser un elefant.", "En Pau Amma no va voler fer-ho."] },
          { cap: 10, e: "Per què el mar puja i baixa dues vegades al dia?", o: ["Perquè en Pau Amma surt i torna al seu cau", "Perquè la Lluna hi beu", "Perquè la Balena s'hi banya"],
            p: ["El Cranc gegant vivia al fons del mar.", "El Mag li va deixar sortir a buscar menjar un cop de dia i un cop de nit."] },
          { cap: 11, e: "Quins animals es fan amics o servents de l'Home i la Dona en aquesta part?", o: ["El Gos, el Cavall i la Vaca", "El Gat i el Ratpenat", "El Lleó i l'Óssa"],
            p: ["Es diuen el Primer Amic, el Primer Servent i la Donadora de Bon Menjar.", "El Gat diu que no és ni amic ni servent."] },
          { cap: 12, e: "Què aconsegueix el Gat gràcies a les tres paraules de lloança de la Dona?", o: ["Seure vora el foc i beure llet calenta", "Anar a caçar amb l'Home", "Dormir amb el Gos"],
            p: ["Primer fa riure el Nadó.", "Després caça un ratolí."] },
          { cap: 13, e: "Què fa en realitat la Papallona quan pica de peus?", o: ["Res: és Suleiman-bin-Daud qui fa la màgia", "Fa desaparèixer el palau", "Crida tots els genis"],
            p: ["La Balquis va demanar a Suleiman que l'ajudés.", "Les 999 esposes s'espanten i deixen de barallar-se."] },
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
