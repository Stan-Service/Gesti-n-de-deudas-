/* script.js - Gestor de Deudas */

/* ---------- Helpers & Storage ---------- */
const LS_KEYS = {
  RATES: 'gd_rates_v1',
  CLIENTS: 'gd_clients_v1',
  SETTINGS: 'gd_settings_v1'
};

function saveRatesToStorage(rates) {
  localStorage.setItem(LS_KEYS.RATES, JSON.stringify(rates));
}
function loadRatesFromStorage() {
  const raw = localStorage.getItem(LS_KEYS.RATES);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function saveClientsToStorage(clients) {
  localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(clients));
}
function loadClientsFromStorage(){
  const raw = localStorage.getItem(LS_KEYS.CLIENTS);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
function saveSettings(s) {
  localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(s));
}
function loadSettings() {
  const raw = localStorage.getItem(LS_KEYS.SETTINGS);
  if (!raw) return { viewCurrency: 'USD' };
  try { return JSON.parse(raw); } catch { return { viewCurrency: 'USD' }; }
}

function formatNum(n, decimals = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const show = Number(n);
  return show.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/* ---------- Rate logic (canonical directions) ---------- */
/*
 canonical:
  - usd_ef : 1 USD = X CUP (ef)
  - usd_tr : 1 USD = Y CUP (tr)
  - ef_tr  : 1 CUP ef = Z CUP tr
*/
function computeThirdRate(rates) {
  // rates: { usd_ef: {v,defined}, usd_tr: {...}, ef_tr: {...} }
  // If exactly one missing, compute it. If all present, leave as is.
  const a = rates.usd_ef.v;
  const b = rates.usd_tr.v;
  const c = rates.ef_tr.v;

  const definedCount = [a,b,c].filter(x => x !== null && x !== undefined && !Number.isNaN(Number(x))).length;

  // Reset calculation flags
  rates.usd_ef.calculated = false;
  rates.usd_tr.calculated = false;
  rates.ef_tr.calculated = false;

  if (definedCount >= 2) {
    // If one missing, compute
    if ((a == null || a === '') && b != null && c != null) {
      // usd_ef = usd_tr / ef_tr
      rates.usd_ef.v = Number(b) / Number(c);
      rates.usd_ef.calculated = true;
    } else if ((b == null || b === '') && a != null && c != null) {
      // usd_tr = usd_ef * ef_tr
      rates.usd_tr.v = Number(a) * Number(c);
      rates.usd_tr.calculated = true;
    } else if ((c == null || c === '') && a != null && b != null) {
      // ef_tr = usd_tr / usd_ef
      if (Number(a) === 0) {
        rates.ef_tr.v = null;
      } else {
        rates.ef_tr.v = Number(b) / Number(a);
        rates.ef_tr.calculated = true;
      }
    }
  }

  // Normalize any string numbers to Number
  ['usd_ef','usd_tr','ef_tr'].forEach(k => {
    rates[k].v = (rates[k].v === '' || rates[k].v === null || rates[k].v === undefined) ? null : Number(rates[k].v);
  });

  return rates;
}

/* ---------- Conversion ---------- */
function convert(amount, from, to, rates) {
  // currencies: 'USD', 'CUP_EF', 'CUP_TR'
  amount = Number(amount);
  if (isNaN(amount)) return 0;
  if (from === to) return amount;

  const usd_ef = rates.usd_ef.v;
  const usd_tr = rates.usd_tr.v;
  const ef_tr  = rates.ef_tr.v;

  // Helpers
  const usdToEf = (x) => x * usd_ef;
  const usdToTr = (x) => x * usd_tr;
  const efToUsd = (x) => x / usd_ef;
  const trToUsd = (x) => x / usd_tr;
  const efToTr  = (x) => x * ef_tr;
  const trToEf  = (x) => x / ef_tr;

  // Direct conversion map
  if (from === 'USD' && to === 'CUP_EF') return usdToEf(amount);
  if (from === 'USD' && to === 'CUP_TR') return usdToTr(amount);
  if (from === 'CUP_EF' && to === 'USD') return efToUsd(amount);
  if (from === 'CUP_TR' && to === 'USD') return trToUsd(amount);
  if (from === 'CUP_EF' && to === 'CUP_TR') return efToTr(amount);
  if (from === 'CUP_TR' && to === 'CUP_EF') return trToEf(amount);

  // Fallback via USD if some rate missing
  if (from === 'CUP_EF' && to === 'CUP_TR') {
    // try via USD
    const usd = efToUsd(amount);
    return usdToTr(usd);
  }
  if (from === 'CUP_TR' && to === 'CUP_EF') {
    const usd = trToUsd(amount);
    return usdToEf(usd);
  }

  return amount;
}

/* ---------- App State ---------- */
let RATES = loadRatesFromStorage() || {
  usd_ef: { v: null, defined: false, calculated: false },
  usd_tr: { v: null, defined: false, calculated: false },
  ef_tr:  { v: null, defined: false, calculated: false }
};
let CLIENTS = loadClientsFromStorage() || [];
let SETTINGS = loadSettings();

/* ---------- DOM refs ---------- */
const panelAddClient = document.getElementById('panelAddClient');
const panelRates = document.getElementById('panelRates');
const toggleAddClientBtn = document.getElementById('toggleAddClient');
const toggleRatesBtn = document.getElementById('toggleRates');
const formAddClient = document.getElementById('formAddClient');
const clientsContainer = document.getElementById('clientsContainer');
const noClients = document.getElementById('noClients');

const rate_usd_ef_input = document.getElementById('rate_usd_ef');
const rate_usd_tr_input = document.getElementById('rate_usd_tr');
const rate_ef_tr_input  = document.getElementById('rate_ef_tr');
const saveRatesBtn = document.getElementById('saveRates');
const resetRatesBtn = document.getElementById('resetRates');
const ratesDisplay = document.getElementById('ratesDisplay');

const globalCurrencySelect = document.getElementById('globalCurrency');
const toggleFlipBtns = document.querySelectorAll('.btnFlip');
const cancelAddClientBtn = document.getElementById('cancelAddClient');
const clearAllBtn = document.getElementById('clearAll');

const modalOverlay = document.getElementById('modalOverlay');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

let clientToDeleteId = null;

/* ---------- UI Actions ---------- */
toggleAddClientBtn.addEventListener('click', () => {
  panelAddClient.classList.toggle('hidden');
  panelRates.classList.add('hidden');
});
toggleRatesBtn.addEventListener('click', () => {
  panelRates.classList.toggle('hidden');
  panelAddClient.classList.add('hidden');
});
cancelAddClientBtn.addEventListener('click', () => {
  panelAddClient.classList.add('hidden');
  formAddClient.reset();
});
clearAllBtn.addEventListener('click', () => {
  if (!confirm('Eliminar todos los datos guardados en LocalStorage (tasas y clientes)?')) return;
  localStorage.removeItem(LS_KEYS.CLIENTS);
  localStorage.removeItem(LS_KEYS.RATES);
  localStorage.removeItem(LS_KEYS.SETTINGS);
  location.reload();
});

/* flip input: invert displayed number and swap label meaning */
toggleFlipBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.currentTarget.getAttribute('data-target');
    const input = document.getElementById(target);
    const val = Number(input.value);
    if (!val || val === 0) {
      alert('Introduce un valor válido antes de invertir.');
      return;
    }
    input.value = (1 / val).toString();
  });
});

/* Save rates */
saveRatesBtn.addEventListener('click', () => {
  // read inputs: if empty -> null
  const a = rate_usd_ef_input.value.trim();
  const b = rate_usd_tr_input.value.trim();
  const c = rate_ef_tr_input.value.trim();

  RATES = {
    usd_ef: { v: (a === '') ? null : Number(a), defined: a !== '', calculated: false },
    usd_tr: { v: (b === '') ? null : Number(b), defined: b !== '', calculated: false },
    ef_tr:  { v: (c === '') ? null : Number(c), defined: c !== '', calculated: false }
  };

  // compute third if applicable
  RATES = computeThirdRate(RATES);

  // if fewer than 1 defined after attempt -> reject
  const definedCount = [RATES.usd_ef.v,RATES.usd_tr.v,RATES.ef_tr.v].filter(x => x !== null && x !== undefined && !Number.isNaN(x)).length;
  if (definedCount < 1) {
    alert('Debes indicar al menos 1 tasa válida. Para que se calcule la tercera debes indicar 2.');
    return;
  }

  saveRatesToStorage(RATES);
  renderRatesDisplay();
  renderClients();
  alert('Tasas guardadas.');
});

/* Reset rates */
resetRatesBtn.addEventListener('click', () => {
  if (!confirm('Resetear tasas globales a vacío?')) return;
  RATES = {
    usd_ef: { v: null, defined: false, calculated: false },
    usd_tr: { v: null, defined: false, calculated: false },
    ef_tr:  { v: null, defined: false, calculated: false }
  };
  saveRatesToStorage(RATES);
  rate_usd_ef_input.value = '';
  rate_usd_tr_input.value = '';
  rate_ef_tr_input.value  = '';
  renderRatesDisplay();
  renderClients();
});

/* Add client */
formAddClient.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const name = document.getElementById('clientName').value.trim();
  const amount = Number(document.getElementById('clientAmount').value);
  const currency = document.getElementById('clientCurrency').value;

  if (!name || isNaN(amount)) {
    alert('Completa nombre y monto inicial válido.');
    return;
  }

  const id = 'c_' + Date.now();
  const client = {
    id,
    name,
    currency,
    initial: Number(amount),
    operations: [ { id: 'op_init', ts: Date.now(), amount: Number(amount), note: 'Inicial', currency } ],
    createdAt: Date.now()
  };

  CLIENTS.push(client);
  saveClientsToStorage(CLIENTS);
  formAddClient.reset();
  panelAddClient.classList.add('hidden');
  renderClients();
});

/* Global currency change */
globalCurrencySelect.value = SETTINGS.viewCurrency || 'USD';
globalCurrencySelect.addEventListener('change', (e) => {
  SETTINGS.viewCurrency = e.target.value;
  saveSettings(SETTINGS);
  renderClients();
});

/* Modal handlers */
modalCancel.addEventListener('click', () => {
  clientToDeleteId = null;
  hideModal();
});
modalConfirm.addEventListener('click', () => {
  if (clientToDeleteId) {
    CLIENTS = CLIENTS.filter(c => c.id !== clientToDeleteId);
    saveClientsToStorage(CLIENTS);
    clientToDeleteId = null;
    renderClients();
    hideModal();
  }
});

/* show/hide modal */
function showModal(id) {
  clientToDeleteId = id;
  modalOverlay.classList.add('show');
}
function hideModal() {
  modalOverlay.classList.remove('show');
}

/* ---------- Rendering ---------- */

function renderRatesDisplay() {
  ratesDisplay.innerHTML = '';
  const usd_ef = RATES.usd_ef.v;
  const usd_tr = RATES.usd_tr.v;
  const ef_tr  = RATES.ef_tr.v;

  const rows = [
    { key: 'usd_ef', label: `1 USD = ${usd_ef ? formatNum(usd_ef, 4) : '—'} CUP (ef)`, calculated: RATES.usd_ef.calculated },
    { key: 'usd_tr', label: `1 USD = ${usd_tr ? formatNum(usd_tr, 4) : '—'} CUP (tr)`, calculated: RATES.usd_tr.calculated },
    { key: 'ef_tr',  label: `1 CUP (ef) = ${ef_tr ? formatNum(ef_tr, 6) : '—'} CUP (tr)`, calculated: RATES.ef_tr.calculated }
  ];

  rows.forEach(r => {
    const card = document.createElement('div');
    card.className = 'p-3 border rounded';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium">${r.label}</div>
          <div class="text-xs text-gray-500 mt-1">${r.calculated ? '(calculado automáticamente)' : '(definido)'}</div>
        </div>
      </div>
    `;
    ratesDisplay.appendChild(card);
  });

  // Populate inputs with canonical values (so the user sees what is stored)
  rate_usd_ef_input.value = RATES.usd_ef.v ?? '';
  rate_usd_tr_input.value = RATES.usd_tr.v ?? '';
  rate_ef_tr_input.value  = RATES.ef_tr.v  ?? '';
}

function renderClients() {
  clientsContainer.innerHTML = '';
  if (CLIENTS.length === 0) {
    noClients.style.display = 'block';
    return;
  } else {
    noClients.style.display = 'none';
  }

  const view = SETTINGS.viewCurrency || 'USD';

  CLIENTS.forEach(client => {
    // compute current debt from operations (they are stored in client's currency)
    const total = client.operations.reduce((acc, op) => acc + Number(op.amount), 0); // all in client's currency
    // convert to view currency
    const converted = convert(total, client.currency, view, RATES);

    const card = document.createElement('div');
    card.className = 'client-card bg-white p-4 rounded border';

    const operationsHtml = (client.operations || []).slice().reverse().map(op => {
      const sign = Number(op.amount) >= 0 ? '+' : '−';
      const amt = Math.abs(Number(op.amount));
      const opInView = convert(Number(op.amount), op.currency, view, RATES);
      const opSign = Number(op.amount) >= 0 ? '+' : '−';
      const time = new Date(op.ts).toLocaleString();
      return `<div class="flex justify-between text-sm py-1 border-b last:border-b-0">
          <div>
            <div class="font-medium">${opSign}${formatNum(amt, 2)} ${op.currency}</div>
            <div class="text-xs text-gray-500">${op.note || ''} • <span class="text-xs">${time}</span></div>
          </div>
          <div class="text-right">
            <div class="text-sm">${opSign}${formatNum(Math.abs(opInView),2)} ${view}</div>
          </div>
        </div>`;
    }).join('');

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <div class="font-semibold text-lg">${escapeHtml(client.name)}</div>
          <div class="text-sm text-gray-500">Moneda base: ${client.currency}</div>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-500">Deuda en ${view}</div>
          <div class="text-xl font-bold">${formatNum(converted,2)} ${view}</div>
        </div>
      </div>

      <div class="mt-3 flex gap-2">
        <button class="btnAddOp px-3 py-1 border rounded text-sm" data-id="${client.id}">➕ Operación</button>
        <button class="btnToggleHist px-3 py-1 border rounded text-sm" data-id="${client.id}">📜 Historial</button>
        <button class="btnDelete text-sm px-2 py-1 text-red-600 border rounded" data-id="${client.id}">X</button>
      </div>

      <div class="mt-3 opFormContainer hidden" id="opform_${client.id}">
        <form class="grid grid-cols-1 md:grid-cols-3 gap-2 opForm" data-id="${client.id}">
          <select name="opType" class="border rounded px-2 py-1">
            <option value="+">Aumentar deuda (+)</option>
            <option value="-">Pago / Reducir deuda (−)</option>
          </select>
          <input name="opAmount" type="number" step="0.01" min="0" placeholder="Monto" class="border rounded px-2 py-1" required>
          <input name="opNote" type="text" placeholder="Nota (opcional)" class="border rounded px-2 py-1">
          <div class="md:col-span-3 flex justify-end gap-2">
            <button type="submit" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Guardar</button>
            <button type="button" class="px-3 py-1 border rounded cancelOp text-sm">Cancelar</button>
          </div>
        </form>
      </div>

      <div class="mt-3 historyContainer hidden p-2 border rounded" id="hist_${client.id}">
        ${operationsHtml || '<div class="text-sm text-gray-500">Sin operaciones.</div>'}
      </div>
    `;
    clientsContainer.appendChild(card);
  });

  // attach event listeners after DOM creation
  document.querySelectorAll('.btnDelete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      showModal(id);
    });
  });

  document.querySelectorAll('.btnAddOp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const container = document.getElementById('opform_' + id);
      container.classList.toggle('hidden');
    });
  });

  document.querySelectorAll('.cancelOp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const form = e.currentTarget.closest('.opForm');
      form.reset();
      form.parentElement.classList.add('hidden');
    });
  });

  document.querySelectorAll('.opForm').forEach(form => {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const id = form.getAttribute('data-id');
      const client = CLIENTS.find(c => c.id === id);
      if (!client) return;

      const type = form.querySelector('[name="opType"]').value;
      const amtRaw = Number(form.querySelector('[name="opAmount"]').value);
      const note = form.querySelector('[name="opNote"]').value.trim();

      if (isNaN(amtRaw) || amtRaw <= 0) {
        alert('Monto inválido.');
        return;
      }
      const signed = (type === '+') ? amtRaw : -amtRaw;

      const op = { id: 'op_' + Date.now(), ts: Date.now(), amount: signed, note, currency: client.currency };
      client.operations.push(op);
      saveClientsToStorage(CLIENTS);
      renderClients();
    });
  });

  document.querySelectorAll('.btnToggleHist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const hist = document.getElementById('hist_' + id);
      hist.classList.toggle('hidden');
    });
  });
}

/* ---------- Utilities ---------- */
function escapeHtml(unsafe) {
  return unsafe
       .replaceAll('&', '&amp;')
       .replaceAll('<', '&lt;')
       .replaceAll('>', '&gt;')
       .replaceAll('"', '&quot;')
       .replaceAll("'", '&#039;');
}

/* ---------- Initial load ---------- */
function init() {
  // load rates if any
  const storedRates = loadRatesFromStorage();
  if (storedRates) RATES = storedRates;

  // if some rates exist, compute third for coherence
  RATES = computeThirdRate(RATES);
  saveRatesToStorage(RATES);

  // populate inputs
  rate_usd_ef_input.value = RATES.usd_ef.v ?? '';
  rate_usd_tr_input.value = RATES.usd_tr.v ?? '';
  rate_ef_tr_input.value  = RATES.ef_tr.v  ?? '';

  SETTINGS = loadSettings();
  globalCurrencySelect.value = SETTINGS.viewCurrency || 'USD';

  renderRatesDisplay();
  CLIENTS = loadClientsFromStorage();
  renderClients();
}

init();

/* ---------- End of file ---------- */