/**
 * main.js - Script principale template agenzia immobiliare
 * Gestisce:
 * - index.html: caricamento immobili in evidenza da JSON, render cards, fallback
 * - immobile.html: caricamento immobile da query string (?id=), galleria, dettagli, meta dinamici, JSON-LD Offer
 * Codice modulare e commentato.
 */

(function () {
  'use strict';

  var MAX_CARD_HOME = 6;
  var IMMOBILI_JSON_PATH = 'data/immobili.json';
  var HOME_GRID_SELECTOR = '#home-immobili-grid';
  var HOME_FALLBACK_SELECTOR = '#home-immobili-fallback';
  var IMMOBILE_DETAIL_SELECTOR = '#immobile-detail';
  var IMMOBILE_FALLBACK_SELECTOR = '#immobile-not-found';

  /**
   * Carica il JSON degli immobili via fetch.
   * @returns {Promise<Array>} Array di oggetti immobile (o array vuoto in caso di errore)
   */
  function fetchImmobili() {
    return fetch(IMMOBILI_JSON_PATH)
      .then(function (response) {
        if (!response.ok) throw new Error('Risposta non ok: ' + response.status);
        return response.json();
      })
      .then(function (data) {
        return Array.isArray(data) ? data : [];
      })
      .catch(function () {
        return [];
      });
  }

  /**
   * Restituisce i dati della prima immagine di un immobile (src e alt).
   * @param {Object} immobile - Oggetto immobile con proprietà immagini
   * @returns {{ src: string, alt: string }}
   */
  function getPrimaImmagine(immobile) {
    var immagini = immobile.immagini;
    if (immagini && immagini.length > 0 && immagini[0].src) {
      return { src: immagini[0].src, alt: immagini[0].alt || immobile.titolo };
    }
    return { src: 'assets/img/placeholders/placeholder.jpg', alt: immobile.titolo || 'Immobile' };
  }

  function getBadgeClass(tipologia) {
    return tipologia === 'affitto' ? 'badge badge--affitto' : 'badge badge--vendita';
  }

  function getBadgeText(tipologia) {
    return tipologia === 'affitto' ? 'Affitto' : 'Vendita';
  }

  /**
   * Escape caratteri speciali per uso in HTML (evita XSS).
   */
  function escapeHtml(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Costruisce il markup HTML di una singola card immobile (home).
   */
  function buildCardHtml(immobile) {
    var img = getPrimaImmagine(immobile);
    var badgeClass = getBadgeClass(immobile.tipologia);
    var badgeText = getBadgeText(immobile.tipologia);
    var meta = immobile.superficie + ' m² · ' + immobile.locali + ' locali · ' + immobile.citta;
    var linkDettaglio = 'immobile.html?id=' + encodeURIComponent(immobile.id);
    return (
      '<article class="card-immobile">' +
        '<div class="card-immobile__media">' +
          '<img src="' + escapeHtml(img.src) + '" width="400" height="300" alt="' + escapeHtml(img.alt) + '" loading="lazy" decoding="async">' +
          '<div class="card-immobile__badge-wrap">' +
            '<span class="' + escapeHtml(badgeClass) + '">' + escapeHtml(badgeText) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="card-immobile__body">' +
          '<h3 class="card-immobile__title">' + escapeHtml(immobile.titolo) + '</h3>' +
          '<div class="card-immobile__meta">' + escapeHtml(meta) + '</div>' +
          '<p class="card-immobile__price">' + escapeHtml(immobile.prezzoDisplay || '') + '</p>' +
          '<a href="' + escapeHtml(linkDettaglio) + '" class="btn btn--primary btn--sm">Dettagli</a>' +
        '</div>' +
      '</article>'
    );
  }

  function showFallback(gridEl, fallbackEl) {
    if (gridEl) gridEl.style.display = 'none';
    if (fallbackEl) fallbackEl.style.display = 'block';
  }

  function hideFallback(gridEl, fallbackEl) {
    if (fallbackEl) fallbackEl.style.display = 'none';
    if (gridEl) gridEl.style.display = '';
  }

  /**
   * Inizializzazione home: render fino a MAX_CARD_HOME card in #home-immobili-grid.
   */
  function initHomeImmobili() {
    var gridEl = document.querySelector(HOME_GRID_SELECTOR);
    var fallbackEl = document.querySelector(HOME_FALLBACK_SELECTOR);
    if (!gridEl) return;

    fetchImmobili()
      .then(function (immobili) {
        var slice = immobili.slice(0, MAX_CARD_HOME);
        if (slice.length === 0) {
          showFallback(gridEl, fallbackEl);
          return;
        }
        hideFallback(gridEl, fallbackEl);
        gridEl.innerHTML = slice.map(buildCardHtml).join('');
      })
      .catch(function () {
        showFallback(gridEl, fallbackEl);
      });
  }

  // ---------- Pagina dettaglio immobile (immobile.html) ----------

  /**
   * Legge un parametro dalla query string (?id=1).
   * @param {string} name - Nome del parametro
   * @returns {string|null} Valore o null
   */
  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    var val = params.get(name);
    return val !== null && val !== '' ? val : null;
  }

  /**
   * Trova un immobile nell’array per id (confronto stringa/numero).
   * @param {Array} immobili
   * @param {string} id - id dalla query (es. "1")
   * @returns {Object|null}
   */
  function findImmobileById(immobili, id) {
    if (!id || !immobili.length) return null;
    for (var i = 0; i < immobili.length; i++) {
      var item = immobili[i];
      if (String(item.id) === String(id)) return item;
    }
    return null;
  }

  /**
   * Aggiorna meta tag SEO della pagina (title e description).
   * @param {Object} immobile
   */
  function updateMetaTags(immobile) {
    var title = escapeHtml(immobile.titolo) + ' | Immobili | Agenzia Immobiliare';
    var desc = (immobile.descrizione || immobile.titolo + ', ' + immobile.superficie + ' m², ' + immobile.locali + ' locali, ' + immobile.citta + '. ' + (immobile.prezzoDisplay || '')).slice(0, 160);
    document.title = title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
  }

  /**
   * Inietta nello head il JSON-LD Offer per l’immobile (SEO).
   * @param {Object} immobile
   */
  function injectJsonLdOffer(immobile) {
    var existing = document.getElementById('jsonld-offer');
    if (existing) existing.remove();

    var url = window.location.href;
    var offer = {
      '@context': 'https://schema.org',
      '@type': 'Offer',
      name: immobile.titolo || '',
      description: immobile.descrizione || '',
      url: url,
      price: typeof immobile.prezzo === 'number' ? immobile.prezzo : 0,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Agenzia Immobiliare'
      }
    };
    var script = document.createElement('script');
    script.id = 'jsonld-offer';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(offer);
    document.head.appendChild(script);
  }

  /**
   * Costruisce la riga meta (città · m² · locali) per l’header.
   */
  function getMetaLine(immobile) {
    var parts = [];
    if (immobile.citta) parts.push(immobile.citta);
    if (immobile.superficie != null) parts.push(immobile.superficie + ' m²');
    if (immobile.locali != null) parts.push(immobile.locali + ' locali');
    return parts.join(' · ');
  }

  /**
   * Restituisce un array di voci per i dettagli tecnici (da oggetto dettagliTecnici + campi base).
   */
  function getDettagliTecniciList(immobile) {
    var list = [];
    if (immobile.superficie != null) list.push({ label: 'Superficie', value: immobile.superficie + ' m²' });
    if (immobile.locali != null) list.push({ label: 'Locali', value: String(immobile.locali) });
    if (immobile.citta) list.push({ label: 'Località', value: immobile.citta });
    if (immobile.tipoImmobile) list.push({ label: 'Tipologia', value: immobile.tipoImmobile });
    var dt = immobile.dettagliTecnici;
    if (dt && typeof dt === 'object') {
      var labels = { piano: 'Piano', riscaldamento: 'Riscaldamento', classeEnergetica: 'Classe energetica', annoCostruzione: 'Anno costruzione', stato: 'Stato', giardino: 'Giardino', postiAuto: 'Posti auto', terrazzo: 'Terrazzo', garage: 'Garage' };
      for (var key in dt) {
        if (dt.hasOwnProperty(key) && dt[key]) {
          list.push({ label: labels[key] || key, value: String(dt[key]) });
        }
      }
    }
    return list;
  }

  /**
   * Renderizza la galleria immagini: immagine principale + thumb (se più di una).
   */
  function renderGallery(container, immobile) {
    var immagini = immobile.immagini;
    if (!immagini || immagini.length === 0) {
      var img = getPrimaImmagine(immobile);
      container.innerHTML = '<figure class="immobile-gallery"><img src="' + escapeHtml(img.src) + '" width="720" height="540" alt="' + escapeHtml(img.alt) + '" loading="eager"></figure>';
      return;
    }
    var main = immagini[0];
    var html = '<figure class="immobile-gallery" role="group" aria-label="Galleria immagini">';
    html += '<img id="immobile-gallery-main" src="' + escapeHtml(main.src) + '" width="720" height="540" alt="' + escapeHtml(main.alt) + '" loading="eager">';
    if (immagini.length > 1) {
      html += '<figcaption class="immobile-gallery__thumbs">';
      for (var i = 0; i < immagini.length; i++) {
        var im = immagini[i];
        html += '<button type="button" class="immobile-gallery__thumb" data-index="' + i + '" aria-label="Vedi immagine ' + (i + 1) + '">';
        html += '<img src="' + escapeHtml(im.src) + '" width="80" height="60" alt="" loading="lazy" decoding="async">';
        html += '</button>';
      }
      html += '</figcaption>';
    }
    html += '</figure>';
    container.innerHTML = html;

    if (immagini.length > 1) {
      var mainImg = container.querySelector('#immobile-gallery-main');
      var thumbs = container.querySelectorAll('.immobile-gallery__thumb');
      thumbs.forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
          var im = immagini[idx];
          if (im && mainImg) {
            mainImg.src = im.src;
            mainImg.alt = im.alt || '';
          }
        });
      });
    }
  }

  /**
   * Popola il contenuto della pagina dettaglio e mostra il blocco.
   */
  function renderImmobileDetail(immobile) {
    var wrap = document.querySelector(IMMOBILE_DETAIL_SELECTOR);
    var fallback = document.querySelector(IMMOBILE_FALLBACK_SELECTOR);
    if (!wrap) return;

    fallback && (fallback.style.display = 'none');
    wrap.style.display = '';

    var badgeClass = getBadgeClass(immobile.tipologia);
    var badgeText = getBadgeText(immobile.tipologia);
    var metaLine = getMetaLine(immobile);
    var descrizione = immobile.descrizione || '';
    var dettagliList = getDettagliTecniciList(immobile);

    var breadcrumbEl = wrap.querySelector('#immobile-breadcrumb');
    if (breadcrumbEl) {
      var titoloSafe = escapeHtml(immobile.titolo);
      breadcrumbEl.innerHTML = '<ol style="list-style: none; display: flex; flex-wrap: wrap; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--color-neutral-500);">' +
        '<li><a href="index.html">Home</a></li><li aria-hidden="true">/</li>' +
        '<li><a href="immobili.html">Immobili</a></li><li aria-hidden="true">/</li>' +
        '<li aria-current="page">' + titoloSafe + '</li></ol>';
    }

    var headerEl = wrap.querySelector('#immobile-header');
    if (headerEl) {
      headerEl.innerHTML =
        '<span class="badge ' + escapeHtml(badgeClass) + '" style="margin-bottom: var(--space-3);">' + escapeHtml(badgeText) + '</span>' +
        '<h1 id="immobile-title">' + escapeHtml(immobile.titolo) + '</h1>' +
        '<p style="font-size: var(--font-size-lg); color: var(--color-neutral-600); margin-top: var(--space-2);">' + escapeHtml(metaLine) + '</p>' +
        '<p style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-primary); margin-top: var(--space-4);">' + escapeHtml(immobile.prezzoDisplay || '') + '</p>';
    }

    var galleryEl = wrap.querySelector('#immobile-gallery');
    if (galleryEl) renderGallery(galleryEl, immobile);

    var descEl = wrap.querySelector('#immobile-descrizione');
    if (descEl) {
      descEl.innerHTML = descrizione ? '<h2 id="descrizione">Descrizione</h2><p>' + escapeHtml(descrizione) + '</p>' : '';
    }

    var dettagliEl = wrap.querySelector('#immobile-dettagli');
    if (dettagliEl && dettagliList.length > 0) {
      var ul = dettagliList.map(function (d) {
        return '<li><strong>' + escapeHtml(d.label) + ':</strong> ' + escapeHtml(d.value) + '</li>';
      }).join('');
      dettagliEl.innerHTML = '<h2 id="caratteristiche">Caratteristiche</h2><ul style="list-style: disc; padding-left: var(--space-6);">' + ul + '</ul>';
    }

    var ctaEl = wrap.querySelector('#immobile-cta');
    if (ctaEl) {
      ctaEl.innerHTML = '<h2 id="contatto-immobile">Richiedi informazioni</h2><p>Per visite o dettagli contatta la nostra agenzia.</p><a href="contatti.html" class="btn btn--primary btn--lg" style="margin-top: var(--space-4);">Contattaci</a>';
    }
  }

  /**
   * Mostra il messaggio "Immobile non trovato" e nasconde il dettaglio.
   */
  function showImmobileFallback() {
    var wrap = document.querySelector(IMMOBILE_DETAIL_SELECTOR);
    var fallback = document.querySelector(IMMOBILE_FALLBACK_SELECTOR);
    if (wrap) wrap.style.display = 'none';
    if (fallback) fallback.style.display = 'block';
  }

  /**
   * Inizializzazione pagina dettaglio: legge ?id=, carica JSON, trova immobile, aggiorna meta, JSON-LD, render.
   */
  function initImmobileDetail() {
    var wrap = document.querySelector(IMMOBILE_DETAIL_SELECTOR);
    if (!wrap) return;

    var id = getQueryParam('id');
    if (!id) {
      showImmobileFallback();
      return;
    }

    fetchImmobili()
      .then(function (immobili) {
        var immobile = findImmobileById(immobili, id);
        if (!immobile) {
          showImmobileFallback();
          return;
        }
        updateMetaTags(immobile);
        injectJsonLdOffer(immobile);
        renderImmobileDetail(immobile);
      })
      .catch(function () {
        showImmobileFallback();
      });
  }

  // ---------- Schema.org RealEstateAgent (SEO) ----------

  var JSONLD_AGENT_ID = 'jsonld-real-estate-agent';

  /**
   * Inietta nello head il JSON-LD RealEstateAgent (Schema.org) per l’agenzia.
   * Usa l’origine della pagina come base URL. Eseguito una volta al boot.
   */
  function injectRealEstateAgentSchema() {
    if (document.getElementById(JSONLD_AGENT_ID)) return;

    var path = window.location.pathname || '/';
    var base = window.location.origin + path.replace(/\/[^/]*$/, '/');
    if (base.indexOf('http') !== 0) base = 'https://example.com/';

    var schema = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      '@id': base + '#agency',
      name: 'Agenzia Immobiliare',
      description: 'Vendita e affitto di immobili. Consulenza professionale e trasparente.',
      url: base + 'index.html',
      telephone: '+39-02-1234567',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Via Example 1',
        addressLocality: 'Milano',
        postalCode: '20100',
        addressCountry: 'IT'
      },
      areaServed: { '@type': 'Country', name: 'Italia' }
    };

    var script = document.createElement('script');
    script.id = JSONLD_AGENT_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // ---------- Menu hamburger e CTA sticky (responsive) ----------

  var HEADER_SELECTOR = '.layout-header';
  var HAMBURGER_SELECTOR = '.layout-header__hamburger';
  var NAV_OPEN_CLASS = 'layout-header--nav-open';
  var CTA_STICKY_VISIBLE_CLASS = 'layout-cta-sticky-visible';

  /**
   * Crea il bottone hamburger (icona 3 linee) e lo inserisce nell’header.
   * Toggle nav su click, chiude su Escape e su click link (navigazione).
   * Aggiorna aria-expanded per accessibilità.
   */
  function initHeaderMobile() {
    var header = document.querySelector(HEADER_SELECTOR);
    var nav = header && header.querySelector('.layout-header__nav');
    if (!header || !nav) return;

    var existing = header.querySelector(HAMBURGER_SELECTOR);
    if (existing) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layout-header__hamburger';
    btn.setAttribute('aria-label', 'Apri menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', nav.id || 'nav-main');
    btn.innerHTML = '<span class="layout-header__hamburger-icon" aria-hidden="true"><span></span><span></span><span></span></span>';

    if (!nav.id) nav.id = 'nav-main';

    btn.addEventListener('click', function () {
      var open = header.classList.toggle(NAV_OPEN_CLASS);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove(NAV_OPEN_CLASS);
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Apri menu');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains(NAV_OPEN_CLASS)) {
        header.classList.remove(NAV_OPEN_CLASS);
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Apri menu');
        btn.focus();
      }
    });

    var inner = header.querySelector('.layout-header__inner');
    if (inner) inner.appendChild(btn);
  }

  /**
   * Inietta la barra CTA sticky (Sfoglia immobili / Contattaci) e mostra solo su mobile.
   * Aggiunge classe al body per padding-bottom del main (evita sovrapposizione).
   */
  function initCtaSticky() {
    if (document.querySelector('.layout-cta-sticky')) return;

    var bar = document.createElement('div');
    bar.className = 'layout-cta-sticky';
    bar.setAttribute('aria-label', 'Azioni rapide');
    bar.innerHTML = '<a href="immobili.html" class="btn btn--accent btn--sm">Sfoglia immobili</a><a href="contatti.html" class="btn btn--secondary btn--sm">Contattaci</a>';

    document.body.appendChild(bar);
    document.body.classList.add(CTA_STICKY_VISIBLE_CLASS);
  }

  /**
   * Avvio: hamburger e CTA sticky su tutte le pagine; poi home o dettaglio immobile.
   */
  function boot() {
    injectRealEstateAgentSchema();
    initHeaderMobile();
    initCtaSticky();

    var isImmobilePage = document.querySelector(IMMOBILE_DETAIL_SELECTOR) !== null;
    if (isImmobilePage) {
      initImmobileDetail();
    } else {
      initHomeImmobili();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
