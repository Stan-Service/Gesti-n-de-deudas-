// Variables del DOM
const toggleControlsBtn = document.getElementById('toggleControlsBtn');
const controlsDiv = document.getElementById('controls');
const addClientBtn = document.getElementById('addClientBtn');
const clientNameInput = document.getElementById('clientNameInput');
const initialDebtInput = document.getElementById('initialDebtInput');
const initialCurrencySelect = document.getElementById('initialCurrencySelect');
const clientsList = document.getElementById('clientsList');
const saveRateBtn = document.getElementById('saveRateBtn');
const fromCurrencySelect = document.getElementById('fromCurrencySelect');
const toCurrencySelect = document.getElementById('toCurrencySelect');
const rateInput = document.getElementById('rateInput');
const ratesDisplay = document.getElementById('ratesDisplay');
const globalCurrencySelect = document.getElementById('globalCurrencySelect');

// El modal de Bootstrap se debe inicializar después de que el DOM esté listo
let confirmDeleteModal; 
let clientToDeleteId = null;

// Variables para los datos, usando 'let' para poder reasignarlas
let clients = [];
let rates = {};

// Espera a que el DOM se cargue completamente antes de ejecutar el código
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el modal de confirmación
    confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    loadData();
    renderClients();
    renderRates();

    // Event listeners principales
    addClientBtn.addEventListener('click', addClient);
    clientsList.addEventListener('click', handleClientActions);
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    saveRateBtn.addEventListener('click', saveGlobalRate);
    globalCurrencySelect.addEventListener('change', renderClients);
    toggleControlsBtn.addEventListener('click', () => {
        const controls = document.getElementById('controls');
        if (controls) {
            controls.classList.toggle('collapse');
        }
    });
});

// --- Funciones de Lógica y UI ---
// Cargar datos desde LocalStorage
function loadData() {
    try {
        const storedClients = localStorage.getItem('clients');
        if (storedClients) {
            clients = JSON.parse(storedClients);
        }
        const storedRates = localStorage.getItem('rates');
        if (storedRates) {
            rates = JSON.parse(storedRates);
        }
    } catch (e) {
        console.error("Error al cargar datos de LocalStorage:", e);
        clients = [];
        rates = {};
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
        const rateKey = `${client.currency}_${globalCurrency}`;
        const clientRate = client.rates[rateKey] !== undefined ? client.rates[rateKey] : rates[rateKey];
        
        let convertedDebt = 'N/A';
        let debtText = `${client.debt.toFixed(2)} ${client.currency}`;

        if (clientRate) {
            convertedDebt = (client.debt * clientRate).toFixed(2);
            debtText = `${convertedDebt} ${globalCurrency}`;
        }

        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.dataset.id = client.id;
        li.innerHTML = `
            <div class="debt-info">
                <strong>${client.name}</strong> - Deuda: ${debtText}
            </div>
            <div class="debt-actions">
                <div class="dropdown me-2">
                    <button class="btn btn-sm btn-info dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        Operación
                    </button>
                    <ul class="dropdown-menu">
                        <div class="d-flex p-2">
                            <input type="number" class="form-control form-control-sm me-2 operation-input" placeholder="Cantidad" step="0.01">
                            <button class="btn btn-sm btn-success add-debt-btn me-1">Sumar</button>
                            <button class="btn btn-sm btn-warning subtract-debt-btn">Restar</button>
                        </div>
                    </ul>
                </div>
                <div class="dropdown me-2">
                    <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        Configuración
                    </button>
                    <ul class="dropdown-menu p-2">
                        <div class="row g-2">
                            <div class="col-md-6">
                                <select class="form-select form-select-sm from-currency-select">
                                    <option value="USD" ${client.currency === 'USD' ? 'selected' : ''}>USD</option>
                                    <option value="CUP-Efectivo" ${client.currency === 'CUP-Efectivo' ? 'selected' : ''}>CUP (Efectivo)</option>
                                    <option value="CUP-Transferencia" ${client.currency === 'CUP-Transferencia' ? 'selected' : ''}>CUP (Transferencia)</option>
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

// Renderizar las tasas de cambio globales guardadas
function renderRates() {
    ratesDisplay.innerHTML = '';
    const rateKeys = Object.keys(rates).reverse().slice(0, 3);
    rateKeys.forEach(key => {
        const [from, to] = key.split('_');
        const rate = rates[key];
        const p = document.createElement('p');
        p.className = 'my-1';
        p.textContent = `1 ${from} = ${rate} ${to}`;
        ratesDisplay.appendChild(p);
    });
}

// Agregar un nuevo cliente
function addClient() {
    const name = clientNameInput.value.trim();
    const debt = parseFloat(initialDebtInput.value);
    const currency = initialCurrencySelect.value;

    if (name && !isNaN(debt)) {
        const newClient = {
            id: Date.now(),
            name,
            debt,
            currency,
            rates: {}
        };
        clients.push(newClient);
        saveData();
        renderClients();
        clientNameInput.value = '';
        initialDebtInput.value = '0';
    } else {
        alert('Por favor, ingrese un nombre y una deuda válida.');
    }
}

// Manejar todas las acciones del cliente usando delegación de eventos
function handleClientActions(e) {
    const li = e.target.closest('.list-group-item');
    if (!li) return;

    const clientId = parseInt(li.dataset.id);
    const client = clients.find(c => c.id === clientId);

    if (e.target.classList.contains('delete-btn')) {
        clientToDeleteId = clientId;
        if (confirmDeleteModal) {
            confirmDeleteModal.show();
        }
    } else if (e.target.classList.contains('add-debt-btn')) {
        const input = li.querySelector('.operation-input');
        const amount = parseFloat(input.value);
        if (!isNaN(amount)) {
            client.debt += amount;
            saveData();
            renderClients();
            input.value = '';
        }
    } else if (e.target.classList.contains('subtract-debt-btn')) {
        const input = li.querySelector('.operation-input');
        const amount = parseFloat(input.value);
        if (!isNaN(amount)) {
            client.debt -= amount;
            saveData();
            renderClients();
            input.value = '';
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
}

// Confirmar la eliminación del cliente
function confirmDelete() {
    if (clientToDeleteId !== null) {
        clients = clients.filter(client => client.id !== clientToDeleteId);
        saveData();
        renderClients();
        clientToDeleteId = null;
        if (confirmDeleteModal) {
            confirmDeleteModal.hide();
        }
    }
}

// Guardar una nueva tasa de cambio global
function saveGlobalRate() {
    const from = fromCurrencySelect.value;
    const to = toCurrencySelect.value;
    const rate = parseFloat(rateInput.value);

    if (!isNaN(rate) && rate > 0) {
        const rateKey = `${from}_${to}`;
        rates[rateKey] = rate;
        saveData();
        renderRates();
        renderClients();
        rateInput.value = '';
    } else {
        alert('Por favor, ingrese una tasa de cambio válida.');
    }
}
