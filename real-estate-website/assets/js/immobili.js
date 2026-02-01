/**
 * immobili.js - Pagina elenco immobili con filtri e ordinamento
 * Carica dati da JSON, applica filtri (vendita/affitto, prezzo, località, tipologia),
 * ordinamento (prezzo crescente/decrescente, più recenti), render grid responsive.
 * Eseguito solo su immobili.html. Codice modulare, UI accessibile.
 */

(function () {
  'use strict';

  var IMMOBILI_JSON_PATH = 'data/immobili.json';
  var SELECTORS = {
    grid: '#immobili-grid',
    fallback: '#immobili-fallback',
    resultCount: '#immobili-result-count',
    form: '#filtri-immobili-form'
  };

  /** Cache dati: tutti gli immobili caricati */
  var allImmobili = [];

  /**
   * Fetch del JSON immobili.
   * @returns {Promise<Array>}
   */
  function fetchImmobili() {
    return fetch(IMMOBILI_JSON_PATH)
      .then(function (res) {
        if (!res.ok) throw new Error('Risposta non ok: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        return Array.isArray(data) ? data : [];
      })
      .catch(function () {
        return [];
      });
  }

  /**
   * Legge i valori correnti del form filtri.
   * @returns {{ contratto: string, prezzoMin: number|null, prezzoMax: number|null, localita: string, tipoImmobile: string, ordine: string }}
   */
  function getFiltersFromForm() {
    var form = document.querySelector(SELECTORS.form);
    if (!form) {
      return {
        contratto: '',
        prezzoMin: null,
        prezzoMax: null,
        localita: '',
        tipoImmobile: '',
        ordine: 'recente'
      };
    }
    var prezzoMinVal = form.querySelector('[name="prezzo-min"]') && form.querySelector('[name="prezzo-min"]').value.trim();
    var prezzoMaxVal = form.querySelector('[name="prezzo-max"]') && form.querySelector('[name="prezzo-max"]').value.trim();
    return {
      contratto: (form.querySelector('[name="contratto"]') && form.querySelector('[name="contratto"]').value) || '',
      prezzoMin: prezzoMinVal === '' ? null : parseInt(prezzoMinVal, 10),
      prezzoMax: prezzoMaxVal === '' ? null : parseInt(prezzoMaxVal, 10),
      localita: (form.querySelector('[name="localita"]') && form.querySelector('[name="localita"]').value) || '',
      tipoImmobile: (form.querySelector('[name="tipo-immobile"]') && form.querySelector('[name="tipo-immobile"]').value) || '',
      ordine: (form.querySelector('[name="ordine"]') && form.querySelector('[name="ordine"]').value) || 'recente'
    };
  }

  /**
   * Applica i filtri all’array di immobili.
   * @param {Array} immobili
   * @param {Object} filters - output di getFiltersFromForm
   * @returns {Array}
   */
  function filterImmobili(immobili, filters) {
    return immobili.filter(function (item) {
      if (filters.contratto && item.tipologia !== filters.contratto) return false;
      var prezzo = typeof item.prezzo === 'number' ? item.prezzo : 0;
      if (filters.prezzoMin != null && !isNaN(filters.prezzoMin) && prezzo < filters.prezzoMin) return false;
      if (filters.prezzoMax != null && !isNaN(filters.prezzoMax) && prezzo > filters.prezzoMax) return false;
      if (filters.localita && item.citta !== filters.localita) return false;
      if (filters.tipoImmobile && (item.tipoImmobile || '') !== filters.tipoImmobile) return false;
      return true;
    });
  }

  /**
   * Ordina l’array in base al criterio scelto.
   * @param {Array} immobili
   * @param {string} ordine - 'prezzo-crescente' | 'prezzo-decrescente' | 'recente'
   * @returns {Array} Nuovo array ordinato (non muta l’originale)
   */
  function sortImmobili(immobili, ordine) {
    var list = immobili.slice();
    if (ordine === 'prezzo-crescente') {
      list.sort(function (a, b) {
        return (a.prezzo || 0) - (b.prezzo || 0);
      });
    } else if (ordine === 'prezzo-decrescente') {
      list.sort(function (a, b) {
        return (b.prezzo || 0) - (a.prezzo || 0);
      });
    } else {
      list.sort(function (a, b) {
        var dateA = a.dataInserimento || '';
        var dateB = b.dataInserimento || '';
        return dateB.localeCompare(dateA);
      });
    }
    return list;
  }

  /**
   * Prima immagine di un immobile (src e alt). Fallback se manca.
   */
  function getPrimaImmagine(immobile) {
    var immagini = immobile.immagini;
    if (immagini && immagini.length > 0 && immagini[0].src) {
      return { src: immagini[0].src, alt: immagini[0].alt || immobile.titolo };
    }
    return { src: 'assets/img/placeholders/placeholder.jpg', alt: immobile.titolo || 'Immobile' };
  }

  /**
   * Classe e testo badge vendita/affitto.
   */
  function getBadge(tipologia) {
    var isAffitto = tipologia === 'affitto';
    return {
      class: isAffitto ? 'badge badge--affitto' : 'badge badge--vendita',
      text: isAffitto ? 'Affitto' : 'Vendita'
    };
  }

  /**
   * Escape per HTML (evita XSS).
   */
  function escapeHtml(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Costruisce l’HTML di una singola card. Immagini con loading="lazy".
   */
  function buildCardHtml(immobile) {
    var img = getPrimaImmagine(immobile);
    var badge = getBadge(immobile.tipologia);
    var meta = immobile.superficie + ' m² · ' + immobile.locali + ' locali · ' + immobile.citta;
    var linkDettaglio = 'immobile.html?id=' + encodeURIComponent(immobile.id);
    return (
      '<article class="card-immobile">' +
        '<div class="card-immobile__media">' +
          '<img src="' + escapeHtml(img.src) + '" width="400" height="300" alt="' + escapeHtml(img.alt) + '" loading="lazy" decoding="async">' +
          '<div class="card-immobile__badge-wrap">' +
            '<span class="' + escapeHtml(badge.class) + '">' + escapeHtml(badge.text) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="card-immobile__body">' +
          '<h2 class="card-immobile__title">' + escapeHtml(immobile.titolo) + '</h2>' +
          '<div class="card-immobile__meta">' + escapeHtml(meta) + '</div>' +
          '<p class="card-immobile__price">' + escapeHtml(immobile.prezzoDisplay || '') + '</p>' +
          '<a href="' + escapeHtml(linkDettaglio) + '" class="btn btn--primary btn--sm">Dettagli</a>' +
        '</div>' +
      '</article>'
    );
  }

  /**
   * Popola le select Località e Tipologia con valori unici dai dati.
   */
  function populateFilterOptions(immobili) {
    var citta = [];
    var tipi = [];
    immobili.forEach(function (item) {
      if (item.citta && citta.indexOf(item.citta) === -1) citta.push(item.citta);
      if (item.tipoImmobile && tipi.indexOf(item.tipoImmobile) === -1) tipi.push(item.tipoImmobile);
    });
    citta.sort();
    tipi.sort();

    var selectLocalita = document.querySelector('[name="localita"]');
    var selectTipo = document.querySelector('[name="tipo-immobile"]');
    if (selectLocalita) {
      var currentLocalita = selectLocalita.value;
      selectLocalita.innerHTML = '<option value="">Tutte le località</option>' +
        citta.map(function (c) {
          return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
        }).join('');
      if (currentLocalita) selectLocalita.value = currentLocalita;
    }
    if (selectTipo) {
      var currentTipo = selectTipo.value;
      selectTipo.innerHTML = '<option value="">Tutte le tipologie</option>' +
        tipi.map(function (t) {
          return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
        }).join('');
      if (currentTipo) selectTipo.value = currentTipo;
    }
  }

  /**
   * Aggiorna il messaggio “X risultati” e annuncia per screen reader (aria-live).
   */
  function updateResultCount(count) {
    var el = document.querySelector(SELECTORS.resultCount);
    if (!el) return;
    if (count === 0) {
      el.textContent = 'Nessun immobile trovato. Prova a modificare i filtri.';
    } else {
      el.textContent = count === 1 ? '1 immobile trovato' : count + ' immobili trovati';
    }
  }

  /**
   * Renderizza la griglia: card o fallback.
   */
  function renderGrid(filtered) {
    var gridEl = document.querySelector(SELECTORS.grid);
    var fallbackEl = document.querySelector(SELECTORS.fallback);
    if (!gridEl) return;

    if (filtered.length === 0) {
      gridEl.style.display = 'none';
      gridEl.innerHTML = '';
      if (fallbackEl) fallbackEl.style.display = 'block';
      updateResultCount(0);
      return;
    }

    if (fallbackEl) fallbackEl.style.display = 'none';
    gridEl.style.display = '';
    gridEl.innerHTML = filtered.map(buildCardHtml).join('');
    updateResultCount(filtered.length);
  }

  /**
   * Applica filtri + ordinamento e ridisegna la griglia.
   */
  function applyFiltersAndRender() {
    var filters = getFiltersFromForm();
    var filtered = filterImmobili(allImmobili, filters);
    var sorted = sortImmobili(filtered, filters.ordine);
    renderGrid(sorted);
  }

  /**
   * Inizializzazione: eseguita solo se siamo sulla pagina immobili (form o grid presenti).
   */
  function init() {
    var form = document.querySelector(SELECTORS.form);
    var gridEl = document.querySelector(SELECTORS.grid);
    if (!form && !gridEl) return;

    fetchImmobili()
      .then(function (data) {
        allImmobili = data;
        populateFilterOptions(allImmobili);
        applyFiltersAndRender();

        if (form) {
          form.addEventListener('change', applyFiltersAndRender);
          form.addEventListener('input', function (e) {
            if (e.target && (e.target.name === 'prezzo-min' || e.target.name === 'prezzo-max')) {
              applyFiltersAndRender();
            }
          });
        }
      })
      .catch(function () {
        renderGrid([]);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
