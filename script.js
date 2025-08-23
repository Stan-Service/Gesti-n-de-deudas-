// ==== LocalStorage Keys ====
const CLIENTS_KEY = 'gestorDeudasClients';
const RATES_KEY = 'gestorDeudasRates';

// ==== DOM ====
const clientsContainer = document.getElementById('clientsContainer');
const modalAddClient = document.getElementById('modalAddClient');
const modalConfig = document.getElementById('modalConfig');
const modalConfirm = document.getElementById('modalConfirm');
const toggleAddClient = document.getElementById('toggleAddClient');
const toggleConfig = document.getElementById('toggleConfig');
const saveClient = document.getElementById('saveClient');
const cancelAddClient = document.getElementById('cancelAddClient');
const clientName = document.getElementById('clientName');
const clientDebt = document.getElementById('clientDebt');
const clientCurrency = document.getElementById('clientCurrency');
const globalCurrency = document.getElementById('globalCurrency');

const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const rateValue = document.getElementById('rateValue');
const saveRate = document.getElementById('saveRate');
const cancelRate = document.getElementById('cancelRate');
const ratesList = document.getElementById('ratesList');

const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

let clients = JSON.parse(localStorage.getItem(CLIENTS_KEY)) || [];
let rates = JSON.parse(localStorage.getItem(RATES_KEY)) || {
  "USD_CUP": 400,
  "USD_CUPT": 400,
  "CUP_CUPT": 1
};
let deleteClientId = null;

// ==== Functions ====
function saveClients() {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function saveRates() {
  localStorage.setItem(RATES_KEY, JSON.stringify(rates));
  updateRatesDisplay();
}

function updateRatesDisplay() {
  ratesList.innerHTML = '';
  const pairs = Object.keys(rates);
  pairs.forEach(pair => {
    const val = rates[pair];
    let text = '';
    if(pair === 'USD_CUP') text = `1 USD = ${val} CUP`;
    if(pair === 'USD_CUPT') text = `1 USD = ${val} CUP transferencia`;
    if(pair === 'CUP_CUPT') text = `1 CUP = ${val} CUP transferencia`;
    const div = document.createElement('div');
    div.textContent = text;
    ratesList.appendChild(div);
  });
}

function convert(amount, from, to) {
  if(from === to) return amount;
  if(from === 'USD' && to === 'CUP') return amount * rates['USD_CUP'];
  if(from === 'USD' && to === 'CUPT') return amount * rates['USD_CUPT'];
  if(from === 'CUP' && to === 'USD') return amount / rates['USD_CUP'];
  if(from === 'CUPT' && to === 'USD') return amount / rates['USD_CUPT'];
  if(from === 'CUP' && to === 'CUPT') return amount * rates['CUP_CUPT'];
  if(from === 'CUPT' && to === 'CUP') return amount / rates['CUP_CUPT'];
  return amount;
}

function renderClients() {
  clientsContainer.innerHTML = '';
  clients.forEach((c, index) => {
    const card = document.createElement('div');
    card.className = 'client-card bg-white p-4 rounded shadow flex flex-col';
    
    const top = document.createElement('div');
    top.className = 'flex justify-between items-center mb-2';
    const name = document.createElement('h3');
    name.className = 'font-bold text-lg';
    name.textContent = c.name;
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'X';
    deleteBtn.className = 'bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600';
    deleteBtn.onclick = () => { deleteClientId = index; openModal(modalConfirm); };
    top.appendChild(name);
    top.appendChild(deleteBtn);

    const debtDisplay = document.createElement('p');
    const amount = convert(c.debt, c.currency, globalCurrency.value);
    debtDisplay.textContent = `Deuda: ${amount.toFixed(2)} ${globalCurrency.value}`;
    debtDisplay.className = 'mb-2';

    // Historial
    const historyToggle = document.createElement('button');
    historyToggle.textContent = 'Mostrar historial';
    historyToggle.className = 'text-blue-500 mb-2 hover:underline';
    const historyDiv = document.createElement('div');
    historyDiv.className = 'client-history hidden flex flex-col gap-1 text-sm';
    c.history.forEach(h => {
      const hDiv = document.createElement('div');
      hDiv.textContent = `${h.type === 'add' ? '+' : '-'} ${convert(h.amount, c.currency, globalCurrency.value).toFixed(2)} ${globalCurrency.value} (${h.type})`;
      historyDiv.appendChild(hDiv);
    });
    historyToggle.onclick = () => {
      historyDiv.classList.toggle('hidden');
      historyToggle.textContent = historyDiv.classList.contains('hidden') ? 'Mostrar historial' : 'Ocultar historial';
    };

    // Operaciones
    const opInput = document.createElement('input');
    opInput.type = 'number';
    opInput.placeholder = 'Monto';
    opInput.className = 'p-2 border rounded mb-1 w-full';
    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.className = 'bg-green-500 text-white px-4 py-2 rounded mr-1 hover:bg-green-600';
    addBtn.onclick = () => {
      const val = parseFloat(opInput.value);
      if(!isNaN(val)) { c.debt += val; c.history.push({type:'add', amount: val}); saveClients(); renderClients(); opInput.value=''; }
    };
    const subBtn = document.createElement('button');
    subBtn.textContent = '-';
    subBtn.className = 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600';
    subBtn.onclick = () => {
      const val = parseFloat(opInput.value);
      if(!isNaN(val)) { c.debt -= val; c.history.push({type:'sub', amount: val}); saveClients(); renderClients(); opInput.value=''; }
    };

    const opDiv = document.createElement('div');
    opDiv.className = 'flex gap-2 mb-2 flex-wrap';
    opDiv.appendChild(opInput);
    opDiv.appendChild(addBtn);
    opDiv.appendChild(subBtn);

    card.appendChild(top);
    card.appendChild(debtDisplay);
    card.appendChild(historyToggle);
    card.appendChild(historyDiv);
    card.appendChild(opDiv);

    clientsContainer.appendChild(card);
  });
}

// ==== Modal Functions ====
function openModal(modal) {
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}
function closeModal(modal) {
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

// ==== Event Listeners ====
toggleAddClient.onclick = () => openModal(modalAddClient);
cancelAddClient.onclick = () => closeModal(modalAddClient);
saveClient.onclick = () => {
  const name = clientName.value.trim();
  const debt = parseFloat(clientDebt.value);
  const currency = clientCurrency.value;
  if(name && !isNaN(debt)) {
    clients.push({name, debt, currency, history: []});
    saveClients();
    renderClients();
    clientName.value=''; clientDebt.value='';
    closeModal(modalAddClient);
  }
};

toggleConfig.onclick = () => openModal(modalConfig);
cancelRate.onclick = () => closeModal(modalConfig);
saveRate.onclick = () => {
  const from = fromCurrency.value;
  const to = toCurrency.value;
  const val = parseFloat(rateValue.value);
  if(from && to && !isNaN(val) && from !== to){
    const key = `${from}_${to}`;
    rates[key] = val;

    // Auto-calcula tercera tasa
    if(from === 'USD' && to === 'CUP') rates['CUP_CUPT'] = val / rates['USD_CUPT'] || 1;
    if(from === 'USD' && to === 'CUPT') rates['CUP_CUPT'] = rates['USD_CUP'] / val || 1;
    if(from === 'CUP' && to === 'CUPT') rates['USD_CUPT'] = rates['USD_CUP']/val || rates['USD_CUPT'];

    saveRates();
    rateValue.value='';
  }
};

globalCurrency.onchange = renderClients;

cancelDelete.onclick = () => { deleteClientId=null; closeModal(modalConfirm); };
confirmDelete.onclick = () => {
  if(deleteClientId !== null) clients.splice(deleteClientId,1);
  saveClients();
  renderClients();
  deleteClientId=null;
  closeModal(modalConfirm);
};

// ==== Init ====
updateRatesDisplay();
renderClients();