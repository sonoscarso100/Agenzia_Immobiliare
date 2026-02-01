# Template sito agenzia immobiliare

## Scopo del progetto

Template **multi-agenzia** per siti web di agenzie immobiliari.  
Utilizza **solo tecnologie standard**: HTML5 semantico, CSS3 e JavaScript vanilla, senza framework né dipendenze esterne.  
Obiettivi:

- **Riutilizzo**: stesso codice base per più agenzie, personalizzando contenuti, colori e font.
- **Manutenibilità**: codice pulito, commentato e leggibile.
- **Indipendenza**: nessuna build, nessun package manager; apri i file e modifica.

Adatto a chi vuole un sito veloce, leggero e facile da personalizzare.

---

## Struttura del progetto

```
real-estate-website/
├── index.html              # Home page
├── immobili.html           # Elenco immobili
├── immobile.html           # Dettaglio singolo immobile
├── chi-siamo.html          # Pagina Chi siamo
├── servizi.html            # Pagina Servizi
├── contatti.html           # Pagina Contatti
├── assets/
│   ├── css/
│   │   ├── reset.css       # Reset/normalizzazione stili
│   │   ├── variables.css   # Variabili (colori, font, spaziature)
│   │   ├── layout.css      # Griglia e layout generale
│   │   ├── components.css  # Componenti riutilizzabili (card, bottoni, ecc.)
│   │   └── responsive.css  # Media query e layout responsive
│   ├── js/
│   │   ├── main.js         # Logica comune (menu, footer, ecc.)
│   │   ├── immobili.js     # Logica elenco e dettaglio immobili
│   │   └── form.js         # Gestione form (es. contatti)
│   ├── img/
│   │   └── placeholders/   # Immagini placeholder
│   └── fonts/              # Font personalizzati (se usati)
├── data/
│   └── immobili.json       # Dati immobili (elenco e dettagli)
├── sitemap.xml             # Sitemap per i motori di ricerca
├── robots.txt              # Regole per crawler
└── README.md
```

- **Pagine HTML**: una per sezione del sito; i contenuti degli immobili vengono letti da `data/immobili.json` e/o renderizzati via JS.
- **CSS**: `variables.css` è il punto centrale per personalizzare look (colori, font); gli altri file organizzano reset, layout, componenti e responsive.
- **JS**: `main.js` per comportamento globale; `immobili.js` per liste e scheda immobile; `form.js` per i form.
- **data/immobili.json**: unica fonte dati per gli immobili; aggiungendo o modificando oggetti qui si aggiorna il sito senza toccare l’HTML delle pagine.

---

## Come aggiungere nuovi immobili

1. Apri **`data/immobili.json`**.
2. Aggiungi un nuovo oggetto nell’array, seguendo la stessa struttura degli altri (es. `id`, `titolo`, `descrizione`, `prezzo`, `metri`, `locali`, `indirizzo`, `tipologia`, `immagini`, ecc.). La struttura esatta dipenderà dall’implementazione in `immobili.js` e `immobile.html`.
3. Salva il file.
4. L’elenco in **immobili.html** e la scheda in **immobile.html** (con query string o hash per l’`id`) mostreranno il nuovo immobile una volta implementata la lettura del JSON e il rendering in **immobili.js**.

Consiglio: mantieni uno stesso schema per tutti gli immobili (stessi campi) così il codice JS resta semplice e riutilizzabile per ogni agenzia.

---

## Come personalizzare colori e font

### Colori

- Apri **`assets/css/variables.css`**.
- Modifica le variabili CSS (es. `--colore-primario`, `--colore-secondario`, `--colore-testo`, `--colore-sfondo`). Usa queste variabili in tutti gli altri file CSS (`layout.css`, `components.css`, `responsive.css`) invece di valori fissi.
- Salva: le pagine che includono `variables.css` mostreranno subito i nuovi colori.

### Font

- **Font di sistema**: in **`assets/css/variables.css`** imposta le variabili per i font (es. `--font-principale`, `--font-secondario`) e assegna famiglie come `"Georgia", serif` o `"Segoe UI", sans-serif`.
- **Font personalizzati**: metti i file dei font (es. `.woff2`, `.woff`) in **`assets/fonts/`**, dichiara i `@font-face` in **`variables.css`** (o in un file CSS dedicato incluso prima degli altri) e assegna la famiglia alle variabili (es. `--font-principale: "NomeFont", sans-serif;`).

Usando solo `variables.css` per colori e font, il template resta **multi-agenzia**: ogni agenzia può avere un proprio `variables.css` (o una copia del progetto) con palette e font diversi senza modificare il resto del codice.

---

## SEO tecnico

### Schema.org

- **RealEstateAgent**: su tutte le pagine che caricano `main.js` viene iniettato un blocco JSON-LD `RealEstateAgent` (nome, descrizione, url, telefono, indirizzo, areaServed). Personalizza i dati in `injectRealEstateAgentSchema()` in **`assets/js/main.js`** (telefono, indirizzo, nome agenzia).
- **Offer**: sulla pagina dettaglio immobile (`immobile.html`) viene iniettato un JSON-LD `Offer` per l’annuncio (nome, descrizione, prezzo, url, disponibilità, seller). Generato dinamicamente da **`main.js`** in base ai dati del singolo immobile.

### Sitemap e robots

- **`sitemap.xml`**: elenca le pagine principali (index, immobili, immobile, chi-siamo, servizi, contatti). **Sostituisci** `https://example.com` con l’URL reale del sito in ogni `<loc>` e aggiorna `<lastmod>` quando modifichi le pagine.
- **`robots.txt`**: consente a tutti i crawler (`User-agent: *`, `Allow: /`) e indica la posizione della sitemap. **Sostituisci** `https://example.com` con il tuo dominio nella riga `Sitemap:`.

In produzione usa sempre URL assoluti nella sitemap e in `robots.txt`.

---

## Performance e Lighthouse (>90)

### Lazy loading immagini

- Le immagini nelle card immobili (home e elenco) hanno **`loading="lazy"`** e **`decoding="async"`** (generate da `main.js` e `immobili.js`).
- Le immagini sotto la fold nelle pagine statiche (chi-siamo, contatti) hanno **`loading="lazy"`** e **`decoding="async"`**.
- L’immagine principale della galleria nella pagina immobile usa **`loading="eager"`** (LCP); le thumb usano lazy loading.

### Suggerimenti per Lighthouse

- **Meta e titoli**: ogni pagina ha `title` e `meta name="description"` univoci; sulla pagina immobile sono aggiornati dinamicamente.
- **Dimensioni immagini**: tutte le `<img>` hanno **`width`** e **`height`** per evitare layout shift (CLS).
- **Font e CSS**: nessun font esterno; i CSS sono caricati in ordine (reset → variables → layout → components → responsive). Per ulteriori ottimizzazioni puoi minificare CSS/JS in build.
- **JavaScript**: nessun framework; script vanilla. Per migliorare “Time to Interactive” evita script pesanti e mantieni gli handler (es. scroll/click) ottimizzati.
- **Accessibilità**: struttura semantica (header, nav, main, section, article, footer), label sui form, `aria-*` dove serve, contrasto colori definito in `variables.css`.
- **Best practice**: nessun contenuto misto (tutto HTTP o tutto HTTPS); in produzione usa HTTPS e una cache adeguata (header HTTP) per asset statici.

Eseguendo Lighthouse in modalità navigazione anonima, con cache abilitata e da una connessione stabile, il template è pensato per ottenere punteggi >90 in Performance, Accessibilità, Best Practice e SEO, a patto di sostituire `example.com` in sitemap/robots e di usare immagini reali ottimizzate (formato WebP, dimensioni adeguate).
