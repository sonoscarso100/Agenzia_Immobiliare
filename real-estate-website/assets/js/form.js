/**
 * form.js - Form contatti con validazione JS e consenso GDPR
 * Validazione campi, checkbox consenso obbligatoria, messaggi errore accessibili.
 * Nessun backend: in caso di successo viene mostrato un messaggio di conferma.
 */

(function () {
  'use strict';

  var FORM_ID = 'form-contatti';
  var ALERT_LIVE_ID = 'form-contatti-alert';
  var SUCCESS_ID = 'form-contatti-success';

  /** Regole di validazione: min length, pattern, ecc. */
  var RULES = {
    nome: { required: true, minLength: 2, maxLength: 200 },
    email: { required: true },
    telefono: { required: false, pattern: /^[\d\s\+\-\(\)]{8,20}$/ },
    messaggio: { required: true, minLength: 10, maxLength: 2000 },
    gdpr: { required: true }
  };

  /** Messaggi di errore in italiano */
  var MESSAGES = {
    required: 'Campo obbligatorio.',
    nome_minLength: 'Inserisci almeno 2 caratteri.',
    nome_maxLength: 'Nome troppo lungo.',
    email_invalid: 'Inserisci un indirizzo email valido.',
    telefono_invalid: 'Formato telefono non valido (es. +39 333 1234567).',
    messaggio_minLength: 'Il messaggio deve contenere almeno 10 caratteri.',
    messaggio_maxLength: 'Messaggio troppo lungo.',
    gdpr_required: 'Devi accettare il trattamento dei dati per inviare il modulo.'
  };

  /**
   * Restituisce l’elemento form contatti (solo su contatti.html).
   */
  function getForm() {
    return document.getElementById(FORM_ID);
  }

  /**
   * Restituisce il valore di un campo (input, textarea, select) o di una checkbox.
   */
  function getFieldValue(form, name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? '1' : '';
    return (el.value || '').trim();
  }

  /**
   * Verifica se una stringa è un’email valida (formato base).
   */
  function isValidEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  /**
   * Esegue la validazione di tutti i campi e restituisce oggetto { valid, errors }.
   * @param {HTMLFormElement} form
   * @returns {{ valid: boolean, errors: Object.<string, string> }}
   */
  function validateForm(form) {
    var errors = {};
    var nome = getFieldValue(form, 'nome');
    var email = getFieldValue(form, 'email');
    var telefono = getFieldValue(form, 'telefono');
    var messaggio = getFieldValue(form, 'messaggio');
    var gdpr = getFieldValue(form, 'gdpr');

    if (RULES.nome.required && !nome) {
      errors.nome = MESSAGES.required;
    } else if (nome.length > 0 && nome.length < RULES.nome.minLength) {
      errors.nome = MESSAGES.nome_minLength;
    } else if (nome.length > RULES.nome.maxLength) {
      errors.nome = MESSAGES.nome_maxLength;
    }

    if (RULES.email.required && !email) {
      errors.email = MESSAGES.required;
    } else if (email && !isValidEmail(email)) {
      errors.email = MESSAGES.email_invalid;
    }

    if (telefono && RULES.telefono.pattern && !RULES.telefono.pattern.test(telefono)) {
      errors.telefono = MESSAGES.telefono_invalid;
    }

    if (RULES.messaggio.required && !messaggio) {
      errors.messaggio = MESSAGES.required;
    } else if (messaggio.length > 0 && messaggio.length < RULES.messaggio.minLength) {
      errors.messaggio = MESSAGES.messaggio_minLength;
    } else if (messaggio.length > RULES.messaggio.maxLength) {
      errors.messaggio = MESSAGES.messaggio_maxLength;
    }

    if (RULES.gdpr.required && !gdpr) {
      errors.gdpr = MESSAGES.gdpr_required;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  /**
   * Mostra l’errore sotto il campo e imposta aria-describedby / aria-invalid.
   * Crea o aggiorna l’elemento .form-error e aggiunge .form-input--error (o .form-textarea--error) al controllo.
   */
  function showFieldError(form, fieldName, message) {
    var el = form.elements[fieldName];
    if (!el) return;

    var group = el.closest('.form-group');
    if (!group) return;

    el.setAttribute('aria-invalid', 'true');
    el.classList.add(el.tagName === 'TEXTAREA' ? 'form-textarea--error' : 'form-input--error');
    if (el.type === 'checkbox') {
      var wrap = el.closest('.form-check-wrap');
      if (wrap) wrap.classList.add('form-check-wrap--error');
    }

    var errorId = 'error-' + fieldName;
    var errorEl = group.querySelector('.form-error');
    if (errorEl) {
      errorEl.id = errorId;
      errorEl.textContent = message;
      errorEl.setAttribute('role', 'alert');
    } else {
      var span = document.createElement('span');
      span.className = 'form-error';
      span.id = errorId;
      span.setAttribute('role', 'alert');
      span.textContent = message;
      group.appendChild(span);
    }
    el.setAttribute('aria-describedby', errorId);
  }

  /**
   * Rimuove errore e stato visivo dal campo.
   */
  function clearFieldError(form, fieldName) {
    var el = form.elements[fieldName];
    if (!el) return;

    var group = el.closest('.form-group');
    if (group) {
      var err = group.querySelector('.form-error');
      if (err) err.remove();
      var wrap = group.querySelector('.form-check-wrap');
      if (wrap) wrap.classList.remove('form-check-wrap--error');
    }

    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
    el.classList.remove('form-input--error', 'form-textarea--error');
  }

  /**
   * Rimuove tutti gli errori dal form e resetta gli stati.
   */
  function clearAllErrors(form) {
    var names = ['nome', 'email', 'telefono', 'messaggio', 'gdpr'];
    names.forEach(function (name) {
      clearFieldError(form, name);
    });
    var live = document.getElementById(ALERT_LIVE_ID);
    if (live) live.textContent = '';
  }

  /**
   * Imposta il focus sul primo campo con errore (per accessibilità).
   */
  function focusFirstError(form, errors) {
    var order = ['nome', 'email', 'telefono', 'messaggio', 'gdpr'];
    for (var i = 0; i < order.length; i++) {
      if (errors[order[i]]) {
        var el = form.elements[order[i]];
        if (el) {
          el.focus();
          break;
        }
      }
    }
  }

  /**
   * Annuncia il riepilogo errori nella regione aria-live (per screen reader).
   */
  function announceErrors(count) {
    var live = document.getElementById(ALERT_LIVE_ID);
    if (!live) return;
    live.textContent = 'Il modulo contiene ' + count + ' errori. Controlla i campi evidenziati.';
  }

  /**
   * Nasconde il blocco successo e mostra di nuovo il form.
   */
  function hideSuccess() {
    var success = document.getElementById(SUCCESS_ID);
    if (success) success.style.display = 'none';
  }

  /**
   * Mostra il messaggio di successo (nessun backend: solo conferma visiva).
   */
  function showSuccess() {
    var success = document.getElementById(SUCCESS_ID);
    var formWrap = document.querySelector('#form-contatti-wrap');
    if (success) {
      success.style.display = 'block';
      success.setAttribute('role', 'status');
      success.setAttribute('aria-live', 'polite');
    }
    if (formWrap) formWrap.style.display = 'none';
  }

  /**
   * Gestisce l’invio: validazione, messaggi errore, eventuale messaggio di successo.
   */
  function handleSubmit(e) {
    e.preventDefault();
    var form = getForm();
    if (!form) return;

    clearAllErrors(form);
    var result = validateForm(form);

    if (!result.valid) {
      var keys = Object.keys(result.errors);
      keys.forEach(function (fieldName) {
        showFieldError(form, fieldName, result.errors[fieldName]);
      });
      focusFirstError(form, result.errors);
      announceErrors(keys.length);
      return;
    }

    showSuccess();
  }

  /**
   * All’evento blur su un campo, valida solo quel campo e mostra/rimuovi errore.
   */
  function handleBlur(e) {
    var form = getForm();
    if (!form) return;
    var name = e.target && e.target.name;
    if (!name || !RULES[name]) return;

    clearFieldError(form, name);
    var result = validateForm(form);
    if (result.errors[name]) {
      showFieldError(form, name, result.errors[name]);
    }
  }

  /**
   * All’evento input/change, rimuove lo stato di errore dal campo (feedback immediato).
   */
  function handleInput(e) {
    var form = getForm();
    if (!form) return;
    var name = e.target && e.target.name;
    if (!name) return;
    clearFieldError(form, name);
  }

  /**
   * Inizializzazione: bind submit, blur, input solo se il form esiste (pagina contatti).
   */
  function init() {
    var form = getForm();
    if (!form) return;

    form.addEventListener('submit', handleSubmit);
    form.addEventListener('blur', handleBlur, true);
    form.addEventListener('input', handleInput);
    form.addEventListener('change', handleInput);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
