// Variables del DOM
const toggleControlsBtn = document.getElementById('toggleControlsBtn');
const controlsDiv = document.getElementById('controls');
const addClientBtn = document.getElementById('addClientBtn');
const clientNameInput = document.getElementById('clientNameInput');
const initialDebtInput = document.getElementById('initialDebtInput');
const initialCurrencySelect = document.getElementById('initialCurrencySelect');
const clientsList = document.getElementById('clientsList');
const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const saveRateBtn = document.getElementById('saveRateBtn');
const fromCurrencySelect = document.getElementById('fromCurrencySelect');
const toCurrencySelect = document.getElementById('toCurrencySelect');
const rateInput = document.getElementById('rateInput');
const ratesDisplay = document.getElementById('ratesDisplay');
const globalCurrencySelect = document.getElementById('globalCurrencySelect');

// Variables para los datos
let clients = [];
let rates = {}; // { 'USD_CUP-Efectivo': 400, ... }
let clientToDeleteId = null;

// Funciones principales
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderClients();
    renderRates();
});

// Cargar datos desde LocalStorage
function loadData() {
    const storedClients = localStorage.getItem('clients');
    if (storedClients) {
        clients = JSON.parse(storedClients);
    }
    const storedRates = localStorage.getItem('rates');
    if (storedRates) {
        rates = JSON.parse(storedRates);
    }
}

// Guardar datos en LocalStorage
function saveData() {
    localStorage.setItem('clients', JSON.stringify(clients));
    localStorage.setItem('rates', JSON.stringify(rates));
}

// Renderizar la lista de clientes
function renderClients() {
    clientsList.innerHTML = '';
    const globalCurrency = globalCurrencySelect.value;
    
    clients.forEach(client => {
        const clientRate = client.rates[`${client.currency}_${globalCurrency}`] || rates[`${client.currency}_${globalCurrency}`];
        const convertedDebt = clientRate ? (client.debt * clientRate).toFixed(2) : 'N/A';
        const debtText = clientRate ? `${convertedDebt} ${globalCurrency}` : `${client.debt} ${client.currency}`;

        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.dataset.id = client.id;
        li.innerHTML = `
            <div class="debt-info">
                <strong>${client.name}</strong> - Deuda: ${debtText}
            </div>
            <div class="debt-actions">
                <div class="dropdown me-2">
                    <button class="btn btn-sm btn-info dropdown-toggle" type="button" id="dropdownMenuButton${client.id}" data-bs-toggle="dropdown" aria-expanded="false">
                        Operación
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton${client.id}">
                        <li>
                            <div class="d-flex p-2">
                                <input type="number" class="form-control form-control-sm me-2 operation-input" placeholder="Cantidad">
                                <button class="btn btn-sm btn-success add-debt-btn me-1">Sumar</button>
                                <button class="btn btn-sm btn-warning subtract-debt-btn">Restar</button>
                            </div>
                        </li>
                    </ul>
                </div>
                <div class="dropdown me-2">
                    <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" id="configDropdown${client.id}" data-bs-toggle="dropdown" aria-expanded="false">
                        Configuración
                    </button>
                    <ul class="dropdown-menu p-2" aria-labelledby="configDropdown${client.id}">
                        <div class="row g-2">
                            <div class="col-md-6">
                                <select class="form-select form-select-sm from-currency-select">
                                    <option value="USD">USD</option>
                                    <option value="CUP-Efectivo">CUP (Efectivo)</option>
                                    <option value="CUP-Transferencia">CUP (Transferencia)</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <select class="form-select form-select-sm to-currency-select">
                                    <option value="USD">USD</option>
                                    <option value="CUP-Efectivo">CUP (Efectivo)</option>
                                    <option value="CUP-Transferencia">CUP (Transferencia)</option>
                                </select>
                            </div>
                            <div class="col-md-12">
                                <div class="input-group input-group-sm">
                                    <input type="number" class="form-control rate-input" step="0.01" value="1">
                                    <button class="btn btn-primary save-rate-client-btn">Guardar</button>
                                </div>
                            </div>
                        </div>
                    </ul>
                </div>
                <button class="btn btn-sm btn-danger delete-btn">X</button>
            </div>
        `;
        clientsList.appendChild(li);
    });
}

// Renderizar las tasas de cambio guardadas
function renderRates() {
    ratesDisplay.innerHTML = '';
    const rateKeys = Object.keys(rates).reverse().slice(0, 3);
    rateKeys.forEach(key => {
        const [from, to] = key.split('_');
        const rate = rates[key];
        const p = document.createElement('p');
        p.textContent = `1 ${from} = ${rate} ${to}`;
        ratesDisplay.appendChild(p);
    });
}

// Agregar un nuevo cliente
addClientBtn.addEventListener('click', () => {
    const name = clientNameInput.value.trim();
    const debt = parseFloat(initialDebtInput.value);
    const currency = initialCurrencySelect.value;

    if (name && !isNaN(debt)) {
        const newClient = {
            id: Date.now(),
            name,
            debt,
            currency,
            rates: {} // Para las tasas de cambio individuales
        };
        clients.push(newClient);
        saveData();
        renderClients();
        clientNameInput.value = '';
        initialDebtInput.value = '0';
    } else {
        alert('Por favor, ingrese un nombre y una deuda válida.');
    }
});

// Event listener para los botones de la lista de clientes (delegación)
clientsList.addEventListener('click', (e) => {
    const li = e.target.closest('.list-group-item');
    if (!li) return;

    const clientId = parseInt(li.dataset.id);
    const client = clients.find(c => c.id === clientId);

    if (e.target.classList.contains('delete-btn')) {
        clientToDeleteId = clientId;
        confirmDeleteModal.show();
    } else if (e.target.classList.contains('add-debt-btn')) {
        const input = li.querySelector('.operation-input');
        const amount = parseFloat(input.value);
        if (!isNaN(amount)) {
            client.debt += amount;
            saveData();
            renderClients();
        }
    } else if (e.target.classList.contains('subtract-debt-btn')) {
        const input = li.querySelector('.operation-input');
        const amount = parseFloat(input.value);
        if (!isNaN(amount)) {
            client.debt -= amount;
            saveData();
            renderClients();
        }
    } else if (e.target.classList.contains('save-rate-client-btn')) {
        const parent = e.target.closest('.dropdown-menu');
        const from = parent.querySelector('.from-currency-select').value;
        const to = parent.querySelector('.to-currency-select').value;
        const rate = parseFloat(parent.querySelector('.rate-input').value);
        
        if (!isNaN(rate) && rate > 0) {
            client.rates[`${from}_${to}`] = rate;
            saveData();
            renderClients();
        } else {
            alert('Por favor, ingrese una tasa de cambio válida.');
        }
    }
});

// Confirmar la eliminación del cliente
confirmDeleteBtn.addEventListener('click', () => {
    if (clientToDeleteId !== null) {
        clients = clients.filter(client => client.id !== clientToDeleteId);
        saveData();
        renderClients();
        clientToDeleteId = null;
        confirmDeleteModal.hide();
    }
});

// Guardar una nueva tasa de cambio global
saveRateBtn.addEventListener('click', () => {
    const from = fromCurrencySelect.value;
    const to = toCurrencySelect.value;
    const rate = parseFloat(rateInput.value);

    if (!isNaN(rate) && rate > 0) {
        rates[`${from}_${to}`] = rate;
        saveData();
        renderRates();
        renderClients(); // Actualizar las deudas mostradas
    } else {
        alert('Por favor, ingrese una tasa de cambio válida.');
    }
});

// Event listener para el cambio de moneda global
globalCurrencySelect.addEventListener('change', renderClients);

// Botón para mostrar/ocultar los controles
toggleControlsBtn.addEventListener('click', () => {
    controlsDiv.classList.toggle('collapse');
    controlsDiv.classList.toggle('show');
});
